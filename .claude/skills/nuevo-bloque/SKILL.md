---
name: nuevo-bloque
description: Crea un componente nuevo como bloque BEM (TSX + CSS junto a él, registrado en globals.css) dentro de la arquitectura modular del proyecto.
---

# Crear un bloque BEM nuevo

Aplica `.claude/rules/arquitectura.md`, `css-bem.md` y `diseno.md`.

1. **Ubicación:** `src/components/ui/<Nombre>/` si es genérico (no sabe del calendario), o
   `src/features/calendario/components/<Nombre>/` si es propio del calendario.
2. **Archivos:**
   - `<Nombre>.tsx`, con un comentario de una línea: `/** Bloque BEM \`nombre-bloque\`: … */`.
   - `<nombre-bloque>.css`, que empiece con `/* Bloque: nombre-bloque — … */`.
   - `modelo.ts`, solo si el componente calcula qué mostrar.
3. **Modificadores condicionales** con `clases()` de `@/lib/clases`.
4. **Registra el CSS** en `src/app/globals.css`, en su sección.
5. Si se usa fuera de su carpeta de funcionalidad, **expórtalo** desde el `index.ts` de esa funcionalidad.
6. **Verifica:** `pnpm verificar` y revisa el bloque en el navegador a 1440, 1024 y 390 px.
