"""
App de escritorio para recibir los formatos de las áreas: los copia a herramientas/formatos/ (la carpeta que lee
consolidar.py) y muestra si cada uno sirve y qué hay que corregir. No consolida ni toca la app web.

  python herramientas/cargar_formatos.py
Como .exe: python herramientas/crear_exe.py («Cargar formatos.exe», junto a este archivo).
"""
from __future__ import annotations

import hashlib
import os
import re
import shutil
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

import consolidar
from comun import HERRAMIENTAS

CARPETA = HERRAMIENTAS / 'formatos'
VERDE, ROJO, GRIS = '#00482B', '#9b1c1c', '#5f6660'


def huella(ruta: Path) -> str:
    return hashlib.sha256(ruta.read_bytes()).hexdigest()


def nombre_destino(origen: Path, area: str) -> Path:
    """Muchas áreas envían el archivo con el mismo nombre: la copia lleva el área adelante y nunca pisa otra."""
    base = origen.stem if not area or area.lower() in origen.stem.lower() else f'{area} - {origen.stem}'
    base = re.sub(r'[<>:"/\\|?*]', '-', base).strip(' .')[:120]
    CARPETA.mkdir(parents=True, exist_ok=True)
    destino, n = CARPETA / f'{base}.xlsx', 2
    while destino.exists():
        destino, n = CARPETA / f'{base} ({n}).xlsx', n + 1
    return destino


def estado(a: consolidar.Archivo) -> tuple[str, str]:
    """(texto, color) para la lista."""
    if a.estado == 'Aceptado':
        n = len(a.errores)
        return ('Listo', 'listo') if not n else (f'Corregir {n} fila{"s" if n > 1 else ""}', 'corregir')
    return {'Rechazado': ('No sirve', 'nosirve'), 'Repetido': ('Repetido', 'otro'),
            'Reemplazado': ('Hay uno más nuevo', 'otro'), 'Ignorado': ('No es Excel', 'nosirve')}[a.estado]


