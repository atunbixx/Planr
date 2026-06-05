---
title: Planr — Wedding-App Market Research & Competitive Comparison
date: 2026-06-06
type: research
---

# Planr vs the market — what makes the leaders shine, and how we match or beat them

Research across the leading consumer apps (Zola, The Knot, WeddingWire, Joy/withjoy, Bridebook,
Hitched, Appy Couple, Say I Do), the pro/seating tools (Prismm/AllSeated, Aisle Planner, Social
Tables, PerfectTablePlan), vendor tooling, i18n best practice, and the Etsy go-to-market.

## 1. The headline strategic finding (Etsy)

**You cannot sell Planr *app access* on Etsy.** Etsy's policy (tightened June 2025, in force to Aug 2026)
explicitly prohibits selling "access codes or licenses", "access to software or app membership
subscriptions", and taking transactions off-platform. Selling an invite/coupon/license to a hosted SaaS
is enumerated as prohibited — account-suspension risk, no compliant workaround.

**What works instead:**
- **Etsy as a funnel, not a checkout.** Sell genuine standalone digital products (a Google-Sheets/PDF
  wedding planner — the £8–£15 band is the sweet spot; top listings do thousands/month) and convert those
  buyers to Planr via post-purchase messaging + a redemption code in the download.
- **Sell real access via Gumroad or Lemon Squeezy** (both explicitly allow SaaS/license sales and handle
  EU VAT) — pair with a redemption-code flow that reuses our existing entitlement engine.
- Either way, build the **redemption-code → entitlement** flow (design in §5). It's small and reuses what we have.

## 2. Competitive comparison table

Legend: ✅ have · ⚠️ partial · ❌ missing · ⭐ our edge. "Gap" = table-stakes (TS) or differentiator (D).

| Capability | Leaders | Planr today | Gap |
|---|---|---|---|
| Command-center dashboard (countdown, live progress) | The Knot (2025 relaunch), most | ⚠️ building now | TS |
| Personalised hero / greeting ("Sophie & James · 102 days") | Joy, The Knot | ⚠️ building now | TS |
| Event **website builder** (themed public site: story/schedule/travel/registry, custom domain) | All | ❌ (only a tokenised RSVP page) | **TS — biggest gap** |
| Guest list + RSVP | All | ✅ + ⭐ tokenised RSVP, **no guest login** | — |
| Per-guest personalised event view (sees only their events/schedule) | Joy, Say I Do, Appy Couple | ⚠️ token is per-guest; no per-event scoping yet | D |
| **Visual seating** (drag-drop floor plan, table shapes, meal-per-seat) | WeddingWire, Hitched, Zola, Say I Do, Aisle Planner | ❌ list-only (Level 0 of 4) | **TS** |
| **Date-driven checklist** (auto-generate ~80–120 tasks from the date) | Zola (top-rated feature), The Knot, Hitched | ⚠️ manual tasks w/ due dates exist | **TS — low effort** |
| Budget | All | ✅ (estimated vs paid) but **GBP-hardcoded** | TS (currency) |
| **Vendor** discovery / tracker / comparison | The Knot, WeddingWire, Bridebook, Zola (marketplaces) | ❌ none | TS (a *tracker*, not a marketplace) |
| Registry / gift list (incl. cash funds) | Zola, The Knot, Joy, Hitched | ❌ none | TS for weddings (a link list is fine v1) |
| Photo sharing + **live reception slideshow** | Joy, Appy Couple | ❌ none | D ("wow") |
| Messaging / announcements to guests | Joy, Appy Couple | ✅ host announcements on RSVP page | — |
| **AI** (thank-you writer, checklist gen, vendor match) | The Knot, Zola | ❌ none | D ("wow", low effort) |
| **Multi-currency** | All (or localised) | ❌ GBP only | **TS** |
| **Multi-language** | Say I Do (13), That's The One (7), Joy bilingual | ❌ English only | D (TS for Etsy-international) |
| Mobile app | All | ❌ responsive web only | TS (PWA first) |
| Multi-**event-type** (birthday/funeral/corporate) | ❌ none | ✅ registry-driven | ⭐ **unique** |
| Multi-tenant **workspaces + roles** (agencies/planners) | ❌ none cleanly | ✅ orgs + RBAC + invites | ⭐ **unique** |

