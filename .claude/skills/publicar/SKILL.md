---
name: publicar
description: Verifica, hace commit y sube (push) los cambios respetando la regla de autoría del proyecto.
disable-model-invocation: true
---

# Publicar cambios (commit y push)

Aplica la regla de autoría (`.claude/rules/autoria.md`).

1. **Verifica:** `pnpm verificar` y `pnpm audit`. Si algo falla, detente y repórtalo; no publiques.
2. **Revisa qué entra:** `git status --short` y `git diff --stat`. Deja fuera `.env*`, archivos temporales
   y cualquier cosa con credenciales; si hay algo dudoso, pregunta.
3. **Commit:** mensaje en español, con una línea de resumen en imperativo y, si hace falta, viñetas.
   En PowerShell pasa el mensaje con `git commit -F <archivo>` (un archivo temporal UTF-8): con `-F -` y un
   here-string PowerShell no lo envía por la entrada estándar.
4. **Push:** `git push` (`main` ya sigue a `origin/main`).
5. **Confirma:** `git fetch origin` y compara `git rev-parse main` con `git rev-parse origin/main`.

Si el push falla por credenciales ("could not read Username", "Cannot prompt"), es porque la sesión tiene
desactivado el inicio de sesión de Git Credential Manager. Avísale al usuario que se abrirá la ventana de
GitHub y repite solo ese comando con `$env:GCM_INTERACTIVE='always'; $env:GIT_TERMINAL_PROMPT='1'`.
Nunca pidas ni escribas tokens o contraseñas.
