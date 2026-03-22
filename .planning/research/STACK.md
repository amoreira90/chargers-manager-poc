# Technology Stack

**Project:** Prosepac — EVSE Management Platform
**Researched:** 2026-03-18
**Research Mode:** Ecosystem (brownfield — evolving existing POC)
**Confidence Note:** External fetch tools unavailable during this session. All findings are from training data (cutoff August 2025). Confidence levels reflect this limitation. Flags marked [VERIFY] require validation before implementation.

---

## Context: What the POC Already Has

The existing codebase sets the foundation. The following are non-negotiable carryovers:

| Component | Current State | Action |
|-----------|--------------|--------|
| Spring Boot 3.2.0 + Java 17 | Working, hexagonal arch | Upgrade to 3.3.x+ for Spring Security, WebSocket |
| H2 in-memory DB | Dev/test only | Replace with PostgreSQL for production |
| React Native 0.81.5 + Expo 54 | Working mobile app | Keep, add charging session libraries |
| No Spring Security | Missing | Add in Phase 1 |
| No OCPP implementation | Missing | Primary gap to fill |
| MercadoPago | Mocked, not integrated | Integrate in Phase 1 |
| Stripe | Mocked, not integrated | Evaluate (see payment section) |
| No push notifications | Missing | Add FCM via Firebase |

---

## Recommended Stack

### Core Backend Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Spring Boot | 3.3.x | Core framework | Compatible with existing hexagonal arch; 3.3 adds WebSocket improvements, virtual threads (Java 21 preview). Keep upgrade path to 3.4 open. |
| Java | 17 → 21 | Runtime | POC uses 17; Java 21 LTS adds virtual threads (critical for 500 concurrent WebSocket connections per requirement). Migrate to 21 in Phase 1. |
| Spring Security 6.x | 6.3.x | Auth + role-based access | Ships with Spring Boot 3.3. Required for JWT, roles (User/Owner/Admin), OCPP WebSocket auth. |
| Spring WebSocket | 6.x (bundled) | OCPP WebSocket server | Spring's built-in WebSocket support is sufficient for OCPP 1.6 at 500 concurrent sessions. No separate broker needed at this scale. |

**Confidence: HIGH** — Spring Boot 3.x + Java 21 is well-established standard stack.

---

### OCPP 1.6 — The Critical Gap

This is the highest-risk component. No Java library handles OCPP perfectly with Spring Boot. Three realistic options:

#### Option A: ChargeTime EU `Java-OCA-OCPP` (RECOMMENDED)

**Maven coordinates:**
```xml
<dependency>
    <groupId>eu.chargetime.ocpp</groupId>
    <artifactId>v1_6</artifactId>
    <version>1.0.0</version>
</dependency>
```

**What it is:** Open-source Java library implementing OCPP message parsing, validation, and session management for OCPP 1.6. Embeddable — not a full server application. You add it to your Spring Boot app as a library.

**Why this:** The hexagonal architecture of the POC is a perfect fit. You implement `IServerAPI` and wire OCPP event handlers as domain port implementations. The library handles the WebSocket JSON framing; your `ChargerService` handles business logic.

**What it covers:** BootNotification, Heartbeat, StatusNotification, StartTransaction, StopTransaction, MeterValues, RemoteStart, RemoteStop, ChangeAvailability — exactly the message set in your Phase 1 requirements.

**Limitation:** Community-maintained. Last verified release: 1.0.0 (2023). Active issues but slower patch cadence. [VERIFY: check GitHub for 2024-2025 releases before implementing]

**Confidence: MEDIUM** — Library exists and is used in production EVSE implementations; version number needs verification.

#### Option B: SteVe (NOT RECOMMENDED for this use case)

SteVe (`steve-community/steve`) is a complete, standalone OCPP Central System application — not a library. It runs as its own Spring Boot app. Embedding it into your hexagonal backend would require running two separate services with cross-service communication, which contradicts the architecture goal and adds operational complexity.

