---
title: Planr vs Top Wedding Apps — Comparison v2 (after the experience-layer build)
date: 2026-06-06
type: research
supersedes: 2026-06-06-market-comparison.md (the v1 gap analysis)
---

# Planr vs the market — re-scored after building the experience layer

Same competitor set as v1 (Zola, The Knot/WeddingWire, Joy, Bridebook, Hitched, Appy Couple, Say I Do —
all current 2025–26). v1 found Planr was a tested *engine* with a basic UI and ~12 table-stakes gaps.
Since then we shipped: event dashboard + countdown, multi-currency, date-driven checklist generator,
visual seating, event website builder, vendor tracker, gift registry, guest photo sharing + live
slideshow, and an installable PWA. This re-scores the same table.

Legend: ✅ have · ⚠️ partial · ❌ missing · ⭐ our edge.

## Scorecard

| Capability | Leaders | Planr v1 (before) | Planr now | Verdict |
|---|---|---|---|---|
| Command-center dashboard + countdown | The Knot 2025 | ❌ | ✅ greeting + countdown + live module cards | **match** |
| Event website builder (themed public site) | all | ❌ (bare RSVP page) | ✅ `/e/<slug>`, 3 themes, story/schedule/travel/registry/photos | **match** |
| Guest list + RSVP | all | ✅ | ✅ + ⭐ **no-login token RSVP** | **beat** (no guest account) |
| Visual seating chart | WeddingWire, Hitched, Zola, Say I Do | ❌ list only | ✅ floor-plan tables w/ chairs, over-capacity surfaced | **match** (meal-per-seat still to do) |
| Date-driven checklist (auto-generated) | Zola (#1 feature) | ⚠️ manual | ✅ ~44-item timeline from the date, one-click | **match** |
| Budget | all | ✅ GBP only | ✅ + **multi-currency** (per workspace) | **match+** |
| Vendor discovery / tracker | Knot/WW/Bridebook (marketplaces) | ❌ | ✅ couple-CRM **grouped by category** + booked total | **match** as a tracker (no marketplace by design) |
| Registry / gifts | Zola, Knot, Joy | ❌ | ✅ host list shown on the public site | ⚠️ **partial** (no cash funds / purchase tracking) |
| Photo sharing + live slideshow | Joy, Appy Couple | ❌ | ✅ guest upload via RSVP link + auto-advancing public slideshow | **match** (Joy's signature) |
| Messaging / announcements | Joy, Appy Couple | ✅ | ✅ host announcements on the guest RSVP page | **match** |
| Mobile app | all (native) | ❌ | ✅ **installable PWA** (manifest, icon, offline shell) | ⚠️ **partial** (PWA, not native) |
| Multi-event-type (birthday/funeral/corporate) | ❌ none | ✅ | ✅ registry-driven | ⭐ **unique** |
| Multi-tenant workspaces + roles (agencies) | ❌ none | ✅ | ✅ RBAC + invites + admin console | ⭐ **unique** |
| Per-guest personalised event view | Joy, Say I Do | ❌ | ⚠️ token is per-guest; no multi-event scoping | gap (minor) |
| Multi-language | Say I Do (13) | ❌ | ❌ deferred (next-intl) | **gap** |
| AI (thank-you / vendor match / checklist) | Knot, Zola | ❌ | ❌ skipped (needs LLM key) | gap |
| Registry cash funds; vendor marketplace; hotel blocks; contact-collector | various | ❌ | ❌ | gaps (mostly their business model / nice-to-haves) |

## Where we landed

- **Table-stakes: essentially closed.** Dashboard, event website, visual seating, auto-checklist,
  multi-currency, registry, photos, messaging, installable app — all present. v1 listed ~9 table-stakes
  gaps; **8 are now closed** (the 9th, native mobile, is covered by a PWA rather than a store app).
- **We beat the field on three structural things no major competitor does:** non-wedding event types,
  true multi-tenant workspaces with roles (agencies/planners), and a guest RSVP/photo flow that needs
  **no guest login**.
- **We match the signature "wow" features:** Zola's auto-checklist, Joy's live photo slideshow, The
  Knot's command-center dashboard.

## Honest remaining gaps (ranked)

1. **Multi-language** — the only outright table-stakes-ish gap left for an international/Etsy audience. It's a
   contained next-intl refactor (deferred, scoped in v1 research).
2. **AI** (thank-you writer, smart checklist, vendor match) — differentiators; blocked on an LLM API key.
3. **Native mobile app** — PWA covers install/offline; a store app is a later, larger investment.
4. **Registry depth** — cash funds / "claimed" tracking / universal add-from-any-store (we have a curated link list).
5. **Seating meal-per-seat** — the one place we could *beat* Zola/Knot; deferred from the seating slice.
6. **Nice-to-haves**: contact-collector magic link, hotel room blocks, per-guest multi-event itineraries.

## Bottom line

v1: "a sound engine that photographs as an admin panel." Now: a couple lands on a **countdown dashboard**,
**generates a wedding checklist**, arranges a **visual seating plan**, tracks **vendors + budget in their
currency**, publishes a **themed website with registry + a live guest photo slideshow**, and guests **RSVP +
upload photos with no login** — installable as an app. On the features that make couples choose and love a
wedding app, Planr now **matches the leaders and beats them** on event-type breadth, collaboration, and
login-free guest flows. The clearest next lever is **multi-language**, then **AI**.
