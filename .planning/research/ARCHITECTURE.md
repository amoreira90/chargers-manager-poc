# Architecture Patterns

**Domain:** EVSE Platform (EV Charger Management) with OCPP 1.6
**Researched:** 2026-03-18
**Confidence:** MEDIUM — OCPP 1.6 is a published, stable spec (2015); patterns from production EVSE systems (SteVe, OCPP-J) are well-documented in training data. Web tools unavailable for current verification. Flag for validation before implementation.

---

## Recommended Architecture

The target system is a **bidirectional, event-driven platform** with three communication planes that must coexist in the same Spring Boot process:

1. **OCPP plane** — WebSocket connections from physical chargers (charge points) to the Central System. Server-initiated and charger-initiated messages flow both directions over a persistent WSS connection.
2. **REST/HTTP plane** — Client-initiated requests from the mobile app and admin dashboard. Standard request/response.
3. **Push plane** — Server-to-mobile notifications for session events (session ended, payment charged, charger offline). FCM push notifications and/or SSE/WebSocket for real-time status polling.

```
Physical Chargers (OCPP 1.6J)
        |  WSS (persistent)
        v
+---------------------------------------+
|        OCPP WebSocket Endpoint        |  infrastructure/adapter/ocpp/
|  (Spring WebSocket, one conn/charger) |
+-------+-------------------------------+
        |  OCPP messages as domain events
        v
+---------------------------------------+
|       OCPP Message Dispatcher         |  application/service/
|  Routes messages to use case handlers |
+-------+-------------------------------+
        |
        v
+---------------------------------------+     +-------------------------+
|         Domain Layer (expanded)       |     |   Session Repository    |
|  Charger, ChargingSession, Tariff,    |<--->|   (PostgreSQL, not H2)  |
|  Payment, User, Transaction           |     +-------------------------+
+-------+-------------------------------+
        |
        v
+-------+----------------+--------------+
|       REST API          |  Event Bus   |
|  /api/v1/ (HTTP)        | (in-process  |
|  Mobile + Admin clients |  or Redis    |
+------------------------+|  Pub/Sub)    |
                          +-+------------+
                            |
                            v
                   +--------+--------+
                   |   FCM / Push    |
                   |  Notification   |
                   |    Service      |
                   +-----------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| OCPP WebSocket Endpoint | Accept WSS connections from chargers; route raw OCPP-J frames to dispatcher | OCPP Dispatcher (inbound), Charger Session Registry (connection tracking) |
| Charger Session Registry | In-memory map of `chargePointId -> WebSocketSession`; required to send CS-initiated commands back to charger | OCPP Dispatcher, RemoteStart/Stop use cases |
| OCPP Message Dispatcher | Parse OCPP-J envelope (MessageTypeId, UniqueId, Action, Payload); route to appropriate handler; serialize and send CallResult/CallError responses | OCPP handlers per action, Domain use cases |
| OCPP Action Handlers | One handler per OCPP action (BootNotification, Heartbeat, StatusNotification, StartTransaction, StopTransaction, MeterValues). Each handler is a thin adapter translating OCPP payload to domain commands. | Domain use cases, Session Repository |
| ChargerService (expanded) | Existing service, extended with OCPP-driven use cases. Owns Charger aggregate lifecycle. | ChargerRepository, OCPP handlers (via use case interfaces) |
| SessionService | Owns ChargingSession aggregate: open, meter updates, close, billing trigger. Critical new domain concept. | SessionRepository, PaymentPort, PushNotificationPort |
| PaymentAdapter | Implements PaymentPort; integrates Stripe or MercadoPago. Handles charge, split (platform/owner), webhook ingestion. | Payment provider API, SessionService (callback) |
| PushNotificationAdapter | Implements PushPort; wraps FCM. Sends session-end, payment-confirmation, charger-offline notifications. | FCM API, SessionService, ChargerService |
| REST API Controllers | Standard Spring MVC. Mobile app and admin panel consume this. No OCPP logic here. | Application use cases (via interfaces) |
| Admin API Controller | Restricted endpoints for admin operations: block charger, list sessions, export CSV, view KPIs. | ChargerService, SessionService |
| Real-time Status Endpoint | Exposes charger status with max 5s staleness. Options: polling endpoint (simplest), SSE, or WebSocket. | ChargerRepository (read side) |

---

## Data Flow

### Flow 1: Charger Boot Sequence

```
Physical Charger connects via WSS
  → OCPP WebSocket Endpoint accepts connection
  → Stores session in Charger Session Registry (chargePointId → WsSession)
  → Charger sends BootNotification { chargePointModel, chargePointVendor, chargePointSerialNumber, ... }
  → OCPP Dispatcher routes to BootNotificationHandler
  → BootNotificationHandler calls UpdateChargerStatusUseCase (marks charger as AVAILABLE)
  → Persists status change to DB
  → BootNotificationHandler returns CallResult { status: "Accepted", currentTime, heartbeatInterval }
  → Charger begins sending Heartbeat every [heartbeatInterval] seconds
