# Board brief: Tirana Events App (working name — unnamed)

This brief stands alone. Everything the founders have stated is here; nothing else is known. The founders' material was written in Albanian; this is a faithful English summary.

## The idea

A mobile app (Android + iOS) for creating, discovering and joining local events in Tirana, Albania. The core bet: event creation today is perceived as something for formal organizers with budgets and venues. The app lets any individual or group create an event of any size — a yoga session by the lake for 8 people, a book club, a group walk, a themed meetup — alongside larger community events, concerts, and business events. Users are simultaneously creators, organizers and attendees. The founders frame it as more than an event calendar: a tool for building micro-communities and real social connections in a city whose default social life is cafés.

## The problem as the founders state it

- No centralized source of information on events in Tirana. Event info is fragmented across Instagram, Facebook, assorted websites and word of mouth. Hard for the public to discover events matching their interests; hard for organizers to be seen beyond their narrow networks.
- Limited variety of social activities; café culture dominates. Young people especially struggle to expand their social circle and find people with shared interests.
- No trusted mechanism for evaluating events/organizers before deciding to attend.
- The founders admit their own market research hit walls: structured data on real user behaviour, event frequency and willingness to adopt a new platform was hard to collect; no centralized statistics on the local events market exist, making immediate validation difficult.

## Target users

- Attendees: young people, students, professionals, families, active citizens in Tirana; heavy smartphone and social media users. Also Albanian diaspora visiting home who don't know what's happening in the city, and tourists wanting authentic local experiences.
- Organizers: individuals, informal groups, communities, independent organizers, small businesses and social/cultural spaces (bars, clubs, restaurants) wanting to create and promote events of any scale.
- Expected first users: the most active young people and the most dynamic organizers in the city, who would seed initial content.

## Product (planned, not built)

Core functions: event creation by users; publishing details and categories; search and discovery by interest and location; registration/RSVP; real-time notifications; post-event rating and comment system. Single codebase for Android/iOS (React Native or Flutter under consideration), separate backend (Node.js/Firebase mentioned), cloud infrastructure, geolocation/maps, image uploads, admin panel.

## Current status

Concept and technical-planning stage. No functional product, no MVP, no registered IP (trademark registration for the future name is planned). Idea validated only through informal conversations in Tirana with potential users, organizers, and bar/venue owners — feedback described as generally positive: users confirmed difficulty finding events in one place; organizers want a more structured promotion channel; the rating system was called very useful. After securing financing: MVP in 3–4 months, market-ready product in 5–6 months including testing with real users (beta of 50–100 users mentioned).

## Market as the founders describe it

Tirana: 500,000+ residents, large share young and professionally active; dozens of events weekly (concerts, business, community). Tens of thousands of potential active users and hundreds of event organizers. High smartphone/social-media penetration. Market is fragmented; no single platform covers all events. Main entry barriers acknowledged: building an initial user base and sufficient event content (chicken-and-egg). Growth path: dominate Tirana, then other cities; add ticketing and advanced promotion later.

## Competition as the founders describe it

- Instagram and Facebook: where most events are promoted today. Not event-focused, no structured search/filter/management.
- Local platforms: Kuadr Events, Enter Event, Go Wild — publish events in Tirana but cover only a small percentage of total events; many events never reach them.
- Founders' claimed differentiation: a complete, centralized solution combining ease of creation + discovery + ratings in one place.

## Business model

Freemium. Attendees use the app free. Revenue from organizers/businesses paying for: event promotion, increased visibility, attendance/interest analytics. Secondary: in-app advertising and targeted promotions with local businesses. Later: online ticketing with a commission per transaction. Pricing not set; described as "affordable for the Tirana market". First revenue expected 6–9 months after launch; break-even projected at 12–18 months, requiring ~100–150 active paying clients (organizers and businesses) plus a stable user base.

## Go-to-market

Build an active community in Tirana from day one. Channels: Instagram and TikTok targeted ads, local influencer collaborations, promotion of real events. Early partnerships with 10–15 active organizers (bars, clubs, communities) to seed content, with assisted onboarding. Organic marketing before paid ads. Sales focus: simple, affordable promotion packages for businesses/organizers with measurable results.

## Team

Three co-founders, all working part-time on this while employed full-time elsewhere:
1. Several years in startups and multinationals on projects of various sizes; currently at TeamSystem (Tirana and Milan). Acts as product designer/PM.
2. Software engineer, many years of experience in companies in Albania and abroad; currently at BMAT Music Innovators, Barcelona.
3. Software engineer and product manager formerly at Skyscanner London; currently AI engineer at JP Morgan Chase, London.

## Risks the founders themselves flag (with their own severity ratings)

- Key members (HIGH): losing any of the three part-time members slows MVP; coordination/prioritization risk from everyone having a day job. Mitigations: documentation, coding standards, weekly meetings, backup plans, clear time-commitment agreements.
- Budget (HIGH): cloud, third-party APIs (maps, notifications, payments), initial marketing and partnerships may exceed budget; a 6–9 month revenue gap could create a financial hole. Mitigations: 20% budget reserve, free tiers, organic-first marketing, pre-sale deals with large organizers.
- Timeline (MEDIUM): 3–4 month MVP may slip given real-time notifications, maps, ratings complexity; delay hits seasonal launch and early user acquisition. Mitigations: Agile 2-week sprints, minimal MVP (create/discover/RSVP), ratings deferred to v2.
- Procurement (LOW): dependence on AWS/Google Maps/Firebase/Stripe pricing changes. Mitigations: startup credits, swappable architecture.
- Technology (HIGH): single codebase with real-time notifications, geolocation, image uploads, ratings and scalable backend is complex; critical bugs in creation/RSVP/search would damage early adoption. Mitigations: proven stack, automated testing, beta with 50–100 users, crash reporting.
- Market (HIGH): competition from Kuadr Events, Enter Event, Go Wild and inertia of Instagram/Facebook; chicken-and-egg (events need users, users need events); possible resistance to new platforms. Mitigations: 10–15 early organizer partnerships, assisted onboarding, clear differentiator, early-adopter incentives, aggressive Tirana social campaign.

## What is NOT known (do not invent)

- No budget figure, no funding amount sought, no runway.
- No prices for the organizer packages; no customer-acquisition-cost estimate; no revenue projections beyond the break-even horizon.
- No structured demand validation: no waitlist, no survey data, no pre-sales — only informal positive conversations.
- No chosen name or brand.
- Equity split, legal entity, and who (if anyone) goes full-time: unstated.
