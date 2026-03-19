# External Integrations

**Analysis Date:** 2026-03-18

## APIs & External Services

**Payment Gateways (planned — currently fully mocked):**
- MercadoPago — Primary payment provider for LATAM market
  - SDK/Client: None installed yet; integration planned via REST API calls
  - Auth: `EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (frontend public key)
  - Backend routes planned: `POST /payments/pre-authorize`, `PUT /payments/pre-authorize/{id}/capture`, `POST /payments/pre-authorize/{id}/release`
  - Frontend mock flag: `USE_MOCK = true` in `frontend/src/api/paymentService.ts`
- Stripe (for Google Pay / Apple Pay) — Secondary provider
  - SDK/Client: Not installed
  - Frontend routes planned: `POST /payments/google-pay`, `POST /payments/apple-pay`
  - Also fully mocked via `USE_MOCK = true`

**Maps:**
- Google Maps — Charger location display on map screen
  - SDK/Client: `react-native-maps` 1.20.1 (uses Google Maps on Android)
  - Auth: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
  - Used in: `frontend/src/screens/MapScreen.tsx`
- Google Maps (deep-link navigation) — External navigation apps
  - Scheme registered in `frontend/app.json`: `comgooglemaps`, `waze`, `geo`
- Leaflet — Admin web map
  - SDK/Client: `react-leaflet` 5 + `leaflet` 1.9.4 in `admin/`
  - No API key required (uses OpenStreetMap tiles by default)

**Mobile Payments (planned):**
- Google Pay — Android payments
  - Auth: `EXPO_PUBLIC_GOOGLE_PAY_MERCHANT_ID`
  - Not yet integrated at SDK level
- Apple Pay — iOS payments
  - Not yet integrated at SDK level

## Data Storage

**Databases:**
- H2 (in-memory, current) — Embedded relational DB for all profiles
  - Connection: `jdbc:h2:mem:chargersdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE` (hardcoded in `backend/src/main/resources/application.yml`)
  - Client: Spring Data JPA + Hibernate (DDL auto: `create-drop`)
  - Console: available at `http://localhost:8080/h2-console` (dev profile)
  - Note: Data is seeded from `backend/src/main/resources/data.sql` on startup

**File Storage:**
- Local filesystem only — Log files written to `logs/` directory (`backend/src/main/resources/logback-spring.xml`)
- Docker volume `logs-data` mounts logs for Promtail to collect (`docker-compose.yml`)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Custom (backend-owned) — REST endpoints at `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/profile`
  - Implementation: Planned; backend endpoints not yet implemented (no Spring Security in `pom.xml`)
  - Frontend: `frontend/src/api/authService.ts` calls these endpoints
  - Session storage: `@react-native-async-storage/async-storage` persists user object locally (`frontend/src/context/AuthContext.tsx`)
  - Note: Development bypasses auth — `AuthContext.tsx` injects a mock user when no stored session is found, so all screens are accessible without login

## Monitoring & Observability

**Metrics:**
- Prometheus — Scrapes backend at `http://chargers-app:8080/actuator/prometheus` every 15 seconds
  - Config: `docker/prometheus/prometheus.yml`
  - Custom metrics via `MetricsAspect`: `usecase.executions`, `usecase.duration`, `rest.requests`, `persistence.operations`, `domain.violations`
  - Library: `micrometer-registry-prometheus` (in `backend/pom.xml`)

**Dashboards:**
- Grafana — Auto-provisioned dashboard from `docker/grafana/dashboards/chargers-manager.json`
  - Credentials: admin / admin (hardcoded in `docker-compose.yml`)
  - URL: `http://localhost:3000`
  - Datasource: Prometheus + Loki (auto-provisioned from `docker/grafana/provisioning/`)

**Log Aggregation:**
- Loki — Receives logs from Promtail
  - Config: `docker/loki/loki.yml`
  - Port: 3100
- Promtail — Reads backend log files from `logs-data` Docker volume
  - Config: `docker/promtail/promtail.yml`
  - Ships logs to Loki

**Error Tracking:**
- None (no Sentry or equivalent)

**Logs:**
- Backend: Logback with rolling file appender (`backend/src/main/resources/logback-spring.xml`)
  - Files: `logs/chargers-manager.log`, rotated daily, max 10MB per file, 30 days retained, 500MB total cap
  - Profile-aware levels: DEBUG in dev, WARN/ERROR in prod

## API Documentation

**Swagger UI:**
- SpringDoc OpenAPI — Auto-generated from annotations
  - URL: `http://localhost:8080/swagger-ui.html`
  - API docs JSON: `http://localhost:8080/api-docs`
  - Library: `springdoc-openapi-starter-webmvc-ui` 2.3.0 (`backend/pom.xml`)

## CI/CD & Deployment

**Hosting:**
- Docker Compose — All services defined in `docker-compose.yml` (root)
- Services: `chargers-app` (8080), `admin-web` (8090), `prometheus` (9090), `grafana` (3000), `loki` (3100), `promtail`

**CI Pipeline:**
- GitHub Actions (inferred from git history referencing CI for "Build & Test" checks)
- No workflow files inspected directly

## Webhooks & Callbacks

**Incoming:**
- None currently implemented

**Outgoing:**
- None currently implemented
- Payment providers (MercadoPago/Stripe) will require webhook endpoints for async payment status updates when fully implemented

## Environment Configuration

**Required env vars (frontend):**
- `EXPO_PUBLIC_API_URL` — Backend base URL
- `EXPO_PUBLIC_API_TIMEOUT` — HTTP timeout in ms (default 10000)
- `EXPO_PUBLIC_ENV` — Environment label (`development`, `staging`, `production`)
- `EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY` — MercadoPago client key
- `EXPO_PUBLIC_GOOGLE_PAY_MERCHANT_ID` — Google Pay merchant ID
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps API key

**Required env vars (backend):**
- `SPRING_PROFILES_ACTIVE` — Controls configuration profile (`dev` or `prod`)
- No external secrets required currently (H2 uses no credentials)

**Secrets location:**
- Frontend: `.env` file (not committed; template at `frontend/.env.example`)
- Backend: No secrets management beyond Spring profiles; future DB credentials would go in environment variables or a secrets manager

---

*Integration audit: 2026-03-18*