```

### Flow 2: App-Initiated Charging Session

```
Mobile App user taps "Start Charging"
  → REST POST /api/v1/sessions { chargerId, userId }
  → SessionService validates: charger AVAILABLE, user has valid payment method
  → SessionService creates ChargingSession (PENDING_START)
  → SessionService sends RemoteStartTransaction via Charger Session Registry
      (looks up WsSession for chargerId, sends OCPP Call message)
  → Charger receives RemoteStartTransaction → plug activates
  → Charger sends StartTransaction { connectorId, idTag, meterStart, timestamp }
  → OCPP Dispatcher routes to StartTransactionHandler
  → StartTransactionHandler: transitions ChargingSession PENDING_START → ACTIVE
      records transactionId (OCPP-assigned), meterStart
  → Returns CallResult { transactionId, idTagInfo: { status: "Accepted" } }
  → Charger begins sending MeterValues periodically
  → MeterValues received → SessionService updates session with energy counters
  → REST GET /api/v1/sessions/{id} polls show live kWh / duration / estimated cost
```

### Flow 3: Session End and Payment

```
User taps "Stop" in app
  OR charger sends StopTransaction autonomously (cable unplugged, charger full)

Path A — App-initiated stop:
  → REST POST /api/v1/sessions/{id}/stop
  → SessionService sends RemoteStopTransaction to charger via Charger Session Registry
  → Charger sends StopTransaction { transactionId, meterStop, stopReason, ... }

Path B — Charger-initiated stop:
  → Charger sends StopTransaction directly
  → OCPP Dispatcher routes to StopTransactionHandler

StopTransactionHandler (both paths):
  → ChargingSession: ACTIVE → COMPLETED
  → Calculates energy consumed (meterStop - meterStart) in kWh
  → Calculates charge: (base fee) + (kWh * tariff per kWh for that charger)
  → Publishes SessionCompleted domain event

SessionService (handles SessionCompleted):
  → Calls PaymentAdapter.charge(userId, amount, sessionId)
  → Payment provider processes charge
  → On success: marks session PAID, triggers split (platform % / owner %)
  → Sends push notification via PushNotificationAdapter: "Session ended, charged $X"
  → Sends receipt email (via email service)

Payment webhook path (async confirmation):
  → Payment provider POSTs to /api/v1/webhooks/payments
  → WebhookController verifies signature
  → Updates session payment status
```

### Flow 4: Real-Time Status (Mobile Map View)

```
Mobile App loads map screen
  → REST GET /api/v1/chargers (with location bounds)
  → Returns chargers with status from DB (updated by OCPP StatusNotification events)

