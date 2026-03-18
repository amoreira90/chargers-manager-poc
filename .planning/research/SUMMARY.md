# Project Research Summary

**Project:** PLUG UY — EVSE Management Platform (chargers-manager-poc)
**Domain:** EV Charger Management (EVSE) with OCPP 1.6, split payments, and mobile-first UX
**Researched:** 2026-03-18
**Confidence:** MEDIUM

## Executive Summary

PLUG UY is a brownfield evolution of a working POC into a production-grade EVSE platform. The existing hexagonal architecture (Spring Boot + Java, React Native + Expo) is the correct foundation and should not be rewritten — it is the asset that makes this project tractable for a 2-3 person team. The primary engineering challenge is not a typical CRUD application: it requires a bidirectional, stateful WebSocket protocol (OCPP 1.6) to control physical charger hardware, a reliable session billing state machine, and split payment flows with Uruguay-specific regulatory constraints. These three concerns are tightly coupled and must be designed together before coding begins.

The recommended approach is a phased expansion of the POC: first migrate data persistence and add authentication, then implement the OCPP Central System (the highest-risk gap), then layer session management and payments on top of a stable OCPP foundation. The Java-OCA-OCPP library (ChargeTime EU) fits cleanly into the existing hexagonal architecture and is the recommended OCPP implementation path. MercadoPago is recommended as the primary payment provider given pre-existing integration planning and superior Uruguay/LatAm coverage, but the Marketplace split payment feature's Uruguay availability must be verified before any payment code is written. This is a Fase 0 blocker.

The most dangerous risks are not technical complexity but silent failure modes: sessions that lose state on reconnect, payments that capture against wrong meter values, and pre-authorizations that expire before capture. All three can cause financial discrepancies that are hard to reconcile retroactively. The session state machine — OCPP transaction ID binding, meterStart/meterStop as billing source, and payment capture gated on confirmed StopTransaction — must be designed as a unit in Fase 1, not assembled incrementally.

---

## Key Findings

### Recommended Stack

The existing POC stack carries forward cleanly with targeted additions. The critical upgrades are: Java 17 → Java 21 (virtual threads for 500 concurrent WebSocket sessions), H2 → PostgreSQL (sessions are billing source of truth — in-memory storage is unacceptable), and Spring Security 6.x (completely absent from current POC). No new frameworks are needed; all additions slot into the existing hexagonal structure as new adapters.

The OCPP 1.6 gap is filled by the `Java-OCA-OCPP` library (ChargeTime EU, `eu.chargetime.ocpp:v1_6`), which is embeddable as a Spring component and maps naturally to the hexagonal architecture: OCPP message handlers become infrastructure adapters, identical in role to the existing REST controller. The library handles WebSocket framing; domain use cases handle business logic. This keeps OCPP protocol details out of the domain layer.

**Core technologies:**
- **Spring Boot 3.3.x + Java 21**: Upgrade path from existing 3.2.0 + Java 17; virtual threads handle 500 concurrent sessions without reactive stack
- **Java-OCA-OCPP (ChargeTime EU)**: OCPP 1.6 protocol library — embeds in Spring Boot, fits hexagonal arch as infrastructure adapter [VERIFY version before implementing]
- **PostgreSQL 16 + Flyway 10**: Replace H2 for production; Flyway required before any schema changes; JSONB for MeterValues storage
- **Redis 7**: Charger status cache (5s SLA requirement) and distributed session registry
- **Spring Security 6.3 + JJWT 0.12.3**: JWT auth for REST + WebSocket upgrade intercept for OCPP charger authentication
- **MercadoPago SDK Java**: Primary payment provider; preauthorization (capture: false → capture) model for EV charging; Marketplace API for owner split [VERIFY Uruguay availability]
- **Firebase Admin SDK 9.x + FCM**: Push notifications (session end, payment, charger offline) — explicitly required in PROJECT.md
- **React Query 5 + expo-notifications + expo-task-manager**: Frontend additions for real-time session UX and background session tracking

