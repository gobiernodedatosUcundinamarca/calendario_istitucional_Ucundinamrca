// Impide instalar con npm, yarn o bun: este proyecto solo usa pnpm (ver CLAUDE.md).
const agente = process.env.npm_config_user_agent ?? '';

if (!agente.startsWith('pnpm/')) {
  console.error('\nEste proyecto solo se instala con pnpm:\n\n  pnpm install\n');
  process.exit(1);
}
