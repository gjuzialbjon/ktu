# Board brief (v6): Tirana Events — the prototype narrowed to Tirana and deepened

This brief stands alone. Everything known is here; nothing else may be assumed. Round 5 (v5 brief) ended
unanimous FUND IF, average 3.7/10, down from 4.3: "the craft got better and the focus got worse"; "a demo is not
evidence". Since round 5 the founders kept working on the prototype app only. No market evidence, interviews,
partner conversations, hosts, pricing or full-time decision have been reported. Treat every one of those as NOT
done.

## The idea (unchanged core)

A mobile app for discovering, creating and joining local events in Tirana. One audience, two tiers:

- **Free community layer (free forever):** small community events: runs by the lake, book circles, board
  games, dinners with strangers, hikes. Anyone can create and join; no fees, no commission.
- **Commercial revenue layer:** big events pay to reach that audience via (1) ticketing commission (test 5% vs
  10%, organizer-absorbed, buyer pays door price) and (2) sponsored placement (max 2 labeled slots per city
  feed; price to be discovered in a capped "10 founding partners" pre-sale). A third idea from v5, partner
  offers with a stamp card, is still in the app (see below); its pricing and funding are still undecided.

## Round 5's conditions and what happened to each

| Round 5 condition | Status reported |
|---|---|
| One named founder full-time in Tirana by a dated deadline | Not reported. Still three part-time co-founders. |
| Run the stage-1 experience test with targets written in advance | Not reported. |
| 15–20 promoter/venue interviews | Not reported. |
| One revenue line priced and signed before backend/payments | Not reported. No backend or payments were built either. |
| Freeze scope to Tirana; move cities, Perks/stamp card and roadmap behind a gate | **Partly.** The 7 other cities are switched off in the app (code kept behind a one-line "live cities" flag; only Tirana is live). The Perks tab with partner offers and the stamp card is **still shipped**. No roadmap item (engagement score, auto-generated events, AI profiles) was built. |
| Own the offline moment before platform-run events go live (named hosts, cost per host, minimum attendance, no-show policy, safety/reporting, host vetting) | Not done. The app now **displays** a step-by-step evening plan for hosted events (see below), but no host is named, recruited or paid, and no safety, reporting or no-show rule exists. No platform-run event has gone live. |
| 10+ partner interviews before partner features | Not reported. |
| A guarantee per paying buyer type | Not reported. |
| Check "tajfa" and the hero line with real Albanian speakers | Not reported. |

## What the prototype gained since round 5 (all demo data, no backend, no real users)

The app is still a cross-platform prototype (Expo/React Native: web, iOS, Android) running on the device with
seeded demo data (~34 events, 8 demo people, 8 made-up partners), published as a web demo. Engineering quality
remains high: typed code, ~155 automated tests, a written "no layout shift" standard checked on every screen.
Changes:

1. **Tirana only.** Other cities hidden; city picker hidden.
2. **Home screen made denser and easier to scan:** a featured swipeable "Don't miss" card, today as a compact
   timeline, small-card rows (for-you, one per category, "see all" per row), about 4 events visible on the first
   phone screen instead of ~1.75.
3. **Filters reworked:** a sticky bar under the greeting with three buttons (When, Where, Filters) that open
   bottom sheets, plus a swipeable category row; picked filters show as removable chips. With any filter on,
   the browsing rows step aside and only matching events show.
4. **Languages for visitors (tourists/newcomers):** each event can list the languages that work there
   (Albanian, English, Italian, Spanish). Shown as EN/IT/ES tags on cards and a "Language" line on the event
   page; a language filter; rows such as "English-friendly" / "Si parla italiano" once 3+ events qualify;
   hosts tick languages when creating an event. In the demo, ~17 of the Tirana events are marked English-friendly
   (set by the founders, not by real hosts).
