#!/usr/bin/env node
/**
 * Hook PreToolUse de Claude Code (Bash y PowerShell). Regla: .claude/rules/autoria.md
 *
 * El único autor de los commits es el usuario configurado en git. Bloquea (código 2)
 * comandos git/gh que:
 *   1. agreguen coautoría o firmas de IA (Co-Authored-By, "Generated with Claude", 🤖…);
 *   2. cambien la identidad (--author, -c user.*, git config user.* <valor>, GIT_AUTHOR_*…);
 *   3. salten las verificaciones de git (--no-verify, commit -n);
 *   4. suban (push) commits con otro autor o con coautoría/firma de IA.
 *
 * Contrato: recibe el JSON del evento por stdin. Código 0 = permitir; código 2 = bloquear
 * (el motivo va por stderr y Claude lo recibe).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FIRMAS_IA = [
  /co-authored-by\s*:/i,
  /generated\s+(with|by)\b[^\n]*\b(claude|anthropic|copilot|chatgpt|openai|gpt|gemini|cursor|codex|ai|ia)\b/i,
  /noreply@anthropic\.com/i,
  /\bclaude[-\s]session\s*:/i,
  /🤖/u,
];
const IDENTIDAD_IA = /\b(claude|anthropic|copilot|chatgpt|openai|gemini|codex)\b|\[bot\]/i;

// Comandos que escriben mensajes (commits, etiquetas, PR, issues, releases).
const ESCRIBE_MENSAJE = /\bgit\s+(commit|tag|notes|merge|revert|cherry-pick)\b|\bgh\s+(pr|issue|release)\s+(create|edit|comment|merge)\b/i;

function bloquear(motivo) {
  process.stderr.write(
    `Bloqueado por .claude/hooks/proteger-autoria.mjs: ${motivo}\n` +
      'Regla del proyecto (.claude/rules/autoria.md): el único autor es el usuario de git; ' +
      'no se agrega a Claude ni a otra IA como autor o coautor.\n',
  );
  process.exit(2);
}

function leerEntrada() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
}

/** Contenido de los archivos pasados con -F/--file (mensaje de commit desde archivo). */
function mensajesDesdeArchivo(comando, cwd) {
  const textos = [];
  const patron = /(?:^|\s)(?:-F|--file)(?:=|\s+)(?:"([^"]+)"|'([^']+)'|(\S+))/g;
  for (const m of comando.matchAll(patron)) {
    const ruta = m[1] ?? m[2] ?? m[3];
    if (!ruta || ruta === '-') continue;
    const absoluta = resolve(cwd, ruta);
    if (existsSync(absoluta)) textos.push(readFileSync(absoluta, 'utf8'));
  }
  return textos;
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

/** Revisa los commits que aún no están en ningún remoto antes de un push. */
function revisarPush(cwd) {
  let correo;
  let registro;
  try {
    correo = git(cwd, 'config', 'user.email').toLowerCase();
    registro = git(cwd, 'log', '--format=%h%x1f%an%x1f%ae%x1f%cn%x1f%ce%x1f%B%x1e', 'HEAD', '--not', '--remotes');
  } catch {
    return; // Sin repositorio o sin commits: que git informe el error.
  }
  for (const bloque of registro.split('\x1e')) {
    const [hash, autor, correoAutor, committer, correoCommitter, mensaje = ''] = bloque.trim().split('\x1f');
    if (!hash) continue;
    if (correoAutor?.toLowerCase() !== correo || correoCommitter?.toLowerCase() !== correo) {
      bloquear(`el commit ${hash} tiene autor/committer "${autor} <${correoAutor}>" / "${committer} <${correoCommitter}>", distinto del usuario configurado (${correo}).`);
    }
    if (IDENTIDAD_IA.test(`${autor} ${correoAutor} ${committer} ${correoCommitter}`)) {
      bloquear(`el commit ${hash} tiene una identidad de IA como autor o committer.`);
    }
    if (FIRMAS_IA.some((r) => r.test(mensaje))) {
      bloquear(`el commit ${hash} incluye coautoría o firma de IA en el mensaje. Corrígelo antes de subirlo.`);
    }
  }
}

const entrada = leerEntrada();
const comando = entrada?.tool_input?.command;
if (typeof comando !== 'string' || !/\b(git|gh)\b/i.test(comando)) process.exit(0);
const cwd = typeof entrada.cwd === 'string' ? entrada.cwd : process.cwd();

// Banderas y asignaciones se buscan fuera de las comillas, para no confundirlas con texto del mensaje.
const sinComillas = comando.replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""');

// 1. Coautoría o firma de IA en el mensaje (en línea o desde archivo).
if (ESCRIBE_MENSAJE.test(comando)) {
  const textos = [comando, ...mensajesDesdeArchivo(comando, cwd)];
  if (textos.some((t) => FIRMAS_IA.some((r) => r.test(t)))) {
    bloquear('el mensaje agrega coautoría o una firma de IA (Co-Authored-By, "Generated with…", 🤖).');
  }
}

// 2. Cambios de identidad.
// (--author en git log/shortlog es un filtro de búsqueda: se permite.)
if (/\bgit\s+(commit|rebase|cherry-pick|am|revert|merge)\b[^\n;|&]*\s--author(=|\s)/i.test(sinComillas)) {
  bloquear('usa --author para cambiar el autor del commit.');
}
if (/\bgit\b[^\n;|&]*\s-c\s+["']?user\.(name|email)\s*=/i.test(comando)) bloquear('usa -c user.name/user.email para cambiar la identidad.');
if (/\bgit\s+config\b[^\n;|&]*\buser\.(name|email)["']?\s+[^\s;|&)]/i.test(comando) || /\bgit\s+config\b[^\n;|&]*--unset(-all)?\s+user\./i.test(sinComillas)) {
  bloquear('intenta modificar user.name/user.email en la configuración de git.');
}
if (/\bGIT_(AUTHOR|COMMITTER)_(NAME|EMAIL)\s*=|\$env:GIT_(AUTHOR|COMMITTER)_(NAME|EMAIL)\b/i.test(sinComillas)) {
  bloquear('define GIT_AUTHOR_*/GIT_COMMITTER_* para cambiar la identidad.');
}

// 3. Saltar las verificaciones de git.
if (/\bgit\b[^\n;|&]*\s--no-verify\b/i.test(sinComillas) || /\bgit\s+commit\b[^\n;|&]*\s-[a-mo-z]*n[a-z]*\b/i.test(sinComillas)) {
  bloquear('--no-verify (o commit -n) salta las verificaciones de git.');
}

// 4. Push: los commits que se van a subir deben ser del usuario y sin firmas de IA.
if (/\bgit\s+push\b/i.test(sinComillas)) revisarPush(cwd);

process.exit(0);
