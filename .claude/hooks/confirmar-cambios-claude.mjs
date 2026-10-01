#!/usr/bin/env node
/**
 * Hook PreToolUse de Claude Code (Bash y PowerShell): ningún archivo de .claude/ se cambia sin que el usuario
 * lo confirme.
 *
 * Las ediciones con las herramientas de archivos (Edit, Write…) las cubre la regla `ask` «Edit(/.claude/**)» de
 * settings.json, que pregunta en cualquier modo de permisos. Este hook cubre los comandos de terminal que
 * escriben, mueven, copian o borran algo en .claude/ del proyecto:
 *   - en los modos que preguntan, pide confirmación («ask»);
 *   - en bypassPermissions y dontAsk, donde un «ask» de hook no llega a preguntar, lo bloquea y le indica a
 *     Claude que haga el cambio con las herramientas de edición, que sí preguntan.
 * Es una ayuda, no una barrera de seguridad: un programa que escriba por su cuenta (python, node…) no se detecta.
 *
 * Contrato: recibe el JSON del evento por stdin y responde con hookSpecificOutput.permissionDecision.
 */
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

// Verbos que crean, cambian, mueven o borran archivos (PowerShell, cmd y bash).
const ESCRIBE = new RegExp(
  [
    String.raw`\b(Set|Add|Clear)-Content\b`, String.raw`\bOut-File\b`, String.raw`\bTee-Object\b`,
    String.raw`\b(New|Remove|Move|Rename|Copy)-Item\b`, String.raw`\bWrite(All)?(Text|Lines|Bytes)\b`, String.raw`\.Save\(`,
    String.raw`(^|[\s;|&(])(sc|ac|ni|ri|rm|rmdir|del|erase|mi|mv|move|cpi|cp|copy|ren|rni|touch|truncate|tee)(\s|$)`,
    String.raw`\bsed\s+(-[a-z]*i|--in-place)`, String.raw`\bperl\s+-[a-z]*i`,
    String.raw`\bgit\s+(checkout|restore|rm|mv|apply|stash|reset)\b`,
    String.raw`(^|[^0-9&])>{1,2}(?!&)`, // redirección a archivo (2>&1 y 2>$null no cuentan como cambio)
  ].join('|'),
  'i',
);
// Rutas que nombran .claude (con o sin comillas, / o \).
const RUTA_CLAUDE = /(?:[A-Za-z]:)?[^\s'"`;|&<>()]*\.claude(?:[\\/][^\s'"`;|&<>()]*)?/g;

function leerEntrada() {
  try {
    return JSON.parse(readFileSync(0, 'utf8').replace(/^﻿/, ''));
  } catch {
    return null;
  }
}

function responder(decision, motivo) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: motivo },
    }),
  );
  process.exit(0);
}

const entrada = leerEntrada();
const comando = entrada?.tool_input?.command;
if (typeof comando !== 'string' || !comando.toLowerCase().includes('.claude')) process.exit(0);

const cwd = typeof entrada.cwd === 'string' ? entrada.cwd : process.cwd();
const proyecto = resolve(process.env.CLAUDE_PROJECT_DIR || cwd);
const carpeta = resolve(proyecto, '.claude');
const dentro = (ruta) => {
  const r = relative(carpeta, resolve(cwd, ruta.replace(/^["']|["']$/g, '')));
  return r === '' || (!r.startsWith('..') && !isAbsolute(r));
};

const rutas = [...comando.matchAll(RUTA_CLAUDE)].map((m) => m[0]).filter(dentro);
if (rutas.length === 0 || !ESCRIBE.test(comando)) process.exit(0);

const lista = [...new Set(rutas)].slice(0, 3).join(', ');
if (['bypassPermissions', 'dontAsk'].includes(entrada.permission_mode)) {
  responder(
    'deny',
    `El comando cambia archivos de .claude/ (${lista}) y en este modo de permisos no se puede pedir confirmación ` +
      'desde un hook. Hazlo con las herramientas de edición (Edit/Write), que siempre piden confirmación al usuario ' +
      'para .claude/, o pídele que lo haga.',
  );
}
responder('ask', `El comando cambia archivos de .claude/ (${lista}): confirma antes de continuar.`);
