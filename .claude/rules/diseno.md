---
paths:
  - "src/**/*.css"
  - "src/**/*.tsx"
---

# Reglas de diseño

Fuente: sistema de diseño del proyecto (Manual de Imagen Institucional ECOM002 V17), convertido a
`src/styles/tokens.css`. Los nombres de los tokens son los del sistema de diseño: no los renombres.

## Color

- Fondo blanco (`--color-bg`); paneles en `--color-surface`; tarjetas y celdas en `--color-neutral-100`
  (fines de semana en `--color-neutral-200`).
- **Verde institucional** (`--color-accent`): acción principal, "hoy", selección activa y foco. Una sola
  acción primaria por vista o diálogo.
- **Amarillo institucional** (`--color-accent-2`): solo para el estado "En curso". Nunca en acciones.
- Texto en `--color-text`; texto secundario en `--color-neutral-700`. **Nunca `neutral-600` o más claro
  para texto** (4,2:1 sobre la superficie, no pasa AA); `neutral-600` es solo para íconos y bordes.
- Los estados de actividad tienen insignia fija (`VARIANTE_ESTADO`): Programada = contorno verde,
  En curso = amarillo, Finalizada = neutra. El estado se calcula por las fechas, no se escribe en los datos.

## Tipografía

- Montserrat en todo, servida por `next/font` (sin peticiones a Google desde el navegador); títulos en 700.
- Escala: periodo 32 px (24 en móvil), título de diálogo 27 (23), cuerpo 15, secundario 12–14,
  rótulos 11 px en mayúsculas con espaciado `.08em` (`.rotulo`). Mínimo 10 px, y solo para los números
  del mapa anual.

## Forma, espacio y elevación

- Controles pequeños en píldora (`--radius-pill`): botones, entradas, chips, insignias y selector de vista.
- Tarjetas y celdas de 14 a 22 px de radio; paneles 28 px; hojas móviles con `--radius-hoja` arriba.
- Sombra solo en capas flotantes (menú, diálogo, hoja) con `--shadow-lg`. Las tarjetas no llevan sombra.
- Márgenes de página de 28 px en escritorio y 16 px en móvil; separaciones de 6 a 24 px.
- Íconos: `Icono` (trazos Lucide, grosor 2,75, 16–20 px), siempre acompañados de texto visible o de `aria-label`.

## Interacción y accesibilidad

- Toda acción es un `<button type="button">`; los enlaces son solo para navegar.
- El foco visible (contorno verde de 2 px) no se quita nunca.
- Objetivos táctiles de al menos 44 px en móvil.
- Ventanas modales siempre con `Dialogo`, que enfoca, mantiene Tab adentro, cierra con Escape y devuelve
  el foco. Menús y hojas se cierran con Escape y con clic fuera.
- Contraste WCAG AA: 4,5:1 para texto y 3:1 para texto grande y elementos gráficos. Mídelo cada vez que
  combines colores nuevos.
- `lang="es-CO"` y textos en español de Colombia: fechas como "25 de septiembre de 2026", horas en
  24 h con "h" ("14:00 h").
- Se respeta `prefers-reduced-motion`.

## Responsivo e impresión

- Escritorio = variante 1a (barra lateral de filtros y cinco vistas).
- Móvil = patrones de la 1c: filtros en hoja inferior, Agenda como vista inicial, mes con puntos y detalle
  como hoja inferior.
- Al imprimir se ocultan los controles, se usa hoja horizontal y se conservan los colores.
