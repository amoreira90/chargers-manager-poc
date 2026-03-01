# Arquitectura Hexagonal — Chargers Manager

## ¿Qué es la arquitectura hexagonal?

La arquitectura hexagonal (también llamada *Ports & Adapters*) organiza el código en capas concéntricas donde **el dominio es el centro** y nunca depende de nada externo. La comunicación con el exterior (HTTP, base de datos, mensajería) ocurre a través de **puertos** (interfaces) e **adaptadores** (implementaciones).

La regla fundamental es la **Regla de Dependencia**: las capas externas pueden depender de las internas, pero nunca al revés.

```
      [ REST / HTTP ]   [ Tests ]         ← Driving (actores primarios)
            │                │
     ┌──────▼────────────────▼──────┐
     │       Driving Adapters       │
     │   (ChargerController)        │
     └──────────┬───────────────────┘
                │
     ┌──────────▼───────────────────┐
     │     Application Layer        │  ← Orquesta casos de uso
     │     (ChargerService)         │
     └──────────┬───────────────────┘
                │
     ┌──────────▼───────────────────┐
     │       Domain Layer           │  ← Lógica de negocio pura
     │  Charger · Location · etc.   │
     └──────────┬───────────────────┘
                │
     ┌──────────▼───────────────────┐
     │      Driven Adapters         │
     │  (ChargerRepositoryAdapter)  │
     └──────────────────────────────┘
                │
      [ JPA / H2 ]                       ← Driven (actores secundarios)
```

---

## Estructura de paquetes

```
com.chargersmanager/
│
├── domain/                          ← Núcleo del negocio (sin dependencias externas)
│   ├── model/
│   │   ├── Charger.java             ← Aggregate Root
│   │   ├── ChargerId.java           ← Value Object (identidad)
│   │   ├── ChargerStatus.java       ← Enum de estados
│   │   ├── Location.java            ← Value Object (inmutable)
│   │   └── PowerOutput.java         ← Value Object (inmutable)
│   ├── exception/
│   │   ├── ChargerNotFoundException.java
│   │   └── DomainException.java
│   └── port/
│       ├── usecase/                 ← Driving ports (lo que el exterior puede pedir)
│       │   ├── CreateChargerUseCase.java
│       │   ├── FindChargerUseCase.java
│       │   ├── UpdateChargerStatusUseCase.java
│       │   └── CreateChargerCommand.java
│       └── repository/              ← Driven port (lo que el dominio necesita)
│           └── ChargerRepository.java
│
├── application/                     ← Orquestación de casos de uso
│   └── service/
│       └── ChargerService.java      ← Implementa los 3 use cases
│
└── infrastructure/                  ← Todo lo externo al dominio
    ├── adapter/
    │   ├── rest/                    ← Driving adapter (HTTP)
    │   │   ├── ChargerController.java
    │   │   ├── dto/
    │   │   │   ├── ChargerRequest.java
    │   │   │   └── ChargerResponse.java
    │   │   └── mapper/
    │   │       └── ChargerRestMapper.java
    │   └── persistence/             ← Driven adapter (JPA)
    │       ├── ChargerRepositoryAdapter.java
    │       ├── entity/
    │       │   ├── ChargerEntity.java
    │       │   └── ChargerStatusEntity.java
    │       ├── mapper/
    │       │   └── ChargerPersistenceMapper.java
    │       └── repository/
    │           └── SpringChargerRepository.java
    └── config/
        ├── GlobalExceptionHandler.java  ← Manejo de errores HTTP
        ├── LoggingAspect.java           ← AOP: logging automático
        └── MetricsAspect.java           ← AOP: métricas automáticas
```

---

## Modelo de dominio

### `Charger` — Aggregate Root

Es la entidad central. Contiene toda la lógica de negocio sobre el ciclo de vida de un cargador. Ninguna otra clase puede mutar su estado directamente.

