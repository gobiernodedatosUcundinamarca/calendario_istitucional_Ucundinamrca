@AGENTS.md

# Calendario institucional — Universidad de Cundinamarca

Aplicación Next.js (App Router) que publica el calendario institucional. El diseño viene del proyecto
**"Calendario institucional Cundinamarca"** en Claude Design: variante **1a** para escritorio y los
patrones de la **1c** para móvil. `legacy/version-estatica/` es el prototipo previo en HTML; no forma
parte de la app (está excluido de TypeScript y ESLint).

## Comandos

```bash
pnpm install      # instalar (solo pnpm)
pnpm dev          # desarrollo en http://localhost:3000
pnpm verificar    # lint + typecheck + build: debe pasar antes de dar un cambio por terminado
pnpm start        # servir la compilación (con las cabeceras de seguridad)
pnpm audit        # debe dar "No known vulnerabilities found"
pnpm outdated     # revisar actualizaciones
```

## Autoría

- **El único autor es el usuario**: la identidad configurada en git (`user.name` / `user.email`).
- **No agregues a Claude ni a ninguna otra IA como autor ni como coautor.** Nada de `Co-Authored-By`,
  "Generated with…", firmas o menciones de IA en commits, pull requests, issues, changelogs, comentarios
  del código ni metadatos (por ejemplo, el campo `author` de package.json).
- No cambies la identidad de git ni uses `--author`.

## Gestor de paquetes: solo pnpm

- **Siempre pnpm.** Nunca npm, yarn, bun ni `npx`: usa `pnpm add`, `pnpm exec`, `pnpm dlx`.
- `packageManager` en package.json fija la versión de pnpm y `scripts/solo-pnpm.mjs` hace fallar
  cualquier instalación con otro gestor. No los quites.
- `pnpm-lock.yaml` se versiona. No lo borres para "arreglar" una instalación: investiga el error.

## Dependencias y seguridad

**Regla: una sola versión por paquete, y es la última estable y segura.** Estable = la etiqueta
`latest` del registro; nunca `canary`, `beta`, `rc`, `next`, `preview` ni `experimental`.

Antes de instalar o actualizar cualquier cosa, en este orden:

1. **Actualiza primero las herramientas.** pnpm a su última estable (`pnpm self-update`) y Node a la
   última LTS con parches (consulta `https://nodejs.org/dist/index.json`: la primera entrada con `lts`).
2. **Consulta la versión:** `pnpm view <paquete> dist-tags` y `pnpm view <paquete>@<versión> deprecated`.
   Una versión marcada como obsoleta no es segura aunque sea la última de su rama.
3. **Revisa compatibilidad:** `peerDependencies` de lo que la usa. Si la última mayor no es compatible,
   usa la última de la mayor anterior **que siga con soporte**, y anótalo en la tabla de abajo.
4. **Instala con versión exacta:** `pnpm add <paquete>@<versión>` (sin `^` ni `~`; `savePrefix: ''` ya lo hace).
5. **Verifica:** `pnpm audit` sin vulnerabilidades, `pnpm peers check` sin conflictos nuevos sin explicar,
   y `pnpm verificar` en verde.

**Next.js va siempre en su última versión estable** (incluidos los parches de seguridad), y
`eslint-config-next` en la misma versión que `next`. React y react-dom, en su última estable.

Versiones actuales (verificadas el 2026-09-25):

| Paquete | Versión | Motivo |
|---|---|---|
| Node.js | 24.21.0 LTS (`engines`) | Última LTS. La máquina de desarrollo tiene 24.14.0: pnpm avisa hasta que se actualice. |
| pnpm | 12.6.0 | Última estable. |
| next, eslint-config-next | 16.3.6 | Última estable. |
| react, react-dom, @types/react, @types/react-dom | 19.3.0 | Última estable. |
| typescript | 6.0.3 | La 7.x no expone la API de compilador que usa Next; Next 16.3 instala `typescript@^6`. |
| eslint | 10.11.0 | La 9.x ya no tiene soporte. `eslint-plugin-react` 7.37 necesita `settings.react.version` fijo en `eslint.config.mjs` (mantenlo igual a la versión de React). |
| @types/node | 24.13.6 | Misma mayor que Node LTS. |

Protecciones de `pnpm-workspace.yaml`. **No las relajes sin documentar el motivo en el mismo archivo:**

- `minimumReleaseAge: 1440`: no se instala nada publicado hace menos de un día.
- `trustPolicy: no-downgrade` + `trustPolicyIgnoreAfter: 43200`: falla si una versión reciente perdió
  firma o procedencia (posible toma de control del paquete). Si bloquea algo, investiga quién la publicó
  y cuándo antes de excluirla, y deja la excepción con fecha y motivo.
