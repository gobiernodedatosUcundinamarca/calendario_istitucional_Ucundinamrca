# Autoría

- **El único autor es el usuario**: la identidad configurada en git (`user.name` / `user.email`).
- **No agregues a Claude ni a ninguna otra IA como autor ni como coautor.** Nada de `Co-Authored-By`,
  "Generated with…", 🤖, firmas o menciones de IA en commits, pull requests, issues, releases, changelogs,
  comentarios del código ni metadatos (por ejemplo, el campo `author` de package.json).
- No cambies la identidad de git (`git config user.*`, `-c user.*`, `GIT_AUTHOR_*`) ni uses `--author`.
- No saltes las verificaciones de git (`--no-verify`, `commit -n`).

Cómo se hace cumplir:

- `.claude/settings.json` → `attribution` vacío: Claude Code no agrega su línea de coautoría.
- `.claude/hooks/proteger-autoria.mjs` (hook `PreToolUse` en Bash y PowerShell): bloquea los comandos que
  agreguen coautoría o firmas de IA, cambien la identidad o salten verificaciones, y antes de cada
  `git push` revisa que los commits que se van a subir sean del usuario y no tengan coautoría.
