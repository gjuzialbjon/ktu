# Roadmap

What the product brief asked for, what is built, and what is next. "Built" means it works
locally with demo data; anything that needs real people (hosts answering, partners scanning)
is simulated and marked as such in the code.

## Built (first pass)

- **Look:** morning/sunset/lake light themes, Bricolage + Caveat, handwritten stickers, the
  home sky that warms as today's events get later.
- **Navigation:** create button in the centre of the tab bar; profile top right; weather top left.
- **Weather:** temperature chip, tap for today (hours, rain chance, sunrise/sunset, one tip).
  Open-Meteo, free, sends only the city's centre coordinates.
- **Feed:** today as a timeline from earliest to latest, "Ku po shkon tajfa", "Mbase te pelqen"
  (from the interests you picked), one carousel per category, then the filterable week.
- **Public / private / ask to join:** ask-to-join events hide their exact place and time (and
  map pin) until you are accepted; private ones only reach feeds with shared interests or a
  followed person going; invite-only never shows in feeds. Hosts answer after ~6 s in the demo.
- **Like, save, join;** saved and pending events listed under Plans.
- **Hashtags:** "Similar vibes" on each event, by shared tags; tapping a tag filters the feed.
- **Platform events with a host (facilitator)** shown on the event page.
- **Partners and offers:** an event can carry one partner offer for everyone who comes; Perks
  tab with partner map, offers and a 5-partner stamp card → 20% (check-in is a demo button;
  real version scans a code at the counter).
- **Copy:** "tajfa" for friends throughout; copy rules in the README.

## Next

1. **Facilitator program.** Rules for who can host, what they do (book the table, welcome
   people, nudge latecomers), and the profile bonus. Needs a backend and a decision on rewards.
2. **Engagement score.** After an event: who showed up, a one-tap "how was it?", comments,
   repeat joins. Score boosts the host's next events in the feed. Needs real attendance data
   (check-in QR at the door already exists for ticketed events).
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
   in profile, English-friendly and newcomer events first, and a weekly "newcomers' coffee"
   run by a host (a seed version exists: e31).
7. **Own events by engagement.** Your created events sorted by how they did, once there is data.
8. **Hotspots map.** Heat layer of where things are happening tonight.
9. **Ticket sales.** After hosts and partners are working.

## Open questions for the team

- **Private events:** is "ask to join" decided by the host only, or can the system auto-accept
  people whose interests match? (Demo: host decides, simulated.)
- **What stays hidden** before acceptance: we hide exact place and time, show the area, day
  part, who is going and the description. Is that the right line for every type (a dinner vs a run)?
- **Stamp card:** one stamp per partner per day, or per visit tied to an event? Who pays the 20%?
- **"Tajfa":** the team should confirm it reads as warm and neutral across regions and ages
  (alternatives: "shoqnia", "ekipi").
- **Hero line** "Ke nai mendje tkeqe per sonte ëë?": playful, but "mendje te keqe" can read as
  "bad intentions" to some. Worth a quick check with a few users against the copy rules.