```
Charger
├── id: ChargerId          (identidad única UUID)
├── name: String
├── status: ChargerStatus  (AVAILABLE | CHARGING | OUT_OF_SERVICE)
├── location: Location     (value object)
└── powerOutput: PowerOutput (value object)

Comportamientos:
  activate()        → válido solo si no está OUT_OF_SERVICE
  deactivate()      → siempre válido
  startCharging()   → válido solo si está AVAILABLE
  stopCharging()    → válido solo si está CHARGING
```

### Value Objects

Son **inmutables** y se validan en construcción. No tienen identidad propia.

| Clase | Campos | Validación |
|---|---|---|
| `Location` | address, latitude, longitude | address != null |
| `PowerOutput` | kilowatts | kilowatts > 0 |
| `ChargerId` | value (UUID) | formato UUID válido |

### Máquina de estados

```
                   ┌─────────────┐
             ──────► AVAILABLE   ◄──────
            │      └──────┬──────┘      │
         activate    startCharging  stopCharging
            │             │              │
   ┌────────┴──────┐  ┌───▼────────┐     │
   │ OUT_OF_SERVICE│  │  CHARGING  ├─────┘
   └───────────────┘  └────────────┘
          ▲
       deactivate (desde AVAILABLE)
```

---

## Puertos y Adaptadores

### Driving Ports (interfaces que el exterior llama)

Siguiendo el **Principio de Segregación de Interfaces (ISP)**, cada caso de uso tiene su propia interfaz:

| Puerto | Métodos |
|---|---|
| `CreateChargerUseCase` | `createCharger(command)` |
| `FindChargerUseCase` | `findById(id)`, `findAll()`, `findAvailable()` |
| `UpdateChargerStatusUseCase` | `activate(id)`, `deactivate(id)`, `startCharging(id)`, `stopCharging(id)` |

### Driven Port (interfaz que el dominio necesita)

| Puerto | Métodos |
|---|---|
| `ChargerRepository` | `save`, `findById`, `findAll`, `findByStatus`, `deleteById`, `existsById` |

El dominio depende de esta **abstracción**, nunca de JPA o H2.

### Adaptadores

| Adaptador | Tipo | Implementa |
|---|---|---|
| `ChargerController` | Driving (REST) | — (delega a los use cases) |
| `ChargerRepositoryAdapter` | Driven (JPA) | `ChargerRepository` |

---

## Cross-cutting concerns (AOP)

Tanto el logging como las métricas son concerns transversales implementados con **Spring AOP**. Se aplican automáticamente a todas las capas sin modificar el código de negocio.

### `MetricsAspect`

Intercepta todas las ejecuciones de las tres capas y registra en Prometheus:

| Métrica | Tipo | Tags |
|---|---|---|
| `usecase.executions` | Counter | name, status (success/error) |
| `usecase.duration` | Timer | name |
| `rest.requests` | Counter | method, status |
| `persistence.operations` | Counter | operation, status |
| `domain.violations` | Counter | type |

### `LoggingAspect`

Loguea automáticamente entrada, salida y errores de cada método en las capas de aplicación e infraestructura.

---

## Decisiones de diseño

### ISP — Interfaces pequeñas por caso de uso
En lugar de una única interfaz `ChargerService` con todos los métodos, se definen tres interfaces separadas. El `ChargerController` solo puede llamar lo que le corresponde; no puede invocar operaciones de otro contexto por error.

### DIP — Inversión de dependencias
`ChargerService` depende de `ChargerRepository` (interfaz del dominio), no de `ChargerRepositoryAdapter` (la implementación JPA). Esto permite cambiar H2 por PostgreSQL sin tocar la capa de aplicación.

### Command pattern
`CreateChargerCommand` encapsula y valida los datos de entrada antes de llegar al dominio. Si el comando es inválido, falla en construcción — nunca llega al aggregate root con datos corruptos.

### Value Objects inmutables
`Location` y `PowerOutput` no tienen setters. Una vez creados, no pueden cambiar. Esto elimina toda una clase de bugs donde el estado de un objeto se modifica desde fuera inesperadamente.
