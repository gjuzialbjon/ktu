> **Superseded (2026-11-23).** This was the original brief for the first build. The app has moved
> on: features and their status are in [../docs/FEATURES.md](../docs/FEATURES.md); the backend is
> NestJS + PostgreSQL with Clerk sign-in ([../backend/PLAN.md](../backend/PLAN.md)), not Supabase
> with phone OTP; comments and multiple cities, listed as out of scope below, were built. Kept as a
> record of what was asked for, not as instructions.

# Build prompt — Tirana Events MVP (web + iOS + Android)

> Copy everything below this line into the coding agent.

---

Build the MVP of a local events platform for Tirana, Albania. One codebase, three targets: web, iOS, Android.

## The one thing (do not widen the scope)

**Community event discovery: browse a complete, curated feed of everything happening in Tirana, and join an event in one tap.** Everything else exists only to serve that loop. If a feature below conflicts with shipping this loop well, cut the feature and say so.

## Context you must design around (from validated research — do not re-litigate)

1. **Users discover passively.** Tirana finds events through Instagram stories and WhatsApp groups, not by opening apps. The #1 validated growth mechanic is the app generating beautiful, shareable event cards that users repost to Instagram stories and WhatsApp. Treat share-out as a first-class feature, more important than in-app search.
2. **Nobody attends alone.** The #1 validated flip condition is "I can see people I know are going." Social visibility of attendees (with privacy controls) is core, not a nice-to-have.
3. **Cash country.** Only ~9% buy event tickets online. v1 has NO payment processing: ticketed events use **reserve in-app, pay cash at the door** (reservation with a code/QR the organizer can check off). Card/EasyPay payments are a later phase; design the data model so a `payment` can be attached to a `reservation` later without migration pain.
4. **The feed is hand-curated by an editor.** A founder curates every event weekly. The admin tool is therefore half the product: make adding an event take under 60 seconds (paste an Instagram post URL or text + a photo → prefilled draft).
5. **Albanian first, English second.** Full i18n from day one (sq default, en). Must run well on low-end Android phones and poor connections: aggressive image sizing, skeleton states, feed cached for offline reading.

## Stack (keep it boring and single-codebase)

- **App:** React Native + Expo (SDK current stable), TypeScript, Expo Router. Web via Expo web output — same codebase, responsive.
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime). Row-level security on from the start.
- **Auth:** phone number OTP (primary in this market) + Apple/Google sign-in (store requirements). Guests can browse the full feed without an account; joining requires one.
- **Images:** Supabase storage + on-upload resize; serve responsive sizes.
- **Analytics:** PostHog (self-serve tier), events listed below.
- **CI:** EAS Build profiles for iOS/Android, static web deploy. Include a seed script with 30 realistic Tirana events (real venues, Albanian titles) for demos.

## Data model (minimum)

`users` (phone/apple/google id, display name, avatar, city default Tirana)
`events` (title, description, category enum [community | music | nightlife | culture | sports | business | food | outdoors], **tags text[] — free-form lowercase tags (e.g. "yoga", "live-music", "beginner-friendly", "outdoor", "english-friendly"); required, 1–6 per event, set by the curator; indexed. They power future recommendations ("more like this", interest onboarding), so log tag views/joins in analytics from day one even though v1 does no recommending**, venue name, address, lat/lng, start/end datetime, cover image, price_type enum [free | ticketed], ticket_price_lek nullable, capacity nullable, source enum [curated | organizer], status [draft | published | cancelled], is_sponsored bool + sponsored_label, created_by)
`rsvps` (user, event, status [going | reserved | cancelled], reservation_code, created_at)
`follows` (user → user, for "people you know")
`organizers` (name, instagram handle, contact, verified bool) linked to events
Design note: a future `payments` table must attach to `rsvps` 1:1; a future `ratings` table attaches to (user, event) — do not build either now.

## Screens (and nothing else)

1. **Feed** (home): this week's events, complete, newest-relevant first; category chips; free/ticketed filter; sponsored events max 2, pinned top, visibly labeled "Sponsored". Empty states must never look dead: always show the weekly editorial header ("Java në Tiranë — 34 evente").
2. **Event detail:** photo, when/where (map link out to Google Maps — no embedded map SDK in v1), price, description, organizer, **avatars of people going (and mutual follows highlighted)**, big single CTA: "Po vij" (free) / "Rezervo" (ticketed).
3. **Share card generator:** from event detail, one tap renders a 1080×1920 story-ready image (title, date, venue, app handle, QR deep link) → native share sheet. Also a plain WhatsApp text+link share. Deep links open the event in app or web fallback.
4. **My events:** upcoming joins/reservations with reservation code as QR; past events list.
5. **Create event** (organizer-lite): title, category, photo, datetime, venue, free/ticketed + price, capacity. New submissions land as `draft` for curator approval.
6. **Profile:** name, avatar, follows, language toggle, notification prefs.
7. **Admin (web-only route, role-gated):** event CRUD with the 60-second quick-add (URL/text paste → prefilled draft), approve drafts, mark sponsored (with required label), cancel with push notice to joiners, weekly stats dashboard (below).

## Notifications (minimal)

Push (Expo notifications) + in-app: event you joined is tomorrow / changed / cancelled; someone you follow joined an event. Nothing else. Every type individually mutable.

## Instrumentation (these numbers decide the business — not optional)

Track with PostHog: feed_viewed, event_viewed (source: feed/share/deeplink), share_card_created, share_completed, rsvp_created (free/ticketed), reservation_redeemed (admin check-off), D1/D7/D14 return, weekly curated-event count. The admin dashboard shows: WAU, joins per event, share→install conversion, **week-2 retention** (the gate the roadmap hangs on), and no-show rate (reservations never redeemed).

## Explicitly OUT of v1 (deferred, do not build)

Payments of any kind; ratings/reviews; comments/chat; recommendation algorithms; multi-city; trips/places/gamification; organizer self-serve analytics; embedded maps. If asked why: the validated plan gates each behind week-2 retention of the core loop.

## Quality bar

TypeScript strict; RLS policies tested; the three flows that must never break: browse feed as guest → join as new user (OTP) → show reservation QR offline. E2E-test exactly those three (Maestro or Detox). Lighthouse mobile ≥ 85 on the web feed. All copy in both sq and en from launch.

## Milestones (demo at each)

1. Feed + event detail + seed data, web deployed (guest browse works end-to-end).
2. Auth + join/reserve + my events with QR + push.
3. Share-card generator + deep links + follows/"people going".
4. Admin quick-add + sponsored labeling + dashboard + i18n polish + store-ready builds (EAS) + E2E suite.

Deliver each milestone as a working build (web URL + Expo build links), with a one-paragraph changelog and the metric events verified firing in PostHog.