**Where we already win:** non-wedding event types, true multi-tenant workspaces with roles, and a
guest RSVP that needs no login. No major competitor does these cleanly. **Where we look basic:** no
dashboard/countdown (fixing now), list-only seating, no website builder, no auto-checklist, GBP-only.

## 3. What makes the leaders "shine" (ranked)

1. A cohesive **dashboard/command-center** — countdown + progress in one screen (daily-habit driver).
2. **Event website** with guest-personalised views, no login.
3. **Live photo slideshow** at the reception (Joy's signature "wow").
4. **Visual drag-drop seating** synced to the guest list.
5. Registry with universal "add from any store" + zero-fee cash funds.
6. **AI**: thank-you writer, vendor match, checklist generation.
7. **Date-driven checklist** ("what do I do next?" — Zola's #1 praised feature).
8. Vendor marketplace / reviewed suppliers (their *business model*).
9. Address-collector magic link; hotel room blocks; day-of itinerary.
10. Multi-language (unlocks multicultural/international couples).

## 4. Recommended roadmap to match-or-beat (impact ÷ effort)

1. **Event dashboard + countdown + live stat cards** — *in progress*. Kills the "looks basic" perception. (We already compute every summary.)
2. **Multi-currency + i18n-proofing** — per-workspace currency setting replacing hardcoded GBP (low effort, high signal for Etsy/international); scaffold `next-intl` + centralise strings now, translate later. Settings page + `user_preferences`/workspace currency.
3. **Date-driven checklist generator** — auto-populate a wedding timeline from the event date; builds directly on our Tasks module. High impact, low–medium effort.
4. **Visual seating chart** — canvas (Konva/SVG): table shapes, drag from unseated pool, **meal-per-seat** colour coding (still missing from Zola/The Knot — a chance to *beat*), PDF export. Turns our weakest module into parity+.
5. **Event website builder** — themed public site (story/schedule/travel/registry) with the tokenised RSVP as the seed; custom subdomain. Biggest table-stakes gap; drives viral guest discovery. (Largest effort — phase it.)
6. **Vendor tracker + comparison table** — couple-facing CRM (category rows × candidate columns; price/status/deposit), links into Budget. Not a marketplace. (Data model in the research.)
7. **Photo sharing + live slideshow** — Supabase Storage; guest upload via the RSVP token; fullscreen slideshow URL. Differentiator/"wow".
8. **AI thank-you writer + checklist generator** — small LLM calls once the above exist; press-friendly wow.
9. **Registry v1** — curated link list + cash-fund link (full registry later).
10. **PWA / mobile polish** — installable responsive PWA before any native app.

## 5. Redemption-code flow (reuses our entitlement engine)

Sell a code (via Etsy download or Gumroad/LS) → buyer enters it in-app → grants a plan's entitlements
via the existing `applyPlanPurchase`, bypassing Stripe (fits the free-launch posture).

- Tables: `redemption_code_batches(plan_id, max_uses, expires_at)`, `redemption_codes(code unique, uses, max_uses)`, `redemption_events(code_id, organizationId, redeemed_by)`.
- tRPC `redeemCode({ code })`: locked txn → validate (exists/expiry/uses, not already redeemed by this org) → increment → `applyPlanPurchase` → log.
- Code format `PLANR-XXXXXXXX` from an unambiguous alphabet (no I/O/0/1).

## 6. Settings & i18n approach (for the stack we have)

- **Library:** `next-intl` (App-Router native; `[locale]` segment; server+client formatters). Messages in `messages/<locale>.json`.
- **Currency is decoupled from locale** (a UK couple may budget in EUR for a destination wedding). Store `currency` (ISO 4217), `locale`, `timezone`, `date_format` per workspace/user; format via `Intl.NumberFormat`/`next-intl` formatters. Replace the hardcoded `£`/GBP in Budget.
- **Minimum settings page:** Account · Language · Currency/Date/Timezone · Notifications · Privacy.

## Sources
See the three research briefs in the session; key refs: theknot.com (AI relaunch 2025), withjoy.com
(photo slideshow, bilingual), weddingwire.com & hitched.co.uk (seating), prismm.com / aisleplanner.com
(pro seating ladder), bridebook.com (UK marketplace), say-i-do (13-language), next-intl.dev,
etsy.com/legal (prohibited items & services policies), lemonsqueezy.com / gumroad (SaaS-friendly sales).