Charger changes state (e.g., plug inserted → Preparing):
  → Charger sends StatusNotification { connectorId, errorCode, status, ... }
  → OCPP Dispatcher routes to StatusNotificationHandler
  → StatusNotificationHandler maps OCPP status → domain ChargerStatus
  → Updates Charger aggregate in DB
  → (Optional) Publishes ChargerStatusChanged event → SSE push to subscribed clients

Max staleness requirement: 5 seconds
  → With polling: mobile polls every 3-4s (acceptable but chatty)
  → With SSE: server-sent events on /api/v1/chargers/stream (preferred for scale)
  → With WebSocket: full-duplex, overkill for status-only reads
```

### Flow 5: Connectivity Lost During Session

```
Charger loses network mid-session (cable stays connected):
  → OCPP WebSocket connection drops
  → Charger Session Registry detects disconnect (onClose / onError)
  → ChargerService marks Charger as OFFLINE (new status needed)
  → Session remains ACTIVE in DB — do NOT auto-close

Charger reconnects:
  → Sends BootNotification (re-registers)
  → Sends StatusNotification reflecting current state
  → Charger may buffer MeterValues and send on reconnect (OCPP 1.6 supports offline buffering)
  → StopTransaction may arrive late with offline timestamp

Backend reconciliation:
  → StopTransaction with timestamp before disconnect → process normally, use OCPP meter values
  → Session still ACTIVE after [configurable timeout, e.g., 30 min] with no charger contact:
      → Mark session as SUSPENDED (new status)
      → Bill based on last known MeterValues
      → Notify user: "Session interrupted — charged based on last reading"

Key invariant: never leave a session in ACTIVE permanently without either:
  (a) receiving StopTransaction from charger, or
  (b) applying the timeout reconciliation policy
```

---

## Patterns to Follow

### Pattern 1: OCPP-J Envelope Handling

OCPP 1.6J uses JSON over WebSocket. Every message is a JSON array:

```
[MessageTypeId, UniqueId, Action, Payload]   // Call (request)
[MessageTypeId, UniqueId, Payload]            // CallResult (response)
[MessageTypeId, UniqueId, ErrorCode, ErrorDescription, ErrorDetails]  // CallError
```

MessageTypeId: 2 = Call, 3 = CallResult, 4 = CallError.

Implementation approach:

```java
// infrastructure/adapter/ocpp/OcppWebSocketHandler.java
// Implements Spring WebSocketHandler
public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) {
    JsonNode frame = objectMapper.readTree(message.getPayload().toString());
    int messageTypeId = frame.get(0).asInt();
    String uniqueId = frame.get(1).asText();

    if (messageTypeId == 2) { // Call
        String action = frame.get(2).asText();
        JsonNode payload = frame.get(3);
        ocppDispatcher.dispatch(session, uniqueId, action, payload);
    }
    // CallResult/CallError handling for responses to CS-initiated requests
}
```

Each action handler is registered in a map: `Map<String, OcppActionHandler>`. This allows adding new OCPP actions without modifying the dispatcher (Open/Closed principle).

### Pattern 2: Charger Session Registry

Because OCPP 1.6 requires the Central System to initiate commands back to the charger (RemoteStart, RemoteStop, ChangeAvailability), the backend must maintain a registry of live WebSocket sessions keyed by chargePointId.

```java
// infrastructure/adapter/ocpp/ChargerConnectionRegistry.java
@Component
public class ChargerConnectionRegistry {
    // ConcurrentHashMap for thread safety — one connection per chargePointId
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public void register(String chargePointId, WebSocketSession session) { ... }
    public void deregister(String chargePointId) { ... }
    public Optional<WebSocketSession> getSession(String chargePointId) { ... }
    public boolean isConnected(String chargePointId) { ... }
}
```

This is an infrastructure concern only — the domain never sees WebSocketSession.

### Pattern 3: OCPP as a Driving Port

OCPP messages are a driving port, same as HTTP. The pattern mirrors the existing REST adapter:

```
OCPP message (external trigger)
  → OcppActionHandler (infrastructure) — same role as ChargerController
  → Use case interface (domain port) — same interfaces, extended
  → Application service — ChargerService, SessionService
  → Domain model — Charger, ChargingSession
