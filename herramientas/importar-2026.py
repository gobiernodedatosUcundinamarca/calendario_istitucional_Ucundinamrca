"""
Importa el calendario institucional 2026 (carga única, antes de que existiera el formato de las áreas).

Origen: data/Calendario2026 version final.xlsx (hojas «Hoja1» y «Tabla1__6»).
Salida:
  data/Calendario institucional.xlsx              (Excel fuente de la app: se REEMPLAZA 2026 y se conservan los demás
                                                   años; copia en salida/respaldos)
  src/datos/actividades.ts, responsables.ts       (los genera cargar.py desde el Excel fuente)
  herramientas/salida/Revisión carga 2026.xlsx    (cada decisión, para revisar una por una)

«Hoja1» es la versión más reciente (usa «2026» donde «Tabla1__6» dice «2025»). Reglas, en orden:
  1. Repetidas en una misma hoja: se quita una solo si coinciden todos los datos (nombre, sede, fechas, horas,
     lugar, responsable y subcategoría). Si difieren en el año de vigencia, queda la del año más reciente.
  2. Actividad en ambas hojas (mismo nombre base y mismo responsable, en la misma sede): se usan las fechas de
     «Hoja1» y se descartan las de «Tabla1__6» (incluye reuniones reprogramadas y nombres con un año menos).
     Si a la fila de «Hoja1» le faltan horas o lugar y la de «Tabla1__6» del mismo día los tiene, se completan.
  3. Resto de «Tabla1__6»: se descarta una fila si «Hoja1» tiene ese mismo día y sede una actividad de nombre
     igual o parecido con el mismo responsable (o uno de los dos vacío).
  4. Lo que queda de «Tabla1__6» existe solo ahí y se conserva.
  «Nombre base» ignora mayúsculas, tildes, plurales, «de/la/y…», números romanos, meses y años. Solo cuentan como año de
  vigencia 2024-2030 (no los años de resoluciones como «Resolución 210 de 2016»).

Uso:  python herramientas/importar-2026.py   (requiere pandas y openpyxl)
"""
from __future__ import annotations

import datetime as dt
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

import cargar
from comun import (CALENDARIOS, FUENTE, RAIZ, SALIDA, TODAS, catalogos, combinar_con_otros_anios, filas_en_fuente,
                   guardar, reemplazar_fuente)

sys.stdout.reconfigure(encoding='utf-8')
ORIGEN = RAIZ / 'data' / 'Calendario2026 version final.xlsx'
INFORME = SALIDA / 'Revisión carga 2026.xlsx'

# ── Normalización de texto ──────────────────────────────────────────────
PALABRAS_VACIAS = {'de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'o', 'u', 'a', 'al', 'en', 'con', 'por', 'para', 'sin', 'sobre', 'entre', 'hacia', 'su', 'sus'}
ROMANOS = {'i', 'ii', 'iii', 'iiii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'}
MESES = {'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'setiembre', 'octubre', 'noviembre', 'diciembre'}
PERIODOS = {'ipa', 'iipa', 'pa'}
VACIOS = {'', 'nan', 'none', 'ninguna', 'ninguno', 'no aplica', 'n a', 'na', 'no especificado', 'sin especificar', 'por definir'}


def texto(v) -> str:
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return ''
    return re.sub(r'\s+', ' ', str(v).replace('_x000D_', ' ')).strip()  # _x000D_: salto de línea mal exportado


def plano(s: str) -> str:
    """minúsculas, sin tildes ni signos, con letras y números separados."""
    s = unicodedata.normalize('NFD', texto(s)).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'([a-z])(\d)', r'\1 \2', s)
    s = re.sub(r'(\d)([a-z])', r'\1 \2', s)
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9]+', ' ', s)).strip()


def singular(f: str) -> str:
    """Plural → singular aproximado: opciones → opcion, encuentros → encuentro, comites → comite."""
    if len(f) > 4 and f.endswith('ones'):
        return f[:-2]
    if len(f) > 4 and f.endswith('s') and f[-2] in 'aeiou':
        return f[:-1]
    return f


def clave_nombre(s: str) -> str:
    fichas = [singular(f) for f in plano(s).split() if f not in PALABRAS_VACIAS | ROMANOS | MESES | PERIODOS and not re.fullmatch(r'(19|20)\d\d', f)]
    return ' '.join(fichas)


