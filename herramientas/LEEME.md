# Herramientas de datos del calendario

Scripts de Python que preparan los datos de la app web. No forman parte de la app: la app solo lee
`src/datos/actividades.ts` y `src/datos/responsables.ts`, que se generan desde el **Excel fuente**
`data/Calendario institucional.xlsx`.

```
plantilla/Formato…xlsx ──(se envía a las áreas)──▶ formatos llenos ──(Cargar formatos.exe)──▶ herramientas/formatos/
herramientas/formatos/ ──consolidar.py──▶ data/Calendario institucional.xlsx ──cargar.py──▶ src/datos/*.ts ──▶ pnpm verificar
```

Requisitos: Python 3.10 o más reciente y `openpyxl` (`importar-2026.py` además necesita `pandas`).

## Uso

0. **Enviar el formato** `herramientas/plantilla/Formato Calendario Institucional - Areas.xlsx` a las áreas.
1. **Recibir los formatos.** Abra `Cargar formatos.exe` (o `python herramientas/cargar_formatos.py`) y use
   «Agregar formatos…». Cada archivo se copia a `herramientas/formatos/` con el nombre del área adelante, y la
   app muestra si sirve y qué filas hay que corregir. «Copiar para enviar al área» deja ese detalle listo para
   pegar en un correo.
2. **Consolidar.** `python herramientas/consolidar.py --anio 2027`
   - En el Excel fuente reemplaza los años que traen los formatos y conserva los demás: consolidar 2027 no borra
     2026. La copia del anterior queda en `herramientas/salida/respaldos/`. Luego regenera `src/datos`.
   - `--solo-revisar` hace todo menos tocar la app: deja una vista previa en `herramientas/salida/`.
   - `--reemplazar-todo` borra también los años que no vienen en los formatos.
   - Para deshacer una consolidación, copie el respaldo sobre `data/Calendario institucional.xlsx` y corra
     `python herramientas/cargar.py`.
3. **Revisar** `herramientas/salida/Revisión consolidación.xlsx`:
   - «Errores»: las filas que no entraron. Se devuelven al área.
   - «Posibles duplicados» y «Reemplazos»: se deciden a mano.
   - «Ajustes por festivo» y «Avisos»: se confirman.
4. **Publicar**: `pnpm verificar`, probar la app y hacer commit de `src/datos`.

El Excel fuente tiene las mismas columnas que el calendario institucional 2026, en el mismo orden:

- Unidad regional, Calendario, Unidad líder, Categoría y Subcategoría.
- Actividad a desarrollar, Lugar de desarrollo, Hora inicio, Hora final, Responsable y Observaciones.
- Fecha inicio, Fecha fin, Día y Mes.
- Tres columnas más dicen de dónde viene cada fila: Repetición, Ajuste y Origen.

Cómo se llena cada columna desde el formato:

- Unidad líder sale de «1. Datos del área».
- Responsable, Calendario y Unidad regional salen de la fila y, si están vacíos, del área (el área, el «Calendario principal» y la «Sede principal»).
- Día y Mes se calculan de la fecha.

Para corregir una actividad a mano, edite la hoja «Calendario» del Excel fuente y corra
`python herramientas/cargar.py`. La próxima consolidación de ese año borra esos cambios: corríjalos también en el
formato del área.

La app muestra en el subtítulo los años de las actividades cargadas (por ejemplo «2026–2027»).

## Qué hace la consolidación

- Revisa cada fila con las mismas reglas de «✔ Así quedó» del formato, sin confiar en las fórmulas: pegar datos
  se salta las validaciones de Excel.
- Rechaza con el motivo los archivos que no son `.xlsx`, los que no son el formato, los que tienen columnas
  cambiadas y los que no dicen el área o la unidad líder.
- Si un área envía varias versiones (mismo «Área o dependencia» y «Sede principal»), vale la más reciente según la
  fecha de envío. Si falta o empata, según la fecha del archivo. Los archivos idénticos se cuentan una vez.
- Expande las repeticiones a una fila por fecha. Las sesiones que caen en festivo pasan al día hábil siguiente.
  Una fecha puntual en festivo se deja igual y se avisa.
- Quita las filas idénticas de un mismo archivo. Las parecidas se conservan y se listan para revisar.
- Los cruces de horario se permiten.

Sedes, unidades líder, calendarios y categorías salen de `src/datos/catalogos.ts`. Si cambian allí, actualice la
hoja «Listas» del formato y vuelva a crear el `.exe`.

La columna H de «Listas» tiene las **áreas sugeridas**. Se ofrecen en «Área o dependencia» y en «Responsable»,
sin obligar: un área que no esté se puede escribir. La consolidación unifica a la forma de la lista los nombres
que solo cambian en mayúsculas o tildes. Es un borrador sacado de los responsables de 2026: valídelo con
Planeación y corríjalo directamente en esa columna (la hoja está oculta: clic derecho en una pestaña → Mostrar).

## Crear el .exe

`python herramientas/crear_exe.py` instala PyInstaller en un entorno aislado (fuera del repositorio) y deja
`Cargar formatos.exe` en esta carpeta. El `.exe` no se versiona: se vuelve a crear con este comando.

## Archivos

| Archivo | Qué hace |
|---|---|
| `plantilla/Formato Calendario Institucional - Areas.xlsx` | El formato que llenan las áreas. |
| `cargar_formatos.py` | App de escritorio para recibir los formatos (el `.exe`). |
| `consolidar.py` | Formatos de las áreas → Excel fuente → app. |
| `cargar.py` | Excel fuente → `src/datos`. |
| `importar-2026.py` | Carga única del calendario 2026 (`data/Calendario2026 version final.xlsx`), anterior al formato. |
| `comun.py` | Rutas, catálogos y el Excel fuente, compartidos por los demás. |
| `crear_exe.py` | Crea `Cargar formatos.exe`. |

`formatos/`, `salida/`, el `.exe` y `data/` no se suben al repositorio porque traen nombres y correos de personas.
La plantilla sí: va vacía.
