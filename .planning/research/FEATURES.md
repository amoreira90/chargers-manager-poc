# Feature Landscape

**Domain:** EVSE (Electric Vehicle Supply Equipment) management platform
**Project:** PLUG UY — chargers-manager-poc
**Researched:** 2026-03-18
**Overall confidence:** MEDIUM (external tools unavailable; findings based on OCPP 1.6 spec knowledge through Aug 2025 + PROJECT.md client requirements. EVSE industry features are well-established; training data is highly reliable for this domain.)

---

## Table Stakes

Features users expect from any EVSE platform. Missing = product feels incomplete, unusable, or unsafe.

### End User (Conductor)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Charger discovery + real-time availability | Core reason to open the app; stale status is worse than no app | Medium | Requires OCPP StatusNotification push; max 5s latency per PROJECT.md |
| Session start from app (remote start) | No one wants to fumble with buttons; app-initiated is the baseline UX | Medium | OCPP RemoteStartTransaction; charger must ACK before confirming |
| Session stop (manual + automatic) | Driver must be able to end session; automatic on full charge is safety expectation | Medium | OCPP RemoteStopTransaction + StopTransaction from charger side |
| Real-time session data (kWh delivered, duration, cost so far) | Driver needs to know what they're paying; no display = anxiety | High | Requires OCPP MeterValues polling or push at ~30s intervals |
| Pre-session price estimate | "How much will this cost?" — answered before plug-in or immediately after | Medium | Cannot know exact cost without final kWh; show rate + estimated range |
| Payment on session end (automatic charge) | Friction-free payment is expected; manual payment flows feel broken | High | Requires payment provider integration; auto-charge on stored method |
| Payment receipt (email + in-app) | Legal + trust requirement; users dispute charges without receipts | Low | Email via transactional provider; in-app history entry |
| Session history | "How much have I spent this month?" — basic financial accountability | Low | List of completed sessions with kWh, duration, cost, charger |
| Push notifications (session end, payment confirmed, charger errors) | User leaves their car; must be notified without checking the app | Medium | FCM for Android; APNs for iOS; requires device token management |
| Authentication (email/password + OAuth) | Any modern app has this; building your own login is baseline | Medium | Google + Apple OAuth expected in mobile-first apps per App Store guidelines |
| Password recovery | Standard expectation; blocking login without recovery loses users permanently | Low | Email magic link or OTP |
| Profile management | Change email, phone, payment method | Low | Basic CRUD; payment method update touches payment provider |

### Owner (Propietario de Cargadores)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Visibility into charger status | Owner must know if their equipment is working or earning | Low | Read-only view of OCPP status per charger |
| Revenue/earnings visibility | Owners need to trust the platform with their income | Medium | Aggregated: sessions x rate, minus platform commission |
| Per-charger configuration (pricing) | Each charger may have different pricing; owner cannot call support each time | Medium | In MVP: admin sets; in Fase 2: owner self-service |
| Fault/offline alerts | Owner needs to know if charger is down; lost revenue + unhappy drivers | Medium | OCPP Heartbeat timeout + StatusNotification fault detection |

### Admin

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Charger registration + configuration | Platform is useless without chargers; admin must onboard them | Medium | OCPP BootNotification + manual record creation; complex because OCA requires OCPP auth |
| Charger block/unblock (ChangeAvailability) | Remote operational control without physical access | Low | OCPP ChangeAvailability command |
| User management (view, block, role assignment) | Admin must be able to manage all actors | Low | CRUD on user entities with role flags |
| Platform KPIs dashboard | Admin must see platform health at a glance | Medium | Sessions, revenue, active chargers, errors; aggregated counts |
| Export data (CSV) | Operations, accounting, reporting to owners — all need raw data export | Low | Simple CSV generation from session/user records |
| 2FA for admin accounts | Security baseline for privileged access; regulatory expectation | Low | TOTP (Google Authenticator / Authy); required per PROJECT.md |

### Protocol / Infrastructure (Non-Negotiable)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| OCPP 1.6 Central System | Hardware dictated by PLUG UY; without this, chargers don't work | High | WebSocket server; must handle: BootNotification, Heartbeat, StatusNotification, StartTransaction, StopTransaction, MeterValues, RemoteStart/Stop, ChangeAvailability |
| Graceful connectivity loss handling | Sessions drop in real life; platform must not double-charge or lose data | High | Buffer MeterValues locally on charger; reconcile on reconnect; partial session billing |
| HTTPS + WSS TLS 1.2+ | Baseline security; plain HTTP not acceptable for payment data | Low | Infra config; not code complexity |
| Idempotent payment on session end | Network retries must not double-charge; users will dispute duplicates immediately | High | Payment provider idempotency keys + session state machine |

