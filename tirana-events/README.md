# Tirana Events — MVP

One codebase, three targets: **web, iOS, Android** (Expo / React Native / TypeScript).

## The one thing

Browse a complete, curated feed of everything happening in Tirana, and join an event in one tap. Every other feature serves that loop.

## Run it

```bash
npm install
npm run web        # web, instantly in a browser
npm run ios        # iOS simulator (needs Xcode) or Expo Go on a phone
npm run android    # Android emulator or Expo Go
```

Production web build: `npx expo export --platform web` → static SPA in `dist/` (serve with any static host, SPA fallback on).

## What's in v1 (and the validated reason)

| Feature | Why (validated) |
| --- | --- |
| Curated weekly feed, sponsored max 2 pinned + labeled | Completeness is the product; feed-integrity rule from the board |
| Tags on every event (1–6, lowercase) | Future recommendations; logged in analytics from day one |
| "People going" avatars, follows highlighted | #1 panel flip condition: "I go if I see people I know" |
| Share: story-ready message + deep link | Tirana discovers events passively via Instagram/WhatsApp |
| Reserve in-app, **pay cash at the door**, QR code | 8.6% online-ticketing penetration; panel refused card-first |
| Create event → draft for curator approval | Anyone can create; curation keeps the quality bar |
| Albanian default, English toggle | Albanian-first market |
| Questions & comments per event, organizer replies badged | Trust gap: buyers want answers before showing up alone |
| Organizer FAQ (accordion) + "Good to know" bullets | Kills the repeat questions that flood Instagram DMs |
| Stylized SVG map of Tirana with tappable category pins | Spatial discovery, zero native-maps dependency, works on web/iOS/Android |
| Per-category colors + emoji, date blocks, popular badges | The feed has to beat Instagram visually, not just functionally |

## Explicitly NOT in v1 (gated on week-2 retention)

Payments, ratings/reviews, chat, recommendations, organizer analytics.

## Architecture

```
src/
  app/          routes only (Expo Router). Thin screens that compose features.
                (tabs)/ feed · map · [+ create] · perks · plans; profile (top right), event/[id], create (modal)
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
  data/         cities.ts (every city: areas, map bounds, water), store.tsx (state; the Supabase swap boundary),
                events.ts (pure rules), access.ts (pure: who sees what, ask-to-join, for-you, similar),
                partners.ts (partners, offers, stamp card),
                storage.ts (versioned device storage), seed.ts, types.ts
  hooks/        useNow, useHoverLift, useKeyboardVisible, useReducedMotion
  lib/          theme, i18n, format, log, analytics, haptics
  test-utils/   fixtures (fixed NOW, makeEvent) and the Jest setup
```

Rules of thumb:

- **Import with `@/`** (`@/data/store`), never `../../`.
- **Business rules are pure functions** (`data/events.ts`, `features/*/build*.ts`, `validate*.ts`) that take `now` and ids as arguments. Screens call them; tests call them directly. Nothing in them reads the clock, storage or React.
- **Cities are data.** Adding one is an entry in `data/cities.ts` plus events; a test checks every seed event sits in a real area of its city and inside its map.
- **Only Tirana is live.** `LIVE_CITIES` in `data/cities.ts` decides which cities people see. The other seven cities (areas, maps, seed events, partners) stay in the code; add an id to `LIVE_CITIES` to switch one on, and the city picker, the profile setting and the create form's city row come back on their own (they only show when more than one city is live).
- **Copy lives in `lib/i18n.tsx`** in both languages. A test fails if a key is missing in one language or the two disagree on arguments.
- **Never put non-route files or tests in `src/app/`**: Expo Router treats every file there as a screen.

## Look and feel

- **Light, always.** Three themes, none dark: Agimi (early morning, default), Muzgu (sunset), Liqeni (lake). Evening is a warmer sky, not black.
- **Two typefaces.** Bricolage Grotesque for headings; Caveat (handwritten) only on a few key words of app copy, usually as a `Sticker`. Never on event copy. Body text uses the phone's own font for readability.
- **One orchestrated moment per screen**, interruptible, and reduced-motion aware (the greeting sticker on home, the dice roll). Routine taps respond within 90–480 ms.
- **The sky.** On home, the background follows today's events from early to late as you scroll (`features/feed/sky.ts`). Keep it subtle.

## Copy is a core value

Copy makes the app feel personal, so it has rules. Every new string, in both languages, should pass these:

1. **Correct.** Real Albanian, spelled the way people actually text (the casual voice drops ë/ç on purpose in app copy; event copy written by organizers keeps them).
2. **Nobody left out.** Gender-neutral by default: "tajfa" (your crew) rather than "shoket"; "njerez" rather than "djem/cupa". No assumptions about drinking, couples, religion, body, money or where someone is from.
3. **Warm, never creepy.** The app never claims to know you. Say why something is shown in plain words ("Based on the interests you picked"), not "we know you love…".
4. **No pressure.** No streaks, guilt or countdowns that are not real. "Can't make it" is always one tap and never punished.
5. **Say what happens.** Buttons name the action ("Ask to join"), and the result uses the same words ("Request sent").

When unsure about a phrase, ask a second native speaker before shipping it.

## Quality and debugging

```bash
npm run check      # lint + typecheck + tests (also runs before every deploy)
npm test           # Jest only; npm run test:watch while working
```

- **Logs** go through `createLogger('scope')` from `lib/log.ts`, never bare `console`, so the dev console can be filtered by scope (`[store]`, `[storage]`, `[event]`…). `log.error` is the single hook for a crash reporter later.
- **Crashes** show `CrashScreen` with a retry button (with the stack in development) instead of a blank app.
- **Device data** is read through `data/storage.ts`: a corrupt key is dropped and logged on its own, never taking the rest down. Changing a stored shape means bumping `SCHEMA_VERSION` and adding a migration step.
- **Dev panel**: in development builds, Profile ends with a panel showing the build, storage version, theme and language, plus a button that resets local data to a fresh install.

## Next steps (from founder/board.md conditions)

1. Supabase backend behind `src/data/store.tsx` (schema in `founder/build-prompt.md`)
2. Phone OTP auth
3. PostHog behind `src/lib/analytics.ts` (week-2 retention is the gate metric)
4. Story-card image generator (view-shot) replacing text share
5. Admin quick-add web route for the curator