def vigencia(s: str) -> int | None:
    anios = [int(a) for a in re.findall(r'\b(20[2-3]\d)\b', plano(s)) if 2024 <= int(a) <= 2030]
    return max(anios) if anios else None


def parecido(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    corto, largo = sorted((a, b), key=len)
    if len(corto) >= 8 and f' {corto} ' in f' {largo} ':
        return 0.92
    return SequenceMatcher(None, a, b).ratio()


def legible(s: str) -> str:
    """Espacios limpios y conectores en minúscula («Comité De Posgrados» → «Comité de Posgrados»)."""
    palabras = texto(s).split(' ')
    return ' '.join(p.lower() if i > 0 and plano(p) in PALABRAS_VACIAS and p[:1].isupper() else p for i, p in enumerate(palabras))


def titulo(s: str) -> str:
    """Para textos en MAYÚSCULAS: «DIRECCIÓN SISTEMAS Y TECNOLOGIA» → «Dirección Sistemas y Tecnologia» (conserva siglas)."""
    salida = []
    for i, p in enumerate(texto(s).split(' ')):
        base = plano(p)
        if i > 0 and base in PALABRAS_VACIAS:
            salida.append(p.lower())
        elif p.isupper() and 2 <= len(re.sub(r'\W', '', p)) <= 4 and base not in PALABRAS_VACIAS:
            salida.append(p)  # sigla: SGC, SST, SGA
        else:
            salida.append(p[:1].upper() + p[1:].lower())
    return ' '.join(salida)


def hora(v) -> str | None:
    if v is None or (isinstance(v, float) and pd.isna(v)) or v == '':
        return None
    if isinstance(v, dt.datetime):
        v = v.time()
    if isinstance(v, dt.time):
        minutos = v.hour * 60 + v.minute
    elif isinstance(v, (int, float)):
        minutos = round(float(v) % 1 * 24 * 60)
    else:
        m = re.search(r'(\d{1,2})[:.](\d{2})\s*([ap]\.?\s?m\.?)?', str(v).lower())
        if not m:
            return None
        h, mi = int(m.group(1)), int(m.group(2))
        if m.group(3) and m.group(3).startswith('p') and h < 12:
            h += 12
        minutos = h * 60 + mi
    if minutos <= 0 or minutos >= 24 * 60:
        return None
    return f'{minutos // 60:02d}:{minutos % 60:02d}'


# ── Catálogos ───────────────────────────────────────────────────────────
CATALOGOS = catalogos()
CALENDARIOS_2026 = {plano(c): c for c in CALENDARIOS}
SEDES = {plano(s): s for s in CATALOGOS['sedes']}
LIDERES = {plano(s): s for s in CATALOGOS['lideres']}
TODAS_LAS_SEDES = re.compile(r'sede seccionales extensiones|sede seccionales y extensiones|todas las (unidades regionales|sedes)|unidades regionales')

# Categorías del formato 2027 (mismos nombres). Se asignan por palabras clave, en este orden de prioridad,
# buscando primero en la subcategoría, luego en la categoría y al final en el nombre de la actividad.
REGLAS_CATEGORIA = [
    ('Proceso electoral', r'\belecci|electoral|votaci|designacion represent'),
    ('Consejo', r'\bconsejo'),
    ('Comité', r'\bcomite|copasst'),
    ('Comisión', r'\bcomision'),
    ('Mesa de trabajo', r'\bmesas? (de )?(trabajo|gestion)|grupo de trabajo'),
    ('Registro, admisiones y grados', r'\badmisi|inscripci|matricul|\bgrados?\b|registro|ceremonia de grado'),
    ('Auditoría / Control', r'auditor|control interno|\bcontrol\b|rendicion de cuentas|revision por la (alta )?direccion|plan de mejoramiento|inspecci'),
    ('Seminario / Conferencia / Foro', r'seminario|conferencia|\bforo|congreso|simposio|conversatorio|catedra|panel|coloquio|workshop|webinar|charla|ponencia'),
    ('Capacitación / Taller', r'capacitaci|taller|formacion|formativa|\bcurso|diplomado|induccion|reinduccion|sensibilizaci|entrenamiento|bootcamp|training|school|aula espejo|aulas vivas|orientacion vocacional'),
    ('Equidad y diversidad', r'equidad|diversidad|genero|inclusi|discapacidad'),
    ('Salud y bienestar', r'salud|bienestar|seguridad y salud|\bsst\b|psicolog|vacunaci|donaci|pausas? activas?|simulacro|emergencia|riesgo|biomecanic|higiene postural|estres|promocion y prevencion|calidad de vida|gimnasio'),
    ('Deporte', r'deport|torneo|\bjuegos|carrera|canicross|olimpiad|futbol|voleibol|baloncesto|atletismo|caminata'),
    ('Cultura', r'cultur|\barte|music|danza|teatro|festival|tuna|coral|\bcoro\b|cine|literari'),
    ('Encuentro', r'encuentro|acogida|feria|expo|muestra|visita|networking'),
    ('Jornada / Conmemoración', r'jornada|conmemora|celebraci|\bdia (de|del|internacional|nacional|mundial)|aniversario|semana|navidad|novena|dia dulce|vacaciones recreativas|tardes de aprendizaje|universidad para la familia|plan padrino|siembr|disfraz'),
    ('Reunión', r'reunion|sesion'),
    ('Actividad académica', r'academic|exito academico|practica|investigaci|semillero|maraton|competencia|campeonato|\breto\b|desafio|\bcac\b|campos de aprendizaje|certificad|consultorio|incubadora|emprend|empleabilidad'),
    ('Actividad administrativa', r'administrativ|financier|presupuest|contable|fiscal|cierre|tesoreria|contrat|planeaci|seguimiento|plan de accion|vacaciones colectivas'),
]


def categoria(sub: str, cat: str, actividad: str) -> tuple[str, str]:
    for fuente, valor in (('subcategoría', sub), ('categoría', cat), ('actividad', actividad)):
        p = plano(valor)
        if not p or p in {'otros', 'otro'}:
            continue
        for nombre, patron in REGLAS_CATEGORIA:
            if re.search(patron, p):
                return nombre, fuente
    return 'Otro', '—'


# ── Lectura ─────────────────────────────────────────────────────────────
def leer() -> tuple[list[dict], list[dict]]:
    filas, excluidas = [], []
    for hoja in ('Hoja1', 'Tabla1__6'):
        df = pd.read_excel(ORIGEN, sheet_name=hoja)
        df.columns = [str(c).strip() for c in df.columns]
        for i, r in df.iterrows():
            nombre = texto(r['Actividad a Desarrollar'])
            ini = pd.to_datetime(r['fecha inicio 2026'], errors='coerce')
            fin = pd.to_datetime(r['fecha 2026 fin'], errors='coerce')
            base = dict(hoja=hoja, fila=i + 2, nombre_original=nombre)
            if not nombre or pd.isna(ini):
                excluidas.append({**base, 'motivo': 'Sin nombre' if not nombre else 'Sin fecha de inicio', 'sede': texto(r['Unida regional'])})
                continue
            ini = ini.date()
            fin_valido = fin.date() if pd.notna(fin) else None
            nota_fin = ''
            if fin_valido is None:
                fin_valido, nota_fin = ini, 'Sin fecha fin: se usa la de inicio'
            elif fin_valido < ini:
                fin_valido, nota_fin = ini, 'Fecha fin anterior a la de inicio: se usa la de inicio'
            hi, hf = hora(r['Hora Inicio']), hora(r['Hora Final'])
            if hi is None:
                hf = None
            elif hf is not None and hf <= hi:
                hf = None
            sede = SEDES.get(plano(r['Unida regional']))
            lider = LIDERES.get(plano(r['Unidad Líder']))
            if not sede or not lider:
                excluidas.append({**base, 'motivo': f'Sede o unidad líder desconocida: {r["Unida regional"]} / {r["Unidad Líder"]}', 'sede': texto(r['Unida regional'])})
                continue
            lugar = texto(r['Lugar de desarrollo'])
            obs = texto(r['Observaciones'])
            cat_nombre, cat_fuente = categoria(texto(r['Subcategoria']), texto(r['Categoría']), nombre)
            filas.append({
                **base, 'nombre': legible(nombre), 'clave': clave_nombre(nombre), 'vigencia': vigencia(nombre),
                'sede': sede, 'lider': lider, 'responsable_original': texto(r['Responsable']),
                'categoria_original': texto(r['Categoría']), 'subcategoria_original': texto(r['Subcategoria']),
                'calendario': texto(r['Calendario']), 'categoria': cat_nombre, 'categoria_fuente': cat_fuente,
                'inicio': ini, 'fin': fin_valido, 'nota_fin': nota_fin, 'hora': hi, 'horaFin': hf,
                'lugar': None if plano(lugar) in VACIOS else legible(lugar),
                'todas': bool(TODAS_LAS_SEDES.search(plano(lugar))),
                'observaciones': None if plano(obs) in VACIOS else obs,
            })
    return filas, excluidas


def completitud(f: dict) -> int:
    return (f['hora'] is not None) * 2 + (f['horaFin'] is not None) + (f['lugar'] is not None) + bool(f['responsable_original'])


def elegir(a: dict, b: dict) -> tuple[dict, dict, str]:
    """Devuelve (conservada, descartada, motivo)."""
    va, vb = a['vigencia'] or 0, b['vigencia'] or 0
    if va != vb:
        return (a, b, f'Año más reciente ({va})') if va > vb else (b, a, f'Año más reciente ({vb})')
    ca, cb = completitud(a), completitud(b)
    if ca != cb:
        return (a, b, 'Datos más completos') if ca > cb else (b, a, 'Datos más completos')
    return (a, b, 'Iguales: se conserva la de Hoja1') if a['hoja'] == 'Hoja1' else (b, a, 'Iguales: se conserva la de Hoja1')


def resp(f: dict) -> str:
    return plano(f['responsable_original'])


def mismo_responsable(a: dict, b: dict) -> float:
    ra, rb = resp(a), resp(b)
    if not ra and not rb:
        return 1.0
    if not ra or not rb:
        return 0.0
    return parecido(ra, rb)


def responsable_compatible(viejo: dict, nuevo: dict) -> bool:
    """Mismo responsable o uno vacío. (Un programa y una facultad son responsables distintos: p. ej. los
    «Encuentros dialógicos y formativos» por programa de la Vicerrectoría Académica no están en Hoja1.)"""
    rv, rn = resp(viejo), resp(nuevo)
    return not rv or not rn or parecido(rv, rn) >= 0.75


def completar(nueva: dict, vieja: dict) -> list[str]:
    """Completa en la fila de Hoja1 los datos que solo tiene la de Tabla1__6 del mismo día."""
    completados = []
    if nueva['hora'] is None and vieja['hora'] is not None:
        nueva['hora'], nueva['horaFin'] = vieja['hora'], vieja['horaFin']
        completados.append('horas')
    elif nueva['horaFin'] is None and vieja['horaFin'] is not None and nueva['hora'] == vieja['hora']:
        nueva['horaFin'] = vieja['horaFin']
        completados.append('hora fin')
    if nueva['lugar'] is None and vieja['lugar'] is not None:
        nueva['lugar'], nueva['todas'] = vieja['lugar'], vieja['todas']
        completados.append('lugar')
    return completados


def depurar(filas: list[dict]) -> tuple[list[dict], list[dict], list[dict]]:
    decisiones, dudosas = [], []

    # 1. Repetidas dentro de cada hoja: solo si coinciden todos los datos.
    hojas = {}
    for hoja in ('Hoja1', 'Tabla1__6'):
        vistas: dict[tuple, dict] = {}
        for f in (x for x in filas if x['hoja'] == hoja):
            k = (f['sede'], f['inicio'], f['fin'], f['clave'], resp(f), f['hora'], f['horaFin'],
                 plano(f['lugar'] or ''), plano(f['subcategoria_original']))
            if k not in vistas:
                vistas[k] = f
                continue
            queda, sale, motivo = elegir(vistas[k], f)
            vistas[k] = queda
            decisiones.append(dict(tipo=f'Repetida en {hoja}', queda=queda, sale=sale,
                                   motivo='Año más reciente' if 'Año' in motivo else 'Misma fila dos veces', parecido=1.0))
        hojas[hoja] = list(vistas.values())
    h1, t1 = hojas['Hoja1'], hojas['Tabla1__6']

    # 2. Actividades presentes en ambas hojas: manda el calendario de Hoja1.
    series_h = defaultdict(list)
    for h in h1:
        series_h[(h['sede'], h['clave'], resp(h))].append(h)
    por_sede_h = defaultdict(list)
    for clave_serie, filas_serie in series_h.items():
        por_sede_h[clave_serie[0]].append((clave_serie, filas_serie))
    series_t = defaultdict(list)
    for t in t1:
        series_t[(t['sede'], t['clave'], resp(t))].append(t)
    salen = set()
    for (sede, clave, r), filas_t in series_t.items():
        mejor, puntaje = None, 0.0
        for (s, c, rh), filas_h in por_sede_h[sede]:
            nombre = parecido(clave, c)
            rs = 1.0 if r == rh else (parecido(r, rh) if r and rh else 0.0)
            if nombre >= 0.85 and rs >= 0.75 and nombre + rs > puntaje:
                mejor, puntaje = filas_h, nombre + rs
        if not mejor:
            continue
        por_fecha = {h['inicio']: h for h in mejor}
        for t in filas_t:
            pareja = por_fecha.get(t['inicio']) or min(mejor, key=lambda h: abs((h['inicio'] - t['inicio']).days))
            completados = completar(pareja, t) if pareja['inicio'] == t['inicio'] else []
            if t['vigencia'] and pareja['vigencia'] and t['vigencia'] != pareja['vigencia']:
                tipo, motivo = 'Mismo nombre, otro año', f'Año más reciente ({pareja["vigencia"]}) en Hoja1'
            elif pareja['inicio'] == t['inicio']:
                tipo, motivo = 'En ambas hojas, misma fecha', 'Hoja1 es la versión más reciente'
            else:
                tipo, motivo = 'En ambas hojas, otra fecha', f'Hoja1 la programa el {pareja["inicio"].isoformat()}'
            if completados:
                motivo += f' · se completó {", ".join(completados)} desde Tabla1__6'
            salen.add(id(t))
            decisiones.append(dict(tipo=tipo, queda=pareja, sale=t, motivo=motivo, parecido=parecido(t['clave'], pareja['clave'])))

    # 3. Resto de Tabla1__6: la misma actividad el mismo día en Hoja1 (nombre parecido, responsable compatible).
    mismo_dia = defaultdict(list)
    for h in h1:
        mismo_dia[(h['sede'], h['inicio'])].append(h)
    for t in (x for x in t1 if id(x) not in salen):
        opciones = sorted(((parecido(t['clave'], h['clave']), mismo_responsable(t, h), h) for h in mismo_dia[(t['sede'], t['inicio'])]),
                          key=lambda o: -(o[0] + 0.1 * o[1]))
        for nombre, rs, h in opciones:
            if nombre >= 0.85 and responsable_compatible(t, h):
                completados = completar(h, t)
                motivo = 'Misma actividad el mismo día en Hoja1 (versión más reciente)'
                if completados:
                    motivo += f' · se completó {", ".join(completados)} desde Tabla1__6'
                salen.add(id(t))
                decisiones.append(dict(tipo='Parecida en Hoja1, mismo día', queda=h, sale=t, motivo=motivo, parecido=nombre))
                break
            if nombre >= 0.70:
                dudosas.append(dict(a=t, b=h, parecido=nombre, responsable=rs))
                break

    final = h1 + [t for t in t1 if id(t) not in salen]
    dudosas = [d for d in dudosas if id(d['a']) not in salen]
    return final, decisiones, dudosas


# ── Responsables ────────────────────────────────────────────────────────
def catalogo_responsables(final: list[dict]) -> dict[str, str]:
    variantes = defaultdict(Counter)
    for f in final:
        variantes[plano(f['responsable_original'])][f['responsable_original']] += 1
    canon = {}
    for clave, conteo in variantes.items():
        if not clave:
            canon[clave] = 'No registrado'
            continue
        mejor = max(conteo, key=lambda v: (any(c.islower() for c in v), sum(c in 'áéíóúñÁÉÍÓÚÑ' for c in v), conteo[v]))
        canon[clave] = legible(titulo(mejor) if mejor.isupper() else mejor)
    return canon


# ── Salidas ─────────────────────────────────────────────────────────────
def a_hora(h: str | None) -> dt.time | None:
    return dt.time(*map(int, h.split(':'))) if h else None


def filas_fuente(final: list[dict], canon: dict[str, str]) -> list[dict]:
    """Las actividades en las columnas del Excel fuente (ver comun.COLUMNAS_FUENTE)."""
    final.sort(key=lambda f: (f['inicio'], f['hora'] or '', f['nombre']))
    def subcategoria(s: str) -> str:
        return titulo(s) if s.isupper() else legible(s)

    return [dict(actividad=f['nombre'], categoria=f['categoria'], subcategoria=subcategoria(f['subcategoria_original']),
                 calendario=CALENDARIOS_2026.get(plano(f['calendario']), f['calendario']), desde=f['inicio'], hasta=f['fin'],
                 hora_inicio=a_hora(f['hora']), hora_fin=a_hora(f['horaFin']), sede=TODAS if f['todas'] else f['sede'],
                 lugar=f['lugar'], responsable=canon[plano(f['responsable_original'])], lider=f['lider'],
                 observaciones=f['observaciones'], ajuste=f['nota_fin'], origen=f'{ORIGEN.name} · {f["hoja"]} fila {f["fila"]}')
            for f in final]


def escribir_informe(filas, final, decisiones, dudosas, excluidas, canon) -> None:
    wb = Workbook()
    negrita, cabecera = Font(name='Arial', bold=True, color='FFFFFF'), PatternFill('solid', fgColor='007B3E')

    def hoja(titulo_hoja, columnas, datos, anchos):
        ws = wb.create_sheet(titulo_hoja)
        ws.append(columnas)
        for fila in datos:
            ws.append(fila)
        for c in ws[1]:
            c.font, c.fill, c.alignment = negrita, cabecera, Alignment(wrap_text=True, vertical='center')
        for i, ancho in enumerate(anchos, start=1):
            ws.column_dimensions[get_column_letter(i)].width = ancho
        for fila in ws.iter_rows(min_row=2):
            for c in fila:
                c.font = Font(name='Arial', size=10)
                c.alignment = Alignment(wrap_text=True, vertical='top')
        ws.freeze_panes = 'A2'
        ws.auto_filter.ref = ws.dimensions
        return ws

    resumen = wb.active
    resumen.title = 'Resumen'
    tipos = Counter(d['tipo'] for d in decisiones)
    lineas = [
        ('Carga del calendario 2026', ''),
        ('Filas leídas (Hoja1 + Tabla1__6)', len(filas) + len(excluidas)),
        ('Excluidas (sin fecha o sin nombre)', len(excluidas)),
        *[(f'Descartadas: {k}', v) for k, v in sorted(tipos.items())],
        ('Actividades cargadas en el calendario', len(final)),
        ('Parejas dudosas (se conservaron ambas; revisar)', len(dudosas)),
        ('Responsables distintos (después de unificar escritura)', len(set(canon.values()))),
        ('', ''),
        ('Cómo leer este archivo', 'Cada hoja lista un tipo de decisión. «Queda» es la fila que pasó al calendario y «Sale» la que se descartó, '
                                   'con su hoja y número de fila en el Excel original para ubicarla.'),
    ]
    for a, b in lineas:
        resumen.append([a, b])
    resumen.column_dimensions['A'].width, resumen.column_dimensions['B'].width = 55, 90
    for fila in resumen.iter_rows():
        for c in fila:
            c.font = Font(name='Arial', size=10, bold=c.row == 1)
            c.alignment = Alignment(wrap_text=True, vertical='top')

    ref = lambda f: f'{f["hoja"]} fila {f["fila"]}'
    hoja('Duplicados', ['Tipo', 'Motivo', 'Parecido', 'Sede', 'Fecha', 'Queda', 'Queda (origen)', 'Sale', 'Sale (origen)'],
         [[d['tipo'], d['motivo'], round(d['parecido'], 2), d['queda']['sede'], d['queda']['inicio'].isoformat(),
           d['queda']['nombre_original'], ref(d['queda']), d['sale']['nombre_original'], ref(d['sale'])]
          for d in sorted(decisiones, key=lambda d: (d['tipo'], d['parecido']))],
         [24, 26, 10, 13, 12, 50, 18, 50, 18])
    hoja('Dudosas (revisar)', ['Parecido nombre', 'Parecido responsable', 'Sede', 'Fecha', 'Actividad A', 'Responsable A', 'Origen A', 'Actividad B', 'Responsable B', 'Origen B'],
         [[round(d['parecido'], 2), round(d['responsable'], 2), d['a']['sede'], d['a']['inicio'].isoformat(),
           d['a']['nombre_original'], d['a']['responsable_original'], ref(d['a']), d['b']['nombre_original'], d['b']['responsable_original'], ref(d['b'])]
          for d in sorted(dudosas, key=lambda d: -d['parecido'])],
         [10, 12, 13, 12, 45, 30, 18, 45, 30, 18])
    hoja('Excluidas', ['Motivo', 'Sede', 'Actividad', 'Origen'],
         [[e['motivo'], e['sede'], e['nombre_original'], f'{e["hoja"]} fila {e["fila"]}'] for e in excluidas], [30, 14, 70, 18])
    combos = Counter((f['categoria'], f['categoria_fuente'], f['subcategoria_original'], f['categoria_original']) for f in final)
    hoja('Categorías asignadas', ['Categoría asignada', 'Tomada de', 'Subcategoría original', 'Categoría original', 'Actividades'],
         [[a, b, c, d, n] for (a, b, c, d), n in combos.most_common()], [30, 14, 45, 45, 12])
    unif = Counter((canon[plano(f['responsable_original'])], f['responsable_original']) for f in final)
    hoja('Responsables unificados', ['Responsable en el calendario', 'Escrito en el Excel', 'Actividades'],
         [[a, b, n] for (a, b), n in sorted(unif.items(), key=lambda x: (plano(x[0][0]), -x[1]))], [55, 55, 12])
    ajustes = [f for f in final if f['nota_fin']]
    hoja('Ajustes de fecha', ['Ajuste', 'Actividad', 'Inicio', 'Origen'],
         [[f['nota_fin'], f['nombre_original'], f['inicio'].isoformat(), ref(f)] for f in ajustes], [50, 60, 12, 18])
    guardar(wb, INFORME)


def main() -> None:
    filas, excluidas = leer()
    final, decisiones, dudosas = depurar(filas)
    canon = catalogo_responsables(final)
    nuevas = filas_fuente(final, canon)
    errores = cargar.validar(nuevas)
    if errores:
        sys.exit('No se reemplazó nada: hay filas que la app no aceptaría.\n  ' + '\n  '.join(errores[:30]))
    antes = filas_en_fuente()
    todas, conservadas = combinar_con_otros_anios(nuevas)  # reemplaza 2026 y conserva los demás años
    otros = Counter(f['desde'].year for f in conservadas)
    origenes = [ORIGEN.name] + (['Filas de otros años del Excel anterior: ' + ', '.join(f'{a} ({n})' for a, n in sorted(otros.items()))]
                                if otros else [])
    respaldo = reemplazar_fuente(todas, 'herramientas/importar-2026.py', origenes)
    escribir_informe(filas, final, decisiones, dudosas, excluidas, canon)
    tipos = Counter(d['tipo'] for d in decisiones)
    print(f'Leídas: {len(filas) + len(excluidas)} | excluidas: {len(excluidas)} | descartadas: {dict(tipos)}')
    print(f'Cargadas: {len(final)} | dudosas (se conservan ambas): {len(dudosas)} | responsables: {len(set(canon.values()))}')
    print('Categorías:', dict(Counter(f['categoria'] for f in final).most_common()))
    print('Con horas:', sum(1 for f in final if f['hora']), '| todas las sedes:', sum(1 for f in final if f['todas']))
    print(f'Excel fuente actualizado: {FUENTE} ({antes if antes is not None else "no existía"} → {len(todas)} filas)')
    if otros:
        print('  Otros años conservados: ' + ', '.join(f'{a} ({n} filas)' for a, n in sorted(otros.items())))
    if respaldo:
        print(f'  Copia del anterior: {respaldo}')
    print('Informe:', INFORME)
    cargar.informar(cargar.cargar())


if __name__ == '__main__':
    main()
