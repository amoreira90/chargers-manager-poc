# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns

**Files (Java backend):**
- Domain model classes: PascalCase noun (`Charger.java`, `ChargerId.java`, `Location.java`, `PowerOutput.java`)
- Value object classes: PascalCase noun, `final` (`ChargerId.java`, `Location.java`, `PowerOutput.java`)
- Use case interfaces: PascalCase + `UseCase` suffix (`CreateChargerUseCase.java`, `FindChargerUseCase.java`)
- Command records: PascalCase + `Command` suffix (`CreateChargerCommand.java`)
- Repository port: PascalCase + `Repository` suffix (`ChargerRepository.java`)
- Adapter classes: PascalCase + `Adapter` suffix (`ChargerRepositoryAdapter.java`)
- Mapper classes: PascalCase + `Mapper` suffix (`ChargerPersistenceMapper.java`, `ChargerRestMapper.java`)
- DTO classes: PascalCase + `Request`/`Response` suffix (`ChargerRequest.java`, `ChargerResponse.java`)
- Exception classes: PascalCase + `Exception` suffix (`ChargerNotFoundException.java`, `DomainException.java`)
- AOP aspect classes: PascalCase + `Aspect` suffix (`LoggingAspect.java`, `MetricsAspect.java`)

**Files (TypeScript frontend/admin):**
- Screen components: PascalCase + `Screen` suffix (`HomeScreen.tsx`, `MapScreen.tsx`)
- Context providers: PascalCase + `Context` suffix for file (`AuthContext.tsx`, `ThemeContext.tsx`)
- Service modules: camelCase + `Service` suffix (`chargerService.ts`, `authService.ts`, `paymentService.ts`)
- Navigator components: PascalCase + `Navigator` suffix (`RootNavigator.tsx`)
- Type definitions: PascalCase interface names in `src/types/index.ts`
- API client: `client.ts` (singleton)

**Functions (TypeScript):**
- Event handlers: `handle` prefix (`handleScanQR`, `handleViewMap`, `handleChargerSelect`, `handleNavigateTo`)
- Data loaders: `load` prefix (`loadChargers`, `loadLocation`)
- Async refresh handlers: `on` prefix (`onRefresh`)
- Context hooks: `use` prefix (`useAuth`, `useTheme`)
- Utility functions: camelCase verb phrase (`getDistanceKm`, `getApiBaseUrl`, `mapToChargerStation`)

**Variables:**
- TypeScript: camelCase throughout
- Java: camelCase for fields and local variables

**Types (TypeScript):**
- Interfaces: PascalCase (`User`, `ChargerStation`, `ChargingSession`, `Payment`, `AuthContextType`)
- Union types (string literals): lowercase (`'available' | 'charging' | 'maintenance'`)

**Methods (Java):**
- Factory methods: `of()` for wrapping values, `create()` for domain construction, `generate()` for UUID generation
- State transition methods: verb (`activate()`, `deactivate()`, `startCharging()`, `stopCharging()`)
- Boolean predicates: `is` prefix (`isAvailable()`)

**Java packages:**
- Domain: `com.chargersmanager.domain.model`, `com.chargersmanager.domain.port.usecase`, `com.chargersmanager.domain.port.repository`, `com.chargersmanager.domain.exception`
- Application: `com.chargersmanager.application.service`
- Infrastructure: `com.chargersmanager.infrastructure.adapter.rest`, `com.chargersmanager.infrastructure.adapter.persistence`, `com.chargersmanager.infrastructure.config`

## Code Style

**Formatting (frontend + admin):**
- Tool: Prettier
- Config: `frontend/.prettierrc` and `admin/.prettierrc` (identical settings)
- Semi-colons: required (`"semi": true`)
- Quotes: single quotes (`"singleQuote": true`)
- Trailing commas: all (`"trailingComma": "all"`)
- Print width: 100 characters
- Tab width: 2 spaces
- Bracket spacing: enabled (`"bracketSpacing": true`)
- Arrow function parens: always (`"arrowParens": "always"`)

**Linting (frontend):**
- Tool: ESLint via `eslint-config-expo/flat` + `eslint-plugin-prettier/recommended`
- Config: `frontend/eslint.config.js`
- React Hooks rules enforced (`eslint-plugin-react-hooks`)
- `react-refresh/only-export-components` set to `warn`

**Linting (admin):**
- Tool: ESLint via `typescript-eslint` + `eslint-plugin-react-refresh` + `eslint-plugin-prettier/recommended`
- Config: `admin/eslint.config.js`
- Target: ECMAScript 2020, browser globals

**Java style:**
- No Lombok `@Data` on domain classes — explicit getters written manually (preserves intentional immutability)
- `var` keyword used for local variable type inference throughout service and controller code
- Constructor injection exclusively (no `@Autowired` field injection)
- `@Transactional(readOnly = true)` applied individually on read methods

