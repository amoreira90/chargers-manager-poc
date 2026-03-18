# Codebase Concerns

**Analysis Date:** 2026-03-18

---

## Tech Debt

**Auth layer is entirely absent from backend:**
- Issue: `authService.ts` in the frontend calls `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/profile` — none of these endpoints exist in the backend. The backend has no auth controller, no Spring Security config, and no user domain model.
- Files: `frontend/src/api/authService.ts`, `frontend/src/context/AuthContext.tsx`
- Impact: Any real sign-in/sign-up will return a 404. The app only works because `AuthContext.tsx` injects a hardcoded mock user (`mock-user-1`) when AsyncStorage has no session, bypassing the login screen entirely.
- Fix approach: Implement Spring Security with JWT, add `/auth` endpoints and a `User` domain model, then remove the mock-user fallback in `AuthContext.tsx`.

**Payment service is entirely mocked with a hardcoded flag:**
- Issue: `paymentService.ts` contains `const USE_MOCK = true` at the top. Every single method (pre-authorize, capture, release, history, getSavedPaymentMethods) returns fake data. The backend has no payment controller or payment domain.
- Files: `frontend/src/api/paymentService.ts`
- Impact: Payment flow appears to work but no real money movement occurs. The mock cannot be turned off without a real backend payment API. Pre-authorization IDs (`preauth_...`) passed into the charging session are fictional.
- Fix approach: Implement payment endpoints on the backend (MercadoPago/Stripe integration), then flip `USE_MOCK` to `false`.

**Charging session API endpoints do not exist in the backend:**
- Issue: `chargerService.ts` calls `/api/v1/charging-sessions` (POST, GET, stop) — these routes are not implemented in `ChargerController.java`. The backend only manages charger status via PATCH endpoints; it has no session resource.
- Files: `frontend/src/api/chargerService.ts`, `backend/src/main/java/com/chargersmanager/infrastructure/adapter/rest/ChargerController.java`
- Impact: `startChargingSession`, `stopChargingSession`, `getChargingHistory` always throw network errors at runtime. The mobile charging flow bypasses these calls and simulates everything locally.
- Fix approach: Add a `ChargingSession` aggregate and REST adapter to the backend.

**Frontend domain model has fields that don't come from the backend:**
- Issue: `ChargerStation` type (used throughout mobile frontend) includes `connectorType`, `pricePerKwh`, and `availability`. The backend returns `status`, `powerKilowatts`, `address`/`latitude`/`longitude`. The mapping in `chargerService.ts` hardcodes `connectorType: 'CCS'` and `pricePerKwh: 2.5` for every charger.
- Files: `frontend/src/api/chargerService.ts` (lines 27–39), `frontend/src/types/index.ts`
- Impact: All chargers show identical connector type and price regardless of reality. Any real pricing or connector-type data added to the backend requires schema + mapper + API changes on both sides.
- Fix approach: Add `connectorType` and `pricePerKwh` fields to the backend `Charger` domain model and `ChargerResponse` DTO, then remove the hardcoded defaults.

**In-memory H2 database is the only storage option:**
- Issue: `application.yml` configures `jdbc:h2:mem:chargersdb` with `ddl-auto: create-drop`. There is no production-grade DB configuration, no migration tooling (no Flyway or Liquibase), and no persistent store. `application-prod.yml` does not override the datasource.
- Files: `backend/src/main/resources/application.yml`, `backend/src/main/resources/application-prod.yml`
- Impact: All data is lost on every application restart. The system cannot be used as a real service until this is addressed.
- Fix approach: Add a PostgreSQL (or equivalent) datasource configuration for production profile, introduce Flyway for schema migrations.

**Admin dashboard has three stub pages:**
- Issue: `Sessions.tsx`, `Users.tsx`, and `Settings.tsx` are placeholder-only components that render a "Próximamente" message with no data or functionality.
- Files: `admin/src/pages/Sessions.tsx`, `admin/src/pages/Users.tsx`, `admin/src/pages/Settings.tsx`
- Impact: Admin operators cannot see session history, manage users, or configure pricing — core operational needs.
- Fix approach: Implement backend endpoints for sessions/users/settings, then build the admin pages against those APIs.

**Admin dashboard revenue/kWh metrics are permanently absent:**
- Issue: The admin dashboard (`Home.tsx`, line 264) renders a hardcoded amber warning: "Ingresos y kWh históricos: pendiente de endpoint en backend." Revenue and energy-delivered KPIs cannot be displayed.
- Files: `admin/src/pages/Dashboard/Home.tsx`
- Impact: The dashboard is useful for operational status only, not for business reporting.
- Fix approach: Add aggregate session-stats endpoints to the backend (total kWh delivered, total revenue) and connect them to the dashboard.

**Profile update is not wired to any API:**
- Issue: `ProfileScreen.tsx` `handleSaveProfile` calls `setLoading(true)` then immediately shows a success alert — the actual `authService.updateProfile` call is commented out.
- Files: `frontend/src/screens/ProfileScreen.tsx` (lines 33–45)
- Impact: Profile edits appear to succeed but are silently discarded. User data is never persisted.
- Fix approach: Uncomment and implement the `authService.updateProfile` call once the backend auth layer exists.