**Do not use** unless you decide to run SteVe as a sidecar and proxy OCPP events to your business backend via REST or messaging. That pattern has merit for very large fleets but adds unnecessary complexity at 500 sessions.

#### Option C: CitrineOS (NOT RECOMMENDED for MVP)

CitrineOS is an open-source CSMS (Charge Station Management System) from ChargePoint, supporting OCPP 2.0.1 and later versions. Since Prosepac's hardware is locked to OCPP 1.6, CitrineOS does not apply.

#### Implementation Pattern with Java-OCA-OCPP

```
OCPP WebSocket (WSS) port (e.g., 8443)
    ↓
Spring WebSocket endpoint (/ocpp/{charger_id})
    ↓
Java-OCA-OCPP Server (handles framing, message routing)
    ↓
OCPP Handler Beans (Spring @Component) → domain port
    ↓
ChargerService (existing hexagonal application layer)
    ↓
Domain Events → StatusNotification persisted, MeterValues recorded
```

**Key implementation decision:** OCPP WebSocket must authenticate chargers on connection using BasicAuth or a token in the WebSocket URL path — this is the OCPP 1.6 standard. Spring Security needs to intercept the WS upgrade request.

---

### Database — Replace H2 in Production

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 16.x | Primary persistence | H2 is dev/test only by design (current `create-drop` DDL). PostgreSQL for production: JSONB support for OCPP MeterValues (flexible schema), mature Spring Data JPA support, excellent connection pooling. |
| Flyway | 10.x | Schema migrations | Required the moment you move from `create-drop` to a real DB. Flyway integrates cleanly with Spring Boot 3.x. Enables zero-downtime migrations. |
| HikariCP | (bundled with Spring Boot) | Connection pooling | Already included via `spring-boot-starter-data-jpa`. Configure pool size for 500 concurrent sessions. |
| Redis | 7.x | Session state + charger status cache | Charger state (AVAILABLE/CHARGING/OFFLINE) must be queryable in <5s per requirement. Redis provides sub-millisecond reads. Also used for distributed rate limiting if scaling horizontally. |

**Confidence: HIGH** — PostgreSQL + Flyway + Redis is the standard Spring Boot production stack.

**NOT recommended:** MongoDB for the main domain model. The relational structure (chargers, sessions, payments, users, splits) maps cleanly to SQL. JSONB in PostgreSQL handles the semi-structured parts (MeterValues).

---

### Spring Security + Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Spring Security | 6.3.x (via Boot 3.3) | Auth framework | Role-based access: USER, OWNER, ADMIN. One user can hold multiple roles (requirement from PROJECT.md). |
| JJWT (java-jwt) | 0.12.x | JWT token library | Industry standard for Spring Boot JWT. `io.jsonwebtoken:jjwt-api` + `jjwt-impl` + `jjwt-jackson`. Stateless auth — required for mobile clients. |
| Spring OAuth2 Resource Server | 6.3.x (via Boot) | Google/Apple OAuth | Handles JWT validation from Google/Apple identity tokens without a third-party auth server. Simpler than Keycloak for a 2-3 person team. |

**Maven coordinates for JJWT:**
```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>
```

**NOT recommended:** Keycloak for MVP. Keycloak is operationally heavy (separate service, admin console, realm config). For a 2-3 person team building to 500 users, custom Spring Security with JWT is faster to ship and easier to debug.

**Confidence: HIGH** — JJWT 0.12.x is the current stable release; Spring OAuth2 Resource Server is well-documented.

---

### Payments — LatAm/Uruguay

This is the biggest open question (explicitly flagged in PROJECT.md as a blocking decision). Research findings:

#### MercadoPago (RECOMMENDED as primary)

**Why MercadoPago:**
- Uruguay is a supported country for MercadoPago. [VERIFY: confirm Uruguay-specific account type — Mercado Pago Uruguay may have different API surface than Argentina]
- The POC already has the MercadoPago public key configured in `.env.example` and mock routes planned
- MercadoPago supports card payments, split payments (Marketplace API), and webhooks — all required for the commission split between Prosepac and charger owners
- MercadoPago's Marketplace/Split API allows charging a user's card and automatically routing a percentage to the charger owner's sub-account, which is exactly the `platform cut + owner split` model in requirements

