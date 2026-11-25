# Roadmap

What is built and what is next. The full list of features with their rules and status is in
[../docs/FEATURES.md](../docs/FEATURES.md); this file is the short version plus the ideas not
yet decided. "Built" means it works locally with demo data; anything that needs real people
(hosts answering, partners scanning) is simulated and marked as such in the code.

## Built (first pass)

- **Look:** morning/sunset/lake light themes, Bricolage + Caveat, handwritten stickers, the
  home sky that warms as today's events get later.
- **Navigation:** tab bar Tirana · Harta · + · Planet · Profili, create in the centre; weather top left.
- **Weather:** temperature chip, tap for today (hours, rain chance, sunrise/sunset, one tip).
  Open-Meteo, free, sends only the city's centre coordinates.
- **Feed:** the filter bar sits right under the greeting and sticks while you scroll: three
  buttons (Kur, zone, Filtra) that open bottom sheets, and the categories as one swipeable row. With no
  filter: a featured row, today as a timeline, "Mbase te pelqen" (from the interests you
  picked), one carousel per category, then the week. With any filter on, the rows step aside
  and only the matching list shows, today included.
- **Public / private / ask to join:** ask-to-join events hide their exact place and time (and
  map pin) until you are accepted; private ones only reach feeds with shared interests or a
  followed person going; invite-only never shows in feeds. Hosts answer after 6 s in the demo.
- **"Mos me trego" (hidden topics):** in the profile, or from any event page ("Mos me trego
  evente si ky"), pick topics you never want (e.g. #chess). Those events leave the feed, rows,
  map, dice and "similar"; anything you joined or asked to join stays. The feed ends with
  "N evente te fshehura… Ndrysho" so nothing disappears silently. A topic is liked or hidden, never both.
- **Event page, route-app style (after Komoot's tour page):** a trust line under the title
  (category, "Per fillestare", like/save), a stats card with big numbers (how long, entry, spots
  or turnout, languages), the forecast for the event's hour when it is within ~12 h, and
  "Programi" as waypoints A → 1 → 2 → B (offsets like "+45m" while ask-to-join details are hidden).
- **Koleksione:** curated lists with a cover and a point of view ("Sapo erdhe ne Tirane", "Vjen
  vetem? S'ka gje", "Jashte, ne ajer te paster", "Fundjave pa para", "Nata e gjate"), filled by a
  rule, shown once they hold 3+ events, each with its own cover.
- **Like, save, join;** saved and pending events listed under Plans.
- **Spoken languages (for visitors):** each event can say which languages work there (Albanian,
  English, Italian, Spanish; missing = Albanian only). Shown as EN/IT/ES on cards and a
  "Gjuha" row on the event page; a filter chip per language that has events; a row per
  language with 3+ events ("English-friendly", "Si parla italiano", "Se habla español"), with
  the English row first when the app is in English. Hosts pick languages when creating.
- **Hashtags:** "Similar vibes" on each event, by shared tags; tapping a tag filters the feed.
- **Platform events with a host (facilitator)** shown on the event page.
- **Partners and offers:** an event can carry one partner offer for everyone who comes; Perks
  tab with partner map, offers and a 5-partner stamp card → 20% (check-in is a demo button;
  real version scans a code at the counter).
- **Highlights and today's favourites:** "Mos i humb" (swipeable on phones, a grid on wide
  screens) and today's timeline capped at 5, picking the day's favourites with a link to all.
- **Repeating events:** weekly, every 2 weeks or monthly; numbered "#1, #2…"; the next edition
  appears when the current one starts.
- **Host ranking:** hosts whose events end empty or who cancel late sink to the end of the feed
  and leave the highlights; reliable hosts get a "trusted" badge. Past outcomes are demo data.
- **Ask to join, per event:** the host picks "Pranoj unë" or "Me interesa të njëjta hyn vetë"
  (people with a shared interest get in at once).
- **Who sees where you go:** each person's choice in the profile, starting at no one.
- **Ratings ("Si ishte?"):** stars and problems after an event you went to; they move the host's
  ranking and send problems to the team; a good host average shows on the event page.
- **Copy:** standard Albanian with ë/ç, "miqtë" for friends (decided 2026-11-23); dates in Albanian; copy rules in the README.
- **Backend started:** `../backend` (NestJS, PostgreSQL) and `../shared` (rules used by app and server).

## Next

0. **Other cities (built, switched off).** Durrës, Vlorë, Shkodër, Korçë, Sarandë, Berat and Gjirokastër are
   fully defined but hidden: Tirana only until it works (board round 5). Switch one on in `LIVE_CITIES`.

1. **Facilitator program.** Rules for who can host, what they do (book the table, welcome
   people, nudge latecomers), and the profile bonus. Needs a backend and a decision on rewards.
2. **Engagement score.** The host side is built (host ranking, from turnout, cancellations and
   ratings). Still to come: real check-ins at the door, so the score uses who actually showed up,
   not only who said they would.
3. **System-created events and pairing.** Generate events from clusters of interests per area
   and time; pair newcomers with friendly regulars and people who have never met. Start
   rule-based (shared tags, new in the last 30 days, high engagement) before any ML.
4. **Event profiles by type.** Running: route map drawn from a GPX/route (Strava-like).
   Book club: covers of the books read, also shown on profiles; fetch covers from Open Library
   by ISBN first, AI only for the gaps.
5. **Share to Instagram Story.** Native share of a rendered story card (sticker style) via
   `react-native-share`/Instagram's story intent; web falls back to downloading the image.
6. **"Sapo erdha" mode (newcomers / short stays).** Research first: interview 5–8 people new
   to Tirana (students, remote workers, visitors staying 1–4 weeks). Likely shape: a toggle
   in profile, English-friendly (built: the languages filter and rows) and newcomer events first, and a weekly "newcomers' coffee"
   run by a host (a seed version exists: e31).
7. **Own events by engagement.** Your created events sorted by how they did, once there is data.
8. **Hotspots map.** Heat layer of where things are happening tonight.
9. **Ticket sales.** After hosts and partners are working.

10. **Komoot ideas that need real users first.**
    - *Venue Highlights:* places people recommend, with short tips ("eja 10 min me heret") and a
      "recommended by 92% of N who went" score, collected after an event ("Si ishte? Ta rekomandosh?").
    - *Photos from who went:* the event page fills with attendees' photos, like a route's photo count.
    - *Collections by people,* not only by the team ("Te dielat e Elises").
    - *A local "Pioneer":* the person whose tips get the most upvotes in an area/category.

## Open questions for the team

All the earlier ones were decided on 2026-11-23 (see the end of `../docs/FEATURES.md`). The stamp
card's rules wait for real partners. Still worth a quick check with a few users: the hero line
"Ku dalim sonte?" (2026-11-21) and "miqtë" in place of "tajfa".
