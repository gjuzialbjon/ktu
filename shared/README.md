# @ktu/shared

The rules and types both sides use: the app (`../tirana-events`) and the API (`../backend`).
One copy, so the phone and the server can never disagree about who sees an event's details,
when the next edition of a series starts, or how a host ranks.

**Source only.** No dependencies, nothing to install, no `node_modules`. `package.json` only gives
the folder its name and entry points; `tsconfig.json` holds its stricter rules.

| File | What |
|---|---|
| `types.ts` | the data shapes: `EventItem`, `Rsvp`, `Profile`, `Series`, `CancelReason`… |
| `lang.ts` | interface languages (`sq`, `en`) |
| `cities.ts` | cities, their areas and map bounds, which cities are live |
| `languages.ts` | languages an event runs in (EN/IT/ES rows and filters) |
| `events.ts` | feed order, sponsored cap, drafts, RSVPs, door codes, comments, spots left |
| `recurrence.ts` | repeating events: dates, edition numbers, the next edition |
| `access.ts` | public / ask-to-join / private: who sees what, "for you", similar events |
| `hostStanding.ts` | host ranking: grading past events, tiers, the feed cap per host |
| `ratings.ts` | ratings after an event: who can rate, summaries, what they do to a host's grade, when the team reviews |
| `testing/fixtures.ts` | `makeEvent`, `at`, `NOW` for tests (`@ktu/shared/testing`) |

## Using it

Both projects depend on it as `"@ktu/shared": "link:../shared"` and import from the package,
never from a file path:

```ts
import { canSeeDetails, type EventItem } from '@ktu/shared';
import { makeEvent } from '@ktu/shared/testing'; // tests only
```

Nothing is built. The app's bundler (Metro, which watches this folder via
`tirana-events/metro.config.js`) and Node on the server (which strips the types when it loads
the files) both run it as-is.

## Rules for code in here

- **No imports from outside this folder:** no React, Expo, Nest, Drizzle, Node APIs or any package.
  No I/O, no clock reads (take `now` as a parameter).
- **Erasable TypeScript only:** no `enum`, `namespace` or constructor parameter properties, and
  `import type` for types. Node can only strip types, not transform code.
- **Relative imports name the file:** `from './types.ts'`.

## Checks and tests

They run from the backend, which has the tools:

| What | Where |
|---|---|
| type check with this folder's strict settings | `backend: pnpm typecheck` (runs `tsc -p ../shared`) |
| the import rules above | `backend/test/architecture.spec.ts` |
| tests for every rule | `backend/test/shared/*.spec.ts` |

So `cd ../backend && pnpm check` checks this folder too. Tests that need the app's demo data
live in the app (`tirana-events/src/data/__tests__/seed.test.ts`).