## Import Organization

**Java:**
- Domain imports before framework imports within same file
- Wildcard imports used only for static assertion imports (`import static org.junit.jupiter.api.Assertions.*`, `import static org.mockito.Mockito.*`)
- No wildcard on regular imports in production code

**TypeScript:**
- Third-party library imports first (React, Expo, react-native)
- Internal module imports after (relative paths: `../api`, `../context`, `../types`)
- Barrel exports used: `src/api/index.ts`, `src/screens/index.ts`

## Error Handling

**Java backend:**
- Domain layer throws `IllegalArgumentException` (value object validation) or `IllegalStateException` (invalid state transitions) — both are unchecked
- Domain exceptions extend abstract `DomainException extends RuntimeException` (`backend/src/main/java/com/chargersmanager/domain/exception/DomainException.java`)
- Specific exceptions extend `DomainException` (e.g., `ChargerNotFoundException`)
- All exceptions are translated at the infrastructure boundary via `@RestControllerAdvice GlobalExceptionHandler` (`backend/src/main/java/com/chargersmanager/infrastructure/config/GlobalExceptionHandler.java`)
- HTTP mapping: `ChargerNotFoundException` → 404, `DomainException` → 422, `IllegalStateException` → 409, `MethodArgumentNotValidException` → 400
- Response format: Spring `ProblemDetail` (RFC 7807)
- Bean validation with `@NotBlank`, `@Positive` annotations on request DTOs

**TypeScript frontend:**
- API calls wrapped in `try/catch` inside async functions
- UI errors surfaced via `Alert.alert()` (React Native)
- Network errors logged via `console.error()` in Axios interceptor (`frontend/src/api/client.ts`)
- Silent failures allowed where UI degradation is acceptable (e.g., location permission denied → distance not shown, comment: `// Silently fail — distance just won't show`)
- Errors re-thrown after catch blocks in context methods (`AuthContext.tsx`)

## Logging

**Backend:**
- Framework: SLF4J with `LoggerFactory.getLogger(ClassName.class)` — logger is a `private static final` field
- Logging is cross-cutting via AOP in `LoggingAspect` (`backend/src/main/java/com/chargersmanager/infrastructure/config/LoggingAspect.java`) — business code is not modified
- Log levels by layer:
  - `INFO`: use case executions and REST adapter calls (with duration in ms)
  - `DEBUG`: persistence adapter calls (with duration in ms)
  - `WARN`: domain rule violations (`DomainException`, `IllegalStateException`)
  - `ERROR`: unexpected exceptions with full stack trace
- Log format uses tagged prefixes: `[USE CASE]`, `[REST]`, `[PERSISTENCE]`, `[DOMAIN VIOLATION]`, `[BUSINESS RULE]`, `[ERROR]`

**Frontend:**
- `console.error()` used in Axios response interceptor for API errors
- No structured logging library — development-only debugging

## Comments

**When to Comment (Java):**
- Javadoc on all public classes with a single-sentence description of responsibility
- Inline comments used to explain design decisions (DIP, ISP references in `ChargerService.java`)
- Pointcut sections grouped with `// --- Pointcuts ---` header in aspect classes
- Log level policy documented in class Javadoc (`LoggingAspect.java`)

**When to Comment (TypeScript):**
- Inline comments explain mock data and stub fields (`// mock: no está en la BD`)
- JSDoc-style single-line comments on utility functions (`/** Haversine distance in km between two coordinates */`)
- Commented-out debug code preserved with explanation (`// console.log('API Request:...'); // Si necesitas debug, descomenta:`)
- Spanish used for business-domain comments; English used for architectural comments

## Function Design

**Java:**
- Service methods are single-purpose: load entity, call domain method, persist
- AOP advices use `ProceedingJoinPoint` for `@Around`, plain exception parameter for `@AfterThrowing`
- Mapper methods: one method per direction (`toEntity`, `toDomain`, `toCommand`, `toResponse`, `toResponseList`)

**TypeScript:**
- Screen components are default exports, helper functions above the component as named constants
- API service objects use object literal pattern (not classes): `export const chargerService = { method: async () => {} }`
- Custom hooks: named exports returning context value with guard (`if (!context) throw new Error(...)`)
- Context memo: `React.useMemo()` used to avoid unnecessary re-renders in `AuthContext.tsx`

## Module Design

**Java exports:**
- Public interfaces for ports (`UseCase`, `Repository`)
- Public classes for domain model, service, adapters, DTOs
- Package-private test classes (no `public` modifier on test classes)

**TypeScript exports:**
- Barrel files at `src/api/index.ts` and `src/screens/index.ts`
- Named exports for services, context hooks, providers
- Default exports for screen components and the API client singleton
- Types exported from `src/types/index.ts`

---

*Convention analysis: 2026-03-18*
