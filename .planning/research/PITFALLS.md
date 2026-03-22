# Domain Pitfalls

**Domain:** EVSE Platform (EV Charger Management) — OCPP 1.6, payments with split flows, React Native mobile
**Project:** Prosepac / Chargers Manager
**Researched:** 2026-03-18
**Overall confidence:** MEDIUM — based on training knowledge (cutoff Aug 2025). All external research tools were unavailable during this session. Findings reflect well-established OCPP, payment, and mobile patterns known before cutoff. Flag all claims for verification against current OCPP 1.6 spec and MercadoPago/Stripe docs before implementation.

---

## Critical Pitfalls

Mistakes that cause data loss, payment fraud, rewrites, or production incidents.

---

### Pitfall C-1: Treating OCPP WebSocket as Stateless — Ignoring Session Resumption

**What goes wrong:** The OCPP Central System (backend) is designed as if each WebSocket connection is independent. When a charger reconnects (after a network drop), the backend creates a new logical session instead of resuming the in-flight one. The charger already has an open `transactionId` from a `StartTransaction.conf` it received before disconnecting — but the backend has lost or orphaned that state.

**Why it happens:** Teams implement OCPP on top of Spring WebSocket or a generic WebSocket library without persisting charger state to a durable store (DB or Redis). Session state lives only in memory (Java object / connection context). When the WebSocket drops, the memory-resident state is gone.

**Consequences:**
- Active session cannot be stopped — `StopTransaction` arrives with a `transactionId` the backend no longer recognizes
- Energy meter values (`MeterValues`) after reconnect are silently dropped
- Billing is based on incomplete data: understated kWh, wrong session duration
- The charger thinks it has an open transaction; the backend thinks the charger is idle — "ghost session" divergence that only clears on charger reboot

**Prevention:**
- Persist `transactionId`, `connectorId`, `idTag`, `meterStart`, and `sessionStart` to the database the moment `StartTransaction.conf` is sent — not after
- Use an idempotent `transactionId` strategy: charger generates its own ID or backend issues a UUID stored before confirmation
- On `BootNotification` from a charger, query the DB for any open transaction on that `chargePointId`; if found, resume it and log the reconnection event
- Implement a "session reconciliation" step in `BootNotification` handling: if charger status is `Charging` but backend has no open session, log a warning and initiate `RemoteStopTransaction`

**Warning signs:**
- Charging history shows sessions with 0 kWh or 0 duration
- `StopTransaction` logs show "transaction not found" errors
- Chargers appear as "Available" in backend while physically occupied

**Phase:** Fase 1 — must be addressed before any real charger hardware is connected

---

### Pitfall C-2: Not Handling `StopTransaction` Arriving After WebSocket Reconnect

**What goes wrong:** The charger stores `StopTransaction` locally during connectivity loss and sends it when the WebSocket reconnects. The backend receives a `StopTransaction` with a `transactionId` created in a previous connection. If the backend did not persist that `transactionId`, it rejects the message or silently no-ops it. The charger moves to `Available` (because it sent Stop successfully from its perspective), but the backend never closes the billing record.

**Why it happens:** Closely related to C-1, but specifically about the "offline charger queue" behavior — chargers buffer messages when offline and replay them on reconnect. This is mandated behavior in OCPP 1.6 but often overlooked in Central System implementations.

**Consequences:**
- Billing record remains open indefinitely (zombie sessions)
- Charging station appears Available but billing is stuck
- Manual intervention required for every dropped-connection session in the field

**Prevention:**
- Every `StopTransaction` must be idempotent: if the `transactionId` is already closed, return `Accepted` and log (do not return an error that causes charger retry loops)
- Design the billing close step as a state machine: `OPEN → CLOSING → CLOSED`. `StopTransaction` triggers `CLOSING`; payment capture triggers `CLOSED`
- Add a background job that flags sessions open for more than N hours and alerts admin

**Warning signs:**
- Sessions with `startTime` but no `endTime` after 24 hours
- Revenue reconciliation gaps between sessions started and sessions billed

**Phase:** Fase 1

---

### Pitfall C-3: Using Wall-Clock Time for Session Billing Instead of Meter Values