**Java SDK:**
```xml
<dependency>
    <groupId>com.mercadopago</groupId>
    <artifactId>sdk-java</artifactId>
    <version>2.1.x</version>
</dependency>
```
[VERIFY: latest version on Maven Central as of 2026]

**Key MercadoPago concepts for this use case:**
- **Preauthorization (hold):** Authorize a card at session start for an estimated amount, capture the real amount at session end. MercadoPago supports this via Payment with `capture: false` → then capture. This is the correct model for EV charging where the final amount is unknown at start.
- **Marketplace split:** Requires each charger owner to connect their MercadoPago account via OAuth to the platform. Enables automatic commission deduction.
- **Webhooks:** POST to your backend with payment status updates. Required for async confirmation handling.

**Confidence: MEDIUM** — MercadoPago Uruguay availability and exact Marketplace API availability for Uruguay needs verification with MercadoPago directly. The API structure is well-known but country-specific features vary.

#### Stripe (SECONDARY — for Google Pay / Apple Pay)

**Why keep Stripe as secondary:**
- Stripe supports Google Pay and Apple Pay via Stripe Elements / Payment Intents natively
- MercadoPago's support for Apple Pay is limited/nonexistent in some LatAm markets [VERIFY]
- The current mock has Stripe routes for Google Pay and Apple Pay already planned
- Stripe's split payments (Connect) is more complex to implement than MercadoPago Marketplace for LatAm contexts

**NOT recommended as primary** because:
- Stripe's LatAm payment method coverage (local bank transfers, local debit cards) is inferior to MercadoPago
- MercadoPago is already in the frontend env config, indicating client preference

**Architecture recommendation:** Use MercadoPago for card payments and native LatAm methods. Gate Google Pay / Apple Pay behind Stripe only if the client confirms demand for those methods in Uruguay. Don't integrate both providers in MVP — pick one and do it properly.

**Confidence: MEDIUM** — Stripe Uruguay availability is HIGH confidence; the relative merits of MercadoPago vs Stripe for Uruguay split payments needs validation.

#### What NOT to use:
- **PayU:** Active in LatAm but thinner Java SDK ecosystem and weaker split payment API
- **dLocal:** Specialized in LatAm cross-border payments, overkill for domestic Uruguay MVP
- **Conekta:** Mexico-focused, not relevant

---

### Push Notifications

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Firebase Cloud Messaging (FCM) | v1 API (HTTP v1) | Push notifications | Industry standard. Supports both Android and iOS from a single backend integration. PROJECT.md explicitly requires FCM. |
| Firebase Admin SDK (Java) | 9.x | Backend FCM sender | Official Google SDK for sending FCM messages from Java server |
| Expo Notifications | (SDK 54 bundled) | Frontend notification handler | Expo provides a wrapper around FCM/APNs. Works in managed workflow. Requires Expo notification service for bare-to-managed bridge. |

**Maven coordinates:**
```xml
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.3.0</version>
</dependency>
```
[VERIFY: latest version]

**Architecture note:** Store FCM device tokens in the `users` table. Tokens are registered from the mobile app at login and refreshed when FCM rotates them. The backend sends notifications from the application service layer (not domain — notifications are infrastructure concerns).

**Notification types required (from PROJECT.md):**
1. Session ended (triggered by StopTransaction OCPP message)
2. Payment charged (triggered by payment webhook)
3. Charger offline (triggered by connection timeout / missing Heartbeat)
4. Stuck cable penalty warning (triggered by configurable grace period timer)

