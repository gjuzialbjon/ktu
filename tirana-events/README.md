# Tirana Events — MVP

One codebase, three targets: **web, iOS, Android** (Expo / React Native / TypeScript).

## The one thing

Browse a complete, curated feed of everything happening in Tirana, and join an event in one tap. Every other feature serves that loop.

## Run it

```bash
pnpm install
pnpm web           # web, instantly in a browser
pnpm ios           # iOS simulator (needs Xcode) or Expo Go on a phone
pnpm android       # Android emulator or Expo Go
```

Production web build: `pnpm expo export --platform web` → static SPA in `dist/` (serve with any static host, SPA fallback on).

## Features

Every feature, its rules, its status (built / simulated / off / not built) and what the backend
must provide: **[../docs/FEATURES.md](../docs/FEATURES.md)**. Read that before building anything.

Why the core choices were made:

| Choice | Why |
| --- | --- |
| A complete, curated weekly feed; at most 2 sponsored events, labelled | completeness is the product; the board's feed-integrity rule |
| "People going" with people you follow first | the buyer panel's #1 reason to go: "I go if I see people I know" |
| Share a ready message + link | Tirana finds events through Instagram and WhatsApp |
| Reserve in the app, **pay cash at the door** with a code/QR | only ~9% buy tickets online in Albania; the panel refused card-first |
| Anyone can create; a curator publishes | open supply, kept to a quality bar |
| Questions, FAQ and a step-by-step programme on every event | people won't show up alone to something they can't picture |
| Albanian first, English second | the market; visitors are the second audience |

Not built on purpose until week-2 retention is proven: payments, ratings/reviews, recommendations
beyond tags, organizer analytics.

## Architecture

```
src/
  app/          routes only (Expo Router). Thin screens that compose features.
                (tabs)/ feed · map · [+ create] · plans · profile (perks hidden), event/[id], create (modal)
  features/     one folder per area; pure logic sits next to the UI that uses it
    feed/       buildFeed.ts (pure: sections, filters, popular, category rails), useFeedFilters, FilterBar,
                TodayTimeline, EventRail, sky.ts + SkyBackdrop (the background warms as today's events get later)
    event/      ActionBar, Comments, FaqList, LikeSave, actions.ts (share, open in maps),
                useEventFacts (the ONE place that decides what time/place an event shows)
    weather/    weather.ts (pure: Open-Meteo parsing, tips), useWeather (fetch + 30 min cache), WeatherChip + sheet
    create/     validateDraft.ts (pure), Field, PhotoField
    map/        project.ts (lat/lng → canvas per city), MapBackdrop (Tirana hand-drawn, others from data)
    city/       CityPicker sheet, countByCity.ts
    dev/        DevTools panel (development builds only)
  components/   shared UI: ui.tsx primitives (Display, Hand, Sticker, Chip…), Sheet, TopBar, EventCard, StoryCard,
                EventPhoto, CityBand, CrashScreen
  data/         store.tsx (every user action; the part the backend replaces), seed.ts + hostHistory.ts (demo data),
                collections.ts, partners.ts (partners, offers, stamp card), storage.ts (versioned device storage)
                (types, cities, events, access, recurrence, host standing: pure rules in ../shared, imported as @ktu/shared)
  hooks/        useNow, useHoverLift, useKeyboardVisible, useReducedMotion
  lib/          theme, i18n, format, log, analytics, haptics
  test-utils/   the Jest setup (test fixtures come from @ktu/shared/testing)
```

Rules of thumb:

- **Import with `@/`** (`@/data/store`), never `../../`.
- **Business rules are pure functions** that take `now` and ids as arguments: shared ones in `../shared` (`@ktu/shared`), app-only ones in `features/*/build*.ts` and `validate*.ts`. Screens call them; tests call them directly. Nothing in them reads the clock, storage or React.
- **Cities are data.** Adding one is an entry in `../shared/src/cities.ts` plus events; a test checks every seed event sits in a real area of its city and inside its map.
- **Only Tirana is live.** `LIVE_CITIES` in `../shared/src/cities.ts` decides which cities people see. The other seven cities (areas, maps, seed events, partners) stay in the code; add an id to `LIVE_CITIES` to switch one on, and the city picker, the profile setting and the create form's city row come back on their own (they only show when more than one city is live).
- **Copy lives in `lib/i18n.tsx`** in both languages. A test fails if a key is missing in one language or the two disagree on arguments.
- **Never put non-route files or tests in `src/app/`**: Expo Router treats every file there as a screen.

