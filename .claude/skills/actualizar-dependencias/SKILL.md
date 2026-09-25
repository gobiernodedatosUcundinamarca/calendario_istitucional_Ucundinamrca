---
name: actualizar-dependencias
description: Instala o actualiza paquetes con pnpm siguiendo la política de versiones del proyecto (última estable y segura, versión exacta, auditoría). Usar siempre antes de agregar o actualizar cualquier dependencia, Next.js incluido.
---

# Instalar o actualizar dependencias

La política (qué versión se permite y qué protege `pnpm-workspace.yaml`) está en
`.claude/rules/dependencias-y-seguridad.md`. Estos son los pasos, en orden:

1. **Herramientas primero.**
   - pnpm: compara `pnpm --version` con `pnpm view pnpm dist-tags.latest`; si hay una nueva, `pnpm self-update`
     y actualiza `packageManager` en package.json.
   - Node: compara `node --version` con la primera entrada con `lts` de `https://nodejs.org/dist/index.json`
     (revisa `security`). Actualizarlo requiere permisos de administrador: avísale al usuario.
2. **Versión objetivo**, por paquete:
   - `pnpm view <paquete> dist-tags` → la de `latest`.
   - `pnpm view <paquete>@<versión> deprecated` → debe estar vacío.
   - `pnpm view <paquete>@<versión> time` → debe tener al menos un día.
3. **Compatibilidad:** `pnpm view <quien-la-usa>@<v> peerDependencies`; para Next, su guía en
   `node_modules/next/dist/docs/`.
4. **Instala:** `pnpm add <paquete>@<versión>` (`-D` si es de desarrollo). Si pnpm bloquea por `trustPolicy`
   o aparece un script de instalación nuevo, actúa según la regla antes de seguir.
5. **Verifica:** `pnpm audit`, `pnpm peers check`, `pnpm verificar` y la app en el navegador.
6. **Documenta:** actualiza la tabla de versiones de la regla con la fecha y el motivo de cada excepción.