**What goes wrong:** The billing engine calculates cost as `duration × rate` using the server timestamp of `StartTransaction` and `StopTransaction`. This appears correct but diverges from reality when: the charger pauses mid-session (EV battery management), the charger buffers messages during offline periods (timestamps are charger-side), or the meter value reports are delayed.

**Why it happens:** Wall-clock billing is simpler to implement. Meter values require parsing `MeasurandType` enum values from `MeterValues` messages and correlating them with session state.

**Consequences:**
- Billing for energy not delivered (charger paused, car full)
- OCPP meter value data is collected but never used for billing
- Disputes from customers who were charged for idle time

**Prevention:**
- Use `MeterValues` with `Measurand = Energy.Active.Import.Register` as the authoritative billing source (kWh delta = `meterStop - meterStart`)
- Treat kWh-based billing (bajada de bandera + $/kWh) as the contract with charger owners — the POC already defines this model
- Fall back to duration-based estimate ONLY if `meterStop` is absent in `StopTransaction` (charger power failure case); log the fallback prominently
- Store both `meterStart` and `meterStop` from `StartTransaction.req` / `StopTransaction.req` (charger-reported, more reliable than `MeterValues` stream)

**Warning signs:**
- Customer complaints about being charged when "the car was done charging"
- Revenue numbers don't match energy consumption reports from the charger hardware

**Phase:** Fase 1 — pricing model implementation

---

### Pitfall C-4: Split Payment Race Condition — Capturing Before Charger Confirms Stop

**What goes wrong:** The mobile app flow completes the UX ("session ended") and triggers payment capture before `StopTransaction` is received and processed on the backend. If `StopTransaction` arrives late (offline charger), the payment was captured against `meterStart` only (kWh = 0 or estimated). The real `meterStop` arrives later, but payment has already settled.

**Why it happens:** Mobile UX pressure to close the loop quickly. The app receives a "stop" response from the backend API (which just issued `RemoteStopTransaction` to the charger), and immediately proceeds to payment. `RemoteStopTransaction` is not a confirmation that the charger has stopped — it's a request.

**Consequences:**
- Incorrect charge amount (under or over)
- Refund/adjustment workflows required retroactively
- MercadoPago split payments are hard to partially reverse; full refund + re-charge is the only clean path

**Prevention:**
- Separate "session stop requested" from "session stop confirmed" — only initiate payment capture after `StopTransaction.req` is received from the charger and stored
- Define a timeout: if `StopTransaction` does not arrive within N minutes of `RemoteStopTransaction`, use the last received `MeterValues` reading as `meterStop` and capture with a "estimated billing" flag
- In the mobile app, show a "Finalizando sesión..." loading state while waiting for backend confirmation (do not let user navigate away freely)
- Implement a webhook/push from backend to mobile when session is truly closed (not just when stop was requested)

**Warning signs:**
- Payment amounts differ from kWh amounts shown in session summary
- Support tickets: "I was charged wrong amount"

**Phase:** Fase 1 — session lifecycle and payment integration must be designed together

---

### Pitfall C-5: MercadoPago Pre-authorization (Reserva) Expiry Killing Active Sessions

**What goes wrong:** The payment flow pre-authorizes a maximum amount on the user's card at session start. MercadoPago pre-authorizations (reservas) expire after a fixed window (typically 7 days, sometimes 30 days depending on the payment method and acquiring bank). Long sessions or sessions in dispute are recaptured after expiry — and MercadoPago returns an error. The code catches the error with a `console.warn` and marks payment as `pending` (already present in the codebase: `ChargingDetailScreen.tsx` lines 192–205).

**Why it happens:** Pre-auth expiry is a payment network constraint that is easy to miss in development (tests never run for 7 days). The POC codebase already has the silent-fail pattern that masks this.

**Consequences:**
- Revenue loss: session completed, energy delivered, payment silently failed
- No automated retry: `pending` status sits forever unless an admin reviews it
- MercadoPago's split/marketplace (Marketplace API) has additional constraints on pre-auth capture windows

**Prevention:**
- Set the pre-auth amount to a realistic maximum (e.g., 2× the average session cost), not an astronomical ceiling
- Capture immediately when `StopTransaction` is confirmed — minimize the window between pre-auth and capture
- Build a payment retry job: sessions with `paymentStatus = PENDING` older than 1 hour get retried up to 3 times
- Alert admin when a payment enters `FAILED` state — do not silently discard
- Verify MercadoPago Marketplace API pre-auth window for Uruguay specifically (may differ from Argentina docs)

