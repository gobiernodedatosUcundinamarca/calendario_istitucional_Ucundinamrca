---
name: agregar-actividad
description: Agrega o corrige actividades del calendario, o entradas de los catálogos (unidades, responsables, tipos), en src/datos.
---

# Agregar o editar actividades

Aplica `.claude/rules/datos.md`; el formato de cada campo está al inicio de `src/datos/actividades.ts`.

1. **Catálogos primero.** Si la actividad usa una unidad regional, unidad líder o responsable nuevos,
   agrégalos a su lista en `src/datos/catalogos.ts`. Un tipo nuevo necesita colores validados según
   `.claude/rules/visualizacion.md`: consúltalo con el usuario antes de inventarlos.
2. **Agrega la actividad** a `src/datos/actividades.ts` con esta plantilla:

   ```ts
   {
     nombre: 'Comité curricular de la Facultad de Ingeniería',
     tipo: 'Institucional',
     inicio: '2026-10-20',
     fin: '2026-10-20',
     hora: '14:00',
     responsable: 'María Fernanda Rojas',
     lider: 'Vicerrectoría Académica',
     regionales: ['Fusagasugá'],
     documento: 'Acta de convocatoria.pdf',
     enlace: 'https://…',
   },
   ```
3. **Verifica:** `pnpm verificar`.
4. **Revisa** la actividad en la vista Agenda y en su mes.
