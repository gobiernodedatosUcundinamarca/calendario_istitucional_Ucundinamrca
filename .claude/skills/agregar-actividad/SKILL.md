---
name: agregar-actividad
description: Agrega o corrige actividades del calendario, o entradas de los catálogos (sedes, unidades, categorías, tipos), en src/datos.
---

# Agregar o editar actividades

Aplica `.claude/rules/datos.md`. Las actividades no se escriben en `src/datos/actividades.ts`: se generan desde el
Excel fuente `data/Calendario institucional.xlsx`.

1. **Decide dónde va el cambio.**
   - Si viene del formato de un área, corrígelo en ese formato (`herramientas/formatos/`) y vuelve a consolidar:
     `python herramientas/consolidar.py`. Revisa después `herramientas/salida/Revisión consolidación.xlsx`.
   - Si es una corrección puntual, edita la hoja «Calendario» del Excel fuente y corre
     `python herramientas/cargar.py`. Avisa al usuario de que la próxima consolidación la borrará, salvo que también
     quede en el formato del área.
2. **Catálogos primero.** Una sede o unidad líder nueva va en su lista de `src/datos/catalogos.ts`; una categoría
   nueva, con su tipo en `categorias`. Un tipo nuevo necesita colores validados según `.claude/rules/visualizacion.md`:
   consúltalo con el usuario antes de inventarlos. Si cambia un catálogo, actualiza la hoja «Listas» del formato y
   vuelve a crear el `.exe` (`python herramientas/crear_exe.py`). Los responsables salen del Excel.
3. **Una fila del Excel fuente** (una por actividad y fecha, con las columnas del calendario 2026):

   | Unidad regional | Calendario | Unidad líder | Categoría | Subcategoría | Actividad a desarrollar | Lugar de desarrollo | Hora inicio | Hora final | Responsable | Observaciones | Fecha inicio | Fecha fin |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Fusagasugá | Académico | Vicerrectoría Académica | Comité | Comité curricular | Comité curricular de Ingeniería | Sala de juntas | 14:00 | 16:00 | Programa de Ingeniería de Sistemas | | 20/10/2026 | 20/10/2026 |

   - La unidad regional es una de `unidadesRegionales` o «Todas las sedes».
   - El calendario es Académico o Administrativo.
   - «Día» y «Mes» se recalculan solos.
   - «Repetición», «Ajuste» y «Origen» solo dicen de dónde viene la fila.
4. **Verifica:** `pnpm verificar`.
5. **Revisa** la actividad en la vista Agenda y en su mes.