**What NOT to add:** Keycloak (operational overhead), Kafka/RabbitMQ (not justified at single-instance 500 sessions), SteVe (full application, not embeddable), Redux (React Query + Context is sufficient), WebFlux (virtual threads achieve equivalent concurrency without reactive learning curve).

### Expected Features

The feature set divides cleanly into three categories. The OCPP Central System is the enabler — nothing else works without it. Session management (start, meter tracking, stop, billing) is the core value loop. Everything else (notifications, admin panel, owner panel) is operational infrastructure.

**Must have (table stakes) — Fase 1:**
- OCPP 1.6 Central System: BootNotification, Heartbeat, StatusNotification, StartTransaction, StopTransaction, MeterValues, RemoteStart/Stop, ChangeAvailability
- Authentication: email/password + Google/Apple OAuth + password recovery; multi-role support (conductor + owner simultaneously)
- Real-time charger status with max 5s latency
- Session start/stop (app-initiated remote start; charger-initiated and manual stop)
- Real-time session meter (kWh delivered, duration, estimated cost from MeterValues)
- Pricing: flag drop (bajada de bandera) + per-kWh tariff per charger; $0 tariff must bypass payment entirely
- Payment on session end: automatic charge to stored method, idempotent, split platform/owner, webhook handling
- Open session / idle fee: grace period timer, push notification, force stop via RemoteStop
- Connectivity loss handling: buffer MeterValues, reconcile on reconnect, partial session billing
- Push notifications: session end, payment confirmed, charger offline (FCM + APNs)
- Session history, email receipt + in-app receipt
- Admin panel: charger status, KPIs, block/unblock, user management, CSV export, 2FA (TOTP)
- Role system: User, Owner, Admin; a single user can hold multiple roles simultaneously

**Should have (differentiators) — targeted Fase 2:**
- Earnings dashboard with payout timeline for charger owners
- Real-time map with filter (power, connector type, price)
- Owner self-service charger registration

**Defer (v2+):**
- QR code session start (explicitly descoped by PLUG UY for MVP)
- OCPI 2.2 roaming interoperability
- Dynamic pricing (peak/off-peak)
- Web app for end users
- In-app wallet / prepaid balance
- Peer-to-peer home charger sharing

**Unresolved blockers (Fase 0 must close before any Fase 1 code):** payment provider selection, currency (pesos vs USD), commission model, liquidation model (per-transaction vs monthly), idle fee parameters, DGI/fiscal compliance, owner panel scope in MVP.

### Architecture Approach

The platform has three coexisting communication planes in one Spring Boot process: OCPP WebSocket (charger ↔ backend, persistent WSS), REST/HTTP (mobile app + admin dashboard), and Push (backend → mobile via FCM). The existing hexagonal structure maps cleanly to each plane — OCPP handlers are driving ports identical in role to REST controllers, with all OCPP-specific code isolated in `infrastructure/adapter/ocpp/`. The domain never sees WebSocket sessions or OCPP framing.

Two new aggregate roots must be created: `ChargingSession` (separate from `Charger` — different lifecycles, different invariants) and `Tariff` (must live in the domain, never the frontend). The `ChargerConnectionRegistry` (`ConcurrentHashMap<chargePointId, WebSocketSession>`) is the critical infrastructure component that enables Central System-initiated commands (RemoteStart, RemoteStop, ChangeAvailability) — it must be keyed by the physical OCPP chargePointId, not the platform UUID.