```

This means the hexagonal architecture maps cleanly. OCPP is just another adapter. The domain does not know whether a "stop charging" was triggered by the app via REST or by the charger via StopTransaction.

### Pattern 4: Session as Aggregate Root

ChargingSession must be a separate aggregate from Charger. They have different lifecycles and different invariants:

```java
// domain/model/ChargingSession.java
public class ChargingSession {
    ChargingSessionId id;
    ChargerId chargerId;
    UserId userId;
    String ocppTransactionId;     // assigned by charger on StartTransaction
    int meterStart;               // Wh at session open
    int meterStop;                // Wh at session close (null until StopTransaction)
    Instant startedAt;
    Instant endedAt;
    ChargingSessionStatus status; // PENDING_START, ACTIVE, COMPLETED, PAID, FAILED, SUSPENDED
    Money amount;                 // calculated on completion
    List<MeterReading> meterReadings; // intermediate MeterValues
    StopReason stopReason;        // REMOTE, LOCAL, EMERGENCY, EV_DISCONNECTED, POWER_LOSS, ...
}
```

The `ocppTransactionId` binding is critical: the charger generates this ID in the StartTransaction response, and all subsequent MeterValues and StopTransaction messages reference it. The backend must index sessions by `ocppTransactionId` to look them up efficiently.

### Pattern 5: Domain Event Publication for Cross-Aggregate Coordination

Session completion triggers payment and notifications — these cross aggregate boundaries. Use domain events to avoid coupling SessionService to PaymentService directly:

```java
// Publish after session closes:
eventPublisher.publish(new SessionCompletedEvent(sessionId, chargerId, userId, energyKwh, amount));

