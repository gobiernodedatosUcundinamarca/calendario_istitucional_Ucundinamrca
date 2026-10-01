"""
Genera los datos de la app (src/datos/actividades.ts y src/datos/responsables.ts) desde el Excel fuente
(data/Calendario institucional.xlsx, hoja «Calendario»).

consolidar.py e importar-2026.py lo corren al terminar. Solo hace falta correrlo a mano después de corregir
el Excel fuente:
  python herramientas/cargar.py
Si alguna fila no es válida no cambia nada y dice cuál corregir. Después: pnpm verificar.
"""
from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

from comun import CALENDARIOS, FUENTE, HOJA_FUENTE, RAIZ, TODAS, a_fecha, a_hora, catalogos, leer_filas_fuente, plano, texto

if sys.stdout:  # en el .exe sin consola no hay salida estándar
    sys.stdout.reconfigure(encoding='utf-8')
SALIDA_ACTIVIDADES = RAIZ / 'src' / 'datos' / 'actividades.ts'
SALIDA_RESPONSABLES = RAIZ / 'src' / 'datos' / 'responsables.ts'


def validar(filas: list[dict]) -> list[str]:
    """Lo mismo que exige la app (normalizarActividades y los tipos de catalogos.ts), fila por fila."""
    cat = catalogos()
    errores = []
    for f in filas:
        donde = f'Fila {f.get("fila", "?")} («{texto(f.get("actividad"))[:60]}»)'
        problemas = []
        if not texto(f.get('actividad')):
            problemas.append('falta la actividad')
        if texto(f.get('categoria')) not in cat['categorias']:
            problemas.append(f'la categoría «{texto(f.get("categoria"))}» no está en catalogos.ts')
        desde, hasta = a_fecha(f.get('desde')), a_fecha(f.get('hasta'))
        if not desde:
            problemas.append('«Fecha inicio» no es una fecha')
        if not hasta:
            problemas.append('«Fecha fin» no es una fecha')
        if desde and hasta and hasta < desde:
            problemas.append('«Fecha fin» es antes de «Fecha inicio»')
        for campo, titulo in (('hora_inicio', 'Hora inicio'), ('hora_fin', 'Hora final')):
            if f.get(campo) not in (None, '') and not a_hora(f.get(campo)):
                problemas.append(f'«{titulo}» no es una hora hh:mm')
        if texto(f.get('sede')) not in [*cat['sedes'], TODAS]:
            problemas.append(f'la unidad regional «{texto(f.get("sede"))}» no está en catalogos.ts')
        if not texto(f.get('responsable')):
            problemas.append('falta el responsable')
        if texto(f.get('lider')) not in cat['lideres']:
            problemas.append(f'la unidad líder «{texto(f.get("lider"))}» no está en catalogos.ts')
        if texto(f.get('calendario')) not in CALENDARIOS:
            problemas.append(f'el calendario «{texto(f.get("calendario"))}» no es {" ni ".join(CALENDARIOS)}')
        if problemas:
            errores.append(f'{donde}: {"; ".join(problemas)}')
    return errores


def ts(s: str) -> str:
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"


def subcategoria_util(f: dict) -> str:
    """La subcategoría solo si dice algo más: muchas filas repiten el nombre de la actividad o la categoría, u «Otros»."""
    sub = texto(f.get('subcategoria'))
    repetidas = {plano(f.get('actividad')), plano(f.get('categoria')), 'otro', 'otros', 'ninguna', 'no aplica'}
    return '' if plano(sub) in repetidas else sub


