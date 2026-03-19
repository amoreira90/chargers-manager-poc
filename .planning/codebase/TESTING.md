# Testing Patterns

**Analysis Date:** 2026-03-18

## Test Framework

### Backend (Java)

**Runner:**
- JUnit 5 (Jupiter) — included via `spring-boot-starter-test` in `backend/pom.xml`
- Spring Boot 3.2.0 test slice support available

**Mocking:**
- Mockito — included via `spring-boot-starter-test`
- Integration: `MockitoExtension` for JUnit 5

**Assertion Library:**
- JUnit 5 built-in: `org.junit.jupiter.api.Assertions.*`

**Run Commands:**
```bash
cd backend && mvn verify           # Run all tests
cd backend && mvn test -Dtest=ChargerServiceTest  # Run single test class
```

### Frontend (TypeScript)

**Runner:**
- Not configured. No `jest.config.*`, `vitest.config.*`, or test files present.

**Run Commands:**
- Not applicable — no frontend test runner configured.

---

## Test File Organization

### Backend

**Location:** `backend/src/test/java/com/chargersmanager/`

**Mirror package structure of main:**
```
backend/src/test/java/com/chargersmanager/
├── application/
│   └── service/
│       └── ChargerServiceTest.java    # Application service unit tests
└── domain/
    └── model/
        └── ChargerTest.java           # Domain model unit tests
```

**Naming:**
- Test class name = class under test + `Test` suffix (`ChargerServiceTest`, `ChargerTest`)
- Test method names: camelCase, descriptive verb phrase without underscores (`createChargerShouldSaveAndReturn`, `findByIdShouldThrowWhenNotFound`, `startChargingShouldChangeStatusToCharging`)
- Method naming pattern: `[action][Context/Subject][ExpectedOutcome]`

---

## Test Structure

### Domain Tests (`ChargerTest.java`)

Domain tests have no Spring context, no database, and no mocks. Pure Java.

```java
class ChargerTest {                    // package-private, no @SpringBootTest

    private Charger createCharger() {  // private factory method for test data
        return Charger.create(
                "Charger A",
                new Location("Calle Falsa 123", -34.6, -58.4),
                PowerOutput.of(22.0)
        );
    }

    @Test
    void newChargerShouldBeAvailable() {
        Charger charger = createCharger();
        assertEquals(ChargerStatus.AVAILABLE, charger.getStatus());
        assertTrue(charger.isAvailable());
    }

    @Test
    void startChargingWhenNotAvailableShouldThrow() {
        Charger charger = createCharger();
        charger.deactivate();
        assertThrows(IllegalStateException.class, charger::startCharging);
    }
}
```

**Patterns:**
- No `@BeforeEach` — each test calls the private factory method
- Arrange-Act-Assert without blank line separation (compact style for small tests)
- State transition tests set up preconditions inline before the asserted action
- Exception tests use `assertThrows` with method reference (`charger::startCharging`)

### Application Service Tests (`ChargerServiceTest.java`)

Application service tests use Mockito to mock the repository port (driven port). No Spring context loaded.

```java
@ExtendWith(MockitoExtension.class)    // Mockito JUnit 5 extension
class ChargerServiceTest {

    @Mock
    private ChargerRepository chargerRepository;   // mock the port interface, not the impl

    private ChargerService chargerService;         // class under test — instantiated manually

    @BeforeEach
    void setUp() {
        chargerService = new ChargerService(chargerRepository);  // constructor injection
    }

    @Test
    void createChargerShouldSaveAndReturn() {
        var command = new CreateChargerCommand("Test", "Av. Siempre Viva", -34.6, -58.4, 22.0);
        var charger = Charger.create("Test", new Location("Av. Siempre Viva", -34.6, -58.4), PowerOutput.of(22.0));
        when(chargerRepository.save(any())).thenReturn(charger);

        var result = chargerService.createCharger(command);

        assertNotNull(result);
        verify(chargerRepository, times(1)).save(any());
    }

    @Test
    void findByIdShouldThrowWhenNotFound() {
        var id = ChargerId.generate();
        when(chargerRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ChargerNotFoundException.class, () -> chargerService.findById(id));
    }
}
```

**Patterns:**
- `@ExtendWith(MockitoExtension.class)` — not `@SpringBootTest` (fast unit tests)
- `@Mock` on port interface, never on concrete class
- Service instantiated via constructor in `@BeforeEach` using `new` — not autowired
- `var` for local variable declarations
- `when(...).thenReturn(...)` stubbing before act; `verify(...)` assertion after act
- `any()` matcher for domain object arguments (domain objects are complex to match exactly)
- Exception test uses lambda `() -> chargerService.findById(id)` (vs. method reference for Charger domain tests)