- `blockExoticSubdeps: true`: ninguna dependencia transitiva desde git o tarballs.
- `strictDepBuilds: true` + `allowBuilds`: ningún script de instalación corre sin aprobación explícita.
  Nunca `dangerouslyAllowAllBuilds`.

Además:

- **Menos dependencias, menos riesgo.** Hoy la app solo depende de next, react y react-dom. Antes de agregar
  un paquete, justifica por qué no alcanza con la plataforma web, React o Next.
- **Cabeceras de seguridad** en `next.config.ts` (CSP, HSTS, nosniff, `frame-ancestors 'none'`…).
  Si hace falta un recurso externo, amplía la CSP solo con ese origen; nunca `*`.
- **Enlaces externos** siempre con `rel="noopener noreferrer"`.

## Arquitectura modular

```
src/
  app/                    rutas: layout.tsx, page.tsx, globals.css, icon.png (solo composición)
  assets/                 imágenes importadas estáticamente (escudo)
  components/ui/          bloques genéricos reutilizables: Boton, Entrada, Campo, Insignia, Dialogo, Icono
  datos/                  datos editables: catalogos.ts, actividades.ts
  features/calendario/    la funcionalidad completa
    index.ts              API pública: fuera de la carpeta se importa solo desde aquí
    tipos.ts, constantes.ts
    lib/                  funciones puras: fechas, texto, actividades (filtros), periodo, colores, exportar
    hooks/                useHoy, useEsMovil
    estado/reductor.ts    estado del calendario (reductor puro)
    components/<Nombre>/  Nombre.tsx + nombre.css (+ modelo.ts si calcula datos para dibujar)
  lib/clases.ts           utilidad compartida
  styles/                 tokens.css, base.css, utilidades.css
```

- **Dependencias en un solo sentido:** `app → features → components/ui → lib`. `components/ui` no sabe
  nada del calendario; `lib/` no importa componentes ni React (salvo tipos).
- **Separa cálculo de dibujo:** lo que decide *qué* se muestra va en `modelo.ts` o `lib/` como funciones
  puras; el componente solo pinta.
- **Servidor por defecto.** `'use client'` solo donde hay estado, efectos o eventos del navegador.
- **Un componente por archivo**, de unas 200 líneas como máximo; si crece, extrae subcomponentes o su modelo.
- **Nombres en español** para el dominio: componentes en PascalCase, funciones en camelCase y archivos CSS
  en kebab-case con el nombre del bloque.
- **"Hoy" se calcula en el navegador** (`useHoy`). La página es estática: nunca calcules la fecha actual
  en el servidor ni al compilar.
- **Los datos se validan al compilar** (`normalizarActividades`): un dato inválido debe detener `pnpm build`
  con un mensaje claro, no fallar en silencio.
- Antes de usar una API de Next, lee su guía en `node_modules/next/dist/docs/` (ver AGENTS.md). En Next 16,
  por ejemplo, `priority` de `next/image` está obsoleto: se usa `loading="eager"` o `preload`.

## CSS y BEM

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

## Reglas de diseño

Fuente: sistema de diseño del proyecto (Manual de Imagen Institucional ECOM002 V17), convertido a
`src/styles/tokens.css`. Los nombres de los tokens son los del sistema de diseño: no los renombres.

**Color**

- Fondo blanco (`--color-bg`); paneles en `--color-surface`; tarjetas y celdas en `--color-neutral-100`
  (fines de semana en `--color-neutral-200`).
- **Verde institucional** (`--color-accent`): acción principal, "hoy", selección activa y foco. Una sola
  acción primaria por vista o diálogo.
- **Amarillo institucional** (`--color-accent-2`): solo para el estado "En curso". Nunca en acciones.
- Texto en `--color-text`; texto secundario en `--color-neutral-700`. **Nunca `neutral-600` o más claro
  para texto** (4,2:1 sobre la superficie, no pasa AA); `neutral-600` es solo para íconos y bordes.
- Los estados de actividad tienen insignia fija (`VARIANTE_ESTADO`): Programada = contorno verde,
  En curso = amarillo, Finalizada = neutra, Aplazada = verde claro.

**Tipografía**

- Montserrat en todo, servida por `next/font` (sin peticiones a Google desde el navegador); títulos en 700.
- Escala: periodo 32 px (24 en móvil), título de diálogo 27 (23), cuerpo 15, secundario 12–14,
  rótulos 11 px en mayúsculas con espaciado `.08em` (`.rotulo`). Mínimo 10 px, y solo para los números
  del mapa anual.

**Forma, espacio y elevación**

