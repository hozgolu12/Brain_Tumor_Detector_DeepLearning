# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## NeuroScan App

Brain tumor detection web app at `artifacts/neuroscan` (React + Vite). Pages: Dashboard, New Scan, History, Model Info, About. Backend lives in `artifacts/api-server` and exposes `/api/predict`, `/api/predictions`, `/api/predictions/stats`, `/api/model/info`. Predictions are persisted in the `predictions` Postgres table.

### Plugging in a custom .h5 Keras model

The Node API forwards inference to an external Python service when `MODEL_SERVICE_URL` is set. A reference Flask service is provided in `model_service/inference_server.py` — see `model_service/README.md` for how to load a `.h5` file and wire it up. When `MODEL_SERVICE_URL` is unset, a deterministic mock is used so the UI works end-to-end.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
