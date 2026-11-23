# Features

Every feature of the Tirana Events app, what it does, the rules behind it, where the code is, and
what the backend must provide. Written from the code on 2026-11-23; when a feature changes, change
its section here in the same commit.

**Status**

| Mark | Meaning |
|---|---|
| ✅ Built | works in the app with demo data, stored on the phone |
| 🧪 Simulated | works, but fakes another person or system (e.g. a host answering after 6 seconds) |
| 🚩 Off | built and kept in the code, switched off for now |
| ⏳ Not built | decided or planned, no code yet |

**Who's who**

| Role | Can |
|---|---|
| Guest | browse everything public, no account |
| Attendee | join, reserve, ask to join, like, save, comment, follow (needs an account) |
| Host | creates events: an organizer, a venue, or the platform itself ("Nga ne") |
| Facilitator | a person the platform names to look after one of its own events on the day |
| Curator | the team: reviews drafts, publishes, handles reports |

**Where the rules live:** pure rules shared with the backend are in `shared/src/` (imported as
`@ktu/shared`); app-only logic is in `tirana-events/src/features/`; every user action is a method in
`tirana-events/src/data/store.tsx`, which is the part the backend replaces.

---

## 1. Discover

### 1.1 Home feed ✅
- **What:** greeting sticker and "Ku dalim sonte?", a count of this week's events, then (top to
  bottom): highlights, the filter bar, today's timeline, "Mbase të pëlqen", collections,
  one row per category, language rows, people you follow, then the week grouped as
  Sot / Nesër / Fundjava / Më vonë.
- **Rules:** only published events of the live city that this person may see (see 3.3, 1.7);
  events drop out 1 h after they start; up to 2 sponsored events per city are pinned and
  labelled "E sponsorizuar"; at most 2 "Po zien 🔥" badges, only on events with 4+ people going.
  With any filter on, the rows step aside and only the matching list shows, today included.
- **Code:** `src/app/(tabs)/index.tsx`, `features/feed/buildFeed.ts`, `shared/src/events.ts` (`orderFeedEvents`, `MAX_PINNED_SPONSORED`).
- **Backend:** `GET /v1/feed?city=` returns the city's upcoming published events the caller may
  see, hidden details already stripped (3.3), with each host's tier (5.3). Ranking stays in the app.

### 1.2 Highlights ("Mos i humb") ✅
- **What:** up to 5 big cards. Phone: a swipeable carousel that advances by itself until touched;
  wide screens: a grid of 2–3, no carousel.
- **Rules:** score = sponsored (+100) + people you follow going (×3) + people going + likes/10 + 2 if
  within 48 h, multiplied by the host's tier weight; only Normal/Trusted hosts (5.3).
- **Code:** `features/feed/HighlightsCarousel.tsx`, `pickHighlights` in `buildFeed.ts`.

### 1.3 Today's timeline ("Sonte" / "Sot") ✅
- **What:** today's events in time order. More than 5: shows the day's favourites and a
  "Të gjitha N eventet e sotme →" link to the full list.
- **Rules:** yours first; then likes + a bonus for a returning series (+3 per earlier edition, max
  10 editions) × host tier weight; Limited/Low hosts only if there is room. Picks shown in time order.
- **Code:** `features/feed/TodayTimeline.tsx`, `features/feed/todayTop.ts`.

### 1.4 Filters ✅
- **What:** a bar that sticks while scrolling: Kur (today / tomorrow / weekend / any), Ku (area),
  Filtra (free only, language), and a swipeable category row. Picked filters show as removable chips.
  Tapping a #tag anywhere filters by it.
- **Code:** `features/feed/FilterBar.tsx`, `useFeedFilters.ts`, `FeedFilters` in `buildFeed.ts`.
- **Backend:** none (filters run on the feed in the app).

### 1.5 Rows: for you, categories, languages ✅
- **"Mbase të pëlqen":** events matching your interests or the tags of events you joined; up to 8;
  nothing matched → no row (never a guess). `forYou` in `shared/src/access.ts`.
