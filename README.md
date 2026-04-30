# SIGC Frontend

Aplicación web SIGC (React 18 + TypeScript + Vite + Redux Toolkit).

## Requisitos

- Node.js 18+
- pnpm 7.33.7

## Instalación

```bash
pnpm install
```

## Scripts principales

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm run test -- --runInBand
pnpm build
```

## Notas de proyecto

- El lockfile fuente de verdad es `pnpm-lock.yaml`.
- Las rutas legacy `/campanas` y `/monitor_seguimientos` redirigen a `/profile`.
- El módulo Campaigns está retirado del flujo productivo actual.

## Estructura (resumen)

- `src/modules/*`: módulos de negocio por dominio.
- `src/pages/*`: páginas de aplicación.
- `src/services/*`: servicios API y adaptadores.
- `src/store/*`: estado global Redux.

## Verificación recomendada antes de merge

```bash
pnpm typecheck
pnpm lint
pnpm run test -- --runInBand
pnpm build
```