**Major components:**
1. **OCPP WebSocket Endpoint + ChargerConnectionRegistry** — accepts WSS connections from chargers, maintains live session registry, enables bidirectional command flow
2. **OCPP Message Dispatcher + per-action Handlers** — one handler class per OCPP action (BootNotification, Heartbeat, StatusNotification, StartTransaction, StopTransaction, MeterValues); open/closed principle — new actions add new classes without modifying dispatcher
3. **SessionService + ChargingSession aggregate** — owns session lifecycle (PENDING_START → ACTIVE → COMPLETED → PAID / SUSPENDED); binds to OCPP transactionId from StartTransaction; uses meterStart/meterStop as billing source of truth
4. **PaymentAdapter (MercadoPago)** — implements `PaymentPort` domain interface; handles preauth, capture, split, webhook ingestion; idempotent on all operations
5. **PushNotificationAdapter (FCM)** — implements `PushPort`; session end, payment, charger offline notifications
6. **Domain Events** — `SessionCompletedEvent` decouples session close from payment and notification triggers; Spring `ApplicationEventPublisher` sufficient for single-instance MVP

### Critical Pitfalls

1. **OCPP session state lost on WebSocket reconnect (C-1)** — Persist `transactionId`, `connectorId`, `meterStart` to DB *before* sending `StartTransaction.conf`. On BootNotification, query DB for any open transaction on that chargePointId and resume it. Ghost sessions (charger thinks session open, backend thinks closed) are unrecoverable without this.

2. **Payment capture before StopTransaction is confirmed (C-4)** — `RemoteStopTransaction` is a request, not a confirmation. Only trigger payment capture after `StopTransaction.req` is received and stored. Show "Finalizando sesion..." state in mobile app; push notification to mobile when session is truly closed.

3. **MercadoPago pre-authorization expiry on long/offline sessions (C-5)** — Pre-auths expire (typically 7 days). Capture immediately after confirmed stop. Build a payment retry job for sessions with `paymentStatus = PENDING` older than 1 hour. The existing POC already has a silent-fail pattern in `ChargingDetailScreen.tsx` that masks this — fix it in Fase 1.

4. **MercadoPago Marketplace requires seller OAuth onboarding — not just account config (C-6)** — Each charger owner must OAuth-authorize the platform before split payments work. This is an owner onboarding flow, not a config value. For MVP with a single operator (Prosepac), collect all payments to the platform account and reconcile manually until seller onboarding UX is built.

5. **Pricing stored in frontend, not enforced on backend (M-3)** — `pricePerKwh: 2.5` is currently hardcoded in `chargerService.ts`. Pricing must be a `Tariff` value object in the domain, returned by the charger detail API, and snapshotted at session-start (`pricePerKwhAtSessionStart`). Backend must calculate billing — never trust client-computed amounts.

---

## Implications for Roadmap

The build order is dictated by hard dependencies in the data flow. Each phase's output is the prerequisite for the next.

### Phase 1: Data Foundation and Authentication

**Rationale:** Everything depends on persistent storage and authenticated identities. OCPP sessions, payments, and notifications all need User, Charger, Tariff, and Owner records to exist in a durable store. This phase has zero risk — standard Spring Boot patterns.

**Delivers:** PostgreSQL migration, Flyway schema migrations, User domain + JWT auth + role system (User/Owner/Admin), Spring Security configuration, Charger domain expanded with `ocppChargePointId`, `Tariff` value object, `ownerId`, `OFFLINE`/`FAULTED` statuses.

**Addresses:** Auth requirement (email/password + Google/Apple OAuth), role system (multi-role users), pricing model in domain (not frontend), database foundation for all subsequent phases.

**Avoids:** Pitfall m-4 (H2 + no migrations causing schema drift), Pitfall M-3 (pricing in frontend), Pitfall m-3 (untyped navigation params — fix before OCPP wiring).

**Research flag:** Standard Spring Boot patterns — skip `/gsd:research-phase`. Well-documented.

---

### Phase 2: OCPP Central System Core

**Rationale:** Without OCPP, no physical charger can connect. This is the highest-risk phase and the critical path — everything from session management to payments depends on OCPP being reliable. Build and validate OCPP with simulated charger traffic before layering session logic.

**Delivers:** `OcppWebSocketHandler`, `ChargerConnectionRegistry`, `OcppMessageDispatcher`, per-action handlers for BootNotification, Heartbeat, StatusNotification, StartTransaction, StopTransaction, MeterValues. Remote commands: RemoteStart, RemoteStop, ChangeAvailability. Separate `connectionStatus` and `operationalStatus` fields on Charger.

