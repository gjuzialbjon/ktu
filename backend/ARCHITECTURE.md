# Backend architecture

A modular monolith: one NestJS app and one Postgres database, split into feature modules
with hard boundaries. Every file has exactly one right place, and `test/architecture.spec.ts`
fails the build when something is in the wrong one.

## Top level

```
src/
  main.ts            starts the server (reads .env in development)
  bootstrap.ts       HTTP setup shared by the server and the tests: /v1 prefix, errors, CORS
  app.module.ts      lists the modules; nothing else
  config/            env.ts: every setting, validated at startup (zod); ENV injection token
  platform/          technical building blocks, no business rules
    database/        Drizzle client (Postgres or PGlite), DB token, schema.ts (collects all tables)
    http/            zod validation pipe, the one error shape (ErrorFilter)
    <later>          auth/ (Clerk guard, @Public, @Roles), storage/ (R2), push/ (Expo), scheduler/ (job lock)
  modules/           one folder per business area (below)
test/
  support/           createTestApp(): the real app + an in-memory database
  *.e2e.spec.ts      HTTP tests through the real app
  shared/            tests for ../shared (@ktu/shared), which has no tools of its own
  architecture.spec.ts   these rules, plus: ../shared imports nothing outside itself
drizzle/             generated SQL migrations (committed, never edited by hand)
```

## Modules

| Module | Owns | Tables |
|---|---|---|
| `health` | uptime check | none |
| `users` | profile, role, phone verification, deletion (synced from Clerk) | users |
| `hosts` | organizers, imported venues, the platform as host | hosts |
| `events` | feed, event pages, create/edit/cancel, curator review, repeating series and the next-edition job | events, series |
| `attendance` | going, reservations with door code, ask-to-join, host accept/decline, my plans | rsvps |
| `social` | follows, likes, saves, "people you know going" | follows, likes, saves |
| `comments` | questions and chat on an event | comments |
| `reputation` | grading finished events, host standing and tiers | event_outcomes, host_standings |
| `moderation` | user reports and curator decisions | reports |
| `media` | signed uploads for covers and avatars | none (files in R2) |
| `notifications` | device tokens, push messages | push_tokens |

A new business area gets a new module, never a folder inside another one.

### Inside a module

```
modules/events/
  events.module.ts     Nest wiring only: controllers, providers, imports, exports
  index.ts             the module's public surface: what other modules may use
  http/                controllers (*.controller.ts) and request/response schemas (*.dto.ts)
  application/         use cases (*.service.ts) and module-only rules (*.policy.ts)
  data/                tables (*.table.ts), queries (*.repository.ts), row ↔ domain mapping (*.mapper.ts)
  jobs/                scheduled work (*.job.ts)
```

Unit tests sit next to the file they test (`events.service.spec.ts`). HTTP tests go in `test/`.

## The rules (checked by `test/architecture.spec.ts`)

1. **Layers point one way:** `http → application → data`. `jobs` may use `application` and `data`.
   A controller never queries the database; a repository never knows about HTTP.
2. **Modules talk through `index.ts` only.** `events` may call `import { HostsService } from '../hosts/index.js'`,
   never `../hosts/application/hosts.service.js`. A module exports a service from `index.ts` and its Nest
   module before another module may use it.
3. **Only `data/` (and `platform/database`) import Drizzle.** Everything above works with plain
   objects and the `@ktu/shared` types.
4. **Tables live in `data/*.table.ts`**, one module owns each table, and `platform/database/schema.ts`
   re-exports them. Another module reads that data through the owner's service, not its table.
5. **`platform/` and `config/` never import from `modules/`.**
6. **A module folder holds only** `<name>.module.ts`, `index.ts`, `http/`, `application/`, `data/`, `jobs/`.

## Conventions

- **Business rules shared with the app** (who sees hidden details, repeating events, host standing,
  reservation codes) come from `@ktu/shared` (`../shared`, see its README), never re-implemented here.
  This project type-checks and tests `../shared` for it (`tsc -p ../shared`, `test/shared/`).
- **Settings** only through the `ENV` token. Never read `process.env` elsewhere.
- **Validation:** every request body, query and param is parsed with a zod schema via `ZodValidationPipe`.
  Schemas the app also needs live in `@ktu/shared`.
- **Errors:** throw Nest's HTTP exceptions with `{ code, message }`. The `ErrorFilter` turns everything into
  `{ error: { code, message, details? } }`; unexpected errors are logged and returned as `internal`.
- **Routes:** feature endpoints under `/v1`. A breaking change adds `/v2` beside it.
- **Imports:** ESM with `.js` extensions on relative paths. Constructor-injected classes are imported as
  values (not `import type`), because Nest resolves them from runtime metadata.
- **Logging:** Nest's `Logger` with a context name; `console` is a lint error.
- **Jobs:** every scheduled job must be safe to run twice (unique constraints, "insert if missing"), and
  runs under a Postgres advisory lock so several server instances never run it at once.
- **Migrations:** change a `*.table.ts`, run `pnpm db:generate`, commit the SQL in `drizzle/`.

## Decisions

| Decision | Why |
|---|---|
| NestJS 12 (ESM), TypeScript 6 | familiar structure (Angular-like); Nest 12 does not support TypeScript 7 yet |
| SWC for builds and tests, `tsc` for type-checking only | Nest needs decorator metadata (esbuild can't emit it); SWC compiles `src/` file by file, so `../shared` is never copied into `dist/`: Node loads it at runtime by stripping types |
| Drizzle + Postgres (Neon in production) | relational data, SQL-shaped queries, generated migrations, plain Postgres that can move anywhere |
| PGlite when `DATABASE_URL` is empty | a real Postgres in-process: development and tests need no account and no Docker |
| zod for settings and requests | one validation library on both sides; schemas shareable with the app |
| Modular monolith, not microservices | one deploy and one database for a small team; modules can be split out later because their boundaries are already enforced |
