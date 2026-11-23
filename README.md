# ktu

| Folder | What | Start here |
|---|---|---|
| `docs/` | **what the app does**: every feature, its rules and status | [FEATURES](docs/FEATURES.md) |
| `tirana-events/` | the app (Expo: web, iOS, Android) | [README](tirana-events/README.md) |
| `backend/` | the API (NestJS, Drizzle, PostgreSQL) | [README](backend/README.md), [PLAN](backend/PLAN.md), [ARCHITECTURE](backend/ARCHITECTURE.md) |
| `shared/` | rules and types used by both (`@ktu/shared`); source only, checked from `backend/` | [README](shared/README.md) |
| `founder/` | business plan, board reviews | [board](founder/board.md) |

`tirana-events/` and `backend/` each install and run on their own (`pnpm install`, `pnpm check`); there is no root package.
The app and the backend link `shared/` as `@ktu/shared` (`link:../shared`), so deploys need the whole repo checked out.