def detalle(a: consolidar.Archivo) -> str:
    d = a.datos
    lineas = [a.ruta.name, '']
    if a.area:
        lineas.append(f'Área: {a.area} · Unidad líder: {d.get("lider") or "—"} · Sede principal: {d.get("sede") or "—"}'
                      f' · Calendario principal: {d.get("calendario") or "—"}')
        lineas.append(f'Diligenció: {consolidar.texto(d.get("quien")) or "—"} ({consolidar.texto(d.get("correo")) or "sin correo"})')
    texto_estado, _ = estado(a)
    lineas.append(f'Estado: {texto_estado}' + (f'. {a.motivo}' if a.motivo else ''))
    if a.estado == 'Aceptado':
        lineas.append(f'Actividades: {a.escritas} filas escritas, {len(a.filas)} listas, '
                      f'{sum(len(f.ocurrencias) for f in a.filas)} fechas en el calendario')
    if a.errores:
        lineas += ['', f'Filas por corregir ({len(a.errores)}): no entran al calendario']
        lineas += [f'  Fila {n} · {nombre or "(sin nombre)"}: {problema}' for n, nombre, problema in a.errores]
    if a.avisos:
        lineas += ['', f'Avisos ({len(a.avisos)}): entran, pero conviene revisarlos']
        lineas += [f'  Fila {n}{" · " + nombre if nombre else ""}: {m}' if n != '—' else f'  {m}' for n, nombre, m in a.avisos]
    return '\n'.join(lineas)


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title('Cargar formatos · Calendario institucional')
        self.geometry('1040x640')
        self.minsize(760, 480)
        self.archivos: dict[str, consolidar.Archivo] = {}
        CARPETA.mkdir(parents=True, exist_ok=True)

        estilo = ttk.Style(self)
        estilo.configure('Titulo.TLabel', font=('Segoe UI', 14, 'bold'), foreground=VERDE)
        estilo.configure('Treeview', rowheight=24)

        arriba = ttk.Frame(self, padding=(16, 12, 16, 6))
        arriba.pack(fill='x')
        ttk.Label(arriba, text='Formatos del calendario institucional', style='Titulo.TLabel').pack(anchor='w')
        ttk.Label(arriba, text='Agregue los formatos que enviaron las áreas. Se copian a la carpeta que usa la '
                                'consolidación; el archivo original no se modifica. Cuando estén todos, se consolidan '
                                'con «python herramientas/consolidar.py».', wraplength=980).pack(anchor='w', pady=(2, 0))
        ruta = ttk.Frame(arriba)
        ruta.pack(fill='x', pady=(6, 0))
        ttk.Label(ruta, text=f'Carpeta: {CARPETA}', foreground=GRIS).pack(side='left')

        botones = ttk.Frame(self, padding=(16, 4))
        botones.pack(fill='x')
        ttk.Button(botones, text='Agregar formatos…', command=self.agregar).pack(side='left')
        ttk.Button(botones, text='Abrir en Excel', command=self.abrir).pack(side='left', padx=(8, 0))
        ttk.Button(botones, text='Quitar de la carpeta', command=self.quitar).pack(side='left', padx=(8, 0))
        ttk.Button(botones, text='Abrir carpeta', command=lambda: os.startfile(CARPETA)).pack(side='right')
        ttk.Button(botones, text='Revisar de nuevo', command=self.actualizar).pack(side='right', padx=(0, 8))

        self.estado = ttk.Label(self, padding=(16, 6), foreground=GRIS)
        self.estado.pack(side='bottom', fill='x')  # antes del panel, para que nunca quede cortada

        panel = ttk.PanedWindow(self, orient='vertical')
        panel.pack(fill='both', expand=True, padx=16, pady=(6, 0))
        lista = ttk.Frame(panel)
        columnas = {'area': ('Área', 260), 'estado': ('Estado', 140), 'filas': ('Filas', 60),
                    'envio': ('Envío', 90)}
        self.tabla = ttk.Treeview(lista, columns=list(columnas), selectmode='extended')
        self.tabla.heading('#0', text='Archivo')
        self.tabla.column('#0', width=330)
        for clave, (titulo, ancho) in columnas.items():
            self.tabla.heading(clave, text=titulo)
            self.tabla.column(clave, width=ancho, anchor='center' if clave in ('filas', 'envio') else 'w')
        self.tabla.tag_configure('listo', foreground=VERDE)
        self.tabla.tag_configure('corregir', foreground='#7a4300')
        self.tabla.tag_configure('nosirve', foreground=ROJO)
        self.tabla.tag_configure('otro', foreground=GRIS)
        barra = ttk.Scrollbar(lista, orient='vertical', command=self.tabla.yview)
        self.tabla.configure(yscrollcommand=barra.set)
        self.tabla.pack(side='left', fill='both', expand=True)
        barra.pack(side='right', fill='y')
        self.tabla.bind('<<TreeviewSelect>>', lambda _: self.mostrar())
        self.tabla.bind('<Double-1>', lambda _: self.abrir())
        self.tabla.bind('<Delete>', lambda _: self.quitar())
        panel.add(lista, weight=3)

        abajo = ttk.Frame(panel)
        cabecera = ttk.Frame(abajo)
        cabecera.pack(fill='x', pady=(8, 4))
        ttk.Label(cabecera, text='Qué revisar del archivo seleccionado').pack(side='left')
        ttk.Button(cabecera, text='Copiar para enviar al área', command=self.copiar).pack(side='right')
        self.texto = tk.Text(abajo, height=10, wrap='word', font=('Segoe UI', 10), relief='solid', borderwidth=1,
                             padx=8, pady=6)
        self.texto.pack(fill='both', expand=True)
        panel.add(abajo, weight=2)
        self.actualizar()

    # ── Acciones ────────────────────────────────────────────────────────
    def agregar(self) -> None:
        rutas = filedialog.askopenfilenames(title='Formatos de las áreas', filetypes=[('Libro de Excel', '*.xlsx'),
                                                                                     ('Todos los archivos', '*.*')])
        if not rutas:
            return
        copiados, ya_estaban, no_xlsx = [], [], []
        existentes = {huella(p) for p in CARPETA.rglob('*.xlsx')}
        for texto_ruta in rutas:
            origen = Path(texto_ruta)
            if origen.suffix.lower() != '.xlsx':
                no_xlsx.append(origen.name)
                continue
            h = huella(origen)
            if h in existentes:
                ya_estaban.append(origen.name)
                continue
            area = consolidar.leer_archivo(origen, None).area
            destino = nombre_destino(origen, area)
            shutil.copy2(origen, destino)
            existentes.add(h)
            copiados.append(destino.name)
        partes = []
        if copiados:
            partes.append(f'Se agregaron {len(copiados)}:\n  ' + '\n  '.join(copiados))
        if ya_estaban:
            partes.append(f'Ya estaban en la carpeta ({len(ya_estaban)}):\n  ' + '\n  '.join(ya_estaban))
        if no_xlsx:
            partes.append(f'No se agregaron porque no son .xlsx ({len(no_xlsx)}). Pida al área que los guarde como '
                          '«Libro de Excel (.xlsx)»:\n  ' + '\n  '.join(no_xlsx))
        messagebox.showinfo('Cargar formatos', '\n\n'.join(partes), parent=self)
        self.actualizar(seleccionar=copiados)

    def seleccionados(self) -> list[consolidar.Archivo]:
        return [self.archivos[i] for i in self.tabla.selection() if i in self.archivos]

    def abrir(self) -> None:
        for a in self.seleccionados()[:5]:
            os.startfile(a.ruta)

    def quitar(self) -> None:
        elegidos = self.seleccionados()
        if not elegidos:
            return
        nombres = '\n  '.join(a.ruta.name for a in elegidos)
        if not messagebox.askyesno('Quitar de la carpeta', f'¿Quitar estos archivos de la carpeta de formatos?\n  {nombres}\n\n'
                                   'Se borra solo la copia; el archivo original que le enviaron sigue donde estaba.',
                                   icon='warning', parent=self):
            return
        for a in elegidos:
            try:
                a.ruta.unlink()
            except PermissionError:
                messagebox.showerror('Quitar de la carpeta', f'No se pudo borrar «{a.ruta.name}»: ciérrelo en Excel.', parent=self)
        self.actualizar()

    def copiar(self) -> None:
        contenido = self.texto.get('1.0', 'end').strip()
        if contenido:
            self.clipboard_clear()
            self.clipboard_append(contenido)
            self.estado.configure(text='Copiado: péguelo en el correo para el área.')

    # ── Lista ───────────────────────────────────────────────────────────
    def actualizar(self, seleccionar: list[str] | None = None) -> None:
        self.estado.configure(text='Revisando los formatos…')
        self.configure(cursor='watch')

        def revisar() -> None:
            try:
                archivos = consolidar.leer_carpeta(CARPETA)
                consolidar.resolver_reenvios(archivos)
                self.after(0, lambda: self.pintar(archivos, seleccionar or []))
            except Exception as e:  # noqa: BLE001 — cualquier falla se muestra en la ventana
                self.after(0, lambda error=e: self.falla(error))

        threading.Thread(target=revisar, daemon=True).start()

    def pintar(self, archivos: list[consolidar.Archivo], seleccionar: list[str]) -> None:
        self.configure(cursor='')
        self.tabla.delete(*self.tabla.get_children())
        self.archivos = {}
        for i, a in enumerate(archivos):
            texto_estado, color = estado(a)
            envio = a.datos.get('envio')
            iid = str(i)
            self.archivos[iid] = a
            self.tabla.insert('', 'end', iid=iid, text=str(a.ruta.relative_to(CARPETA)), tags=(color,), values=(
                a.area or '—', texto_estado, a.escritas or '', envio.strftime('%d/%m/%Y') if envio else ''))
        elegidos = [i for i, a in self.archivos.items() if a.ruta.name in seleccionar]
        if elegidos:
            self.tabla.selection_set(elegidos)
            self.tabla.see(elegidos[0])
        self.mostrar()
        conteo = {}
        for a in archivos:
            conteo[estado(a)[1]] = conteo.get(estado(a)[1], 0) + 1
        self.estado.configure(text=f'{len(archivos)} archivos · {conteo.get("listo", 0)} listos · '
                                   f'{conteo.get("corregir", 0)} con filas por corregir · {conteo.get("nosirve", 0)} no sirven · '
                                   f'{conteo.get("otro", 0)} repetidos o reemplazados')

    def mostrar(self) -> None:
        elegidos = self.seleccionados()
        self.texto.configure(state='normal')
        self.texto.delete('1.0', 'end')
        self.texto.insert('1.0', '\n\n'.join(detalle(a) for a in elegidos) if elegidos
                          else 'Seleccione un archivo para ver qué tiene que corregir el área.')
        self.texto.configure(state='disabled')

    def falla(self, error: Exception) -> None:
        self.configure(cursor='')
        self.estado.configure(text=f'No se pudieron revisar los formatos: {error}')
        messagebox.showerror('Cargar formatos', f'No se pudieron revisar los formatos:\n{error}', parent=self)


def main() -> None:
    try:  # texto nítido en pantallas con escala
        import ctypes
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except (AttributeError, OSError):
        pass
    App().mainloop()


if __name__ == '__main__':
    main()