**Addresses:** Full OCPP 1.6 Central System requirement, real-time charger status (max 5s latency via StatusNotification), charger registration flow, admin block/unblock.

**Avoids:** Pitfall C-1 (session state lost on reconnect — persist transactionId before sending StartTransaction.conf), Pitfall C-2 (idempotent StopTransaction handler for unknown/late transactions), Pitfall M-1 (per-charger command queue with reconnect replay), Pitfall M-2 (connectionStatus vs operationalStatus as separate fields), Pitfall m-6 (TLS certificate trust — test WSS with real hardware early).

**Research flag:** NEEDS `/gsd:research-phase`. Java-OCA-OCPP library version, OCPP 1.6 spec edge cases (offline buffering, transactionId generation), and Spring WebSocket OCPP subprotocol handshake configuration all require deeper implementation research before this phase is planned.

---

### Phase 3: Session Lifecycle

**Rationale:** Sessions depend on OCPP (Phase 2) receiving StartTransaction to bind the session and generate the OCPP transactionId. The session state machine is the bridge between OCPP events and billing.

**Delivers:** `ChargingSession` aggregate root with full state machine (PENDING_START → ACTIVE → COMPLETED → PAID → FAILED / SUSPENDED), `SessionService`, REST endpoints (start session, stop session, live session status), real-time MeterValues → estimated cost display, connectivity loss handling (SUSPENDED state + billing from last known MeterValues), idle fee / open session detection with grace period timer.

**Addresses:** Session start/stop (remote and charger-initiated), real-time meter display, connectivity loss requirement, open session / manguera trabada flow, session history.

**Avoids:** Pitfall C-3 (use meterStop - meterStart as billing source, not wall-clock time), Pitfall C-4 (decouple "stop requested" from "stop confirmed" — gate payment trigger on StopTransaction receipt), Pitfall M-4 (free sessions with $0 tariff bypass payment flow at SessionService level, not frontend), Pitfall M-5 (cache sessionId in AsyncStorage for reconnect; charger physical stop as backstop), Pitfall m-2 (fix timer leaks in ChargingDetailScreen before wiring real OCPP backend).

**Research flag:** Session reconciliation edge cases (offline StopTransaction with past timestamp, partial MeterValues on reconnect) may benefit from `/gsd:research-phase` focused on OCPP 1.6 offline behavior spec.

---

### Phase 4: Payment Integration

**Rationale:** Payment depends on sessions (Phase 3) being closeable with a confirmed, final energy amount. The payment adapter is the last downstream step in the session completion flow.

**Delivers:** `PaymentPort` domain interface, MercadoPago adapter (preauth at session start, capture on StopTransaction confirmed, split calculation platform/owner), payment webhook endpoint (idempotent, signature-verified), payment retry job for `PENDING` sessions, email receipt + in-app receipt, `paymentStatus = NOT_APPLICABLE` for $0 tariff sessions.

**Addresses:** Automatic payment on session end, split payment platform/owner, webhook async confirmation, receipt requirement, free session exception.

**Avoids:** Pitfall C-5 (capture immediately after confirmed stop; payment retry job; fix silent-fail in ChargingDetailScreen.tsx), Pitfall C-6 (for MVP single operator, route all payments to platform account; document seller onboarding as Fase 2 dependency), Pitfall M-6 (idempotent webhook handlers; query MercadoPago API for current state on webhook receipt; signature verification).

**Research flag:** NEEDS `/gsd:research-phase`. MercadoPago Uruguay Marketplace API availability, preauth expiry window, and exact Marketplace OAuth flow must be researched and verified before this phase is planned. This is the highest-uncertainty area in the entire project.

---

### Phase 5: Notifications and Offline Resilience

**Rationale:** Notifications and offline handling are last-mile UX and reliability concerns. They depend on the session state machine (Phase 3) being stable and the OCPP layer (Phase 2) being reliable. These are polish relative to the core billing loop but are user-visible requirements.