// Handled by:
@EventListener SessionPaymentHandler -> PaymentAdapter
@EventListener SessionNotificationHandler -> PushNotificationAdapter
```

Spring's `ApplicationEventPublisher` works for the initial implementation. Move to a message broker (Redis Streams or RabbitMQ) only when horizontal scaling requires it.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: OCPP Logic in the Domain Layer

**What:** Putting OCPP message parsing, frame construction, or protocol-specific logic inside domain models or application services.
**Why bad:** The domain would depend on OCPP protocol details. If the protocol changes (e.g., OCPP 2.0.1 migration), domain must be rewritten. Also makes unit testing impossible without OCPP machinery.
**Instead:** Keep all OCPP-specific code in `infrastructure/adapter/ocpp/`. The domain only sees domain commands (e.g., `StartSessionCommand`, `UpdateMeterCommand`).

### Anti-Pattern 2: Stateful Session in ChargerService

**What:** Adding session tracking directly to `ChargerService` instead of creating `SessionService`.
**Why bad:** Charger and Session have different lifecycles. Charger status (AVAILABLE/CHARGING) is derived from session state but the session has much richer data (billing, meter readings, OCPP transaction ID). Merging them creates a god service.
**Instead:** `ChargerService` manages Charger aggregate. `SessionService` manages ChargingSession aggregate. ChargerService updates charger status in response to session events.

### Anti-Pattern 3: Blocking WebSocket Threads on DB Operations

**What:** Processing OCPP messages synchronously on the WebSocket handler thread, including all DB writes and payment calls.
**Why bad:** OCPP 1.6 requires the Central System to respond to charger messages promptly. If the DB is slow or payment call takes 2 seconds, the charger times out waiting for CallResult. At 500 concurrent sessions, this saturates the WebSocket thread pool.
**Instead:** WebSocket handler dispatches to an async executor. OCPP handler writes to DB quickly, returns CallResult immediately, then triggers downstream work (payment, notifications) asynchronously.

### Anti-Pattern 4: H2 in Production

**What:** Running production with the current H2 in-memory database.
**Why bad:** Sessions, charger state, and payment records are lost on restart. H2 is not HA-capable. Session data is the billing source of truth — loss means unrecoverable financial discrepancy.
**Instead:** PostgreSQL (or equivalent relational DB) for persistence. This is a required infrastructure change before any OCPP work goes to production.

### Anti-Pattern 5: Using chargePointId as Primary Key Without Mapping

**What:** Assuming the `ChargerId` (platform UUID) equals the OCPP `chargePointId` (string identifier configured on the physical charger).
**Why bad:** Physical chargers have their own identifier configured by the installer (often a serial number or vendor ID). This must be mapped to the platform's UUID. A charger can be deregistered and re-registered with a different UUID while keeping the same OCPP identifier.
**Instead:** `Charger` aggregate stores an `ocppChargePointId: String` field in addition to the platform `ChargerId: UUID`. The OCPP registry keys on `ocppChargePointId`. REST API exposes platform UUIDs.

### Anti-Pattern 6: Single Application Service for All OCPP Actions

**What:** Routing all 7+ OCPP action types through a single handler class with a giant if/else or switch.
**Why bad:** Violates ISP. Adding a new OCPP action (e.g., `DataTransfer`, `DiagnosticsStatusNotification`) requires modifying the monolithic handler. Testing requires constructing the whole handler for each case.
**Instead:** One handler class per OCPP action, registered in a handler map in the dispatcher. New actions = new classes, no modification to existing code.

---

## How Existing Hexagonal Architecture Maps to EVSE Components

The existing POC hexagonal structure is the right foundation. The expansion follows the same pattern — only new adapters and new domain concepts are added.

| Existing POC Component | EVSE Extension |
|------------------------|----------------|
| `domain/model/Charger` | Expand: add `ocppChargePointId`, `connectorCount`, `tariff`, `ownerId` fields. Add `markOnline()`, `markOffline()` state methods. |
| `domain/model/ChargerStatus` enum | Expand: add `OFFLINE`, `FAULTED` statuses to map OCPP StatusNotification error states. |
| `domain/port/usecase/` | Add: `StartSessionUseCase`, `StopSessionUseCase`, `UpdateMeterUseCase`, `HandleBootNotificationUseCase`, `HandleStatusNotificationUseCase` |
| `domain/port/repository/` | Add: `SessionRepository`, `UserRepository`, `PaymentRepository` |
| `application/service/ChargerService` | Keep and extend. Add `markOnline()`, `markOffline()`, `handleBootNotification()` use cases. |
| `application/service/` (new) | Add: `SessionService`, `PaymentService`, `NotificationService` |
| `infrastructure/adapter/rest/ChargerController` | Keep. Add: `SessionController`, `PaymentWebhookController`, `AdminController`, `AuthController` |
| `infrastructure/adapter/persistence/` | Add: `SessionRepositoryAdapter`, `UserRepositoryAdapter`. Replace H2 with PostgreSQL. |
| `infrastructure/adapter/ocpp/` (new package) | New: `OcppWebSocketHandler`, `ChargerConnectionRegistry`, `OcppMessageDispatcher`, per-action handlers |
| `infrastructure/adapter/push/` (new package) | New: `FcmPushAdapter` implementing `PushNotificationPort` |
| `infrastructure/adapter/payment/` (new package) | New: `StripeAdapter` or `MercadoPagoAdapter` implementing `PaymentPort` |
| `infrastructure/config/` | Add: `WebSocketConfig` (register OCPP endpoint, configure handshake interceptors for chargePointId extraction) |

---

## Suggested Build Order (Phase Dependencies)

The build order is dictated by hard dependencies in the data flow.

```
Phase 1: Data Foundation
  └─ PostgreSQL migration (H2 → Postgres)
  └─ User/Auth domain + JWT security
  └─ Charger domain expansion (ocppChargePointId, Tariff, Owner)

  Reason: Everything else depends on persistent storage and auth.
  OCPP sessions and payments need User, Charger, and Tariff records to exist.