---

## Pricing Model Features

Pricing is a first-class domain in EVSE. Getting this wrong means billing disputes and lost trust.

| Pricing Model | Industry Status | Complexity | Recommended for MVP? |
|---------------|----------------|------------|---------------------|
| Flag drop (bajada de bandera) + per-kWh rate | Most common hybrid; matches PROJECT.md requirement | Medium | YES — matches client spec |
| Flat rate per session (fixed fee) | Simple but ignores vehicle differences; less common | Low | NO — conflicts with per-kWh model |
| Time-based ($/minute) | Used when kWh metering is unreliable; common on DC fast chargers | Medium | NO — needs precise meter; add in Fase 2 |
| Free sessions ($0 tariff) | Needed for private/home chargers or promotions | Low | YES — PROJECT.md explicitly requires it; must skip payment flow entirely |
| Dynamic pricing (peak/off-peak) | Demand management; sophisticated operators use this | High | NO — Fase 2 per PROJECT.md |
| Per-kWh + idle/overstay fee | Prevents charger monopolization; needed for public locations | Medium | Partial — idle fee is "open session" feature per PROJECT.md |

### Fee for Open Session (Manguera Trabada)

This is explicitly listed in PROJECT.md as an open decision. Industry standard treatment:

- Grace period after full charge (typically 5-10 minutes)
- Idle fee per minute after grace period (separate from charging rate)
- Push notification at charge completion + warning before idle fee starts
- Cap on total idle fee (not infinite penalty)
- Complexity: Medium (requires charger-side energy curve detection + timer)

---

## Differentiators

Features that set the product apart. Not baseline, but valued and remembered.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Accurate pre-session cost estimate with SOC awareness | Most platforms show a range; showing cost per driver's typical session builds trust | High | Requires SOC input from user OR learning from historical sessions; OCPP 1.6 does not expose SOC to CSMS |
| Session cost split visibility for multi-unit buildings | Building admin sees per-unit consumption; simplifies HOA cost allocation | Medium | Requires tagging sessions to units; useful for Fase 2 corporate market |
| Earnings dashboard with payout timeline for owners | Owners trust platform when they can see money moving and when it arrives | Medium | Requires settlement records tied to sessions; liquidation model (per-tx vs monthly) affects complexity |
| Peer-to-peer home charger sharing (homeowner rents access) | Expands supply without capital; differentiates from operator-only networks | High | Requires Fase 2; pricing based on UTE electricity bill per PROJECT.md |
| Real-time map with filter (power, connector type, price) | Discovery feature; platforms without maps lose users to Google Maps results | Medium | Map is Fase 2 per PROJECT.md; basic list in MVP |
| QR code session start | Reduces app navigation to one tap; reduces misidentification errors | Low | Explicitly descoped from MVP by PLUG UY |
| OCPI 2.2 roaming interoperability | Drivers can use any roaming-enabled charger on the network | High | Fase 2 per PROJECT.md |
| AI-powered session anomaly detection (unexpected energy spike) | Catches meter tampering or faulty chargers before disputes | High | Post-MVP; requires historical data baseline |

---

## Anti-Features

Features to explicitly NOT build in MVP. Building these is a trap.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Self-service charger registration by owner | PLUG UY explicitly rejected this; charger config is technically complex (OCPP auth, power limits) | Admin registers all chargers in MVP; owner onboarding is Fase 2 |
| QR code session start in MVP | PLUG UY said not needed for V1; adds complexity (camera permissions, QR generation, print coordination) | Use app-based charger selection from list/map |
| Multi-currency support | Uruguay operates in pesos; adding USD in MVP adds FX complexity, DGI complications | Single currency MVP; currency choice is a blocker to resolve in Fase 0 |
| In-app wallet / prepaid balance | Adds regulatory complexity (e-money regulation in Uruguay); not needed for per-session billing | Pay-per-session with stored card; wallet is Fase 2 decision per PROJECT.md |
| RFID card support | OCPP 1.6 supports RFID (idTag) but it's an ops/hardware problem; mobile-first means app-first | App-initiated sessions only; RFID can be retrofitted later without breaking session model |
| Multi-language support in MVP | Platform is Uruguay-only; single language reduces scope | Spanish only; i18n scaffolding can be built but content is single-language |
| Web portal for end users | Mobile-first per PROJECT.md; web app is Fase 2 | React Native app only; admin web is already in scope and is a different actor |
| Subscription billing (monthly plans) | Adds subscription management complexity; per-session billing is simpler and matches PLUG UY's commission model | Pay-per-session only in MVP |
| Hardware provisioning / firmware management | Out of scope for CSMS layer; belongs to OEM tooling | OCPP handles operational commands only; no firmware push via OCPP FirmwareManagement in MVP |

