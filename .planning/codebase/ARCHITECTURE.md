# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** Multi-application monorepo — three distinct client applications share a single backend API.

**Applications:**
- `backend/` — Java Spring Boot REST API (Hexagonal Architecture)
- `frontend/` — React Native + Expo mobile app (screen-based architecture)
- `admin/` — React + Vite web admin dashboard (page-based SPA)

**Backend Key Characteristics:**
- Hexagonal Architecture (Ports & Adapters) with strict layer separation
- Dependency direction: domain ← application ← infrastructure. Domain has zero external dependencies.
- Interface Segregation Principle (ISP): one interface per use case
- Dependency Inversion Principle (DIP): `ChargerService` depends on `ChargerRepository` interface, not JPA
- Cross-cutting concerns (logging, metrics) handled exclusively via Spring AOP — no business code modification

## Layers (Backend)

**Domain Layer:**
- Purpose: Pure business logic with no framework dependencies
- Location: `backend/src/main/java/com/chargersmanager/domain/`
- Contains: Aggregate root (`Charger`), value objects (`Location`, `PowerOutput`, `ChargerId`), status enum (`ChargerStatus`), domain exceptions, port interfaces
- Depends on: Nothing (pure Java)
- Used by: Application layer

**Application Layer:**
- Purpose: Orchestrates use case flows; no business logic resides here
- Location: `backend/src/main/java/com/chargersmanager/application/service/`
- Contains: `ChargerService` — single class implementing all three use case interfaces
- Depends on: Domain model and port interfaces only
- Used by: Infrastructure (REST controller injects use case interfaces)

**Infrastructure Layer:**
- Purpose: Framework glue — HTTP, JPA persistence, AOP, exception mapping
- Location: `backend/src/main/java/com/chargersmanager/infrastructure/`
- Contains:
  - `adapter/rest/` — Spring MVC controller, request/response DTOs, MapStruct mapper
  - `adapter/persistence/` — JPA entity, Spring Data repository, persistence adapter, MapStruct mapper
  - `config/` — AOP aspects (`LoggingAspect`, `MetricsAspect`), `GlobalExceptionHandler`, `CorsConfig`
- Depends on: Application and domain layers (via interfaces)
- Used by: Spring container only

## Data Flow

**Inbound HTTP Request:**

1. HTTP request arrives at `ChargerController` (`infrastructure/adapter/rest/ChargerController.java`)
2. Controller invokes `ChargerRestMapper.toCommand()` to convert DTO → domain command record
3. Controller calls the appropriate use case interface method (e.g., `createChargerUseCase.createCharger(command)`)
4. `ChargerService` (application layer) constructs domain objects and delegates to `ChargerRepository` port
5. `ChargerRepositoryAdapter` converts domain model → `ChargerEntity` via `ChargerPersistenceMapper`
6. `SpringChargerRepository` (Spring Data JPA) persists to H2 in-memory database
7. Result flows back: `ChargerEntity` → domain `Charger` → `ChargerResponse` DTO → HTTP response

**AOP Interception (transparent to business code):**
- `LoggingAspect` intercepts all application, REST, and persistence layer method calls
- `MetricsAspect` intercepts the same pointcuts to record Prometheus counters and timers
- Both aspects fire automatically via Spring AOP — no annotations on business methods

**State Management (Mobile Frontend):**
- `AuthContext.tsx` — useReducer pattern manages auth state (`RESTORE_TOKEN`, `SIGN_IN`, `SIGN_UP`, `SIGN_OUT`); persists user to `AsyncStorage`
- `ThemeContext.tsx` — manages dark/light mode preference
- No global state store (no Redux/Zustand); each screen fetches directly from API services

## Key Abstractions

**Driving Ports (Use Case Interfaces):**
- Purpose: Define what the application can do, each segregated by responsibility
- Files:
  - `backend/src/main/java/com/chargersmanager/domain/port/usecase/CreateChargerUseCase.java`
  - `backend/src/main/java/com/chargersmanager/domain/port/usecase/FindChargerUseCase.java`
  - `backend/src/main/java/com/chargersmanager/domain/port/usecase/UpdateChargerStatusUseCase.java`
- Pattern: Single-method interfaces (ISP). Controller injects all three separately.

**Driven Port (Repository Interface):**
- Purpose: Domain-owned persistence contract; domain never sees JPA
- File: `backend/src/main/java/com/chargersmanager/domain/port/repository/ChargerRepository.java`
- Pattern: Standard repository contract (save, findById, findAll, findByStatus, deleteById, existsById)

**Aggregate Root:**
- Purpose: Owns all Charger state transitions; enforces invariants
- File: `backend/src/main/java/com/chargersmanager/domain/model/Charger.java`
- Pattern: Rich domain model. All state changes via domain methods: `activate()`, `deactivate()`, `startCharging()`, `stopCharging()`. Throws `IllegalStateException` on invalid transitions.