5. **"Never show me" topics:** in the profile, or from any event page, a user can hide topics (e.g. #chess);
   those events leave the feed, map and suggestions; anything already joined stays; the feed says how many are
   hidden.
6. **Event page rebuilt, inspired by the outdoor route app Komoot:** a trust line (category, "beginner-friendly"),
   a stats card (duration, entry price, spots left or turnout, languages), the weather forecast for the event's
   start hour when it is within ~12 hours, and a "Programme" shown as waypoints A → 1 → 2 → B (e.g. meet at the
   door → seated by lottery → three-course dinner → dessert and optional drinks). While an ask-to-join event's
   details are hidden, the programme shows offsets ("+45m") instead of clock times.
7. **Collections:** curated lists on home with a cover photo and a point of view, filled automatically by a
   rule: "New in Tirana", "Coming alone? That's fine", "Out in the fresh air", "A weekend for free", "The long
   night". Each shows only when it holds 3+ events and opens its own page.

Still present from v5: private and ask-to-join events (details hidden until a host accepts; acceptance is
simulated), platform-run events with a named demo "host", likes/saves/comments, "your crew", reserve-and-pay-
cash-at-the-door with a QR code, the Perks tab (partner map, offers, 5-partner stamp card → 20% off, check-in is
a demo button).

Ideas parked in the roadmap, not built: venue "highlights" with community tips and a "recommended by X% of N who
went" score; attendee photos on event pages; user-made collections; a local "top contributor" title.

## Verified market evidence (unchanged since round 4; sources in founder/competitors.md, 2026-11-12)

- The discovery slot is nearly empty: no general-discovery platform ever tried and failed in Tirana. Kuadr
  (production house), Enter Events (club-scene promoter/ticketing) and Go Wild (nightlife listings) sit in the
  commercial/nightlife slice. Even8 (even8.app) is live but thin (~37 events, "29+ community members"). Also:
  a polluted AllEvents.in aggregator page, a reportedly dead government tourism-events app, thin Eventbrite.
  The free community layer is served by nobody; small events spread via WhatsApp groups and Instagram.
- Revenue layer: EasyPay leads online ticket sales with a nationwide cash-agent network; big festivals and
  promoters ticket in-house; nobody publishes organizer fees. Only 8.6% of people in Albania bought event
  tickets online in the 3 months before the 2025 Eurostat survey. Typical local ticket ≈ 700 Lek (≈ €7).
- Simulated buyer panel (founder/pricing.md, 20 synthetic answers, not real buyers): acceptable ticket range
  ~200–1,000 Lek, sweet spot ~500 Lek; at 700 Lek every 1% commission ≈ €0.07 per ticket, so placement must
  carry early revenue. Panel's #1 condition to attend: seeing people they know going.

## Team

Three co-founders, all part-time alongside full-time jobs: product/PM (TeamSystem, Tirana/Milan; the only one
regularly in Tirana), software engineer (BMAT, Barcelona), software engineer/PM (JP Morgan, London). Full-time
commitment: still undecided as far as reported.

## What is NOT known (do not invent)

- Any real usage: stage-1 feed results, followers, attendee conversion, week-two return rate.
- Promoter promotion spend, organizer fees, willingness to pay for placement or commission.
- Whether any business would join as a partner, what it would pay, and who funds discounts.
- Whether strangers will show up to platform-run events, and the cost/supply of reliable hosts.
- Safety/trust handling for meeting strangers (moderation, reporting, no-shows, host vetting).
- Whether visitors (tourists, newcomers) would find or use the app, and how many events in Tirana really run in
  English, Italian or Spanish.
- CAC, budget, runway, unit economics. No name or brand chosen (app currently "Tirana Events").

## Board history

R1 3.7 → R2 4.3 → R3 4.3 → R4 4.3 → R5 3.7 (all FUND IF from round 3 on; Monopoly PASS in R1–R2). Round 5's
chair: "The board does not doubt the team can build. It doubts the team will go out and test… What is missing is
not software. It is a founder in Tirana doing it."
