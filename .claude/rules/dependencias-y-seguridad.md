# Dependencias y seguridad

## Solo pnpm

- **Siempre pnpm.** Nunca npm, yarn, bun ni `npx`: usa `pnpm add`, `pnpm exec`, `pnpm dlx`.
- `packageManager` en package.json fija la versión de pnpm y `scripts/solo-pnpm.mjs` hace fallar
  cualquier instalación con otro gestor. No los quites.
- `pnpm-lock.yaml` se versiona. No lo borres para "arreglar" una instalación: investiga el error.

## Una sola versión: la última estable y segura

Estable = la etiqueta `latest` del registro; nunca `canary`, `beta`, `rc`, `next`, `preview` ni
`experimental`. **Next.js va siempre en su última versión estable** (incluidos los parches de seguridad), y
`eslint-config-next` en la misma versión que `next`. React y react-dom, en su última estable.

Para instalar o actualizar sigue la skill `/actualizar-dependencias`.

Versiones actuales (verificadas el 2026-09-25):

| Paquete | Versión | Motivo |
|---|---|---|
| Node.js | 24.21.0 LTS (`engines`) | Última LTS. |
| pnpm | 12.6.0 | Última estable. |
| next, eslint-config-next | 16.3.6 | Última estable. |
| react, react-dom, @types/react, @types/react-dom | 19.3.0 | Última estable. |
| typescript | 6.0.3 | La 7.x no expone la API de compilador que usa Next; Next 16.3 instala `typescript@^6`. |
| eslint | 10.11.0 | La 9.x ya no tiene soporte. `eslint-plugin-react` 7.37 necesita `settings.react.version` fijo en `eslint.config.mjs` (mantenlo igual a la versión de React). |
| @types/node | 24.13.6 | Misma mayor que Node LTS. |

## Protecciones de `pnpm-workspace.yaml`

**No las relajes sin documentar el motivo en el mismo archivo.**

- `minimumReleaseAge: 1440`: no se instala nada publicado hace menos de un día.
- `trustPolicy: no-downgrade` + `trustPolicyIgnoreAfter: 43200`: falla si una versión reciente perdió
  firma o procedencia (posible toma de control del paquete). Si bloquea algo, investiga quién la publicó
  y cuándo antes de excluirla, y deja la excepción con fecha y motivo.
- `blockExoticSubdeps: true`: ninguna dependencia transitiva desde git o tarballs.
- `strictDepBuilds: true` + `allowBuilds`: ningún script de instalación corre sin aprobación explícita.
  Nunca `dangerouslyAllowAllBuilds`.

## Además

- **Menos dependencias, menos riesgo.** Hoy la app solo depende de next, react y react-dom. Antes de agregar
  un paquete, justifica por qué no alcanza con la plataforma web, React o Next.
- **Cabeceras de seguridad** en `next.config.ts` (CSP, HSTS, nosniff, `frame-ancestors 'none'`…).
  Si hace falta un recurso externo, amplía la CSP solo con ese origen; nunca `*`.
- **Enlaces externos** siempre con `rel="noopener noreferrer"`.
