---
paths:
  - "src/features/calendario/**"
  - "src/datos/catalogos.ts"
  - "src/styles/tokens.css"
---

# Reglas de visualización

## Cada vista responde una pregunta

No agregues gráficos que dupliquen otra vista:

- Mes: qué hay cada día.
- Semana: el detalle por hora.
- Agenda: la lista completa con responsable y estado. Además es la vista textual accesible.
- Línea de tiempo: duración y solapes por unidad líder.
- Año: densidad de actividades.

## Color categórico = tipo de actividad

- Cada actividad tiene una **categoría** (las 19 del formato) y cada categoría pertenece a un **tipo**
  (`categorias` en `datos/catalogos.ts`). El color es del tipo: seis tipos, cinco colores y un gris neutro
  para «Otro». La categoría se muestra como texto (etiqueta del detalle, `title` y `.oculto-visual`).
- Los colores de `tiposActividad` van en orden fijo. El color sigue al tipo, nunca a la posición:
  filtrar no repinta nada. No se generan colores nuevos; un tipo nuevo necesita su trío definido con el
  equipo de diseño y validado.
- El trío se usa así: `solido` para puntos, bordes y barras; `fondo` para rellenos; `texto` para el texto
  sobre `fondo` (todos pasan AA, de 6,6 a 8,9:1). **Nunca pongas texto en el color `solido`**: amarillo,
  naranja, turquesa y lima quedan por debajo de 3:1 sobre blanco.
- **El tipo nunca se comunica solo con color.** Toda marca lleva el nombre visible de la actividad y el tipo
  como texto (`title` y `.oculto-visual`). La leyenda de tipos son los chips del filtro "Tipo de actividad",
  que además permiten aislar un tipo.
- ⚠️ **Limitación conocida de la paleta** (validada el 2026-09-25 con el validador de la skill dataviz):
  - Naranja (Procesos institucionales) y amarillo (Reuniones y gestión): ΔE 0,6 con deuteranopia y 7,3 con
    visión normal (el mínimo es 15).
  - Lima (Bienestar y comunidad) y naranja: ΔE 3,0 con deuteranopia.

  Para muchas personas estos tipos son indistinguibles por color. Por eso ninguna vista puede depender solo
  del color para el tipo. El equipo de diseño debería ajustar esos tonos; si se cambian, vuelve a validar.
- `colorPorTipo: false` en `datos/catalogos.ts` deja todo en gris neutro; el texto sigue identificando cada actividad.

## Secuencial (mapa anual)

- Un solo tono, la rampa del verde institucional: `accent-200 → 300 → 400 → 600`, de claro (menos) a oscuro (más).
- Cuatro niveles calculados con los cuartiles de los días con actividades del año, no con umbrales fijos:
  con datos reales hay decenas de actividades por día y unos umbrales fijos dejarían todo en el nivel máximo.
  La leyenda siempre muestra el rango de cada nivel.
- **No cuentan las actividades de una semana o más** (campañas, convocatorias): ocupan todos los días y
  borrarían la diferencia entre días tranquilos y días llenos. La leyenda lo dice.
- Texto oscuro en los niveles 1 a 3 y blanco en el 4. Nunca un arcoíris ni un segundo tono.

## Marcas y anotaciones

- Píldoras con radio de 8 px.
- Las barras de la línea de tiempo van en píldora con borde interior de 1,5 px del color `solido`. Los solapes
  bajan a otro carril; las barras nunca se superponen.
- Puntos de 5 a 10 px.
- **"Hoy" siempre con la misma marca:** círculo verde con número blanco (mes, semana y cabecera de la línea),
  columna `accent-200` en la línea de tiempo y anillo oscuro en el año.
- Todo texto truncado lleva puntos suspensivos y `title` con el texto completo.
- Límites por día en la vista Mes: 3 píldoras más "+N más" (lleva a la semana); en móvil, 4 puntos.
- En cada día (Mes y Semana) van primero las actividades puntuales y al final las de una semana o más
  (`porRelevancia`), para que las campañas de todo el año no tapen lo que pasa ese día.
- Los conteos ("16 actividades") siempre están visibles y corresponden al periodo mostrado.
- Todo estado vacío tiene su mensaje (`.vacio`).

## Validación obligatoria al cambiar colores

- Paleta categórica: `node <skill dataviz>/scripts/validate_palette.js "<hex,…>" --mode light --surface "#ffffff" --pairs all`.
- Además mide el contraste de cada texto sobre su fondo.
- Revisa el resultado con capturas a 1440, 1024 y 390 px.
