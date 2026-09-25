import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-plugin-react 7.37 no puede detectar la versión con ESLint 10 (usa context.getFilename,
  // eliminado en ESLint 10). Se declara a mano; mantenerla igual a la de package.json.
  { settings: { react: { version: "19.3" } } },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prototipo estático previo a la migración; no forma parte de la app.
    "legacy/**",
  ]),
]);

export default eslintConfig;