**Value Objects:**
- Purpose: Immutable, self-validating data containers
- Files:
  - `backend/src/main/java/com/chargersmanager/domain/model/Location.java` — address, lat/long; validates non-null
  - `backend/src/main/java/com/chargersmanager/domain/model/PowerOutput.java` — kW value
  - `backend/src/main/java/com/chargersmanager/domain/model/ChargerId.java` — UUID wrapper with `generate()` and `of()` factory methods

**MapStruct Mappers:**
- Purpose: Convert between layers without coupling them
- Files:
  - `backend/src/main/java/com/chargersmanager/infrastructure/adapter/rest/mapper/ChargerRestMapper.java` — domain ↔ REST DTOs
  - `backend/src/main/java/com/chargersmanager/infrastructure/adapter/persistence/mapper/ChargerPersistenceMapper.java` — domain ↔ JPA entity

**API Client (Frontend):**
- Purpose: Single Axios instance shared across all frontend services
- File: `frontend/src/api/client.ts`
- Pattern: Auto-resolves dev backend URL using Expo's `hostUri`. Request/response interceptors for auth token injection (token injection is stubbed, not yet implemented).

## Entry Points

**Backend:**
- Location: `backend/src/main/java/com/chargersmanager/ChargersManagerApplication.java`
- Triggers: `java -jar` or `./mvnw spring-boot:run`
- Responsibilities: Spring Boot bootstrap, component scan for all three layers

**Backend REST API:**
- Location: `backend/src/main/java/com/chargersmanager/infrastructure/adapter/rest/ChargerController.java`
- Base path: `/api/v1/chargers`
- Endpoints: POST `/`, GET `/`, GET `/{id}`, GET `/available`, PATCH `/{id}/activate`, PATCH `/{id}/deactivate`, PATCH `/{id}/start-charging`, PATCH `/{id}/stop-charging`

**Mobile Frontend:**
- Location: `frontend/src/navigation/RootNavigator.tsx`
- Triggers: Expo dev server or compiled app launch
- Responsibilities: Mounts `AuthProvider` and `ThemeProvider`, then conditionally renders `AuthStack` or `AppTabs` based on `user` from `AuthContext`

**Admin Web:**
- Location: `admin/src/App.tsx`
- Triggers: Vite dev server or built static files served by Nginx (Docker)
- Responsibilities: React Router v6 route tree; all protected routes wrapped in `AppLayout`

## Error Handling

**Backend Strategy:** Domain exceptions are caught globally and translated to RFC 7807 `ProblemDetail` responses.

**Patterns:**
- `ChargerNotFoundException` → `404 NOT_FOUND`
- `DomainException` → `422 UNPROCESSABLE_ENTITY`
- `IllegalStateException` (invalid state transitions) → `409 CONFLICT`
- `MethodArgumentNotValidException` (Bean Validation) → `400 BAD_REQUEST` with field-level error map
- Handler location: `backend/src/main/java/com/chargersmanager/infrastructure/config/GlobalExceptionHandler.java`

**Frontend Strategy:** Axios interceptors log errors to console. No centralized error boundary; individual screens handle errors inline. Auth token injection is stubbed (interceptor present but not yet populating the Authorization header).

## Cross-Cutting Concerns

**Logging (Backend):**
- Implemented via Spring AOP: `LoggingAspect` in `backend/src/main/java/com/chargersmanager/infrastructure/config/LoggingAspect.java`
- Levels: REST and use case calls → INFO; persistence → DEBUG; domain/business violations → WARN; unexpected → ERROR
- Output piped to file volume, scraped by Promtail → Loki → Grafana

**Metrics (Backend):**
- Implemented via Spring AOP: `MetricsAspect` in `backend/src/main/java/com/chargersmanager/infrastructure/config/MetricsAspect.java`
- Custom Prometheus metrics: `usecase.executions`, `usecase.duration`, `rest.requests`, `persistence.operations`, `domain.violations`
- Exposed at `/actuator/prometheus`, scraped by Prometheus, visualized in Grafana

**Validation (Backend):**
- Bean Validation annotations on `ChargerRequest` DTO (Jakarta validation)
- Domain-level validation in value object constructors (`Objects.requireNonNull`, range checks)

**CORS (Backend):**
- Configured in `backend/src/main/java/com/chargersmanager/infrastructure/config/CorsConfig.java`

**Authentication (Frontend):**
- `AuthContext.tsx` uses a mock user by default in dev — real auth API calls exist in `authService.ts` but the mock bypasses them. The Axios client has a request interceptor stub for token injection that is not yet populated.

---

*Architecture analysis: 2026-03-18*
