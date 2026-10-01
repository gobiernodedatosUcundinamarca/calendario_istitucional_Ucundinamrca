---
paths:
  - "src/datos/**"
  - "herramientas/**"
---

# Datos del calendario

- **Regla: los datos de la app salen siempre del Excel consolidado** `data/Calendario institucional.xlsx`, y de
  ningún otro lado. Los formatos de las áreas (`herramientas/formatos/`) no alimentan la app directamente: pasan
  primero por `consolidar.py`, que escribe el consolidado. No se escriben ni se editan actividades en
  `src/datos/actividades.ts` ni `responsables.ts` (ni a mano ni con scripts propios): se corrige el consolidado
  (o el formato del área y se vuelve a consolidar) y se corre `herramientas/cargar.py`, que los regenera.
- `herramientas/cargar.py` genera desde el consolidado `src/datos/actividades.ts` y `src/datos/responsables.ts`.
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
