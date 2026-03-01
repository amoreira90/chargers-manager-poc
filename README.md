# Chargers Manager POC

POC de gestión de cargadores eléctricos implementado con **arquitectura hexagonal** (Ports & Adapters). El objetivo es demostrar separación de capas, inversión de dependencias, y observabilidad completa con métricas y logs.

## Tech Stack

| Tecnología | Rol |
|---|---|
| Spring Boot 3.2 | Framework principal |
| Java 17 | Lenguaje |
| H2 (in-memory) | Base de datos |
| MapStruct | Mapeo entre capas |
| Lombok | Reducción de boilerplate |
| Micrometer + Prometheus | Métricas |
| Grafana | Visualización de métricas y logs |
| Loki + Promtail | Agregación de logs |
| Docker + Docker Compose | Containerización |
| springdoc-openapi | Documentación de API |

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE                           │
│                                                                 │
│  ┌─────────────────┐              ┌──────────────────────────┐  │
│  │   REST Adapter  │              │   Persistence Adapter    │  │
│  │ ChargerController│             │ ChargerRepositoryAdapter  │  │
│  └────────┬────────┘              └───────────┬──────────────┘  │
│           │ implements                         │ implements      │
│  ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ │
│           │          APPLICATION               │                 │
│           ▼                                   │                 │
│  ┌────────────────────────────────────────────┴──────────────┐  │
│  │                      ChargerService                       │  │
│  │      (implements use cases, orchestrates domain)          │  │
│  └────────────────────────────────────────────┬──────────────┘  │
│           │          DOMAIN                   │                 │
│  ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ │
│  ┌────────▼────────┐              ┌───────────▼──────────────┐  │
│  │  Driving Ports  │              │      Driven Ports        │  │
│  │ (Use Cases)     │              │   (ChargerRepository)    │  │
│  └─────────────────┘              └──────────────────────────┘  │
│           │                                                     │
│  ┌────────▼────────────────────────────────────────────────┐    │
│  │                    Domain Model                         │    │
│  │    Charger · Location · PowerOutput · ChargerStatus     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

Ver documentación detallada en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Requisitos

### Para correr con Docker (recomendado)

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Docker Desktop | 4.x (incluye Docker Compose v2) | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Git | cualquiera | [git-scm.com](https://git-scm.com/downloads) |

Verificar instalación:
```bash
docker --version        # Docker version 24.x o superior
docker compose version  # Docker Compose version v2.x
```

> **Nota**: Docker Desktop incluye Docker Compose v2. No es necesario instalarlo por separado.

### Para desarrollo local (sin Docker)

Adicionalmente a Git y Docker (para Prometheus/Grafana/Loki):

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Java JDK | 17 | [Adoptium](https://adoptium.net/) |
| Maven | 3.9+ | [maven.apache.org](https://maven.apache.org/download.cgi) — o usar el wrapper `./mvnw` incluido |

Verificar instalación:
```bash
java -version   # openjdk 17 o superior
mvn -version    # Apache Maven 3.9.x
```

## Quick Start

```bash
# Clonar el repositorio
git clone <repo-url>
cd chargers-manager-poc

# Levantar todo el stack
docker-compose up --build

# Verificar que la app está up
curl http://localhost:8080/actuator/health
```

El primer build descarga dependencias Maven — los siguientes serán más rápidos por el cache de layers.

## API Endpoints

Base URL: `http://localhost:8080/api/v1`

| Método | Endpoint | Descripción | Status codes |
|---|---|---|---|
| `POST` | `/chargers` | Crear un cargador | 201, 400 |
| `GET` | `/chargers` | Listar todos los cargadores | 200 |
| `GET` | `/chargers/available` | Listar cargadores disponibles | 200 |
| `GET` | `/chargers/{id}` | Obtener cargador por ID | 200, 404 |
| `PATCH` | `/chargers/{id}/activate` | Activar un cargador | 200, 404, 409 |
| `PATCH` | `/chargers/{id}/deactivate` | Desactivar un cargador | 200, 404 |
| `PATCH` | `/chargers/{id}/start-charging` | Iniciar carga | 200, 404, 409 |
| `PATCH` | `/chargers/{id}/stop-charging` | Detener carga | 200, 404, 409 |

### Ejemplo: Crear cargador

```bash
curl -X POST http://localhost:8080/api/v1/chargers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Charger Norte",
    "address": "Av. Corrientes 1234, CABA",
    "latitude": -34.6037,
    "longitude": -58.3816,
    "powerKilowatts": 22.0
  }'
```

### Documentación interactiva

Swagger UI disponible en: **http://localhost:8080/swagger-ui.html**

## Estados del Cargador

```
                    ┌─────────────┐
              ──────► AVAILABLE   ◄──────
             │      └──────┬──────┘      │
          activate    start-charging  stop-charging
             │             │              │
    ┌────────┴──────┐  ┌───▼────────┐     │
    │ OUT_OF_SERVICE│  │  CHARGING  ├─────┘
    └───────────────┘  └────────────┘
           ▲
        deactivate (desde AVAILABLE)
```

| Estado | Descripción |
|---|---|
| `AVAILABLE` | Disponible para cargar |
| `CHARGING` | En proceso de carga |
| `OUT_OF_SERVICE` | Fuera de servicio |

## Monitoring

| Servicio | URL | Credenciales |
|---|---|---|
| Grafana | http://localhost:3000 | admin / admin |
| Prometheus | http://localhost:9090 | — |
| Loki | http://localhost:3100/ready | — |
| Swagger UI | http://localhost:8080/swagger-ui.html | — |

### Ver métricas en Grafana

1. Ir a http://localhost:3000 → **Dashboards** → **Chargers Manager** → **Chargers Manager**
2. El dashboard se auto-refresca cada 10 segundos

### Ver logs en Grafana

1. Ir a **Explore** → seleccionar datasource **Loki**
2. Query: `{job="chargers-manager"}`
3. Click en **Run query**

### Métricas custom (PromQL)

```promql
# Requests REST por método y estado
sum by (method, status) (rate(rest_requests_total[1m]))

# Latencia P95 de los use cases
histogram_quantile(0.95, sum by (name, le) (rate(usecase_duration_seconds_bucket[1m])))

# Violaciones de dominio acumuladas
sum by (type) (domain_violations_total)
```

## Desarrollo Local (sin Docker)

```bash
# Compilar
./mvnw clean package -DskipTests

# Correr (perfil dev)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

La app corre en http://localhost:8080. Para Prometheus y Grafana igualmente necesitás Docker:

```bash
docker-compose up prometheus grafana loki promtail
```

## Documentación adicional

- [Arquitectura hexagonal](docs/ARCHITECTURE.md) — diseño, capas, decisiones
- [Runbook de operaciones](docs/RUNBOOK.md) — comandos Docker, troubleshooting
