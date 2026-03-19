# Codebase Structure

**Analysis Date:** 2026-03-18

## Directory Layout

```
chargers-manager-poc/
├── backend/                        # Java Spring Boot API (Hexagonal Architecture)
│   └── src/
│       ├── main/java/com/chargersmanager/
│       │   ├── ChargersManagerApplication.java  # Spring Boot entry point
│       │   ├── domain/                          # Pure business logic (no dependencies)
│       │   │   ├── model/                       # Aggregate root + value objects + enum
│       │   │   ├── port/
│       │   │   │   ├── usecase/                 # Driving port interfaces + commands
│       │   │   │   └── repository/              # Driven port interface
│       │   │   └── exception/                   # Domain exception hierarchy
│       │   ├── application/
│       │   │   └── service/                     # ChargerService — implements all use cases
│       │   └── infrastructure/
│       │       ├── adapter/
│       │       │   ├── rest/                    # Spring MVC controller + DTOs + mapper
│       │       │   └── persistence/             # JPA adapter + entity + mapper + repo
│       │       └── config/                      # AOP aspects, exception handler, CORS
│       ├── main/resources/                      # application.yml, data.sql, logback config
│       └── test/java/com/chargersmanager/       # Unit tests (mirrored package structure)
├── frontend/                       # React Native + Expo mobile app
│   ├── app/                        # Expo Router screens (legacy scaffold, not primary nav)
│   │   └── (tabs)/                 # Tab layout from Expo scaffold
│   ├── src/                        # Primary business logic
│   │   ├── api/                    # Axios services
│   │   ├── context/                # React context providers
│   │   ├── navigation/             # RootNavigator (active navigation entry point)
│   │   ├── screens/                # One file per screen
│   │   └── types/                  # Shared TypeScript interfaces
│   ├── components/                 # Shared UI components (Expo scaffold remnants)
│   ├── constants/                  # Theme constants
│   ├── hooks/                      # Custom React hooks
│   └── assets/                     # Images and static files
├── admin/                          # React + Vite admin dashboard (web)
│   └── src/
│       ├── App.tsx                 # React Router entry point
│       ├── api.ts                  # Axios API client (flat, no service split)
│       ├── types.ts                # TypeScript types
│       ├── pages/                  # Route-level page components
│       │   ├── Dashboard/          # Home dashboard
│       │   ├── AuthPages/          # Sign in
│       │   ├── Chargers.tsx        # Charger management page
│       │   ├── Sessions.tsx        # Charging sessions page
│       │   ├── Users.tsx           # User management page
│       │   └── Settings.tsx        # Settings page
│       ├── components/             # Reusable UI components
│       │   ├── ui/                 # Primitive UI (button, badge, modal, table, etc.)
│       │   ├── charts/             # Bar and line chart wrappers
│       │   ├── map/                # Map component
│       │   ├── tables/             # Table components
│       │   ├── header/             # App header
│       │   ├── form/               # Form elements
│       │   └── auth/               # Auth-specific components
│       ├── context/                # React context providers
│       ├── hooks/                  # Custom hooks
│       ├── layout/                 # AppLayout (sidebar + header shell)
│       └── icons/                  # Icon components
├── docker/                         # Observability stack configs
│   ├── grafana/                    # Dashboards + datasource provisioning
│   ├── prometheus/                 # prometheus.yml
│   ├── loki/                       # loki.yml
│   └── promtail/                   # promtail.yml
├── docs/                           # Project documentation
├── .github/workflows/              # CI pipeline definitions
├── docker-compose.yml              # Full stack + observability compose file
└── CLAUDE.md                       # Project guidance for Claude Code
```

## Directory Purposes

**`backend/src/main/java/com/chargersmanager/domain/model/`:**
- Purpose: Aggregate root, value objects, and domain enum — the heart of the system
- Contains: `Charger.java` (aggregate root), `ChargerId.java`, `Location.java`, `PowerOutput.java`, `ChargerStatus.java` (enum: `AVAILABLE`, `CHARGING`, `OUT_OF_SERVICE`)
- Key files: `Charger.java` — owns all state transition methods

**`backend/src/main/java/com/chargersmanager/domain/port/`:**
- Purpose: All port interfaces live here, owned by the domain
- Contains: `usecase/` (driving ports — 3 interfaces + 1 command record), `repository/` (driven port — 1 interface)
- Key files: `ChargerRepository.java`, `CreateChargerUseCase.java`, `FindChargerUseCase.java`, `UpdateChargerStatusUseCase.java`, `CreateChargerCommand.java`