---

## Mocking

**Framework:** Mockito (via `spring-boot-starter-test`)

**What to mock:**
- Driven ports (repository interfaces in `com.chargersmanager.domain.port.repository.*`)
- Never mock domain model classes (`Charger`, `Location`, `PowerOutput`, `ChargerId`)
- Never mock `ChargerService` itself in its own tests — test the real implementation

**What NOT to mock:**
- Domain model — always use the real `Charger.create()` factory method and real value objects
- Value objects (`Location`, `PowerOutput`, `ChargerId`) — constructed directly in tests

**Stubbing pattern:**
```java
// Setup stub before act
when(chargerRepository.findById(id)).thenReturn(Optional.empty());

// Verify interaction after act
verify(chargerRepository, times(1)).save(any());
```

---

## Fixtures and Factories

**Test Data (Java):**

Private factory methods inside the test class, not shared fixtures:

```java
// Domain test — ChargerTest.java
private Charger createCharger() {
    return Charger.create(
            "Charger A",
            new Location("Calle Falsa 123", -34.6, -58.4),
            PowerOutput.of(22.0)
    );
}

// Service test — ChargerServiceTest.java (inline, no factory method)
var command = new CreateChargerCommand("Test", "Av. Siempre Viva", -34.6, -58.4, 22.0);
```

**Location:** Test-local private methods within each test class. No shared test utilities or test fixture files exist.

---

## Coverage

**Requirements:** Not enforced. No JaCoCo configuration in `backend/pom.xml`. No coverage thresholds set.

**View Coverage:**
```bash
# Coverage not configured — add JaCoCo plugin to pom.xml to enable
cd backend && mvn test jacoco:report
```

---

## Test Types

**Unit Tests (domain):**
- Scope: Single aggregate root or value object, no Spring context, no I/O
- Location: `backend/src/test/java/com/chargersmanager/domain/`
- Examples: `ChargerTest.java`
- Speed: Instantaneous

**Unit Tests (application):**
- Scope: Application service with mocked repository, no Spring context
- Location: `backend/src/test/java/com/chargersmanager/application/`
- Examples: `ChargerServiceTest.java`
- Speed: Fast (< 1s per class)

**Integration Tests:**
- Not present. No `@SpringBootTest`, `@WebMvcTest`, or `@DataJpaTest` test classes exist.

**E2E Tests:**
- Not present on any layer (frontend or backend).

**Frontend Tests:**
- None. No test files, no test runner configuration in `frontend/` or `admin/`.

---

## Common Patterns

**Async Testing:**
- Not applicable to current Java test suite (synchronous service methods)
- Frontend has no test suite

**Exception Testing:**
```java
// Method reference style (domain tests)
assertThrows(IllegalStateException.class, charger::startCharging);

// Lambda style (service tests — needed when method requires arguments)
assertThrows(ChargerNotFoundException.class, () -> chargerService.findById(id));
```

**State Verification:**
```java
// Verify state directly via domain accessors
assertEquals(ChargerStatus.CHARGING, charger.getStatus());
assertTrue(charger.isAvailable());

// Verify collaboration via Mockito
verify(chargerRepository, times(1)).save(any());
assertNotNull(result);
```

**Precondition Setup for Transition Tests:**
```java
// Get domain object to known intermediate state before asserting
Charger charger = createCharger();   // starts AVAILABLE
charger.startCharging();              // move to CHARGING
charger.stopCharging();               // test: should return to AVAILABLE
assertEquals(ChargerStatus.AVAILABLE, charger.getStatus());
```

---

## Missing Test Coverage

The following areas have no test coverage:

- `backend/src/main/java/com/chargersmanager/infrastructure/adapter/rest/ChargerController.java` — REST layer untested (no `@WebMvcTest`)
- `backend/src/main/java/com/chargersmanager/infrastructure/adapter/persistence/` — JPA adapter untested (no `@DataJpaTest`)
- `backend/src/main/java/com/chargersmanager/infrastructure/config/GlobalExceptionHandler.java` — exception mapping untested
- `backend/src/main/java/com/chargersmanager/infrastructure/config/LoggingAspect.java` / `MetricsAspect.java` — AOP aspects untested
- `frontend/src/` — entire frontend is untested
- `admin/src/` — entire admin panel is untested

---

*Testing analysis: 2026-03-18*
