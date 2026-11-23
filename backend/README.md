# KTU backend

The API for the Tirana Events app (`../tirana-events`): NestJS 12, Drizzle, PostgreSQL.
What it will do and in what order: [PLAN.md](PLAN.md) (features: [../docs/FEATURES.md](../docs/FEATURES.md)).
How the code is organised and why: [ARCHITECTURE.md](ARCHITECTURE.md).

## Run it

Needs Node 22.12+ (the repo pins 26 in `../.nvmrc`) and pnpm 12 (pinned in `package.json`; install scripts are approved in `pnpm-workspace.yaml`). No database account or Docker for development.

```bash
pnpm install
cp .env.example .env        # optional in development
pnpm dev                    # http://localhost:3000, restarts on save
curl localhost:3000/health  # {"status":"ok","database":"up"}
```

Without `DATABASE_URL` the API uses PGlite, a real Postgres running inside the process, stored in
`./.data/pglite` (delete the folder to start fresh). Set `DATABASE_URL` to a Neon connection string
to use a real server.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | start with reload |
| `pnpm build` / `pnpm start` | compile to `dist/` with SWC / run the compiled server |
| `pnpm check` | lint + typecheck + tests, for this folder and `../shared`: run before every commit |
| `pnpm test` | unit, HTTP, architecture and `@ktu/shared` tests (in-memory database) |
| `pnpm db:generate` | write a SQL migration from changes to `*.table.ts` |
| `pnpm db:migrate` | apply migrations to the database in `DATABASE_URL` (or the local PGlite) |
| `pnpm db:studio` | browse the data |

## Shared rules

Business rules shared with the app come from `@ktu/shared` (`../shared`, linked by pnpm; source only,
nothing to install there). This project also checks it: `pnpm typecheck` type-checks `../shared` with
its own strict settings, and its tests live in `test/shared/`. At runtime Node loads that TypeScript
directly, so a deploy needs the repository checked out, not just this folder: build with
`cd backend && pnpm install && pnpm build`, start with `pnpm start`.

## Endpoints

| Route | Notes |
|---|---|
| `GET /health` | uptime check, outside the version prefix |
| `/v1/...` | everything else |

Errors always look like `{ "error": { "code": "not_found", "message": "…" } }`.
