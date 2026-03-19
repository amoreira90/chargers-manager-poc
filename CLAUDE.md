# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chargers Manager POC — a full-stack EV charger management system with a Java backend (hexagonal architecture) and a React Native mobile frontend.

## Commands

### Backend (`backend/`)

```bash
# Build (skip tests)
cd backend && ./mvnw clean package -DskipTests

# Run with dev profile
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Run all tests
cd backend && mvn verify

# Run a single test class
cd backend && mvn test -Dtest=ChargerServiceTest
```

### Frontend (`frontend/`)

```bash
# Install dependencies
cd frontend && npm install

# Copy and configure env (required first time)
cp frontend/.env.example frontend/.env
# Set: EXPO_PUBLIC_API_URL, EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY, EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

# Start dev server
cd frontend && npm start

# Platform-specific
cd frontend && npm run android
cd frontend && npm run ios
cd frontend && npm run web

# Lint
cd frontend && npm run lint
```

### Full Stack (Docker)

```bash
# Start everything
docker-compose up --build

# Start only observability stack (while running backend locally)
docker-compose up prometheus grafana loki promtail
```

## Backend Architecture

The backend follows **Hexagonal Architecture (Ports & Adapters)**. The dependency rule: domain ← application ← infrastructure. Domain has zero external dependencies.

### Layer structure (`com.chargersmanager/`)

| Layer | Package | Responsibility |
|---|---|---|
| Domain | `domain/` | Business logic, aggregate root, value objects, port interfaces |
| Application | `application/service/` | `ChargerService` — implements all 3 use case interfaces |
| Infrastructure | `infrastructure/` | REST controller, JPA adapter, AOP aspects, exception handler |

### Domain model

- **`Charger`** — Aggregate Root. Owns all state transitions: `activate()`, `deactivate()`, `startCharging()`, `stopCharging()`
- **`Location`**, **`PowerOutput`**, **`ChargerId`** — immutable Value Objects validated on construction
- **`ChargerStatus`** — enum: `AVAILABLE` → `CHARGING` → `AVAILABLE` / `AVAILABLE` → `OUT_OF_SERVICE`

### Ports

- **Driving ports** (in `domain/port/usecase/`): `CreateChargerUseCase`, `FindChargerUseCase`, `UpdateChargerStatusUseCase` — each is a separate interface (ISP)
- **Driven port** (in `domain/port/repository/`): `ChargerRepository` — implemented by `ChargerRepositoryAdapter` (JPA/H2)

### Cross-cutting concerns (AOP)

Both `MetricsAspect` and `LoggingAspect` in `infrastructure/config/` intercept method calls across layers automatically via Spring AOP — no business code is modified.

`MetricsAspect` records Prometheus metrics: `usecase.executions`, `usecase.duration`, `rest.requests`, `persistence.operations`, `domain.violations`.

### Mapping

MapStruct mappers handle all conversions between layers:
- `ChargerRestMapper` — domain ↔ REST DTOs
- `ChargerPersistenceMapper` — domain ↔ JPA entities

## Frontend Architecture

React Native + Expo (TypeScript). The app is structured around `src/` for business logic and `app/` for Expo Router screens.

### Navigation

`RootNavigator.tsx` — conditional root: unauthenticated users see `AuthStack`; authenticated users see `AppTabs` (Home, History, Profile bottom tabs). The Home tab contains a nested stack: Home → Map → Scanner → ChargingDetail → PreAuthPayment → Payment.

### Key directories

- `src/api/` — Axios-based service layer (`chargerService.ts`, `authService.ts`, `paymentService.ts`), shared `client.ts`
- `src/context/` — `AuthContext.tsx` (session state), `ThemeContext.tsx` (dark/light mode)
- `src/screens/` — one file per screen
- `src/types/index.ts` — shared TypeScript types

## Observability (when running with Docker)

| Service | URL | Credentials |
|---|---|---|
| API | http://localhost:8080 | — |
| Swagger UI | http://localhost:8080/swagger-ui.html | — |
| Grafana | http://localhost:3000 | admin / admin |
| Prometheus | http://localhost:9090 | — |

The Grafana dashboard is auto-provisioned from `docker/grafana/dashboards/chargers-manager.json`.
