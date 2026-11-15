# Pricing: Tirana events app

One structural note first: this platform does not set ticket prices — organizers do. So the panel's price curve answers a different, equally important question: **which events can this audience afford**, and therefore what volume the commission line can realistically see. The prices this business must actually set are the **commission rate** and the **sponsored-placement price**. Both are set out below as what to test, because (per the rules) 20 simulated answers and zero organizer interviews pick a test, not a price.

## 1. What buyers said (pricing-curve.md, 20 answers, values in Lek)

| point | Lek | meaning |
|---|---:|---|
| PMC | 202 | below this, "too cheap to be good" |
| IPP | 502 | as many call it a bargain as expensive |
| PME | 999 | above this, most won't buy |

**Acceptable ticket range: ~200–1,000 Lek (≈ €2–10), sweet spot ~500 Lek.** The 700 Lek reference ticket sits inside the range but above the indifference point — fine for a known act, heavy for an unknown one. Above ~1,000 Lek this audience drops off fast (medians: "getting expensive" 900, "too expensive" 1,500). This matches the verified market signal (typical local tickets ~€7, EasyPay example 700 Lek) and explains it: €120–330 mega-concert prices are a different market this platform won't ticket anyway.

**Commission math this implies:** at a 500–700 Lek ticket, every 1% of commission is 5–7 Lek (~€0.05–0.07). A 100-ticket event at 700 Lek grosses 70,000 Lek (~€700); at 5% the platform earns ~€35, at 10% ~€70, per event. Commission only matters at volume — dozens of ticketed events a month — which confirms the board's view that **sponsored placement must carry the early revenue**.

## 2. What competitors charge (from competitors.md)

- The organizer-side fees of EasyPay, Enter Events and Myticket are **unpublished — relationship-priced**. No public anchor exists; the stage-3 interviews must extract it ("what did you pay, in Lek or %, for your last ticketed event?").
- The buyer-side anchor is public: EasyPay sold concert tickets at 700 Lek with **no online fee to the buyer**. The pitch already matches this ("organizer's normal price, no extra fee to you") — keep it; the panel's cash-habit objection makes any buyer-side fee fatal.
- Instagram promotion, the substitute for placement, costs an organizer **0 Lek** plus their time. Placement is therefore sold against *results Instagram can't prove*, not against its price.

## 3. What the business needs

`founder/numbers.json` does not exist yet, so no margin or break-even can be computed — the unit-economics check is the next step (`/founder-cfo`), using the structures below as inputs. Per the board (round 4): the commercial layer must show a credible path to one full-time Tirana salary, or Monopoly reverts to PASS.

## 4. The decision (as test structures, each with a falsifying number)

**A. Ticketing commission — test 5% vs 10%, organizer-absorbed.**
- Buyer always pays the door price (keeps the pitch's "no extra fee" promise and the EasyPay parity).
- Offer the first cohort a performance frame per the Offers-lens condition: *"You pay only on tickets we actually sell."* Commission is inherently risk-reversed; say so explicitly.
- Cash-at-door reservations (the panel's #1 payment ask) carry **no commission** — charge nothing for them in v1 and count them as proof-of-delivery data for placement sales instead. Do not monetize reservations before liquidity.

**B. Sponsored placement — sell 10 capped "founding partner" slots by pre-sale, two candidate prices.**
- No data exists to set this price; it must come from the stage-3 pre-sale itself. Structure: max 2 sponsored slots per weekly feed, clearly labeled, right to refuse bad events (the board's feed-integrity rule).
- Test two price points in real negotiations, one modest and one ambitious, both anchored to the organizer's own stated Instagram spend from the interviews — and a performance guarantee the Offers lens demanded: *"X verified attendees/clicks or the month is free."* The interviews (15–20 mid-tier organizers) set X and the two prices; do not fix them on paper before that.
- Falsifier: if fewer than the pre-declared stage-3 minimum sign at the modest price, the placement line fails and the board's stop rule applies.

**C. Ticket-price guidance to organizers (a product feature, not a fee):** surface to listing organizers that this audience's sweet spot is ~500 Lek and resistance starts at ~1,000 — the data itself is a seed of the future "analytics" product.

## 5. The opening offer (no discount-training)

- **Founding Partner package, capped at 10, ends at app launch:** placement + commission bundled, at the tested price, with the performance guarantee and their logo as a launch partner. Scarcity is real (10 slots, one feed), the deadline is real (launch), and no price is cut — value is added instead (guarantee + founding status).
- Never a "free placement period": it trains the market that placement is worth 0, in a city where the substitute already costs 0.

## 6. What to test with real buyers

1. **Commission A/B in the stage-3 pre-sale:** offer 5% to half the interviewed organizers, 10% to the other half, same guarantee. Measure signatures, not opinions.
2. **Placement price discovery:** the two candidate prices from the interviews, sold as the capped founding slots. A signed rate card is the data.
3. **Ticket-price sensitivity on the buyer side, free:** when the curated feed runs (stage 1), post two otherwise-similar ticketed events at ~500 and ~900 Lek and compare click-through/reservations — a live Van Westendorp on real Tirana users at zero cost.

## 7. The panel's price objections, verbatim (for marketing)

1. "700 Lek is my coffee money for a week, so the paid part of this app is not for me." (P016)
2. "Buying a 700 Lek concert ticket through an app is not something I do — that is real money for me and I pay cash when I pay at all." (P020)
3. "Let me reserve in the app and pay cash at the entrance, or pay with Easypay or at a kiosk — the first time has to not need a card." (P005)

The answer to all three is the same product decision: **reserve in-app, pay cash at the door, EasyPay as a payment option** — not a lower price. The panel's resistance was to the payment rail, not the price level; 700 Lek sat inside the acceptable range.

---
Next: `/founder-cfo` needs `founder/numbers.json` — realistic volumes for commission (events/month × tickets × rate) and placement (slots × price), plus the cost side (cloud, the full-time Tirana salary the board requires, marketing). The honest version of that file can only be filled after the stage-3 interviews put real Lek numbers in the blanks above.