- **Category rows:** one per category with events, fullest first, "Të gjitha N" opens the filtered list.
- **Language rows:** "English-friendly", "Si parla italiano", "Se habla español" once 3+ events work
  in that language; the English row comes first when the app is in English. `shared/src/languages.ts`.
- **All rows:** Low-standing hosts left out, Limited ones last, at most 1–3 events per host (5.3).
  On a computer, arrow buttons scroll the row.

### 1.6 Collections ("Koleksione") ✅
- **What:** curated lists with a cover and a point of view, each with its own page.
- **Rules:** filled by a rule, shown only with 3+ events, Normal/Trusted hosts only:
  - "Sapo erdhe në Tiranë": #newcomers, or English-friendly + meet-people/beginner-friendly/social;
  - "Vjen vetëm? S'ka gjë": the platform's own events, #meet-people, #small-group;
  - "Jashtë, në ajër të pastër": outdoors category or #outdoor/#hiking/#running/#walk;
  - "Fundjavë pa para": free, this weekend;
  - "Nata e gjatë": nightlife, or starting at 21:00 or later.
- **Code:** `tirana-events/src/data/collections.ts`, `src/app/collection/[id].tsx`.
- **Backend:** none yet (rules run on the feed); curator-made collections would need a table.

### 1.7 Hidden topics ("Mos më trego") ✅
- **What:** in the profile, or from an event page ("Mos më trego evente si ky"), pick topics never to
  see. The feed ends with "N evente të fshehura… Ndrysho".
- **Rules:** those events leave the feed, rows, map, dice and "similar"; anything you joined or asked
  to join stays; a topic is either an interest or hidden, never both.
- **Code:** `hiddenTopicOf`, `visibleInFeed` in `shared/src/access.ts`; `features/profile/HideTopicsSheet.tsx`.
- **Backend:** `hidden[]` on the user; the feed endpoint applies it.

### 1.8 Dice ("Hidh zarin") ✅
- **What:** opens a random upcoming event with a short dice animation (respects reduced motion).
- **Rules:** picks among upcoming events, Low-standing hosts left out.
- **Code:** `features/feed/DiceRoll.tsx`.

### 1.9 Map ("Harta") ✅
- **What:** a hand-drawn map of Tirana (lake, areas) with a pin per event, coloured by category;
  tap for a preview. Ask-to-join events show no exact pin.
- **Code:** `src/app/(tabs)/map.tsx`, `features/map/project.ts`, `MapBackdrop.tsx`.
- **Backend:** `lat`/`lng` on events; hidden for ask-to-join events until accepted.

### 1.10 Weather ✅
- **What:** temperature chip on home; tap for today (hours, rain, wind, sunrise/sunset, one tip).
  Event pages show the forecast for the event's hour when it starts within ~12 h.
- **Rules:** Open-Meteo, free, only the city centre's coordinates are sent; cached 30 min.
- **Code:** `features/weather/`, `weatherAt` in `features/event/stats.ts`.
- **Backend:** none (the app calls Open-Meteo directly).

### 1.11 The sky ✅
- **What:** the home background warms from morning to evening as you scroll past later events.
- **Code:** `features/feed/sky.ts`, `SkyBackdrop.tsx`.

---

## 2. The event page

### 2.1 Details ✅
- **What:** photo with credit, time, title, a trust line (category, "Për fillestarë", "🔁 Çdo javë"
  for a series, "✓ Organizator i besuar" for Trusted hosts, like/save), description, organizer,
  place with "Hape në hartë", tags, sponsored label when paid.
- **Code:** `src/app/event/[id].tsx`, `features/event/useEventFacts.ts` (the one place deciding
  which time/place to show).
- **Backend:** `GET /v1/events/:id` with the same masking as the feed.

### 2.2 Stats card ✅
- **What:** big numbers: how long, entry price (with a € hint in English), spots left or turnout, languages.
- **Rules:** spots left = capacity − people going (− you, if you joined); turnout under 3 is not shown.
- **Code:** `features/event/EventStats.tsx`, `stats.ts`, `spotsLeft` in `shared/src/events.ts`.

