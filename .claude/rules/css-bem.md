---
paths:
  - "src/**/*.css"
  - "src/**/*.tsx"
---

# CSS y BEM

- **Metodología BEM:** `.bloque`, `.bloque__elemento`, `.bloque--modificador`, `.bloque__elemento--modificador`.
- **Un bloque = un componente = un archivo CSS** junto al componente, con el nombre del bloque
  (`VistaMes/vista-mes.css` → `.vista-mes`).
- **Registra cada archivo en `src/app/globals.css`**, el único punto de entrada de CSS, en su sección y en
  el orden `tokens → base → utilidades → ui → funcionalidades`. No importes CSS desde componentes (Next no
  garantiza el orden) y no uses CSS Modules, Tailwind ni CSS-in-JS.
- **Nada de elementos de elementos** (`bloque__a__b`): aplana a `bloque__a-b`.
- **Selectores de una sola clase.** Únicas combinaciones permitidas: un modificador que afecta a elementos
  de su mismo bloque (`.vista-mes__dia--hoy .vista-mes__circulo`), atributos de tipo en controles
  (`.entrada[type="date"]`) y `.boton svg`. Sin IDs, sin selectores de etiqueta y sin `!important`
  (salvo `prefers-reduced-motion`).
- **Un bloque no estiliza el interior de otro.** Para ubicar un bloque dentro de otro usa una mezcla:
  `<Boton className="panel-filtros__limpiar">`.
- **Estados visuales con modificadores** (`--activo`, `--hoy`, `--abierto`, `--fuera`). El atributo ARIA
  equivalente (`aria-pressed`, `aria-expanded`) se pone igual, para accesibilidad, pero no se usa para estilar.
- **Utilidades permitidas** para mezclar: `.rotulo` (rótulo en mayúsculas), `.oculto-visual` (solo para
  lectores de pantalla) y `.vacio` (sin resultados). No agregues más sin necesidad real.
- **Solo tokens:** `var(--color-*)`, `--space-*`, `--radius-*`, `--shadow-*`, `--capa-*`. Ningún color hex
  literal en componentes. Los únicos hex fuera de `tokens.css` son los de `tiposActividad` en
  `datos/catalogos.ts` y `themeColor` en `app/layout.tsx` (los metadatos no aceptan variables CSS).
- **Estilos en línea solo para valores dinámicos:** colores por tipo (`estiloTipo()` →
  `--tipo-solido/--tipo-fondo/--tipo-texto`), columnas de la línea de tiempo y `--dias`.
- **Puntos de quiebre:** `1180px` (intermedio) y `860px` (móvil, igual a `CONSULTA_MOVIL` en `constantes.ts`).
  Los `@media` y el `@media print` de cada bloque van al final de su propio archivo.