**Expo-specific consideration:** Expo's push notification service adds an abstraction layer that simplifies iOS APNs handling but introduces a dependency on Expo's servers. For production, using FCM HTTP v1 API directly from the backend (bypassing Expo's service) is more reliable. The frontend uses `expo-notifications` for local handling regardless.

**Confidence: HIGH** — FCM + Firebase Admin SDK is the established standard.

---

### Real-Time WebSocket Management

**At 500 concurrent sessions, Spring WebSocket is sufficient.**

| Technology | Purpose | Why |
|------------|---------|-----|
| Spring WebSocket (STOMP disabled) | OCPP WebSocket server | OCPP 1.6 uses raw WebSocket with JSON subprotocol (`ocpp1.6`), not STOMP. Use Spring's raw WebSocket without SockJS or STOMP broker. |
| Spring WebSocket (STOMP enabled) | Client-facing real-time status updates | Use STOMP over WebSocket for pushing charger status updates to the admin web dashboard and future mobile app features. |

**Two separate WebSocket concerns:**

1. **OCPP WebSocket (charger ↔ backend):** Raw WebSocket, OCPP 1.6 subprotocol, authenticated by charger ID + password. One persistent connection per physical charger. Low message volume, high reliability requirement.

2. **Frontend WebSocket (app/admin ↔ backend):** STOMP over WebSocket or Server-Sent Events (SSE). Pushes charger status changes to connected clients. Higher connection count (one per active user session).

**Scale consideration:** 500 concurrent charging sessions does NOT mean 500 OCPP connections necessarily. It means 500 active sessions across however many chargers exist. If Prosepac has 50 chargers, you have 50 OCPP WebSocket connections and potentially 500 app users polling or subscribing. Spring handles both comfortably on a single instance with Java 21 virtual threads.

**NOT recommended:** Apache Kafka or RabbitMQ for MVP. Message brokers are justified when you horizontally scale the backend across multiple instances. At 500 sessions on a single well-tuned JVM instance with Java 21 virtual threads, a broker adds operational complexity with no benefit. Revisit at Fase 2 if scaling beyond a single instance.

**Confidence: HIGH** — Spring WebSocket at this scale is well-established.

---

### React Native — Charging Session UX

The existing stack (React Native 0.81.5, Expo 54, Expo Router 6) is correct. These additions are needed for the charging session flow:

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `expo-notifications` | SDK 54 compatible | Push notification handling | Required for FCM token registration and foreground notification display |
| `expo-task-manager` | SDK 54 compatible | Background session tracking | Allows the app to update session timer even when backgrounded |
| `expo-keep-awake` | SDK 54 compatible | Prevent screen sleep during charging | UX requirement — screen should stay on during active charging session |
| `react-native-reanimated` | 4.x (already installed) | Session progress animations | Already in POC. Use for charging progress bar animation |
| `@stripe/stripe-react-native` | 0.38.x | Stripe payment sheet (if Google/Apple Pay) | Only if Stripe is confirmed as the Google/Apple Pay provider |
| `react-native-purchases` | — | NOT recommended | RevenueCat is for subscription IAP, not applicable here |

**What the charging session screen needs:**
1. Real-time kWh counter (polling backend every 5s or WebSocket subscription)
2. Elapsed time counter (local timer, not server-dependent)
3. Estimated cost display (kWh × price_per_kwh + flag_fee)
4. "Stop Session" button with confirmation
5. Background task to keep session alive and alert user when unplugged

**MercadoPago React Native integration:**
MercadoPago provides a React Native SDK: `react-native-mercadopago-px`. [VERIFY: SDK compatibility with Expo 54 managed workflow vs bare workflow — MercadoPago's native SDK historically required ejecting from Expo managed workflow]

**Alternative payment flow (recommended if MercadoPago SDK has Expo issues):** Card tokenization via MercadoPago's web checkout flow opened as an in-app browser (`expo-web-browser`), with a deep link callback. This avoids native SDK friction entirely and is confirmed to work in Expo managed workflow.

**Confidence: MEDIUM** — Expo 54 compatibility of MercadoPago native SDK needs verification. The `expo-web-browser` fallback is HIGH confidence.

---

### Admin Web Dashboard

The existing admin stack (React 19, Vite 6, TailwindCSS 4, React Router 7) is appropriate. No changes recommended. Additions needed:

| Library | Purpose | Why |
|---------|---------|-----|
| `@tanstack/react-query` 5.x | Server state management | Required for polling charger status, invalidating on WebSocket updates. Much cleaner than manual useEffect polling. |
| `socket.io-client` or native WebSocket | Real-time charger status | Connect to backend STOMP/WebSocket for live dashboard updates. Use native browser WebSocket if STOMP not used. |
| `recharts` or keep `apexcharts` | Dashboard KPI charts | ApexCharts is already installed. Keep it unless bundle size is a concern. |

**NOT recommended:** Redux for admin dashboard. React Query handles server state; local UI state with `useState`/`useContext` is sufficient.

**Confidence: HIGH** — React Query 5 is the established standard for this use case.

---

### Observability — Production Upgrades

The POC already has Prometheus + Grafana + Loki. These additions are needed for production:

| Technology | Purpose | Why |
|------------|---------|-----|
| Sentry (Java SDK + React Native SDK) | Error tracking | The POC has no error tracking. Required to catch OCPP message failures, payment webhook errors, and mobile crashes in production. |
| Spring Boot Actuator `/health` | Kubernetes/Docker health checks | Already present. Ensure liveness and readiness probes are configured. |
| Micrometer OCPP metrics | Custom metrics for charger operations | Extend the existing `MetricsAspect` to record OCPP-specific metrics: `ocpp.bootnotification.count`, `ocpp.transaction.duration`, `ocpp.connection.active`. |

---

## What NOT to Use

| Technology | Category | Why Not |
|------------|----------|---------|
| Keycloak | Auth | Operational overhead too high for 2-3 person team at MVP scale |
| Kafka / RabbitMQ | Messaging | Not justified at 500 sessions single-instance |
| CitrineOS | OCPP | OCPP 2.0.1 only; Prosepac hardware is OCPP 1.6 |
| SteVe (as embedded library) | OCPP | Full application, not embeddable in hexagonal arch |
| MongoDB | Database | Relational model fits domain; JSONB in PostgreSQL handles flexible parts |
| dLocal | Payments | Cross-border specialist, overkill for domestic Uruguay |
| RevenueCat / IAP | Payments | Subscription/app store model, not applicable |
| React Redux | State mgmt | React Query + Context is sufficient for this app size |
| WebFlux / Reactive | Backend paradigm | Team is familiar with imperative Spring MVC; Java 21 virtual threads achieve equivalent concurrency without reactive learning curve |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| OCPP library | Java-OCA-OCPP (ChargeTime EU) | SteVe, CitrineOS | SteVe is not a library; CitrineOS is OCPP 2.x only |
| Database | PostgreSQL 16 | MySQL, MongoDB | PostgreSQL JSONB for MeterValues, better JSON support |
| Auth | Spring Security + JJWT | Keycloak, Auth0 | Simpler ops, self-contained, no extra service |
| Payments | MercadoPago (primary) | Stripe, PayU, dLocal | MercadoPago has best Uruguay/LatAm coverage and pre-existing integration planning |
| Push | FCM + Firebase Admin SDK | OneSignal, Pusher | FCM is free, direct, explicitly requested in PROJECT.md |
| Real-time | Spring WebSocket | Socket.io, Ably | No Node.js dependency; Spring WS sufficient at 500 sessions |
| Mobile payments | expo-web-browser + MercadoPago checkout | MercadoPago native SDK | Avoids Expo eject risk |

---

## Maven Dependencies to Add (Backend)

```xml
<!-- Spring Security -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- Spring WebSocket (for OCPP + frontend real-time) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>

<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>

<!-- OCPP 1.6 -->
<dependency>
    <groupId>eu.chargetime.ocpp</groupId>
    <artifactId>v1_6</artifactId>
    <version>1.0.0</version>  <!-- [VERIFY: latest version] -->
</dependency>

<!-- PostgreSQL -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- Flyway -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>

<!-- Redis -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

<!-- MercadoPago SDK [VERIFY version] -->
<dependency>
    <groupId>com.mercadopago</groupId>
    <artifactId>sdk-java</artifactId>
    <version>2.1.x</version>
</dependency>

<!-- Firebase Admin SDK -->
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.3.0</version>  <!-- [VERIFY: latest version] -->
</dependency>

<!-- Sentry -->
<dependency>
    <groupId>io.sentry</groupId>
    <artifactId>sentry-spring-boot-starter-jakarta</artifactId>
    <version>7.x</version>  <!-- [VERIFY] -->
</dependency>
```

## npm Packages to Add (Frontend)

```bash
# Push notifications + background
npx expo install expo-notifications expo-task-manager expo-keep-awake

# MercadoPago (prefer web checkout to avoid eject)
npx expo install expo-web-browser  # for MercadoPago web checkout
# OR (if native SDK verified compatible with Expo 54 managed):
# npm install react-native-mercadopago-px

# Stripe (only if Google/Apple Pay confirmed)
npx expo install @stripe/stripe-react-native
```

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Spring Boot + Java 21 | HIGH | Established, well-documented, fits existing arch |
| Java-OCA-OCPP library | MEDIUM | Library exists and is used in production; version number needs verification before implementing |
| PostgreSQL + Flyway + Redis | HIGH | Standard Spring Boot production stack |
| Spring Security + JJWT | HIGH | Current stable versions, well-documented |
| MercadoPago for Uruguay | MEDIUM | Uruguay is a supported country but Marketplace/split API Uruguay availability needs direct verification with MercadoPago |
| MercadoPago preauthorize flow | MEDIUM | Feature exists in MercadoPago API; Uruguay-specific behavior needs testing |
| Stripe as secondary (Google/Apple Pay) | MEDIUM | Technically sound but decision depends on client confirmation of need |
| FCM + Firebase Admin SDK | HIGH | Official Google SDK, standard approach |
| Spring WebSocket at 500 sessions | HIGH | Java 21 virtual threads handle this comfortably |
| expo-notifications | HIGH | Official Expo SDK, standard approach |
| MercadoPago native SDK + Expo 54 | LOW | MercadoPago native SDKs historically require bare workflow; Expo 54 compatibility unverified |
| expo-web-browser for payments | HIGH | Well-established Expo pattern for OAuth/checkout flows |

---

## Items Requiring Verification Before Implementation

1. **[VERIFY] Java-OCA-OCPP latest version** — Check `https://github.com/ChargeTimeEU/Java-OCA-OCPP/releases` for current version (1.0.0 may be outdated)
2. **[VERIFY] MercadoPago Uruguay Marketplace API** — Confirm split payment (Marketplace) feature is available for Uruguay merchant accounts, not just Argentina/Brazil
3. **[VERIFY] MercadoPago preauthorization in Uruguay** — The `capture: false` + capture flow must be tested with a Uruguay test account
4. **[VERIFY] MercadoPago SDK Java latest** — Check Maven Central for `com.mercadopago:sdk-java` current version
5. **[VERIFY] Firebase Admin SDK Java latest** — Check Maven Central for `com.google.firebase:firebase-admin` current version
6. **[VERIFY] react-native-mercadopago-px + Expo 54** — Check if MercadoPago's React Native SDK supports Expo 54 managed workflow without ejection
7. **[VERIFY] Spring Boot version upgrade** — Confirm 3.2.0 → 3.3.x is a safe upgrade path for existing hexagonal arch (generally yes, but verify WebSocket API changes)
8. **[VERIFY] OCPP 1.6 vs 1.6J** — Prosepac hardware may use OCPP 1.6J (JSON) or 1.6S (SOAP). Almost certainly JSON, but confirm with hardware specs.

---

## Sources

- Training data (cutoff August 2025) — all recommendations
- Project context: `.planning/PROJECT.md`, `.planning/codebase/STACK.md`, `.planning/codebase/INTEGRATIONS.md`
- Existing POC: `backend/pom.xml` — current dependency versions confirmed
- External verification unavailable (WebFetch/WebSearch restricted during this session)
- **Action required:** Re-verify Maven artifact versions and MercadoPago Uruguay API availability before Phase 1 implementation begins
