# Autoría

Vale para cualquier persona del equipo que haga commits o pushes en este repositorio.

- **El único autor es quien hace el commit y el push**, con su propia identidad de git (`user.name` /
  `user.email` configurados en su equipo).
- **No se agrega a Claude ni a ninguna otra IA como autor ni como coautor.** Nada de `Co-Authored-By`,
  "Generated with…", 🤖, firmas o menciones de IA en commits, pull requests, issues, releases, changelogs,
  comentarios del código ni metadatos (por ejemplo, el campo `author` de package.json).
- No se cambia la identidad de git (`git config user.*`, `-c user.*`, `GIT_AUTHOR_*`) ni se usa `--author`.
- No se saltan las verificaciones de git (`--no-verify`, `commit -n`).
- Cada quien sube sus propios commits: si hay commits de otra persona que aún no están en el remoto, los sube su autor.

Cómo se hace cumplir:

- `.claude/settings.json` → `attribution` vacío: Claude Code no agrega su línea de coautoría.
- `.claude/hooks/proteger-autoria.mjs` (hook `PreToolUse` en Bash y PowerShell): bloquea los comandos que
  agreguen coautoría o firmas de IA, cambien la identidad o salten verificaciones. Antes de cada `git push`
  revisa que los commits que aún no están en el remoto sean de quien hace el push y no tengan coautoría.