### 2.3 Programme ("Programi") ✅
- **What:** the evening step by step as waypoints A → 1 → 2 → B ("Takohemi te dera" … "Ëmbëlsira").
- **Rules:** clock times when details are visible, offsets ("+45m") while an ask-to-join event is hidden.
- **Code:** `features/event/Program.tsx`, `programStops` in `stats.ts`; data: `program` on the event.

### 2.4 FAQ and "Mirë të dish" ✅
- **What:** host-written questions (accordion) and short tips (bring a mat, cash only…).
- **Code:** `features/event/FaqList.tsx`; data: `faq`, `goodToKnow` on the event.

### 2.5 Comments ("Pyetje & llafe") ✅
- **What:** questions and chat under the event; the host's replies are badged.
- **Rules:** empty text is ignored; author name or "Ti".
- **Code:** `features/event/Comments.tsx`, `makeComment` in `shared/src/events.ts`.
- **Backend:** `GET/POST /v1/events/:id/comments`, rate-limited; host replies marked by the server.

### 2.6 People going ✅
- **What:** avatars of people going with people you follow first, "Elisa dhe Gent vijnë" on cards,
  "Nga miqtë e tu" on the page.
- **Rules (decided 2026-11-23):** each person chooses who sees the events they go to, in the
  profile (6.5); everyone starts at "nobody". Counts ("6 vijnë") always include everyone; names and
  faces only of people whose choice lets you see them, the rest as "+N". A friend who doesn't share
  never shapes your feed either: no "Elisa vjen", no rank boost, no private event reaching you
  through them. `canSeeGoing` in `shared/src/access.ts`; the store's `goersOf` and `friendsShown`.
- 🧪 **Simulated:** each demo person carries a choice; Sara never chose and Rea shares only with
  people Rea follows, so neither is ever named.
- **Backend:** `GET /v1/events/:id/people` and the feed return only the names the viewer may see,
  plus the total count; the event's host always sees who is coming.

### 2.7 Similar events ("Të ngjashme") ✅
- **Rules:** same city, upcoming, sharing tags; most shared tags first; up to 6. `similarEvents` in `shared/src/access.ts`.

### 2.8 Share ✅
- **What:** the phone's share sheet with a ready message ("Vij unë, hajde edhe ti!") and a link.
- **Code:** `shareEvent`, `eventDeepLink` (`tiranaevents://event/:id`) in `features/event/actions.ts`.
- ⏳ **Not built:** a rendered Instagram-story image; web links that open the app.

---

## 3. Joining

### 3.1 Join a free event ✅
- **What:** "Vij edhe unë!" → "Je brenda ✓"; "Nuk vij dot më" undoes it with no penalty.
- **Code:** `join`/`cancel` in `store.tsx`; `makeRsvp` in `shared/src/events.ts`.
- **Backend:** `POST /v1/events/:id/join`, `DELETE /v1/events/:id/rsvp`; one RSVP per person per event.

### 3.2 Reserve a ticketed event, pay at the door ✅
- **What:** "Zër një vend" gives a door code (`TE-` + 4 characters) and a QR code; you pay cash at the door.
- **Rules:** no online payment (only ~9% of people in Albania buy tickets online).
- **Code:** `reservationCode`, `makeRsvp` in `shared/src/events.ts`; the QR on the event page.
- **Backend:** the code is created by the server and unique per event.
- ⏳ **Not built:** the host checking codes off at the door; online payment (later).

### 3.3 Ask to join, private, invite only 🧪
- **What:** some events need the host's yes. Until then the page shows the area ("Diku në Blloku"),
  the day part ("nesër, në mbrëmje") and the programme as offsets, not the exact place or time.
- **Rules:**

  | Visibility + join mode | In the feed | Details visible |
  |---|---|---|
  | public + open | everyone | always |
  | public + ask | everyone | once accepted |
  | private + ask | people with a shared interest, or someone they follow is going | once accepted |
  | private + invite | nobody (link only) | once on it |

  Code: `visibleInFeed`, `canSeeDetails` in `shared/src/access.ts`.
