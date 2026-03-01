# Runbook de Operaciones — Chargers Manager

## Comandos esenciales

### Levantar el stack completo

```bash
# Primera vez o tras cambios en el código
docker-compose up --build

# En background (modo daemon)
docker-compose up --build -d
```

### Detener sin borrar datos

```bash
docker-compose down
```

### Detener y borrar todos los volúmenes (reset total)

```bash
docker-compose down -v
```

> **Advertencia**: esto borra la base de datos H2, el historial de Grafana, los datos de Loki y los logs almacenados.

### Ver estado de los containers

```bash
docker-compose ps
```

Salida esperada cuando todo está OK:

```
NAME                  STATUS
chargers-app          Up
chargers-grafana      Up
chargers-loki         Up
chargers-prometheus   Up
chargers-promtail     Up
```

---

## Ver logs

### Todos los servicios (follow)

```bash
docker-compose logs -f
```

### Por servicio específico

```bash
docker-compose logs -f chargers-app
docker-compose logs -f grafana
docker-compose logs -f prometheus
docker-compose logs -f loki
docker-compose logs -f promtail
```

### Últimas N líneas

```bash
docker-compose logs --tail=100 chargers-app
```

---

## URLs del stack

| Servicio | URL | Credenciales |
|---|---|---|
| App (API) | http://localhost:8080 | — |
| Swagger UI | http://localhost:8080/swagger-ui.html | — |
| Actuator Health | http://localhost:8080/actuator/health | — |
| Métricas raw | http://localhost:8080/actuator/prometheus | — |
| Grafana | http://localhost:3000 | admin / admin |
| Prometheus | http://localhost:9090 | — |
| Loki | http://localhost:3100/ready | — |

---

## Grafana — Ver métricas

1. Ir a **http://localhost:3000** → login con `admin` / `admin`
2. Menú izquierdo → **Dashboards**
3. Carpeta **Chargers Manager** → **Chargers Manager**

El dashboard tiene 6 paneles:

| Panel | Qué muestra |
|---|---|
| REST Requests / min | Requests por endpoint y estado |
| Use Case Executions / min | Ejecuciones de casos de uso |
| Use Case Duration P95 | Latencia del 95% de las ejecuciones |
| Persistence Operations / min | Operaciones de base de datos |
| Domain Violations | Errores de negocio acumulados |
| JVM Heap Memory | Uso de memoria de la JVM |

Para generar tráfico y ver datos, ejecutar requests contra la API.

---

## Grafana — Ver logs (Loki)

1. Ir a **http://localhost:3000**
2. Menú izquierdo → **Explore**
3. Seleccionar datasource **Loki** (arriba a la izquierda)
4. En el query builder escribir: `{job="chargers-manager"}`
5. Click en **Run query**

### Filtros útiles en Loki

```logql
# Solo errores
{job="chargers-manager"} |= "ERROR"

# Requests a un endpoint específico
{job="chargers-manager"} |= "ChargerController"

# Por nivel de log
{job="chargers-manager"} | pattern `<_> <level> <_>` | level = "ERROR"
```

---

## Prometheus — Queries de referencia

Ir a **http://localhost:9090** → pestaña **Graph**.

```promql
# Tasa de requests REST por minuto
rate(rest_requests_total[1m]) * 60

# Requests agrupados por método y estado
sum by (method, status) (rate(rest_requests_total[1m]))

# Latencia P95 de use cases (en ms)
histogram_quantile(0.95, sum by (name, le) (rate(usecase_duration_seconds_bucket[1m]))) * 1000

# Violaciones de dominio acumuladas
sum by (type) (domain_violations_total)

# Uso de heap JVM
jvm_memory_used_bytes{area="heap"}
```

### Verificar que Prometheus scrapea la app

Ir a **http://localhost:9090** → **Status** → **Targets**.

El target `chargers-manager` debe estar en estado **UP**. Si aparece DOWN, ver sección de troubleshooting.

---

## Troubleshooting

### Grafana no carga / está en Restarting

**Causa**: El volumen `grafana-data` tiene estado de una versión anterior incompatible con la configuración actual.

**Solución**:
```bash
docker-compose down -v
docker-compose up -d
```

### La app no inicia

```bash
docker-compose logs chargers-app
```

Causas comunes:
- Puerto 8080 ocupado por otro proceso → matar el proceso o cambiar el puerto
- Error de compilación Maven → verificar que el código compile localmente

### Prometheus no scrapea la app (target DOWN)

1. Verificar http://localhost:9090/targets
2. Verificar que `chargers-app` esté corriendo: `docker-compose ps`
3. Verificar que el endpoint de métricas responde: `curl http://localhost:8080/actuator/prometheus`
4. Revisar `docker/prometheus/prometheus.yml` — el target debe ser `chargers-app:8080`

### No aparecen logs en Loki

1. Verificar que Promtail está corriendo: `docker-compose ps promtail`
2. Verificar logs de Promtail: `docker-compose logs promtail`
3. La app debe estar corriendo con perfil `dev` para que escriba logs al archivo
4. Verificar que el volumen `logs-data` se comparte entre `chargers-app` y `promtail`

### No se puede conectar a la app desde otro container

Los containers se comunican por nombre de servicio dentro de la red de Docker Compose:
- App: `chargers-app:8080`
- Prometheus: `prometheus:9090`
- Loki: `loki:3100`

---

## Profiles de Spring Boot

| Profile | Logging | Actuator endpoints |
|---|---|---|
| `dev` | DEBUG (SQL, requests) | Todos |
| `prod` | WARN/ERROR | Solo health y prometheus |
| *(ninguno)* | INFO | health, info, metrics, prometheus |

Para cambiar el profile en Docker, editar `docker-compose.yml`:

```yaml
chargers-app:
  environment:
    - SPRING_PROFILES_ACTIVE=dev   # cambiar aquí
```

Luego: `docker-compose up --build chargers-app`