def generar(filas: list[dict], origen: str) -> dict:
    """Escribe los .ts. Una hora fin sin hora inicio, o que no es posterior a ella, se deja por fuera (la app no la acepta)."""
    actividades = []
    sin_hora_fin = 0
    for f in filas:
        hora, hora_fin = a_hora(f.get('hora_inicio')), a_hora(f.get('hora_fin'))
        if hora_fin and (not hora or hora_fin <= hora):
            hora_fin, sin_hora_fin = None, sin_hora_fin + 1
        actividades.append(dict(nombre=texto(f['actividad']), categoria=texto(f['categoria']),
                                subcategoria=subcategoria_util(f), calendario=texto(f['calendario']),
                                inicio=a_fecha(f['desde']), fin=a_fecha(f['hasta']), hora=hora, horaFin=hora_fin,
                                responsable=texto(f['responsable']), lider=texto(f['lider']), sede=texto(f['sede']),
                                lugar=texto(f.get('lugar')), observaciones=texto(f.get('observaciones'))))
    actividades.sort(key=lambda a: (a['inicio'], a['hora'] or '', a['nombre']))
    responsables = sorted({a['responsable'] for a in actividades}, key=plano)

    SALIDA_RESPONSABLES.write_text(
        f'/** Dependencias responsables. GENERADO por herramientas/cargar.py desde «{origen}». */\n'
        'export const responsables = [\n' + ''.join(f'  {ts(r)},\n' for r in responsables) + '] as const;\n',
        encoding='utf-8')
    bloques = []
    for a in actividades:
        campos = [f'nombre: {ts(a["nombre"])}', f'categoria: {ts(a["categoria"])}']
        if a['subcategoria']:
            campos.append(f'subcategoria: {ts(a["subcategoria"])}')
        campos += [f'calendario: {ts(a["calendario"])}', f"inicio: '{a['inicio'].isoformat()}'", f"fin: '{a['fin'].isoformat()}'"]
        if a['hora']:
            campos.append(f"hora: '{a['hora']}'")
        if a['horaFin']:
            campos.append(f"horaFin: '{a['horaFin']}'")
        campos += [f'responsable: {ts(a["responsable"])}', f'lider: {ts(a["lider"])}',
                   "regionales: 'todas'" if a['sede'] == TODAS else f'regionales: [{ts(a["sede"])}]']
        if a['lugar']:
            campos.append(f'lugar: {ts(a["lugar"])}')
        if a['observaciones']:
            campos.append(f'observaciones: {ts(a["observaciones"])}')
        bloques.append('  actividad({\n' + ''.join(f'    {c},\n' for c in campos) + '  }),\n')
    SALIDA_ACTIVIDADES.write_text(
        '/**\n'
        ' * Actividades del calendario institucional.\n'
        f' * GENERADO por herramientas/cargar.py desde «{origen}» (hoja «{HOJA_FUENTE}»): no lo edite a mano,\n'
        ' * la próxima carga lo SOBRESCRIBE. Para corregir, edite el Excel y vuelva a correr el script.\n'
        ' *\n'
        ' * Campos: nombre · categoria (una de `categorias`) · subcategoria opcional · calendario (uno de `calendarios`)\n'
        ' * · inicio/fin (AAAA-MM-DD) · hora/horaFin opcionales (HH:MM) · responsable · lider · regionales (\'todas\' o\n'
        ' * lista de sedes) · lugar, observaciones, documento, enlace y estado opcionales.\n'
        ' */\n'
        "import type { ActividadFuente } from '@/features/calendario/tipos';\n\n"
        '/** Valida cada actividad por separado: TypeScript no puede validar de una vez un arreglo tan grande. */\n'
        'const actividad = (a: ActividadFuente): ActividadFuente => a;\n\n'
        'export const actividades: ActividadFuente[] = [\n' + ''.join(bloques) + '];\n',
        encoding='utf-8')

    return {'actividades': len(actividades), 'responsables': len(responsables), 'horas_fin_quitadas': sin_hora_fin,
            'anios': Counter(a['inicio'].year for a in actividades)}


def cargar(ruta: Path = FUENTE) -> dict:
    filas = leer_filas_fuente(ruta)
    errores = validar(filas)
    if errores:
        lista = '\n  '.join(errores[:30]) + (f'\n  … y {len(errores) - 30} más' if len(errores) > 30 else '')
        sys.exit(f'No se cargó nada: corrija estas filas de «{ruta.name}» y vuelva a correr cargar.py.\n  {lista}')
    if not filas:
        sys.exit(f'«{ruta.name}» no tiene actividades: no se cargó nada.')
    origen = ruta.relative_to(RAIZ).as_posix() if ruta.is_relative_to(RAIZ) else ruta.name
    return generar(filas, origen)


def informar(resultado: dict) -> None:
    print(f'App: {resultado["actividades"]} actividades y {resultado["responsables"]} responsables en src/datos '
          f'(años: {", ".join(f"{a}: {n}" for a, n in sorted(resultado["anios"].items()))})')
    if resultado['horas_fin_quitadas']:
        print(f'  {resultado["horas_fin_quitadas"]} horas fin quedaron por fuera: no eran posteriores a la hora inicio')
    print('Siguiente paso: pnpm verificar')


if __name__ == '__main__':
    informar(cargar())
