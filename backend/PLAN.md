# Backend plan

What the API will do and in what order. **What** each feature must do is in
[../docs/FEATURES.md](../docs/FEATURES.md); **how the code is organised** is in
[ARCHITECTURE.md](ARCHITECTURE.md). This file connects the two: tables, endpoints, build order.

Goal: what the board's real-world test needs — accounts, a shared feed a curator fills, joins that
hosts actually see, and notifications — replacing the phone-only `tirana-events/src/data/store.tsx`.

## Stack

| Piece | Choice | Status |
|---|---|---|
| API | NestJS 12 (ESM), TypeScript 6, SWC builds | ✅ scaffolded |
| Database | PostgreSQL: Neon (EU, Frankfurt) in production; PGlite (in-process) in development and tests | ✅ wired, no tables yet |
| ORM + migrations | Drizzle (`drizzle-orm`, `drizzle-kit`), tables in each module's `data/*.table.ts` | ✅ configured |
| Shared rules | `@ktu/shared` (`../shared`): the same files the app runs | ✅ |
| Validation + API contract | zod; request/response schemas the app also needs go in `@ktu/shared`, so both sides use the same types (no code generation) | ⏳ |
| Sign-in | Clerk: attendees by email link, Google, Apple; hosts also verify a phone by SMS | ⏳ step 2 |
| Images | Cloudflare R2, presigned uploads straight from the app | ⏳ step 4 |
| Push | Expo push (`expo-server-sdk`) | ⏳ step 2 |
| Scheduled jobs | `@nestjs/schedule` under a Postgres advisory lock | ⏳ step 4 |
| Rate limits | `@nestjs/throttler` | ⏳ step 2 |
| Hosting | Railway (EU), built from the repo root (`cd backend && pnpm install && pnpm build`) | ⏳ |
| Analytics | PostHog EU, from the app | ⏳ |

Not now: WebSockets (refetching is enough), PostGIS (one city with areas), payments.

## Tables

All tables: `id uuid`, `created_at timestamptz`. Enums mirror `shared/src/types.ts`.

| Module | Table | Columns (short) | Constraints / indexes |
|---|---|---|---|
| users | `users` | clerk_id, name, avatar_url, city, interests text[], hidden text[], lang, show_going (`nobody`/`following`/`everyone`, default `nobody`), role (`user`/`curator`/`admin`), phone_verified, deleted_at | unique(clerk_id) |
| hosts | `hosts` | name, instagram, verified, owner_id → users (null for imported venues and the platform) | index(owner_id) |
| events | `series` | host_id, repeat, base_title, active | |
| events | `events` | the `EventItem` fields + host_id, series_id, edition, status, cancelled_at, cancel_reason, visibility, join_mode, accept_mode (`host`/`interests`), capacity, languages text[], tags text[], program jsonb, faq jsonb, good_to_know jsonb, cover_key, lat, lng | index(city, status, starts_at); GIN(tags); unique(series_id, edition) |
| attendance | `rsvps` | user_id, event_id, status (`going`/`reserved`/`requested`/`cancelled`), reservation_code | unique(user_id, event_id); unique(event_id, reservation_code) |
| social | `follows` | follower_id, followee_id | unique pair |
| social | `likes`, `saves` | user_id, event_id | unique pair |
| comments | `comments` | event_id, author_id, text, is_organizer | index(event_id, created_at) |
| reputation | `event_outcomes` | the `EventOutcome` fields | unique(event_id) |
| reputation | `ratings` | user_id, event_id, stars (1–5), issues text[], note, updated_at | unique(user_id, event_id); index(event_id) |
| reputation | `host_standings` | host_id (PK), tier, score, graded, late_cancels, ratings, rating_avg, updated_at | |
| moderation | `reports` | reporter_id, event_id / host_id, kind, status | index(status) |
| notifications | `push_tokens` | user_id, token, platform | unique(token) |

Later, additive: `partners`/`offers`/`stamps` (behind the flag, board condition; stamp rules parked),
`payments` (1:1 with rsvps).

## Endpoints