**Profile stats section displays hardcoded data:**
- Issue: `ProfileScreen.tsx` renders "125.5 kWh Cargados", "$312 Gastados", "8 Cargas" as static literal values — not fetched from any API.
- Files: `frontend/src/screens/ProfileScreen.tsx` (lines 211–224)
- Impact: Every user sees the same fake lifetime stats regardless of their actual usage.
- Fix approach: Expose a user-stats endpoint on the backend and connect it here.

**History screen uses hardcoded mock data instead of API:**
- Issue: `HistoryScreen.tsx` `loadHistory` always resolves with two hardcoded `ChargingSession` objects and never calls any API.
- Files: `frontend/src/screens/HistoryScreen.tsx` (lines 27–62)
- Impact: Users always see the same two fake sessions.
- Fix approach: Connect to `chargerService.getChargingHistory()` once the backend session endpoint exists.

---

## Security Considerations

**CORS allows all origins in all environments:**
- Risk: `CorsConfig.java` uses `.allowedOriginPatterns("*")` combined with `.allowCredentials(true)`. This combination means any website can make credentialed cross-origin requests to the API.
- Files: `backend/src/main/java/com/chargersmanager/infrastructure/config/CorsConfig.java`
- Current mitigation: None.
- Recommendations: Restrict `allowedOriginPatterns` to known domains (admin frontend URL) in production. Consider separating CORS config by profile.

**All actuator endpoints are exposed in dev profile:**
- Risk: `application-dev.yml` sets `include: "*"` for actuator endpoints, exposing `/actuator/env`, `/actuator/beans`, `/actuator/mappings`, and others that leak configuration details.
- Files: `backend/src/main/resources/application-dev.yml`
- Current mitigation: Production profile correctly restricts to `health, prometheus`.
- Recommendations: Restrict dev actuator exposure or add IP-based access control so it is not reachable over the network.

**H2 console is enabled and accessible with no auth:**
- Risk: `application.yml` enables `/h2-console` globally. This provides direct SQL access to the in-memory database with no credentials (username `sa`, blank password).
- Files: `backend/src/main/resources/application.yml`
- Current mitigation: H2 is an in-memory database, so exposure is less critical in dev, but this config will carry over unless explicitly disabled per profile.
- Recommendations: Move H2 console configuration to `application-dev.yml` only, disabled in all other profiles.

**Auth token is never attached to API requests:**
- Risk: `client.ts` has a request interceptor comment "Aquí se agregará el token del contexto de autenticación" but the token is never actually injected. All API calls go out unauthenticated.
- Files: `frontend/src/api/client.ts` (lines 30–40)
- Current mitigation: Backend has no auth enforcement either, so requests succeed regardless.
- Recommendations: Once auth is implemented on the backend, add token injection to the interceptor before enabling protected routes.

**Payment capture failure is silently ignored:**
- Risk: In `ChargingDetailScreen.tsx`, if `paymentService.capturePayment` throws, the error is caught with `console.warn` and the user is navigated to the payment summary screen showing `status: 'pending'`. The session completes from the user's perspective even if payment failed.
- Files: `frontend/src/screens/ChargingDetailScreen.tsx` (lines 192–205)
- Current mitigation: Mock mode means capture never fails today.
- Recommendations: On capture failure, block navigation, show an error, and allow retry before marking the session complete.

---

## Performance Bottlenecks

**Admin dashboard polls the backend every 15 seconds with no debouncing:**
- Problem: Both `Home.tsx` and `Chargers.tsx` set up `setInterval(loadChargers, 15000)`. Each poll fetches the full charger list. With many chargers this becomes increasingly expensive. Two browser tabs would double the load.
- Files: `admin/src/pages/Dashboard/Home.tsx` (line 57), `admin/src/pages/Chargers.tsx` (line 24)
- Cause: Simple interval-based polling with no WebSocket or SSE alternative.
- Improvement path: Replace polling with WebSocket or Server-Sent Events for real-time status. If polling must remain, increase interval or add exponential backoff on error.

**`findAll()` in backend loads all chargers with no pagination:**
- Problem: `ChargerController.java` `findAll()` and `findAvailable()` both load the complete charger list from the database. `SpringChargerRepository` extends `JpaRepository` with no pagination support.
- Files: `backend/src/main/java/com/chargersmanager/infrastructure/adapter/rest/ChargerController.java`, `backend/src/main/java/com/chargersmanager/infrastructure/adapter/persistence/repository/SpringChargerRepository.java`
- Cause: No `Pageable` parameter on the repository or controller.
- Improvement path: Add `Pageable` to `FindChargerUseCase.findAll()`, `SpringChargerRepository.findAll()`, and the controller. Return `Page<ChargerResponse>`.

---

## Fragile Areas