**`backend/src/main/java/com/chargersmanager/application/service/`:**
- Purpose: Single application service implementing all three use case ports
- Key files: `ChargerService.java` — `@Service @Transactional` class implementing `CreateChargerUseCase`, `FindChargerUseCase`, `UpdateChargerStatusUseCase`

**`backend/src/main/java/com/chargersmanager/infrastructure/adapter/rest/`:**
- Purpose: HTTP adapter — translates HTTP to domain commands and back
- Key files: `ChargerController.java`, `dto/ChargerRequest.java`, `dto/ChargerResponse.java`, `mapper/ChargerRestMapper.java`

**`backend/src/main/java/com/chargersmanager/infrastructure/adapter/persistence/`:**
- Purpose: JPA persistence adapter — translates between domain model and database schema
- Key files: `ChargerRepositoryAdapter.java` (implements domain port), `entity/ChargerEntity.java`, `entity/ChargerStatusEntity.java`, `mapper/ChargerPersistenceMapper.java`, `repository/SpringChargerRepository.java`

**`backend/src/main/java/com/chargersmanager/infrastructure/config/`:**
- Purpose: Cross-cutting infrastructure configuration — no business logic
- Key files: `LoggingAspect.java`, `MetricsAspect.java`, `GlobalExceptionHandler.java`, `CorsConfig.java`

**`backend/src/main/resources/`:**
- Purpose: Spring Boot configuration and initial data
- Key files: `application.yml` (base config + H2 + actuator + swagger), `application-dev.yml`, `application-prod.yml`, `data.sql` (seed data), `logback-spring.xml`

**`frontend/src/api/`:**
- Purpose: All backend communication — one file per domain area
- Key files: `client.ts` (shared Axios instance), `chargerService.ts`, `authService.ts`, `paymentService.ts`, `index.ts` (barrel export)

**`frontend/src/navigation/`:**
- Purpose: Root navigation setup (the actual active navigation, not `app/`)
- Key files: `RootNavigator.tsx` — defines `AuthStack`, `HomeStack`, `HistoryStack`, `ProfileStack`, and `AppTabs`

**`frontend/src/screens/`:**
- Purpose: One component file per screen
- Key files: `HomeScreen.tsx`, `MapScreen.tsx`, `QRScannerScreen.tsx`, `ChargingDetailScreen.tsx`, `PreAuthPaymentScreen.tsx`, `PaymentScreen.tsx`, `HistoryScreen.tsx`, `ProfileScreen.tsx`, `AuthScreen.tsx`, `index.ts` (barrel)

**`admin/src/`:**
- Purpose: Flat source for the admin SPA — simpler than frontend (no `src/` sub-split)
- Key files: `App.tsx` (router), `api.ts` (all API calls in one file), `types.ts`

## Key File Locations

**Entry Points:**
- `backend/src/main/java/com/chargersmanager/ChargersManagerApplication.java`: Spring Boot main class
- `frontend/src/navigation/RootNavigator.tsx`: Mobile app navigation root
- `admin/src/App.tsx`: Admin web app router root

**Configuration:**
- `backend/src/main/resources/application.yml`: Base Spring config (H2, actuator, swagger, logging)
- `backend/src/main/resources/application-dev.yml`: Dev profile overrides
- `backend/src/main/resources/data.sql`: Database seed data
- `docker-compose.yml`: Full stack + observability compose
- `docker/prometheus/prometheus.yml`: Prometheus scrape config
- `docker/grafana/provisioning/`: Grafana datasource + dashboard auto-provisioning
- `docker/grafana/dashboards/chargers-manager.json`: Pre-built Grafana dashboard

**Core Logic:**
- `backend/src/main/java/com/chargersmanager/domain/model/Charger.java`: Aggregate root with all state transitions
- `backend/src/main/java/com/chargersmanager/application/service/ChargerService.java`: All use case implementations
- `backend/src/main/java/com/chargersmanager/infrastructure/adapter/rest/ChargerController.java`: REST endpoints
- `frontend/src/api/client.ts`: Shared Axios instance for mobile
- `frontend/src/context/AuthContext.tsx`: Authentication state management

**Testing:**
- `backend/src/test/java/com/chargersmanager/`: Mirrors main source package structure
- `backend/src/test/java/com/chargersmanager/application/service/`: `ChargerServiceTest`
- `backend/src/test/java/com/chargersmanager/domain/model/`: Domain model tests

## Naming Conventions