Phase 2: OCPP Central System Core
  └─ WebSocket endpoint + ChargerConnectionRegistry
  └─ OCPP dispatcher + BootNotification + Heartbeat handlers
  └─ StatusNotification handler (updates Charger status in DB)
  └─ StartTransaction + StopTransaction handlers
  └─ MeterValues handler

  Reason: Without OCPP, no real charger can connect. This is the critical path.
  REST-initiated RemoteStart/Stop requires the registry to be operational.

Phase 3: Session Lifecycle
  └─ ChargingSession domain aggregate
  └─ SessionService (start, stop, meter updates)
  └─ REST endpoints: start session, stop session, session status
  └─ Real-time status (polling endpoint first, SSE later)

  Reason: Sessions depend on OCPP (Phase 2) receiving StartTransaction to bind the session.

Phase 4: Payment Integration
  └─ PaymentPort domain interface
  └─ MercadoPago or Stripe adapter
  └─ Payment webhook endpoint (idempotent)
  └─ Split calculation (platform/owner)
  └─ Receipt email

  Reason: Payment depends on sessions (Phase 3) being closeable with a known energy amount.

Phase 5: Notifications + Offline Handling
  └─ FCM push notification adapter
  └─ Session suspension on charger disconnect
  └─ Reconnect reconciliation logic
  └─ Penalty flow for blocked connector (with configurable grace period)

  Reason: Notifications are last-mile UX polish; offline handling requires session state machine to be stable.

Phase 6: Admin Panel + Observability
  └─ Admin REST endpoints (block, KPIs, CSV export)
  └─ Owner panel endpoints (session history, revenue)
  └─ Expanded Grafana dashboards (OCPP message rates, session metrics)
```

---

## Scalability Considerations

| Concern | At 100 sessions | At 500 concurrent sessions (MVP target) | At 5K sessions |
|---------|-----------------|------------------------------------------|----------------|
| WebSocket connections | Default Spring WebSocket (Tomcat NIO) handles this trivially | Still within single-node capacity (NIO handles thousands of idle connections) | Single-node limit; need sticky sessions if load-balanced or use Redis pub/sub for cluster coordination |
| Charger Session Registry | ConcurrentHashMap, zero latency | Same | Move to Redis (distributed registry) if running multiple backend instances |
| DB writes | H2 fine for dev | PostgreSQL required, connection pool (HikariCP defaults) sufficient | Read replicas for status polling queries |
| Status polling (5s SLA) | DB query per poll fine | Add Redis cache layer for charger status (invalidate on StatusNotification) | Cache mandatory |
| OCPP message throughput | Synchronous processing fine | Async executor pool for message handling | Consider disruptor pattern or reactive stack |

---

## Sources

**Confidence: MEDIUM**
- OCPP 1.6 specification (Open Charge Alliance, 2015/2019 errata) — stable published standard, HIGH confidence on protocol semantics
- SteVe (Java OCPP Central System, open source) — pattern reference for WebSocket handler and registry design (training data, not verified current)
- Spring WebSocket documentation — Spring 6.x WebSocket support patterns (training data, HIGH confidence on Spring mechanics)
- Web tools unavailable during research — no current-date verification performed. All architectural claims should be validated against the OCPP 1.6 spec PDF before implementation.
- Existing POC codebase (direct read, 2026-03-18) — HIGH confidence on current state

**Note:** The OCPP 1.6 message catalog (BootNotification, Heartbeat, StatusNotification, StartTransaction, StopTransaction, MeterValues, RemoteStart, RemoteStop, ChangeAvailability) is defined in the OCPP 1.6 specification document, which should be the authoritative implementation reference. Verify all field names, required vs optional fields, and allowed enum values against the spec — do not rely solely on this document.
