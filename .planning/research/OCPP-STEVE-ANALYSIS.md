# Research: SteVe OCPP 1.6J — Análisis para Fase 2

**Fecha:** 2026-03-22
**Fuente:** `steve-master/` — SteVe v3.4.4 (RWTH Aachen University)
**Propósito:** Referencia de implementación para el Central System OCPP 1.6J de Prosepac

---

## Qué es SteVe

Central System OCPP de producción open source (GPL). Soporta OCPP 1.2J/S, 1.5J/S, **1.6J/S**.
Stack: Java 11 · Spring 5 · Jetty 9 · MySQL · jOOQ · Jackson · Apache CXF (SOAP).

Nos interesa **exclusivamente la capa OCPP 1.6J (WebSocket/JSON)**.

---

## Arquitectura OCPP 1.6J en SteVe

```
Charger (WSS)
    → OcppWebSocketUpgrader       (handshake + Basic Auth)
    → Ocpp16WebSocketEndpoint     (lifecycle: connect / message / close / error)
    → IncomingPipeline
        → Deserializer            (JSON → RequestType JAXB)
        → Ocpp16CallHandler       (dispatch por tipo de mensaje)
    → CentralSystemService16_SoapServer  (thin adapter)
    → CentralSystemService16_Service     (lógica de negocio)
    → OcppServerRepository               (persistencia, jOOQ + MySQL)
```

Para **outgoing commands** (RemoteStart, RemoteStop, ChangeAvailability):
```
Admin / App
    → ChargePointService16_InvokerImpl
    → FutureResponseContextStore   (correlación messageId → callback)
    → WebSocketSession.sendMessage()
```

---

## Mensajes OCPP 1.6J manejados

Todos los mensajes que necesitamos están implementados en `Ocpp16CallHandler`:

| Mensaje | Clase JAXB | Nuestro req |
|---|---|---|
| BootNotification | `BootNotificationRequest` | OCPP-02 |
| Heartbeat | `HeartbeatRequest` | OCPP-03 |
| StatusNotification | `StatusNotificationRequest` | OCPP-04 |
| StartTransaction | `StartTransactionRequest` | OCPP-05 |
| MeterValues | `MeterValuesRequest` | OCPP-06 |
| StopTransaction | `StopTransactionRequest` | OCPP-07 |
| Authorize | `AuthorizeRequest` | (no usamos RFID) |
| DataTransfer | `DataTransferRequest` | — |

Outgoing commands en `ChargePointService16_InvokerImpl`:
- `RemoteStartTransaction` → OCPP-08
- `RemoteStopTransaction` → OCPP-08
- `ChangeAvailability` → ADM-03

---

## Componentes directamente adoptables

### 1. Pipeline de mensajes entrantes

```java
// Patrón a adoptar tal cual (adaptando imports)
IncomingPipeline pipeline = new IncomingPipeline(deserializer, new Ocpp16CallHandler(service));

// AbstractCallHandler — deserializa y rutea
protected abstract ResponseType dispatch(RequestType params, String chargeBoxId);
```

**Acción:** Copiar el patrón `IncomingPipeline` + `AbstractCallHandler` en nuestro módulo OCPP hexagonal.

### 2. FutureResponseContextStore

```java
// Correlación asíncrona: messageId enviado → respuesta recibida del charger
// (session, messageId) → FutureResponseContext
private final Map<WebSocketSession, Map<String, FutureResponseContext>> lookupTable = new ConcurrentHashMap<>();
```

**Acción:** Adoptar directamente. Ya es un `@Service` de Spring, sin dependencias externas.

### 3. SessionContextStore (dentro de AbstractWebSocketEndpoint)

Maneja múltiples sesiones WebSocket por charger (reconexiones):
- `onOpen`: registra sesión, notifica solo si es la primera (0 → 1)
- `onClose`: elimina sesión, notifica solo si es la última (1 → 0)
- Ping/Pong automático cada 15 min para mantener conexión viva