**`ChargingDetailScreen` accumulates simulation state with raw `setTimeout`:**
- Files: `frontend/src/screens/ChargingDetailScreen.tsx`
- Why fragile: The screen uses a cascade of `setTimeout` calls for state transitions (connecting, verifying, activating), a `setInterval` for the charging counter, and `Animated.loop` for pulse animation — all with no cleanup coordination. If the user navigates away mid-flow, timers and animations may continue running against unmounted state.
- Safe modification: Wrap all timers in refs, cancel them all in a single `useEffect` cleanup, and guard state updates with a `mounted` boolean.
- Test coverage: Zero. No frontend tests exist.

**Navigation params are untyped throughout the frontend:**
- Files: All screen files in `frontend/src/screens/` (every screen uses `{ route, navigation }: any`)
- Why fragile: Missing `chargerId`, `charger`, `autoStart`, `preAuth`, `qrScanned` params cause silent runtime failures. `ChargingDetailScreen` creates a dummy charger object when params are missing rather than showing an error.
- Safe modification: Define a typed navigation param list (React Navigation `NavigatorScreenParams`) and replace all `: any` screen props with typed alternatives.
- Test coverage: None.

**Expo template files remain in the `app/` directory:**
- Files: `frontend/app/(tabs)/explore.tsx`, `frontend/app/(tabs)/index.tsx`, `frontend/app/modal.tsx`, `frontend/app/_layout.tsx`
- Why fragile: The app's actual navigation lives in `src/navigation/RootNavigator.tsx` and is mounted inside `frontend/app/_layout.tsx`. The Expo Router tabs (`explore.tsx`, `index.tsx`) are original template scaffolding and are not the active app screens. Any changes to the tab layout in `app/` would conflict with `RootNavigator.tsx`.
- Safe modification: Remove or archive the unused Expo Router screen files (`explore.tsx`, `modal.tsx`, the tabs `index.tsx`) once the intent is confirmed.

**Admin UI pages contain boilerplate from the TailAdmin template:**
- Files: `admin/src/pages/UiElements/`, `admin/src/pages/Charts/`, `admin/src/pages/Forms/`, `admin/src/pages/Tables/`, `admin/src/pages/Calendar.tsx`, `admin/src/pages/Blank.tsx`, `admin/src/pages/UserProfiles.tsx`
- Why fragile: These pages have TailAdmin meta titles ("TailAdmin - Next.js Admin Dashboard Template") and contain no business logic. They are template samples that were never removed. Routes pointing to them may expose confusing UI to operators.
- Safe modification: Remove non-business pages from the router and delete the files, keeping only `Chargers.tsx`, `Dashboard/Home.tsx`, `Sessions.tsx`, `Users.tsx`, `Settings.tsx`.

---

## Test Coverage Gaps

**Zero frontend tests (mobile and admin):**
- What's not tested: All React Native screens, all API service calls, `AuthContext`, `ThemeContext`, payment flow logic, navigation transitions.
- Files: All files under `frontend/src/` and `admin/src/`
- Risk: Regressions in payment capture, charging state machine, or auth bypass are invisible.
- Priority: High

**Backend tests cover only 2 of ~12 testable behaviors:**
- What's not tested: `activate()` / `deactivate()` / `startCharging()` / `stopCharging()` state guard logic, `ChargerRepositoryAdapter` JPA mapping, `ChargerController` HTTP contract (no `@SpringBootTest` or `MockMvc` tests), `GlobalExceptionHandler` error mapping, AOP aspects (`MetricsAspect`, `LoggingAspect`).
- Files: `backend/src/test/java/com/chargersmanager/application/service/ChargerServiceTest.java`, `backend/src/test/java/com/chargersmanager/domain/model/ChargerTest.java`
- Risk: Domain state machine bugs go undetected; REST contract breaks silently when DTOs are renamed.
- Priority: High

**No integration or E2E tests:**
- What's not tested: The full request path from HTTP to DB and back; the admin frontend against a live backend; the mobile QR-to-payment flow end to end.
- Risk: Layer interaction bugs (mapping errors, wrong HTTP status codes) are only caught manually.
- Priority: Medium

---

## Missing Critical Features

**No authentication or authorization anywhere:**
- Problem: Backend has no Spring Security config, no user entity, no JWT or session tokens. Frontend uses a hardcoded mock user. Admin dashboard has no login flow (routes are publicly accessible).
- Blocks: Multi-user operation, protecting admin actions, attributing sessions to real users, enabling real payment.

**No real charger communication protocol:**
- Problem: The charging flow is entirely simulated with `setTimeout` calls. There is no OCPP (Open Charge Point Protocol) implementation or WebSocket channel to actual charging hardware.
- Blocks: Deploying to real hardware, detecting real charging events, monitoring actual energy delivery.

**No pricing model in the backend:**
- Problem: Price per kWh is hardcoded as `2.5` in `chargerService.ts` on the frontend. The backend `Charger` domain model has no `pricePerKwh` field.
- Blocks: Variable pricing, operator-configurable tariffs, accurate billing.

---

*Concerns audit: 2026-03-18*