- **What stays hidden (decided 2026-11-23):** the same line for every kind of event: area and part
  of the day show, exact place and time wait for the yes.
- **Who lets people in (decided 2026-11-23): the host picks per event** on the create form (4.1):
  - *Pranoj unë:* the host answers every request.
  - *Me interesa të njëjta hyn vetë:* people who share at least one of the event's tags get in at
    once ("Keni të përbashkët #books: hyn menjëherë."); everyone else waits for the host.
  `acceptMode` on the event, `autoAccepts` in `shared/src/access.ts`. Demo: the book club (e4).
- 🧪 **Simulated:** the host accepts every request after 6 seconds (`DEMO_APPROVE_AFTER_MS`).
- **Backend:** the server strips venue, address, exact time and pin before sending; hosts see
  requests and accept or decline (`POST /v1/rsvps/:id/accept|decline`); the person gets a push.

### 3.4 Plans ("Planet") ✅
- **What:** "Si ishte?" for events you went to in the last week (5.5), your upcoming events,
  waiting requests, saved events, past events. Hosts also see a
  "Si organizator" card with their status (5.3) once they have created something.
- **Code:** `src/app/(tabs)/my-events.tsx`.
- **Backend:** `GET /v1/me/plans`; the reservation QR must open offline.

### 3.5 Like and save ✅
- **What:** a heart (count shown) and a bookmark on cards and pages. Saved events are listed in Plans.
- **Backend:** `likes`, `saves` tables; like counts on events.

---

## 4. Creating events

### 4.1 The create form ✅
- **What:** the "+" in the middle of the tab bar: title, description, photo, place, area, date and
  time, tags, languages, repeat, how people get in (Hyn kushdo / Pranoj unë / Me interesa të
  njëjta hyn vetë, see 3.3), price.
- **Rules:** title 5+ characters; place and area required; not in the past; 1–6 tags (lowercase,
  spaces become dashes); price a whole number of lekë or empty for free.
- **Code:** `src/app/create.tsx`, `features/create/validateDraft.ts`, `makeDraftEvent` in `shared/src/events.ts`.

### 4.2 Review before publishing 🧪
- **What:** a new event is a draft: "E shohim shpejt dhe e publikojmë".
- 🧪 **Simulated:** drafts stay on the phone; nobody reviews them.
- **Backend:** drafts go to the curator queue; publish/reject in an admin page (role-gated);
  creating needs a verified phone and is rate-limited (5.3 spam rules).

### 4.3 Repeating events ✅
- **What:** "Përsëritet?" Vetëm një herë / Çdo javë / Çdo 2 javë / Çdo muaj. Titles get "#1", "#2"…
- **Rules:** the next edition appears the moment the current one starts: same time and place, +1
  week / +2 weeks / +1 month (31 Jan → 28 Feb), nobody going yet, likes carried over. After a long
  gap the numbering catches up.
- **Code:** `shared/src/recurrence.ts`; today derived on the phone in `store.tsx`.
- **Backend:** a job stores each next edition when the latest starts (safe to run twice).
- ⏳ **Not built:** ending a series, editing events.

### 4.4 Cancel an event ⏳
- **Rules (decided, from 5.3):** free more than 72 h before; later cancels with people going lower
  the host's standing; a reason is asked (weather, venue, illness, low signups, other); people going
  are told right away.
- **Backend:** `POST /v1/events/:id/cancel`, notifications, an outcome record.

---

## 5. Hosts and trust

