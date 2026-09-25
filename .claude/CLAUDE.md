@../AGENTS.md

# Calendario institucional — Universidad de Cundinamarca

Aplicación Next.js (App Router) que publica el calendario institucional. El diseño viene del proyecto
**"Calendario institucional Cundinamarca"** en Claude Design: variante **1a** para escritorio y los
patrones de la **1c** para móvil. `legacy/version-estatica/` es el prototipo previo en HTML; no forma
parte de la app (está excluido de TypeScript y ESLint).

## Comandos

```bash
pnpm install      # instalar
pnpm dev          # desarrollo en http://localhost:3000
pnpm verificar    # lint + typecheck + build
pnpm start        # servir la compilación (con las cabeceras de seguridad)
pnpm audit        # vulnerabilidades conocidas
pnpm outdated     # actualizaciones disponibles
```

## Cómo está organizada esta carpeta

Cada tema vive en un solo lugar; este archivo no repite su contenido.

- `rules/` — las reglas del proyecto, un archivo por tema. Las que tienen `paths` en su encabezado se
  cargan solo al trabajar con esos archivos; las demás, siempre.
- `skills/` — los procedimientos de varios pasos, que se invocan con `/nombre`.
- `settings.json` + `hooks/` — lo que se hace cumplir de forma automática, sin depender de las instrucciones.

Los hooks y las reglas no se desactivan ni se rodean para terminar una tarea: si algo bloquea, corrige la
causa. Los ajustes personales van en `settings.local.json`, que no se versiona.

## Antes de dar un cambio por terminado

1. `pnpm verificar` en verde y `pnpm audit` sin vulnerabilidades.
2. Probar en el navegador (`pnpm build && pnpm start`) a 1440, 1024 y 390 px: con teclado (Tab y Escape),
   exportación e impresión, y sin errores en la consola (incluidas las violaciones de CSP).

## Pendientes conocidos

- Quitar `settings.react.version` de `eslint.config.mjs` cuando `eslint-plugin-react` soporte ESLint 10.
- Ajustar con el equipo de diseño los colores de tipo que se confunden con daltonismo (`rules/visualizacion.md`).
- Borrar `legacy/version-estatica/` cuando ya no haga falta como referencia.