Everything under `/v1`; `GET /health` outside it. A global Clerk guard; guest routes marked public.

| Module | Endpoints | Rules |
|---|---|---|
| events | `GET /feed?city=` (public), `GET /events/:id` (public) | strip venue, address, exact time and pin when `canSeeDetails` says no; apply `visibleInFeed`; include each host's tier |
| events | `POST /events`, `PATCH /events/:id`, `POST /events/:id/cancel` | verified phone to create; new events are drafts; cancel asks a reason and notifies people going |
| events | `GET /curation/drafts`, `POST /curation/events/:id/publish`, `…/reject` | curator role |
| attendance | `POST /events/:id/join`, `POST /events/:id/request` (accepted at once when `autoAccepts`), `DELETE /events/:id/rsvp`, `GET /me/plans` | one RSVP per person per event; door code made by the server |
| attendance | `GET /events/:id/requests`, `POST /rsvps/:id/accept`, `POST /rsvps/:id/decline` | the event's host only; push to the person |
| social | follow/unfollow, like/unlike, save/unsave, `GET /events/:id/people` names only where the person's `show_going` lets this viewer see them (`canSeeGoing`); the host sees everyone coming; the total count always |
| reputation | `PUT /events/:id/rating`, `GET /me/ratings` | `canRate` (went, ended, within 7 days, not the host); one per person, replaced on change; `needsReview` sends problems to the curator queue; notes only to the team and the host |
| comments | `GET/POST /events/:id/comments` | rate-limited; host replies marked by the server |
| users | `GET/PATCH /me`, `DELETE /me`, `POST /webhooks/clerk` | webhook creates, updates and deletes users; deletion anonymises RSVPs |
| media | `POST /uploads/cover` | presigned R2 URL; size and type limits |
| moderation | `POST /reports`, curator decisions | reports count only once a curator confirms |
| notifications | `PUT /me/push-token` | dead tokens removed |

**Jobs** (each in its module's `jobs/`, safe to run twice):
- `events`: create the next edition of a series when the latest starts (`nextEditions`).
- `reputation`: grade events that ended or were cancelled (`outcomeOf`, with their ratings), recompute host standings (`hostStanding`), and again when late ratings arrive in the 7-day window.
- `notifications`: day-before reminders.

## Build order

Steps 1–2 are what the board's stage-1 test needs.

1. **Feed from the API:**
   - tables for hosts, series and events;
   - the demo seed loaded from `tirana-events/src/data/seed.ts`;
   - `GET /feed` and `GET /events/:id` with masking;
   - the app reads them as a guest;
   - curator publish.
2. **Accounts and joining:**
   - Clerk and the webhook;
   - join, reserve and request;
   - hosts accept or decline;
   - "my plans" offline;
   - push.
3. **Social and ratings:** follows, likes, saves, comments, who sees where you go, people you know going, ratings.
4. **Hosts:** create with review, cancel with reason, the edition job, outcomes and standings, reports, photo uploads.

## Before step 2: accounts and costs

| Account | Notes |
|---|---|
| Neon | free; EU region; its connection string in `.env` (development works without it) |
| Clerk | free tier; check SMS prices to Albanian numbers for host phone checks |
| Cloudflare R2 | free tier |
| Railway | a few dollars a month once deployed |
| Apple Developer, Google Play | for Apple sign-in, push and store builds |

## Verification

- `pnpm check` passes in `backend/` (which also checks `../shared`) and in `tirana-events/`.
- **Backend HTTP tests run on an in-memory database and check:**
  - a guest gets an ask-to-join event without its venue or time;
  - nobody reads another user's RSVPs, accepts someone else's request, or publishes a draft;
  - joining twice keeps one RSVP;
  - the edition job run twice makes one edition;
  - a late cancel lowers the host's standing;
  - only someone who went can rate, once, inside the week; a "felt unsafe" lands in the curator queue;
  - people going are named only where their choice allows;
  - creating without a verified phone is refused.
- **End-to-end:**
  - browse as a guest → sign in and join → the reservation QR opens offline;
  - a host verifies a phone → creates an event → it lands in the curator's queue.