**Warning signs:**
- Sessions in `paymentStatus = PENDING` accumulating over time
- Revenue reports show lower totals than session counts suggest

**Phase:** Fase 1 — payment integration. Pre-auth window must be verified against MercadoPago docs for UY before implementation.

---

### Pitfall C-6: MercadoPago Split Payments (Marketplace) Require Sellers to be Onboarded — Not Just Accounts

**What goes wrong:** The team assumes that knowing a charger owner's MercadoPago account email is sufficient to route split payments to them. In reality, MercadoPago Marketplace (the split/commission model) requires each seller (charger owner) to explicitly OAuth-authorize the marketplace application, granting it permission to collect on their behalf. This is a multi-step onboarding flow involving the seller visiting a MercadoPago URL and granting permissions.

**Why it happens:** The split payment requirement is documented as a business rule ("cobro automático al finalizar sesión, split automático plataforma/propietario") without the team realizing that MercadoPago's technical implementation requires seller onboarding, not just configuration.

**Consequences:**
- Cannot route payments to charger owners until they complete onboarding
- MVP launch is blocked if even one charger owner hasn't completed the OAuth flow
- Onboarding UX needs to be built and tested — this is not trivial
- If Stripe Connect is chosen instead, similar constraints apply (Stripe Connect onboarding)

**Prevention:**
- Resolve the Stripe vs MercadoPago decision (Fase 0 blocker) before any payment code is written
- Design the charger owner onboarding flow to include the payment provider's seller authorization step
- For MVP with a single operator (Prosepac), simplify: collect all payments to the platform account and reconcile manually until the seller onboarding UX is built
- Document the exact Marketplace OAuth scopes required

**Warning signs:**
- "We just need their bank account number" assumptions in planning
- Payment provider docs only read up to the basic payment API section (not the Marketplace section)

**Phase:** Fase 0 — this decision changes the owner onboarding design entirely

---

## Moderate Pitfalls

### Pitfall M-1: OCPP Message Queue Not Handling Backpressure — Commands Lost on Reconnect

**What goes wrong:** The Central System sends `RemoteStartTransaction` or `ChangeAvailability` to a charger whose WebSocket just dropped. The command is acknowledged as "sent" but the charger never received it. When the charger reconnects, there is no mechanism to replay the command — it is silently lost.

**Prevention:**
- Maintain a per-charger command queue persisted in the database (status: `QUEUED → SENT → CONFIRMED/FAILED`)
- On charger reconnect (`BootNotification`), replay any `QUEUED` commands in order
- Apply idempotency: charger-side commands like `ChangeAvailability` are safe to replay; `RemoteStartTransaction` is not (could start a second session) — only replay non-idempotent commands if the previous session is confirmed closed
- Set a TTL on queued commands (e.g., 5 minutes for `RemoteStart`, 24 hours for `ChangeAvailability`)

**Warning signs:**
- Admin clicks "Enable charger" but charger stays offline-looking for minutes
- Sessions that "never started" even though user got a confirmation

**Phase:** Fase 1 — OCPP Central System implementation

---

### Pitfall M-2: Heartbeat Misinterpretation — Confusing "Online" with "Operational"

**What goes wrong:** The backend uses heartbeat receipt as the sole indicator of charger health. A charger can send `Heartbeat` while having a connector fault or being in `Faulted` state. The admin dashboard shows it as "Online" while it is actually unable to charge.

**Prevention:**
- Maintain both `connectionStatus` (WebSocket alive = `CONNECTED/DISCONNECTED`) and `operationalStatus` (from `StatusNotification`: `Available`, `Charging`, `Faulted`, `Unavailable`) as separate fields
- Display both to admin; surface `Faulted` as an alert, not just a status label
- The POC's `ChargerStatus` enum (`AVAILABLE`, `CHARGING`, `OUT_OF_SERVICE`) is a good start — map OCPP's richer status set to it carefully

**Warning signs:**
- Admin dashboard shows charger as green while users report it won't start a session

