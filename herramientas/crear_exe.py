"""
Crea «Cargar formatos.exe» (la app de cargar_formatos.py) en herramientas/, con PyInstaller.

  python herramientas/crear_exe.py

Instala las versiones fijadas abajo en un entorno aislado fuera del repositorio (en la carpeta temporal del
usuario), así no toca el Python del equipo. Vuelva a crearlo si cambia src/datos/catalogos.ts: el .exe lleva
una copia para cuando se usa fuera del repositorio.
"""
from __future__ import annotations

import os
import subprocess
import sys
import tempfile
from pathlib import Path

HERRAMIENTAS = Path(__file__).resolve().parent
CATALOGOS_TS = HERRAMIENTAS.parent / 'src' / 'datos' / 'catalogos.ts'
ENTORNO = Path(tempfile.gettempdir()) / 'calendario-institucional-exe'
# Últimas estables al 2026-09-29. Para actualizar: cambie la versión, cree el .exe y pruébelo.
VERSIONES = ['pyinstaller==6.22.3', 'openpyxl==3.1.5']
NOMBRE = 'Cargar formatos'


def correr(*orden: object) -> None:
    subprocess.run([str(o) for o in orden], check=True)


def main() -> None:
    python = ENTORNO / 'Scripts' / 'python.exe'
    if not python.exists():
        correr(sys.executable, '-m', 'venv', ENTORNO)
    correr(python, '-m', 'pip', 'install', '--disable-pip-version-check', '--quiet', *VERSIONES)
    with tempfile.TemporaryDirectory() as trabajo:
        correr(python, '-m', 'PyInstaller', '--noconfirm', '--clean', '--onefile', '--windowed', '--name', NOMBRE,
               '--distpath', HERRAMIENTAS, '--workpath', Path(trabajo) / 'build', '--specpath', trabajo,
               '--paths', HERRAMIENTAS, '--add-data', f'{CATALOGOS_TS}{os.pathsep}.',
               '--exclude-module', 'pandas', '--exclude-module', 'numpy', HERRAMIENTAS / 'cargar_formatos.py')
    print(f'Listo: {HERRAMIENTAS / (NOMBRE + ".exe")}')


if __name__ == '__main__':
    main()