---

## Feature Dependencies

```
Auth (email/password + OAuth)
  └── Session start (requires authenticated user)
        └── OCPP RemoteStartTransaction
              └── MeterValues polling → real-time session data
                    └── Session stop (manual or automatic from charger)
                          └── Final kWh calculation
                                └── Payment charge (auto on stored method)
                                      └── Receipt (email + in-app)
                                            └── Session history entry

Charger registration (admin) → OCPP BootNotification acceptance
  └── StatusNotification processing → real-time availability
        └── Charger discovery list (user)

Pricing configuration (admin sets per charger)
  └── Pre-session estimate (user sees rate)
        └── Post-session invoice calculation

Open session detection (charger sends StopTransaction or energy plateaus)
  └── Grace period timer
        └── Idle fee accrual
              └── Push notification (driver must move vehicle)
                    └── Force stop via RemoteStop (if grace expired)

Split payment (platform commission)
  └── Settlement record per session
        └── Owner earnings dashboard
              └── Liquidation payout (batch or per-transaction)
```

---

## MVP Recommendation

### Must ship in Fase 1 (MVP)

1. **OCPP 1.6 Central System** — without this the product cannot talk to chargers
2. **Authentication** — email/password + Google/Apple OAuth + password recovery
3. **Charger discovery** (list view; map deferred to Fase 2)
4. **Real-time charger status** — OCPP StatusNotification processing with max 5s latency
5. **Session start + stop** — RemoteStart/Stop; both manual (user) and automatic (charger-initiated)
6. **Real-time session meter** — MeterValues displayed in app
7. **Pricing: flag drop + per-kWh** — per PROJECT.md; $0 tariff must skip payment entirely
8. **Payment on session end** — automatic charge to stored method; idempotent; webhooks for async confirmation
9. **Open session / idle fee handling** — grace period + notification + force stop
10. **Connectivity loss handling** — partial session billing with reconciliation
11. **Push notifications** — end of session, payment, charger offline (FCM + APNs)
12. **Session history** — list of completed sessions for user
13. **Receipt** — email + in-app per session
14. **Admin panel** — charger status, KPIs, block/unblock, user management, CSV export, 2FA
15. **Role system** — User, Owner, Admin; a user can hold multiple roles simultaneously
16. **Comprobante / fiscal receipt** — depends on DGI decision from Fase 0; block MVP if unresolved

### Defer to Fase 2

- Map with real-time overlays and filters
- QR code session initiation (already descoped by PLUG UY)
- Owner self-service charger registration
- Owner full panel with revenue reports and payout history
- Home charger peer-to-peer sharing
- Dynamic pricing (peak/off-peak)
- OCPI 2.2 roaming
- Web app for end users
- In-app wallet / prepaid balance
- Tarifas dinámicas

### Unresolved Blockers (Fase 0 must close before coding)

These are not features to build — they are decisions that change feature implementation:

| Decision | Impact if Deferred |
|----------|--------------------|
| Payment provider (Stripe vs MercadoPago) | Cannot implement payment flow at all |
| Currency (pesos vs USD) | Affects payment API, receipt format, DGI compliance |
| Commission model (% fixed + min + cap?) | Affects split payment calculation in every session |
| Liquidation model (per-tx vs monthly) | Affects owner dashboard, accounting, payout scheduling |
| Owner panel scope in MVP | Affects Fase 1 backend endpoints and mobile screens |
| Idle fee parameters (grace period, rate, cap) | Affects session state machine design |
| Digital wallet (yes/no) | Changes payment flow architecture |
| Admin panel detail (map vs list, filters) | Affects frontend scope |

---

## Sources

**Confidence assessment:**
- OCPP 1.6 protocol capabilities: HIGH — stable spec since 2015; well-documented in training data
- ChargePoint / Electrify America / EVgo feature sets: MEDIUM — training data through Aug 2025; platform features evolve but core is stable
- Uruguay-specific constraints (DGI, MercadoPago, UTE): MEDIUM — general knowledge; PROJECT.md provides client-validated context
- PROJECT.md requirements (PLUG UY client feedback): HIGH — directly from client-provided spec and feedback document

Note: WebSearch, WebFetch, and Bash tools were denied during this research session. All findings are based on training data (knowledge cutoff Aug 2025) plus PROJECT.md context. The EVSE domain is well-established; protocol-level features (OCPP 1.6) are stable and high-confidence. Pricing model landscape and platform UX patterns are MEDIUM confidence — validate with current competitor research when tools become available.