**Phase:** Fase 1 — status model design

---

### Pitfall M-3: Pricing Model Stored in Frontend — Not Enforced on Backend

**What goes wrong:** The POC already has this: `pricePerKwh: 2.5` is hardcoded in `chargerService.ts`. The backend has no pricing model. When pricing changes (per-charger rate, time-of-day, promotional discount), the change must be made in the mobile app and the admin panel independently, with no single source of truth, and existing sessions mid-charge use stale prices.

**Prevention:**
- Pricing must live in the backend `Charger` domain model and be returned in the charger detail API response
- The billing calculation must happen on the backend (never trust client-computed amounts for payment capture)
- Store the tariff at session-start as a snapshot (`pricePerKwhAtSessionStart`) — prevents billing disputes when tariffs change mid-session
- The POC already defines `bajada de bandera + precio por kWh` as the model — implement this as a `Tariff` value object in the domain

**Warning signs:**
- Frontend and admin panel show different prices for the same charger
- Price changes require a mobile app release

**Phase:** Fase 1 — domain model, before any payment code

---

### Pitfall M-4: Free Sessions (tarifa $0) Creating Payment Provider Transactions

**What goes wrong:** A charger configured with `pricePerKwh = 0` triggers the same session flow as paid sessions, including a pre-authorization call to MercadoPago. Payment providers may charge fees on zero-amount transactions, reject them, or log them in ways that confuse reconciliation.

**Prevention:**
- Gate the payment flow at session start: `if (charger.tariff.isZero()) skip pre-authorization`
- Create a `ChargingSession` record with `paymentStatus = NOT_APPLICABLE` for free sessions
- The project requirements already call this out explicitly ("Cargadores gratuitos (tarifa $0) sin generar transacción de pago") — ensure this gate is implemented at the domain service level, not just the frontend

**Warning signs:**
- MercadoPago dashboard shows zero-amount authorizations

**Phase:** Fase 1

---

### Pitfall M-5: Connectivity Loss During Active Session — No Client-Side Reconciliation

**What goes wrong:** The mobile app loses internet mid-session (common in parking garages). The user cannot see session progress, cannot stop the session manually from the app, and panics. If the user closes the app, the backend detects the stop request never came and the session stays open until charger-side timeout or physical unplug.

**Prevention:**
- The charger can always stop a session independently via the physical stop button or `StopTransaction` triggered by EV disconnect — this is OCPP 1.6 compliant behavior; rely on it as the fallback
- Design the mobile session screen to cache the session ID in AsyncStorage; on app relaunch, reconnect to the session state via the backend API
- Show a "Session running in background" notification (via FCM) that the user can tap to reopen the session screen
- Add an automatic timeout on the charger side (`ConnectionTimeOut` OCPP config parameter) as a backstop