### 5.1 Platform events ("Nga ne") and facilitators ✅
- **What:** events the team runs (stranger dinner, newcomers' coffee, run club), with a named host
  who looks after the details. Shown with a "Nga ne" chip.
- **Data:** `source: 'platform'`, `facilitatorId`.
- ⏳ **Not built:** who can be a facilitator, what they do, how they are rewarded.

### 5.2 Verified organizers ✅
- **What:** a ✓ after the organizer's name. Data: `organizer.verified`. Set by the team.

### 5.3 Host ranking 🧪
- **What:** hosts whose events end empty, or who cancel at the last minute, sink to the end of
  the feed and lose the curated places; reliable hosts rise. Ranking never hides an event.
- **Rules:** each past event is graded −3…+3 (turnout against the event's own size; cancels by how
  late and whether people were going; bad-weather cancels excused; illness/venue once per 60 days);
  old events fade (60-day half-life); tiers Trusted / Normal / New / Limited / Low; at most 1–3
  events per host per section, the rest behind "Edhe N evente nga X"; a friend going overrides.
  Full rules: `shared/src/hostStanding.ts`.
- 🧪 **Simulated:** past outcomes are demo data (`tirana-events/src/data/hostHistory.ts`).
- **Backend:** record an outcome when each event ends or is cancelled; recompute the host's
  standing; the anti-gaming rules (verified accounts count, regulars capped, near-duplicates merged).

### 5.4 Reports ⏳
- **What:** "not as described", "the host didn't show", spam; confirmed by a curator before they count.

### 5.5 Ratings ("Si ishte?") ✅
- **Why:** people who went help the team keep weak events out of the feed (decided 2026-11-23).
- **What:** after an event you went to ends, Plans and the event page ask "Si ishte?": 1–5 stars,
  optional problems (Nuk u bë / Ndryshe nga përshkrimi / Organizatori nuk erdhi / Nuk më dukej e
  sigurt) and an optional note. Sent, it folds to your stars and "Ndrysho".
- **Rules:**
  - only people who were in (going or reserved), only after the end, for 7 days; not your own
    event, not a cancelled one; one rating per person per event, changeable in the week;
  - stars change the host's grade (5.3) once 3+ people rated the event: average ≥ 4.5 → +1,
    < 3.5 → −1, < 2.5 → −2;
  - problems go to the team: always for "Nuk më dukej e sigurt", otherwise once 2 people or a third
    of the raters name the same one. Only confirmed problems count (5.4); nothing is hidden
    automatically;
  - public: the host's average ("★ 4,7 · 40 vlerësime") on the event page from 5 ratings, and only
    when it is 4.0 or more; like the trusted badge, a weak record sinks in the feed instead of
    being shown. Notes are seen only by the team and the host.
- **Code:** `shared/src/ratings.ts` (`canRate`, `makeRating`, `ratingGrade`, `needsReview`),
  `outcomeOf`/`hostStanding` in `shared/src/hostStanding.ts`, `features/rating/RateEvent.tsx`.
- 🧪 **Simulated:** a first run starts as if you went to last night's chess evening (e35), so there
  is something to rate; the seed hosts' past ratings are demo data (`data/hostHistory.ts`).
- **Backend:** `ratings` table (unique user + event), `PUT /v1/events/:id/rating`; the outcomes job
  adds them to standings; problems land in the curator queue.

---

## 6. People and profile

### 6.1 Following ("Miqtë e tu") ✅
- **What:** follow people you know; their plans show on cards and in "Ku po shkojnë miqtë".
- 🧪 **Simulated:** 8 demo people.
- **Backend:** `follows` table; people search or invite.

### 6.2 Profile ✅
- **What:** your name, interests (used for "Mbase të pëlqen" and private events), hidden topics,
  language (Shqip/English), theme (Agimi, Muzgu, Liqeni; all light).
- **Backend:** `users` with `interests[]`, `hidden[]`, `lang`, `city`. Theme stays on the phone.

### 6.3 Accounts ⏳
- **Decided:** guests browse without an account; joining or liking asks to sign in (email link,
  Google, Apple); creating an event also needs a phone verified by SMS. Accounts can be deleted.

### 6.4 Notifications ⏳
- **Decided:** push for: the event you joined is tomorrow / changed / cancelled; your request was
  accepted; someone you follow joined an event (only if their setting in 6.5 lets you see it).
  Each can be turned off.

### 6.5 Who sees where you go ✅
- **What:** a profile setting, "Kush i sheh eventet ku shkon": Askush (no one) / Ata që ndjek
  (people I follow) / Të gjithë (everyone). Starts at **Askush** until you choose. The "Je brenda"
  box on an event you joined says who can see it, with a link to change it.
- **Rules:** counts are never hidden; the event's host always sees who is coming; the setting
  covers every event (not per event). Analytics: `going_visibility_changed`.
- **Backend:** `users.show_going` (default `nobody`); every response that names people going
  applies `canSeeGoing` for the viewer; the "someone you follow joined" push (6.4) only for people
  who let you see it.
---

## 7. Partners and perks 🚩 (recommended off)

- **What:** the "Ofertat" tab: a partner map, offers ("15% off your second coffee after"), and a
  stamp card: check in at 5 different partners → 20% off at any of them.
- 🧪 **Simulated:** 8 made-up partners; check-in is a button (the real one scans a code at the counter).
- **Status note:** still shown in the app, but the board asked to put it behind a flag like the
  other cities until a partner signs and the discount is funded.
- **Code:** `tirana-events/src/data/partners.ts`, `src/app/(tabs)/offers.tsx`.

## 8. Cities 🚩

- **What:** Durrës, Vlorë, Shkodër, Korçë, Sarandë, Berat and Gjirokastër are fully defined (areas,
  maps, events, partners) but switched off: Tirana only. Turning one on (`LIVE_CITIES` in
  `shared/src/cities.ts`) brings back the city picker on its own.

---

## 9. Across the app

| Topic | Rule | Where |
|---|---|---|
| Languages | Albanian first, English second; every string in both, checked by a test | `tirana-events/src/lib/i18n.tsx` |
| Copy | standard Albanian with ë/ç, friendly, gender-neutral, never pressuring | `tirana-events/README.md` (Copy) |
| Dates | Albanian day/month names written by the app (phones often lack them) | `tirana-events/src/lib/format.ts` |
| No layout shift | nothing moves by itself, in any language, theme or state; checked before shipping | `tirana-events/README.md` |
| Accessibility | labels on every control, keyboard focus ring (not on tap), reduced motion respected | components |
| Analytics | events logged locally today, PostHog later | `tirana-events/src/lib/analytics.ts` |
| Offline | everything is on the phone today; with the backend, the last feed and your plans stay readable offline | `tirana-events/src/data/storage.ts` |

**Analytics events sent today:** event_viewed, rsvp_created, rsvp_cancelled, join_requested,
join_request_approved, event_liked, event_saved, comment_created, event_draft_submitted,
create_opened, share_card_created, share_completed, tag_filtered, rail_see_all, today_see_all,
collection_opened, surprise_me, highlight_dot, host_unfold, weather_opened, scroll_to_top,
city_changed, partner_stamp, going_visibility_changed, join_request_auto_accepted, event_rated
(stars and problems, never the note).

---

## 10. What the backend must deliver, by step

| Step | Features | Backend module |
|---|---|---|
| 1. Feed from the API | 1.1–1.11, 2.1–2.4, 2.7, 4.2 (curator publish) | events, hosts, health |
| 2. Accounts and joining | 6.3, 3.1–3.4, 6.4 | users, attendance, notifications |
| 3. Social | 6.1, 6.5, 2.6, 2.5, 3.5, 5.5 | social, comments, users, reputation |
| 4. Hosts | 4.1–4.4, 5.3, 5.4 | events, reputation, moderation, media |
| Later, behind flags | 7, 8, online payments | — |

## Open decisions

None right now. Decided on 2026-11-23:
- who sees where you go: each person chooses, starting at no one (6.5);
- ask to join: the host picks per event (3.3);
- what stays hidden before a yes: the same line for every event (3.3);
- friends are "miqtë" in the copy, not "tajfa";
- ratings: built now (5.5);
- the stamp card: parked with partners (7), decided when real partners sign up.