## Look and feel

- **Four themes:** Agimi (early morning, default), Muzgu (sunset) and Liqeni (lake) are light, their evening a warmer sky; Nata (night out) is the one dark theme: violet city, lit windows, yellow actions, pink for people.
- **Three faces, three jobs.** Young Serif for headings; Onest for all other text, numbers included (`components/Text` picks the weight file; import `Text` and `TextInput` from there, not from react-native); Caveat (handwritten) only on a few key words of app copy, usually as a `Sticker`, never on event copy.
- **One orchestrated moment per screen**, interruptible, and reduced-motion aware (the greeting sticker on home, the dice roll). Routine taps respond within 90–480 ms.
- **The sky.** On home, the background follows today's events from early to late as you scroll (`features/feed/sky.ts`). Keep it subtle.

## Copy is a core value

Copy makes the app feel personal, so it has rules. Every new string, in both languages, should pass these:

1. **Correct.** Standard Albanian as written in Tirana, always with ë and ç. Friendly and casual, but no Gheg/Kosovo forms in app copy ("Të gjitha", not "Krejt"; "çfarë", not "çka"; "kaluar", not "kalu"). Tirana words people really use are fine ("qejf", "llafe").
2. **Nobody left out.** Gender-neutral by default: "miqtë" (your friends) rather than "shokët"; "njerëz" rather than "djem/çupa". No assumptions about drinking, couples, religion, body, money or where someone is from.
3. **Warm, never creepy.** The app never claims to know you. Say why something is shown in plain words ("Based on the interests you picked"), not "we know you love…".
4. **No pressure.** No streaks, guilt or countdowns that are not real. "Can't make it" is always one tap and never punished.
5. **Say what happens.** Buttons name the action ("Ask to join"), and the result uses the same words ("Request sent").

When unsure about a phrase, ask a second native speaker before shipping it.

## No layout shift, ever

Nothing on screen may move by itself: not on first load, not when saved data, fonts, images
or the weather arrive, not when a host answers, and not in either language or any theme.

- The app draws nothing until fonts, language, theme and saved data are ready (each provider
  returns `null` until loaded), so the first frame is already the real one.
- Anything that arrives late gets its space up front: fixed sizes (weather chip, event action
  bar, cards), not `min` sizes that grow.
- Text that changes (labels, statuses, translations) sits in boxes sized for the longest
  version in either language. Controls keep fixed labels and never cut words with "…": a
  picked value is shown in full somewhere with room (e.g. the filter chips), not squeezed into a button.
- Check before shipping: load each screen at 375 and 320 px wide in Albanian and English and
  read Chrome's layout-shift score (aim for 0). Content changing right after your own tap
  (a filter) is expected and not counted.

## Quality and debugging

```bash
pnpm check         # lint + typecheck + tests (also runs before every deploy: pnpm deploy:web)
pnpm test          # Jest only; pnpm test:watch while working
```

- **Logs** go through `createLogger('scope')` from `lib/log.ts`, never bare `console`, so the dev console can be filtered by scope (`[store]`, `[storage]`, `[event]`…). `log.error` is the single hook for a crash reporter later.
- **Crashes** show `CrashScreen` with a retry button (with the stack in development) instead of a blank app.
- **Device data** is read through `data/storage.ts`: a corrupt key is dropped and logged on its own, never taking the rest down. Changing a stored shape means bumping `SCHEMA_VERSION` and adding a migration step.
- **Dev panel**: in development builds, Profile ends with a panel showing the build, storage version, theme and language, plus a button that resets local data to a fresh install.

## Next steps

The backend (NestJS + PostgreSQL in `../backend`, sign-in with Clerk) replaces `src/data/store.tsx`
step by step; the order is in [../docs/FEATURES.md](../docs/FEATURES.md#10-what-the-backend-must-deliver-by-step)
and the plan in [../backend/PLAN.md](../backend/PLAN.md). Also planned: PostHog behind
`src/lib/analytics.ts` (week-2 retention is the board's gate metric) and a rendered story image for sharing.
