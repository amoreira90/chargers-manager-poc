# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- Java 17 - Backend (Spring Boot application, hexagonal architecture)
- TypeScript 5.9 - Frontend mobile app (Expo/React Native)
- TypeScript 5.7 - Admin web dashboard (Vite/React)

**Secondary:**
- SQL - Backend seed data (`backend/src/main/resources/data.sql`)
- XML - Backend Logback configuration (`backend/src/main/resources/logback-spring.xml`)
- YAML - Backend Spring configuration and Docker observability configs

## Runtime

**Backend:**
- Java 17 (Eclipse Temurin JRE in production Docker image)
- Maven 3.9 (build tool, `backend/mvnw` wrapper included)

**Frontend:**
- Node.js 20 (Alpine, per `admin/Dockerfile` build stage)
- Expo SDK 54 (`frontend/package.json`)

**Package Manager:**
- Backend: Maven — lockfile via `pom.xml` dependency resolution
- Frontend: npm — `frontend/package-lock.json` present
- Admin: npm — `admin/package-lock.json` present

## Frameworks

**Backend:**
- Spring Boot 3.2.0 - Core application framework (`backend/pom.xml`)
- Spring Data JPA - Persistence layer
- Spring AOP - Cross-cutting concerns (metrics, logging)
- Spring Boot Actuator - Health checks and metrics exposure
- Spring Boot Validation - Bean validation

**Frontend (Mobile):**
- React Native 0.81.5 with New Architecture enabled - Mobile framework
- Expo 54 - Build tooling and managed workflow
- Expo Router 6 - File-based navigation
- React Navigation 7 - Stack and tab navigators

**Admin (Web):**
- React 19 - UI library
- Vite 6 - Build tool and dev server (`admin/vite.config.ts`)
- TailwindCSS 4 - Utility-first CSS framework
- React Router 7 - Client-side routing

**Testing:**
- Spring Boot Test (JUnit 5) - Backend tests

**Build/Dev:**
- Docker + Docker Compose - Full stack orchestration (`docker-compose.yml`)
- Multi-stage Docker builds for backend (`backend/Dockerfile`) and admin (`admin/Dockerfile`)
- Nginx Alpine - Admin web server in production container

## Key Dependencies

**Backend Critical:**
- `spring-boot-starter-web` 3.2.0 - REST API
- `spring-boot-starter-data-jpa` 3.2.0 - ORM and repository layer
- `mapstruct` 1.5.5.Final - Compile-time layer mapping (domain ↔ REST ↔ JPA)
- `lombok` 1.18.30 - Boilerplate reduction (builders, getters, etc.)
- `springdoc-openapi-starter-webmvc-ui` 2.3.0 - Swagger UI at `/swagger-ui.html`
- `micrometer-registry-prometheus` - Metrics export for Prometheus scraping
- `h2` - In-memory database (runtime scope, for dev and test)

**Frontend Critical:**
- `axios` 1.6.5 - HTTP client (`frontend/src/api/client.ts`)
- `expo-camera` 17 - QR code scanning
- `expo-location` 19 - GPS location for nearby chargers
- `react-native-maps` 1.20.1 - Map display
- `@react-native-async-storage/async-storage` 2.2.0 - Local session persistence
- `react-native-reanimated` 4.1.1 - Animations

**Admin Critical:**
- `axios` 1.13.6 - HTTP client for backend API calls
- `apexcharts` + `react-apexcharts` - Dashboard charts
- `react-leaflet` 5 + `leaflet` 1.9.4 - Interactive map
- `@fullcalendar/react` 6 - Calendar component
- `tailwind-merge` 3 - TailwindCSS class merging utility

## Configuration

**Backend Environment:**
- Spring profile-based: `application.yml` (base), `application-dev.yml` (verbose), `application-prod.yml` (minimal)
- Dev profile activated via `SPRING_PROFILES_ACTIVE=dev` (set in `docker-compose.yml`)
- H2 in-memory database — no external DB required currently
- Actuator endpoints exposed: `health`, `info`, `metrics`, `prometheus` (prod: only `health`, `prometheus`)

**Frontend Environment:**
- Variables prefixed `EXPO_PUBLIC_*` (loaded from `.env`, see `.env.example`)
- Required: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_API_TIMEOUT`, `EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY`, `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_GOOGLE_PAY_MERCHANT_ID`
- In development: API URL is auto-resolved from Expo host IP (`frontend/src/api/client.ts`)

**Build:**
- Backend: `backend/pom.xml` — Maven build, `mvnw` wrapper at `backend/mvnw`
- Frontend: `expo` CLI — `frontend/app.json` configures iOS/Android bundle IDs
- Admin: `vite.config.ts` — React plugin + SVGR for SVG imports

## Platform Requirements

**Development:**
- Java 17+
- Node.js 20+
- Docker (for observability stack)
- Expo Go app or Android/iOS simulator for mobile frontend

**Production:**
- Docker (all services containerized)
- Backend: Eclipse Temurin 17 JRE
- Admin: Nginx Alpine (port 80, exposed as 8090)
- Backend API: port 8080
- Grafana: port 3000
- Prometheus: port 9090
- Loki: port 3100

---

*Stack analysis: 2026-03-18*
