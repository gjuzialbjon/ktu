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

Payments, ratings/reviews, chat, recommendations, multi-city, organizer analytics.

## Architecture

- `app/` — Expo Router screens: `(tabs)/` feed · my events · profile; `event/[id]`; `create` (modal)
- `lib/store.tsx` — **the swap boundary**: local-first (AsyncStorage) now, same method names move to Supabase later
- `lib/analytics.ts` — event logging boundary (console now → PostHog later); logs tag views/joins for future recommendations
- `lib/seed.ts` — 10 realistic Tirana events + demo people for social proof
- `lib/i18n.tsx` — sq/en dictionaries

## Next steps (from founder/board.md conditions)

1. Supabase backend behind `lib/store.tsx` (schema in `founder/build-prompt.md`)
2. Phone OTP auth
3. PostHog behind `lib/analytics.ts` (week-2 retention is the gate metric)
4. Story-card image generator (view-shot) replacing text share
5. Admin quick-add web route for the curator