**Delivers:** FCM push notification adapter (PushPort implementation), per-user FCM device token storage with refresh handling, notification types: session ended, payment charged, charger offline (Heartbeat timeout), idle fee warning + force stop. Mobile: session persistence in AsyncStorage, "Session running in background" FCM notification for network-loss recovery.

**Addresses:** Push notification requirement (session end, payment, charger offline), open session notification flow, mobile connectivity loss UX recovery.

**Avoids:** Pitfall C-1 extension (charger offline detection via Heartbeat timeout, not just WebSocket disconnect), Pitfall M-5 (background notification so user can reopen session screen after network loss).

**Research flag:** Standard FCM + Firebase Admin SDK patterns — skip `/gsd:research-phase`. Well-documented; Expo 54 compatibility with `expo-notifications` is HIGH confidence.

---

### Phase 6: Admin Panel and Observability

**Rationale:** Admin panel is operational infrastructure. It requires stable data from all previous phases to display meaningful KPIs. This phase can also be built partially in parallel with Phases 4-5 since it mostly reads existing data.

**Delivers:** Admin REST endpoints (block/unblock charger via ChangeAvailability, KPIs aggregation, user management, CSV export), 2FA (TOTP) for admin accounts, Owner panel MVP (charger status, earnings view — scope TBD from Fase 0), expanded Grafana dashboards (OCPP message rates, session counts, payment success rates), admin dashboard WebSocket/SSE for real-time status (replacing current 15s polling interval).

**Addresses:** Admin panel MVP requirement, 2FA for admin requirement, charger owner visibility into status and revenue.

**Avoids:** Pitfall m-1 (replace polling with SSE for admin charger status updates).

**Research flag:** Standard admin REST + React Query 5 patterns — skip `/gsd:research-phase`. Replace polling with SSE is straightforward.

---

### Phase Ordering Rationale

- **Data foundation first (Phase 1):** Zero OCPP work can begin without persistent storage and auth. Flyway must be set up before any schema changes to avoid m-4.
- **OCPP before sessions (Phase 2 before Phase 3):** OCPP generates the `transactionId` and `meterStart` that the session aggregate requires. Building sessions without OCPP leaves a stub that must be replaced, creating integration risk.
- **Sessions before payments (Phase 3 before Phase 4):** Payment capture requires a confirmed `meterStop` from a completed session. Attempting payments without a stable session state machine causes C-4 (capture before StopTransaction confirmed).
- **Notifications after sessions (Phase 5 after Phase 3):** Notification triggers (session end, charger offline) originate from session and OCPP events. The event publishers must exist before notification subscribers.
- **Admin panel last (Phase 6):** It reads data produced by all previous phases. KPI dashboards are meaningless without real session and payment data.

### Research Flags

**Needs `/gsd:research-phase` during planning:**
- **Phase 2 (OCPP Central System):** Java-OCA-OCPP library integration with Spring WebSocket, OCPP 1.6 subprotocol handshake configuration, offline message buffering spec behavior, transactionId idempotency strategy
- **Phase 4 (Payment Integration):** MercadoPago Uruguay Marketplace API availability, preauthorization expiry window, Marketplace OAuth seller onboarding flow, MercadoPago SDK Java current version on Maven Central

