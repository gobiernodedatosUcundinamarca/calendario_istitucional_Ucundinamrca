---
paths:
  - "src/datos/**"
  - "herramientas/**"
---

# Datos del calendario

- La app toma las actividades del **Excel fuente** `data/Calendario institucional.xlsx`. `herramientas/cargar.py`
  genera desde él `src/datos/actividades.ts` y `src/datos/responsables.ts`: esos dos archivos no se editan a mano.
- `herramientas/consolidar.py` (formatos de las áreas) e `herramientas/importar-2026.py` (carga única de 2026)
  **reemplazan en el Excel fuente los años que cargan y conservan los demás**. Antes guardan una copia en
  `herramientas/salida/respaldos`. El uso, las reglas de consolidación y el informe de revisión están en
  `herramientas/LEEME.md`. El formato que llenan las áreas está en `herramientas/plantilla/`.
- `src/datos/catalogos.ts` se edita a mano (sedes, unidades líder, calendarios, tipos y la tabla categoría → tipo) y
  manda sobre todo lo demás: las herramientas leen de allí sedes, unidades, calendarios y categorías. Si cambian,
  actualiza la hoja «Listas» del formato y vuelve a crear el `.exe` (`python herramientas/crear_exe.py`).
- El subtítulo de la app toma los años de las actividades cargadas (`app/page.tsx`): no se escribe a mano.
- Los nombres de los catálogos son tipos de TypeScript: una sede, unidad, responsable o categoría mal escrita no compila.
- `normalizarActividades` valida fechas y horas al compilar: si falla, corrige el dato en el Excel, no la validación.
- Las herramientas son Python aparte de la app (openpyxl, y pandas para 2026). No se instalan con pnpm ni se
  agregan a `package.json`.
- `data/`, `herramientas/formatos/`, `herramientas/salida/` y el `.exe` no se versionan: traen nombres y correos
  de personas. La plantilla del formato sí se versiona: va vacía.