**Acción:** Adoptar el patrón. Resuelve OCPP-09 (reconexión sin pérdida).

### 4. OcppWebSocketUpgrader (Basic Auth en handshake)

Valida el `chargeBoxId` durante el upgrade del WebSocket antes de procesar ningún mensaje.
Extrae el ID del path: `/websocket/CentralSystemService/{chargeBoxId}`

**Acción:** Adaptar para validar contra nuestra BD de cargadores (CHRG-02: mapeo ocppChargePointId → UUID).

### 5. Dependencia Maven: `de.rwth.idsg:ocpp-jaxb`

Provee todas las clases JAXB de mensajes OCPP 1.6:
- `ocpp.cs._2015._10.*` — mensajes Charge Point → Central System
- `ocpp.cp._2015._10.*` — mensajes Central System → Charge Point

```xml
<!-- Agregar al pom.xml de nuestro backend -->
<dependency>
    <groupId>de.rwth.idsg</groupId>
    <artifactId>ocpp-jaxb</artifactId>
    <version><!-- verificar última versión en Maven Central --></version>
</dependency>
```

**Acción:** Incluir esta dependencia. Evita generar los tipos OCPP desde cero.

---

## Lo que NO adoptamos de SteVe

| Componente SteVe | Por qué no |
|---|---|
| Jetty standalone | Usamos Spring Boot embebido |
| jOOQ + MySQL | Usamos JPA + PostgreSQL + Flyway |
| Apache CXF / SOAP stack | Solo necesitamos JSON/WebSocket |
| RFID / OcppTagService | Auth es via app mobile, no tarjeta |
| Panel admin de SteVe | Construimos el nuestro |
| `OcppServerRepository` | Acoplado a jOOQ — reemplazar con JPA |

---

## Gaps que SteVe NO resuelve — construir desde cero

### GAP-1: Redis para estado de cargadores (OCPP-04)

SteVe persiste `StatusNotification` directo en MySQL. Nosotros necesitamos Redis para latencia <5s.

```java
// En nuestro statusNotification() handler:
public StatusNotificationResponse statusNotification(StatusNotificationRequest req, String chargeBoxId) {
    // 1. Persistir en PostgreSQL (histórico)
    chargerRepository.saveStatusHistory(chargeBoxId, req.getStatus(), req.getTimestamp());
    // 2. Actualizar Redis (estado actual, TTL = heartbeatInterval × 2)
    redisTemplate.opsForValue().set("charger:status:" + chargeBoxId, req.getStatus(), ttl);
    return new StatusNotificationResponse();
}
```

### GAP-2: transactionId a BD ANTES de conf (OCPP-05 — crítico)

SteVe lo hace pero con jOOQ. Nuestro equivalente con JPA:

```java
public StartTransactionResponse startTransaction(StartTransactionRequest req, String chargeBoxId) {
    // ORDEN CRÍTICO: persistir ANTES de armar la respuesta
    ChargingSession session = sessionRepository.save(new ChargingSession(
        chargeBoxId, req.getConnectorId(), req.getMeterStart(), req.getTimestamp()
    ));
    // Solo DESPUÉS de confirmado el save, respondemos con el transactionId
    return new StartTransactionResponse()
        .withTransactionId(session.getOcppTransactionId())
        .withIdTagInfo(new IdTagInfo().withStatus(AuthorizationStatus.ACCEPTED));
}
```

### GAP-3: Heartbeat timeout → charger offline (OCPP-03)

SteVe actualiza el timestamp del Heartbeat pero no detecta inactividad automáticamente.

```java
@Scheduled(fixedDelay = 60_000) // cada 60 segundos
public void detectOfflineChargers() {
    int heartbeatInterval = settingsRepository.getHeartbeatIntervalInSeconds();
    DateTime threshold = DateTime.now().minusSeconds(heartbeatInterval * 2);
    List<String> offline = chargerRepository.findByLastHeartbeatBefore(threshold);
    offline.forEach(id -> {
        redisTemplate.opsForValue().set("charger:status:" + id, "Offline");
        notificationService.chargerWentOffline(id); // NOTIF-03
    });
}
```