**Standard patterns — skip research-phase:**
- **Phase 1 (Data Foundation):** Spring Security 6 + JJWT, PostgreSQL + Flyway, Spring Boot 3.3 upgrade path — all well-documented
- **Phase 3 (Session Lifecycle):** Domain event pattern, Spring ApplicationEventPublisher, session state machine — established patterns from research
- **Phase 5 (Notifications):** FCM + Firebase Admin SDK, expo-notifications — official SDKs with established patterns
- **Phase 6 (Admin Panel):** React Query 5, SSE endpoints, Spring MVC REST — all standard

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core Spring Boot + Java 21 + PostgreSQL is HIGH. Java-OCA-OCPP version and MercadoPago Uruguay Marketplace are MEDIUM/LOW and need verification before Fase 1 planning |
| Features | HIGH | OCPP 1.6 spec is a published standard (2015). PLUG UY requirements come directly from client feedback. Feature landscape is stable. |
| Architecture | MEDIUM | OCPP 1.6 protocol semantics are HIGH confidence. Spring WebSocket implementation patterns are HIGH. Exact library integration details need Phase 2 research. |
| Pitfalls | MEDIUM | OCPP pitfalls are well-established from production EVSE implementations. MercadoPago-specific pitfalls (pre-auth expiry window, Marketplace scopes) are MEDIUM — require direct API documentation verification. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **MercadoPago Uruguay Marketplace API availability:** Must be confirmed directly with MercadoPago before payment architecture is finalized. If Marketplace is unavailable in Uruguay, the split payment model requires a manual reconciliation workaround for MVP. This is a Fase 0 blocker that is currently unresolved.

- **Java-OCA-OCPP current version:** `v1.0.0` was the last verified release in training data (2023). Check `https://github.com/ChargeTimeEU/Java-OCA-OCPP/releases` before adding the dependency. If the library is unmaintained, evaluate SteVe-as-sidecar as a fallback pattern.

- **MercadoPago native React Native SDK + Expo 54 managed workflow:** MercadoPago's native SDK has historically required bare workflow (ejecting Expo). The `expo-web-browser` fallback (in-app browser checkout with deep link callback) is the safe default. Confirm managed workflow compatibility before committing to native SDK.

- **Physical charger TLS certificate trust:** PLUG UY's charger hardware has a specific CA trust list. Must be confirmed with Prosepac before staging environment setup. If the hardware doesn't trust Let's Encrypt, a commercial CA cert is required.

- **Fase 0 decisions blocking Fase 1 implementation:** Payment provider, currency, commission model, liquidation model, idle fee parameters, and DGI/fiscal compliance are all unresolved. Coding Fase 1 payment and billing features without these decisions leads to rework. All Fase 0 blockers must close before Fase 1 planning.

- **OCPP 1.6 variant (1.6J vs 1.6S):** Almost certainly JSON (1.6J) but must be confirmed with hardware specs. The Java-OCA-OCPP library supports 1.6J. If hardware uses SOAP (1.6S), a different integration path is required.

- **Owner panel scope in MVP:** PROJECT.md lists this as a Fase 0 open decision. Phase 6 scope is directly affected — a minimal earnings view is very different from a full reporting dashboard.

---

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — client requirements, Fase 0 blockers, out-of-scope decisions
- `.planning/research/FEATURES.md` — OCPP 1.6 message catalog, feature dependency chain
- `.planning/research/ARCHITECTURE.md` — hexagonal architecture extension patterns, data flow diagrams
- Existing POC codebase (`backend/pom.xml`, `frontend/src/`) — current dependency versions and known issues
- OCPP 1.6 specification (Open Charge Alliance, 2015/2019 errata) — protocol semantics

### Secondary (MEDIUM confidence)
- Training data (cutoff Aug 2025) — Spring Boot 3.3, Java-OCA-OCPP, MercadoPago API, FCM
- `.planning/research/STACK.md` — technology recommendations with rationale
- `.planning/research/PITFALLS.md` — pitfall catalog with phase-specific warnings
- SteVe (open source Java OCPP Central System) — pattern reference for WebSocket handler and registry design

### Tertiary (LOW confidence / needs verification)
- MercadoPago Marketplace API Uruguay availability — requires direct verification with MercadoPago
- Java-OCA-OCPP current release — requires checking GitHub releases page
- Physical charger CA trust list — requires confirmation from PLUG UY / Prosepac
- Uruguay DGI e-factura requirements for platform commission — requires legal review
- MercadoPago pre-authorization expiry window for Uruguay — may differ from Argentina

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes — pending Fase 0 decisions listed in Gaps section*