**Warning signs:**
- Sessions with very long durations in logs (user couldn't stop, session ran to charger timeout)
- Support tickets about charges for sessions the user "thought they stopped"

**Phase:** Fase 1 — session lifecycle and notification design

---

### Pitfall M-6: MercadoPago Webhook Reliability — Assuming Delivery Order

**What goes wrong:** MercadoPago webhooks do not guarantee delivery order. A `payment.updated` (captured) event can arrive before `payment.created`, or a webhook can be retried out of order after a temporary server failure. If the backend processes webhooks in arrival order without idempotency checks, it can record double-captures or skip reconciliation.

**Prevention:**
- Store the raw webhook payload with a unique `resource` ID; deduplicate before processing
- Make all webhook handlers idempotent: processing the same event twice must not change state a second time
- On receiving `payment.updated`, query MercadoPago's API for the current payment state rather than relying solely on the webhook payload (webhooks can have stale data)
- Implement a webhook signature verification step (MercadoPago provides HMAC headers) — do not process unsigned webhooks

**Warning signs:**
- Duplicate payment records for the same session
- Payments appearing as both "captured" and "pending" simultaneously

**Phase:** Fase 1 — payment integration

---

### Pitfall M-7: OCPP Authorization (idTag) Bypassed — No Real User-Charger Binding

**What goes wrong:** The OCPP `StartTransaction` message includes an `idTag` (the user's RFID token or app-generated token). Many implementations send a fixed idTag (`"MOBILE"` or a hardcoded string) for all mobile-initiated sessions. This means the Central System cannot attribute sessions to specific users, cannot block suspended accounts, and cannot enforce per-user session limits.

**Prevention:**
- Generate a unique, per-user `idTag` token stored in the backend (e.g., UUID tied to the user account)
- Validate the `idTag` on `StartTransaction.req` against the user's status (active, suspended, payment method valid)
- Return `Blocked` status in `StartTransaction.conf` if validation fails
- Do not expose the raw `idTag` in the mobile app — it should be an opaque token assigned at session-start via the backend API

**Warning signs:**
- All sessions in logs show the same `idTag`
- No way to stop a specific user's session from the admin panel

**Phase:** Fase 1

---

## Minor Pitfalls

### Pitfall m-1: Admin Dashboard Polling Overload at Scale

**What goes wrong:** The POC already has this: `setInterval(loadChargers, 15000)` fetching the full charger list on every tick. With 50+ chargers and multiple admin browser tabs open, this creates significant backend load with zero delta information most of the time.

**Prevention:** Replace polling with WebSocket or Server-Sent Events for real-time charger status updates. The OCPP layer already has WebSocket connections to chargers — the Central System can broadcast status changes to admin clients without polling.

**Phase:** Fase 1 (or acceptable technical debt for MVP if charger count is low)

---

### Pitfall m-2: React Native Timer Leaks in Charging Session Screen

**What goes wrong:** The POC's `ChargingDetailScreen.tsx` uses cascading `setTimeout` and `setInterval` calls without cleanup coordination. If the user navigates away during the connecting phase, timers fire against unmounted state, causing React Native "Can't perform a React state update on an unmounted component" warnings and potentially incorrect state in subsequent sessions.

**Prevention:** Wrap all timers in `useRef`, cancel them in `useEffect` cleanup, and guard all `setState` calls with a `mounted` ref. This is already flagged in `CONCERNS.md`.

**Phase:** Fase 1 — fix before connecting to real OCPP backend

---

### Pitfall m-3: Navigation Param Type Unsafety Causing Silent Session Mismatches

**What goes wrong:** All screens use `{ route, navigation }: any`. `ChargingDetailScreen` creates a dummy charger object when params are missing rather than showing an error. In a real session, missing the `charger` param could result in billing being applied to the wrong charger or silently failing.

**Prevention:** Define typed navigation params before wiring up real session data. A wrong `chargerId` in params during a real charging session is a billing integrity issue.

**Phase:** Fase 1 — before real session wiring

---

### Pitfall m-4: H2 In-Memory DB with No Migration Tooling — Schema Drift on Upgrade

**What goes wrong:** Adding fields to the `Charger` entity (e.g., `pricePerKwh`, `connectorType`, `idTag`) with `ddl-auto: create-drop` destroys all data on restart. When switching to PostgreSQL for production, there is no migration history, so the schema applied manually or via `create` differs from what tests expect.

**Prevention:** Add Flyway now, before significant schema work begins. Every domain model change gets a versioned migration script. The POC already identified this (`CONCERNS.md`).

**Phase:** Fase 1 — first task before any schema changes

---

### Pitfall m-5: Uruguay / LatAm Fiscal Compliance — IVA on Platform Commission

**What goes wrong:** The platform charges commission per transaction. In Uruguay, this commission may be subject to IVA (22%). If the commission calculation does not account for IVA, the platform either absorbs the tax or has incorrect revenue reporting. Additionally, DGI (Dirección General Impositiva) may require e-invoicing (e-factura) for B2B payments to charger owners.

**Prevention:**
- Resolve the "moneda de facturación y cumplimiento DGI" decision (already listed as Fase 0 blocker)
- If operating in UYU (pesos uruguayos), determine if the mobile app price display must show IVA included or excluded
- Evaluate whether e-factura integration is required at MVP or can be deferred
- Note: Stripe's VAT handling for LatAm is limited; MercadoPago has deeper local fiscal infrastructure

**Warning signs:**
- Commission amounts that are round numbers (suggests tax hasn't been modeled)
- No mention of IVA in pricing model discussions

**Phase:** Fase 0 — legal/fiscal, before payment provider is chosen

---

### Pitfall m-6: OCPP Over WSS — TLS Certificate Management Overlooked

**What goes wrong:** OCPP 1.6 over WSS requires a valid TLS certificate on the Central System endpoint that the charger hardware trusts. Charger hardware (especially older EVSE units) may have a pinned CA list that doesn't include Let's Encrypt or may require a specific certificate format. Some EVSE hardware requires the backend to present a certificate from a commercial CA.

**Prevention:**
- Verify with Prosepac / Prosepac what CA the physical chargers trust before choosing a TLS certificate provider
- Test WSS connectivity with the actual charger hardware in a staging environment early
- Use a wildcard or specific domain cert aligned with the charger configuration

**Warning signs:**
- TLS handshake failures in charger logs with no obvious cause
- Charger connects successfully in dev (no TLS) but fails in staging (WSS)

**Phase:** Fase 1 — infrastructure setup, before any real charger connection attempt

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| OCPP Central System design | C-1: Session state lost on reconnect | Persist session to DB before sending `StartTransaction.conf` |
| OCPP Central System design | C-2: `StopTransaction` for unknown transaction | Idempotent stop handler; never return error to charger on unknown ID |
| Session billing calculation | C-3: Wall-clock billing vs meter values | Use `meterStop - meterStart` from charger as billing source |
| Payment integration | C-4: Capture before `StopTransaction` confirmed | Decouple "stop requested" from "stop confirmed" in state machine |
| MercadoPago pre-auth | C-5: Pre-auth expiry on long sessions | Capture immediately after confirmed stop; add payment retry job |
| Payment split design | C-6: Seller onboarding not just account config | Design owner onboarding to include Marketplace OAuth before writing payment code |
| Admin dashboard | m-1: Polling overload | Replace polling with SSE or WebSocket for status updates |
| Schema / DB | m-4: H2 + no migrations | Add Flyway before any schema changes in Fase 1 |
| Mobile session screen | m-2, m-3: Timer leaks and untyped params | Fix before wiring real OCPP backend |
| Charger status model | M-2: Heartbeat ≠ Operational | Model `connectionStatus` and `operationalStatus` as separate fields |
| Pricing model | M-3: Price in frontend | Pricing must be in backend domain and captured at session-start |
| Free charger sessions | M-4: Zero-amount payment transaction | Gate payment flow at domain service level based on tariff |
| Connectivity loss | M-5: Mobile can't stop session offline | Charger physical stop is the backstop; store session ID in AsyncStorage |
| Webhooks | M-6: MercadoPago delivery order | Idempotent handlers + query payment state from API on webhook receipt |
| User-charger binding | M-7: Fixed idTag for all sessions | Per-user idTag generated by backend; validated on `StartTransaction.req` |
| Uruguay operations | m-5: IVA and DGI fiscal compliance | Resolve in Fase 0 before payment provider selection |
| TLS / WSS | m-6: Certificate not trusted by charger hardware | Test WSS with real hardware in staging before Fase 1 launch |

---

## Sources

**Confidence notes:** All research tools (WebSearch, WebFetch, Brave Search, Bash) were unavailable during this session. Findings are based on:
- Training knowledge of OCPP 1.6 specification (Open Charge Alliance, published 2015, widely implemented)
- Known MercadoPago Marketplace API constraints (documented pre-Aug 2025)
- React Native timer lifecycle patterns (React Native 0.73+ documented behavior)
- Spring Boot / Spring WebSocket patterns
- Codebase audit findings from `.planning/codebase/CONCERNS.md`
- Project requirements from `.planning/PROJECT.md`

**Verification required before implementation:**
- MercadoPago pre-authorization expiry window for Uruguay (may differ from Argentina — LOW confidence on exact duration)
- MercadoPago Marketplace OAuth onboarding flow — verify current API version requirements (MEDIUM confidence on process, LOW on current URLs/scopes)
- Physical charger CA trust list — requires direct confirmation from Prosepac / Prosepac (LOW confidence without hardware spec)
- Uruguay DGI e-factura requirements for platform commission — requires legal review (LOW confidence)
- OCPP 1.6 exact behavior of `ConnectionTimeOut` configuration parameter — verify in OCA spec PDF (HIGH confidence on concept, MEDIUM on exact parameter name)
