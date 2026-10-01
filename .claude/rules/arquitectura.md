---
paths:
  - "src/**"
---

# Arquitectura modular

```
src/
  app/                    rutas: layout.tsx, page.tsx, globals.css, icon.png (solo composición)
  assets/                 imágenes importadas estáticamente (escudo)
  components/ui/          bloques genéricos reutilizables: Boton, Entrada, Campo, Insignia, Dialogo, Icono
  datos/                  catalogos.ts (a mano); actividades.ts y responsables.ts (generados por herramientas/cargar.py)
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
  en kebab-case con el nombre del bloque. Para crear uno nuevo usa la skill `/nuevo-bloque`.
- **"Hoy" se calcula en el navegador** (`useHoy`). La página es estática: nunca calcules la fecha actual
  en el servidor ni al compilar.
- **Los datos se validan al compilar** (`normalizarActividades`): un dato inválido debe detener `pnpm build`
  con un mensaje claro, no fallar en silencio.
- Antes de usar una API de Next, lee su guía en `node_modules/next/dist/docs/` (ver AGENTS.md). En Next 16,
  por ejemplo, `priority` de `next/image` está obsoleto: se usa `loading="eager"` o `preload`.