- Controles pequeños en píldora (`--radius-pill`): botones, entradas, chips, insignias y selector de vista.
- Tarjetas y celdas de 14 a 22 px de radio; paneles 28 px; hojas móviles con `--radius-hoja` arriba.
- Sombra solo en capas flotantes (menú, diálogo, hoja) con `--shadow-lg`. Las tarjetas no llevan sombra.
- Márgenes de página de 28 px en escritorio y 16 px en móvil; separaciones de 6 a 24 px.
- Íconos: `Icono` (trazos Lucide, grosor 2,75, 16–20 px), siempre acompañados de texto visible o de `aria-label`.

**Interacción y accesibilidad**

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

**Responsivo e impresión**

- Escritorio = variante 1a (barra lateral de filtros y cinco vistas).
- Móvil = patrones de la 1c: filtros en hoja inferior, Agenda como vista inicial, mes con puntos y detalle
  como hoja inferior.
- Al imprimir se ocultan los controles, se usa hoja horizontal y se conservan los colores.

## Reglas de visualización

**Cada vista responde una pregunta; no agregues gráficos que dupliquen otra:**

- Mes: qué hay cada día.
- Semana: el detalle por hora.
- Agenda: la lista completa con responsable y estado. Además es la vista textual accesible.
- Línea de tiempo: duración y solapes por unidad líder.
- Año: densidad de actividades.

**Color categórico = tipo de actividad**

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
  - Convocatoria y Administrativa: ΔE 0,6 con deuteranopia y 7,3 con visión normal (el mínimo es 15).
  - Institucional y Convocatoria: ΔE 3,0 con deuteranopia.

  Para muchas personas estos tipos son indistinguibles por color. Por eso ninguna vista puede depender solo
  del color para el tipo. El equipo de diseño debería ajustar esos tonos; si se cambian, vuelve a validar.
- `colorPorTipo: false` en `datos/catalogos.ts` deja todo en gris neutro; el texto sigue identificando cada actividad.

**Secuencial (mapa anual)**

- Un solo tono, la rampa del verde institucional: `accent-200 → 300 → 400 → 600`, de claro (menos) a oscuro (más).
- Cuatro niveles fijos: 1, 2, 3 y 4 o más actividades por día. La leyenda "Menos … Más" siempre está visible.
- Texto oscuro en los niveles 1 a 3 y blanco en el 4. Nunca un arcoíris ni un segundo tono.

**Marcas y anotaciones**

- Píldoras con radio de 8 px.
- Las barras de la línea de tiempo van en píldora con borde interior de 1,5 px del color `solido`. Los solapes
  bajan a otro carril; las barras nunca se superponen.
- Puntos de 5 a 10 px.
- **"Hoy" siempre con la misma marca:** círculo verde con número blanco (mes, semana y cabecera de la línea),
  columna `accent-200` en la línea de tiempo y anillo oscuro en el año.
- Todo texto truncado lleva puntos suspensivos y `title` con el texto completo.
- Límites por día en la vista Mes: 3 píldoras más "+N más" (lleva a la semana); en móvil, 4 puntos.
- Los conteos ("16 actividades") siempre están visibles y corresponden al periodo mostrado.
- Todo estado vacío tiene su mensaje (`.vacio`).

**Validación obligatoria al cambiar colores**

- Paleta categórica: `node <skill dataviz>/scripts/validate_palette.js "<hex,…>" --mode light --surface "#ffffff" --pairs all`.
- Además mide el contraste de cada texto sobre su fondo.
- Revisa el resultado con capturas a 1440, 1024 y 390 px.

## Datos

- Las actividades se editan solo en `src/datos/actividades.ts` y los catálogos en `src/datos/catalogos.ts`.
- Los nombres de los catálogos son tipos de TypeScript: una unidad, responsable o tipo mal escrito no compila.
- Fechas en `AAAA-MM-DD` y horas en `HH:MM` (24 h). Sin `hora` = todo el día. Sin `enlace` no se muestra "Abrir".
- Los datos actuales **son de ejemplo del diseño** (incluidos los nombres de los responsables): hay que
  reemplazarlos por los oficiales.

## Antes de dar un cambio por terminado

1. `pnpm verificar` y `pnpm audit` en verde.
2. Probar en el navegador (`pnpm build && pnpm start`) a 1440, 1024 y 390 px: con teclado (Tab y Escape),
   exportación e impresión, y sin errores en la consola (incluidas las violaciones de CSP).

## Pendientes conocidos

- Actualizar Node de 24.14.0 a 24.21.0 LTS en la máquina de desarrollo (requiere permisos de administrador).
- Quitar `settings.react.version` de `eslint.config.mjs` cuando `eslint-plugin-react` soporte ESLint 10.
- Paleta de tipos no apta para daltonismo (ver Reglas de visualización).
- Borrar `legacy/version-estatica/` cuando ya no haga falta como referencia.
