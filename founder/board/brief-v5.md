# Board brief (v5): Tirana Events — a working prototype, a wider product, and new revenue ideas

This brief stands alone. Everything known is here; nothing else may be assumed. Round 4 (v4 brief) ended
unanimous FUND IF, average 4.3/10: "the community product is believed; the business attached to it is not yet."
New in v5: a working prototype app now exists, the product scope has grown (multi-city, private/ask-to-join
events, platform-run events with hosts, partner offers), and new revenue ideas appeared (partner offers and a
stamp card). No new market evidence has been gathered since round 4.

## The idea (unchanged core)

A mobile app for discovering, creating and joining local events, Tirana first, now also 7 other Albanian
cities (Durrës, Vlorë, Shkodër, Korçë, Sarandë, Berat, Gjirokastër). One audience, two tiers:

- **Free community layer (free forever):** small community events — runs by the lake, book circles, board
  games, dinners with strangers, hikes. Anyone can create and join; no fees, no commission.
- **Commercial revenue layer:** big events pay to reach that audience via (1) ticketing commission (test 5% vs
  10%, organizer-absorbed, buyer pays door price, from founder/pricing.md) and (2) sponsored placement (max 2
  labeled slots per city feed; price to be discovered in a capped "10 founding partners" pre-sale).

## What changed since round 4

### 1. A prototype was built (before the board's conditions were met)

Round 4's conditions included "one named founder full-time in Tirana before stage 2 / before any code" and
"no organizer-facing build or commission plumbing before week-two retention is proven." Since then the team
built a cross-platform app (Expo/React Native: web, iOS, Android), published as a web demo on GitHub Pages.
It runs entirely on the device with seeded demo data (≈34 events, 8 demo people, 8 made-up partner businesses);
there is no backend, no real users, no real organizers, no real partners, no revenue. Building it cost founder
hours only. Engineering quality is high (typed, ~130 automated tests, versioned storage, tidy architecture).

Not reported by the founders (treat as NOT done): whether the stage-1 curated Instagram/WhatsApp feed ran, any
follower or attendance numbers, any organizer interviews, any signed commercial terms, any full-time decision.

### 2. What the prototype does

- Feed for your city: "Don't miss" highlights, today as a timeline from earliest to latest (background colour
  warms as events get later), "might be your thing" (from interests you pick), one carousel per category,
  then the filterable week. Dice button picks a random event. Weather for the day in the corner.
- Social: "your crew" (people you follow) and where they are going; likes, saves, comments, share.
- Join: free events one tap; ticketed events reserve in-app and pay cash at the door with a QR code.
- **Public vs private, and "ask to join":** some events require the host to accept you; until then the exact
  place, time and map pin are hidden (area and part of day shown). Private events only appear to people with
  shared interests or friends going; invite-only events never appear in feeds. (Host acceptance is simulated.)
- **Platform-run events with a "host" (facilitator):** the app itself sets up events (run club, dinner with 6
  strangers, newcomers' coffee, book circle) and a host handles the small things on the day.
- **Partners and offers (new revenue idea):** local businesses (bookshop, restaurant, café, running shop, bar,
  pottery studio) attach an offer to events, e.g. "5% off dinner for the whole table", "10% off the book club
  pick". A "Perks" tab shows a partner map and a stamp card: check in at 5 different partners, get 20% off.
  No partner has been approached; who pays for the discount and what partners pay the platform is undecided.
- Look and copy: light "morning/sunset" themes, handwritten sticker accents, casual Albanian-first copy with a
  written rule set (correct, inclusive/gender-neutral, never creepy, no pressure).

### 3. Roadmap the team wants next (none built)

Facilitator program with profile rewards; post-event "engagement score" that boosts good hosts in the feed;
system-generated events from interest clusters and automatic pairing of newcomers with engaged regulars; event
"profiles" by type (run route maps, book-club covers fetched/AI-assisted); Instagram Story sharing; a
"newcomer / short stay" mode (research first); hotspots map; ticket sales.

### 4. Open product questions the team itself lists

Who accepts ask-to-join requests (host only, or auto-accept on interest match); what details stay hidden per
event type; how the stamp card is funded (one stamp per partner per day vs per event visit; who pays the 20%);
whether "tajfa" (Albanian slang for "crew") reads well as the word for friends; whether the hero line
"Ke nai mendje tkeqe per sonte ëë?" ("Got any bad ideas for tonight?") could read as "bad intentions".

## Verified market evidence (unchanged from round 4; sources in founder/competitors.md, 2026-11-12)

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

Three co-founders, all part-time alongside full-time jobs: product/PM (TeamSystem, Tirana/Milan — the only
one regularly in Tirana), software engineer (BMAT, Barcelona), software engineer/PM (JP Morgan, London).
Full-time commitment: still undecided as far as reported.

## What is NOT known (do not invent)

- Any real usage: stage-1 feed results, followers, attendee conversion, week-two retention.
- Promoter promotion spend, organizer fees, willingness to pay for placement or commission.
- Whether any business would join as a partner, what it would pay, and who funds discounts.
- Whether strangers will actually show up to platform-run "dinner with strangers"/run-club events, and the
  cost/supply of reliable hosts (paid? volunteer? rewarded how?).
- Safety/trust handling for meeting strangers (moderation, reporting, no-shows) — not designed yet.
- Demand in the 7 other cities (no research done there).
- CAC, budget, runway, unit economics. No name or brand chosen (app currently "Tirana Events").
