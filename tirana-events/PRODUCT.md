# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Primary: young people in Tirana (students and young professionals) on their phone, deciding where to
go tonight or this week, often with friends. Future screens are judged by this person first.

Also served, never ahead of the primary user:
- returning diaspora and visitors, who use the English option and the language rows;
- community hosts (yoga by the lake, chess, book clubs, group hikes), who create events and accept
  requests;
- the curator team, who review drafts, publish, and handle reports and ratings.

## Product Purpose

A mobile app for finding, joining and creating local events in Tirana. Success right now is the
board's real-world test: people come back in their second week (week-2 retention is the gate
metric), and hosts see real people join.

## Positioning

- **Small events are free forever.** Community events never pay and carry no commission. Only big
  commercial events (concerts, festivals, parties, business events) will pay, through ticketing
  commission or sponsored placement, to reach the audience the free side built.
- **A complete, curated week.** Everything worth doing in Tirana this week sits in one feed, and the
  team reviews every event before it is published.

## Operating Context

- Opened on the phone, often in the evening or on the move, in Albanian or English.
- Joining is one tap for open events; ask-to-join events show the area and part of the day until the
  host says yes. A reservation QR has to open at the door without signal.
- Hosts create events from the same app; drafts go to the curator queue before they appear.
- People who went rate an event within 7 days; problems go to the team, not to the public.
- Feature-by-feature rules: `../docs/FEATURES.md`. Business plan and board conditions: `../founder/`.

## Capabilities and Constraints

- One Expo codebase for iOS, Android and web. iOS and Android are the product; web is for
  development and shared links. One custom look on every OS: per-OS adaptation is limited to system
  behaviour (text scaling, safe areas, the back gesture, haptics, date and time pickers), never a
  change of visual language.
- Only Tirana is live; other cities stay in the code, switched off.
- Prototype on demo data, stored on the phone. A NestJS + PostgreSQL backend (`../backend`) is
  replacing the phone store step by step.
- Partner offers and the stamp card are parked until real partners sign up.
- Undecided: the product name (working name only), ticket commission rate, sponsored placement price.

## Brand Commitments

- No final name yet; "Tirana Events" is a working name.
- Voice: standard Albanian as written in Tirana (always ë and ç, no Gheg forms), friendly and casual;
  English as the second language. Gender-neutral by default ("miqtë", "njerëz").
- Warm, never creepy: the app never claims to know you and says plainly why something is shown.
- No pressure: no streaks, guilt or fake countdowns; "can't make it" is always one tap.
- Buttons name the action and the result repeats the same words.
- Full copy rules: `README.md`, "Copy is a core value".

## Evidence on Hand

- Demo events, people, hosts and partners in `src/data/seed.ts`; event photos credited on the event
  page (Wikimedia Commons and similar).
- No real users, hosts, partners, interviews, testimonials, ratings or press yet. Do not invent any,
  and do not present demo numbers (people going, ratings) as real.

## Product Principles

1. The person deciding tonight comes first: the next good thing to do should be findable in seconds.
2. Free stays free: nothing pushes community hosts or attendees toward paying.
3. Trust is earned quietly: weak hosts sink in ranking and the team reviews problems; nobody is
   publicly shamed or hidden automatically.
4. Each person chooses what others see about them (who sees where you go starts at "nobody").
5. Nothing moves on its own: no layout shift in any language, theme or state.

## Accessibility & Inclusion

- Zero layout shift, checked at 375 and 320 px in both languages before shipping.
- Touch targets at least 44 px; focus rings shown for keyboard use; reduced motion respected.
- Text scales with the system setting (capped per element where layout needs it).
- No words cut with "…" in controls; text that changes sits in boxes sized for the longest language.
- Copy assumes nothing about gender, drinking, couples, religion, body, money or origin.
