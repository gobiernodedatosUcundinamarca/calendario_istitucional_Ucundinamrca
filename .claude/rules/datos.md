---
paths:
  - "src/datos/**"
---

# Datos del calendario

- Las actividades se editan solo en `src/datos/actividades.ts` y los catálogos en `src/datos/catalogos.ts`.
  El formato de cada campo está documentado al inicio de `actividades.ts`; para agregar datos usa la skill
  `/agregar-actividad`.
- Los nombres de los catálogos son tipos de TypeScript: una unidad, responsable o tipo mal escrito no compila.
- `normalizarActividades` valida fechas y horas al compilar: si falla, corrige el dato, no la validación.
- Los datos actuales **son de ejemplo del diseño** (incluidos los nombres de los responsables): hay que
  reemplazarlos por los oficiales.