**Backend — Files:**
- Domain models: `PascalCase` noun — `Charger.java`, `ChargerId.java`, `Location.java`
- Use case interfaces: `VerbNounUseCase` — `CreateChargerUseCase.java`, `FindChargerUseCase.java`
- Command records: `VerbNounCommand` — `CreateChargerCommand.java`
- Repository ports: `NounRepository` — `ChargerRepository.java`
- Adapters: `NounAdapter` suffix — `ChargerRepositoryAdapter.java`
- JPA entities: `NounEntity` suffix — `ChargerEntity.java`, `ChargerStatusEntity.java`
- Mappers: `NounContextMapper` suffix — `ChargerRestMapper.java`, `ChargerPersistenceMapper.java`
- DTOs: `NounRequest.java` / `NounResponse.java` — `ChargerRequest.java`, `ChargerResponse.java`
- Config classes: `PurposeConfig` or `PurposeAspect` — `CorsConfig.java`, `LoggingAspect.java`

**Frontend — Files:**
- Screens: `PascalCaseScreen.tsx` — `HomeScreen.tsx`, `QRScannerScreen.tsx`
- Services: `camelCaseService.ts` — `chargerService.ts`, `authService.ts`
- Contexts: `PascalCaseContext.tsx` — `AuthContext.tsx`, `ThemeContext.tsx`
- Navigator: `PascalCaseNavigator.tsx` — `RootNavigator.tsx`

**Admin — Files:**
- Pages: `PascalCase.tsx` or `PascalCase/` directory — `Chargers.tsx`, `Dashboard/Home.tsx`
- Components: `PascalCase/index.tsx` or `PascalCase.tsx`

## Where to Add New Code

**New Backend Use Case:**
1. Define interface in `backend/src/main/java/com/chargersmanager/domain/port/usecase/NewActionUseCase.java`
2. Add command record in same directory if input is complex: `NewActionCommand.java`
3. Implement in `backend/src/main/java/com/chargersmanager/application/service/ChargerService.java` (add `implements NewActionUseCase`)
4. Inject interface into `ChargerController` and add endpoint
5. Add tests in `backend/src/test/java/com/chargersmanager/application/service/ChargerServiceTest.java`

**New Domain Concept (second aggregate):**
- Domain model: `backend/src/main/java/com/chargersmanager/domain/model/NewModel.java`
- Repository port: `backend/src/main/java/com/chargersmanager/domain/port/repository/NewModelRepository.java`
- Use case ports: `backend/src/main/java/com/chargersmanager/domain/port/usecase/`
- JPA entity: `backend/src/main/java/com/chargersmanager/infrastructure/adapter/persistence/entity/NewModelEntity.java`
- Persistence adapter: `backend/src/main/java/com/chargersmanager/infrastructure/adapter/persistence/NewModelRepositoryAdapter.java`
- REST controller: `backend/src/main/java/com/chargersmanager/infrastructure/adapter/rest/NewModelController.java`

**New Mobile Screen:**
- Implementation: `frontend/src/screens/NewScreen.tsx`
- Export from: `frontend/src/screens/index.ts`
- Register in: `frontend/src/navigation/RootNavigator.tsx` within appropriate stack

**New Frontend API Service:**
- Implementation: `frontend/src/api/newService.ts`
- Export from: `frontend/src/api/index.ts`
- Use shared client from: `frontend/src/api/client.ts`

**New Admin Page:**
- Implementation: `admin/src/pages/NewPage.tsx`
- Register route in: `admin/src/App.tsx` (inside `<Route element={<AppLayout />}>`)
- API calls go directly in `admin/src/api.ts`

**New Shared Types (Frontend):**
- Location: `frontend/src/types/index.ts`

**New Shared Types (Admin):**
- Location: `admin/src/types.ts`

## Special Directories

**`backend/src/main/resources/`:**
- Purpose: Spring Boot config files and seed SQL
- Generated: No
- Committed: Yes

**`docker/`:**
- Purpose: Observability stack config (Prometheus, Grafana, Loki, Promtail)
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning artifacts (phase plans, codebase maps)
- Generated: Yes (by GSD commands)
- Committed: Yes

**`.github/workflows/`:**
- Purpose: CI pipeline definitions
- Generated: No
- Committed: Yes

**`frontend/app/`:**
- Purpose: Expo Router scaffold remnant — contains a minimal default tab layout. The active navigation lives in `frontend/src/navigation/RootNavigator.tsx`, not here.
- Generated: Partially (Expo scaffold)
- Committed: Yes

---

*Structure analysis: 2026-03-18*