### GAP-4: Motor de precios (PRICE-01 al 06)

SteVe no sabe de precios. Construir `PricingEngine`:

```java
BigDecimal calculateCost(String chargerId, int meterStart, int meterStop) {
    Tariff tariff = tariffRepository.findByChargerId(chargerId);
    BigDecimal kWh = BigDecimal.valueOf(meterStop - meterStart).divide(BigDecimal.valueOf(1000));
    BigDecimal energyCost = kWh.multiply(tariff.getPricePerKwh());
    BigDecimal connectionFee = tariff.getConnectionFee(); // bajada de bandera
    BigDecimal subtotal = energyCost.add(connectionFee);
    BigDecimal commission = subtotal.multiply(tariff.getCommissionRate());
    return subtotal.add(commission);
}
```

### GAP-5: Sesión de usuario (SESS-01 al 06)

SteVe no tiene concepto de "usuario de app que inicia sesión". La máquina de estados es nuestra:

```
IDLE → REQUESTED (usuario toca "iniciar" en app)
    → PENDING (RemoteStart enviado al charger)
    → ACTIVE (StartTransaction.req recibido)
    → STOPPING (usuario toca "detener" o vehículo desconecta)
    → COMPLETED (StopTransaction.req recibido + cobro procesado)
    → FAILED (timeout o error OCPP)
```

---

## Impacto en Fase 2 del roadmap

Con SteVe como referencia, las semanas 1-3 de investigación se reducen significativamente:

| Tarea original sem 1-3 | Estado con SteVe |
|---|---|
| Research librería Java-OCA-OCPP | ✅ Resuelto — usar `ocpp-jaxb` de SteVe |
| Diseño del WebSocket handler | ✅ Resuelto — adoptar patrón AbstractWebSocketEndpoint |
| Estrategia de idempotencia transactionId | ✅ Resuelto — ver GAP-2 arriba |
| Handshake subprotocolo OCPP | ✅ Resuelto — ver OcppWebSocketUpgrader |
| Buffer de mensajes offline | ✅ Resuelto — SessionContextStore |

**Ahorro estimado: 2-3 semanas calendario en Fase 2.**

---

## Checklist de adopción para Fase 2

- [ ] Agregar dependencia `de.rwth.idsg:ocpp-jaxb` al `pom.xml`
- [ ] Crear módulo `ocpp/` en capa infrastructure siguiendo patrón hexagonal
- [ ] Adaptar `AbstractWebSocketEndpoint` → `OcppWebSocketHandler`
- [ ] Adaptar `IncomingPipeline` + `AbstractCallHandler` → `OcppMessagePipeline`
- [ ] Adaptar `FutureResponseContextStore` → adoptar casi sin cambios
- [ ] Adaptar `OcppWebSocketUpgrader` → validar contra `chargerRepository`
- [ ] Implementar `OcppCentralSystemService` (nuestro `CentralSystemService16_Service`)
  - [ ] `bootNotification()` → actualizar BD + Redis
  - [ ] `heartbeat()` → actualizar timestamp en BD + Redis
  - [ ] `statusNotification()` → BD + Redis (GAP-1)
  - [ ] `startTransaction()` → persistir ANTES de responder (GAP-2, crítico)
  - [ ] `meterValues()` → acumular kWh en Redis durante sesión
  - [ ] `stopTransaction()` → cerrar sesión + trigger cobro
- [ ] Implementar `HeartbeatMonitorJob` (@Scheduled) para offline detection (GAP-3)
- [ ] Implementar `ChargePointCommandService` (adaptar `ChargePointService16_InvokerImpl`)
  - [ ] `remoteStartTransaction()`
  - [ ] `remoteStopTransaction()`
  - [ ] `changeAvailability()`

---

*Creado: 2026-03-22*
*Basado en análisis directo del código fuente de steve-master/*
