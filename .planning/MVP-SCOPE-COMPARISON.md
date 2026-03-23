# Comparación de Scope — MVP Original vs MVP 4 meses

**Fecha:** 22 de marzo 2026
**Restricción:** 2 horas/persona/día · equipo de 3 · máximo 4 meses calendario

---

## Resumen ejecutivo

| | MVP Original | MVP 4 meses |
|---|---|---|
| Requerimientos funcionales | 57 | 57 |
| Diferidos a v2 | 0 | 4 |
| Diferidos a fase 3 | 0 | 4 |
| Go-live estimado (2h/día) | julio 2027 | **julio 2026** |
| Tiempo ganado | — | **~12 meses** |

El MVP de 4 meses mantiene el flujo principal intacto:
> Un conductor encuentra un cargador, inicia una sesión y paga — Prosepac recibe su reporte mensual.

Lo que se difiere son features operacionales avanzadas, no el núcleo del producto.

---

## Comparación por módulo

### Autenticación y Roles

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| AUTH-01 | Registro con email y contraseña | ✅ | ✅ | |
| AUTH-03 | Recupero de contraseña por email | ✅ | ✅ | |
| AUTH-04 | 4 roles: Admin / Veedor / Empresa / Usuario | ✅ | ⚠️ | 3 roles (Admin/Empresa/Usuario) — Veedor en fase 3 |
| AUTH-06 | Admin suspende / elimina usuarios | ✅ | ✅ | |
| AUTH-08 | Tokens con expiración y revocación | ✅ | ✅ | |

---

### Gestión de Cargadores

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| CHRG-01 | Admin registra cargador (nombre, lat/lng, conector, kW, fotos, ocppId) | ✅ | ✅ | |
| CHRG-02 | Mapeo ocppChargePointId → ChargerId UUID | ✅ | ✅ | Crítico para OCPP |
| CHRG-04 | Habilitar / deshabilitar cargador manualmente | ✅ | ✅ | |
| CHRG-05 | Historial de estados con timestamp | ✅ | ✅ | |

---

### OCPP 1.6J — Central System

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| OCPP-01 | Central System OCPP 1.6J (WebSocket) | ✅ | ✅ | |
| OCPP-02 | BootNotification — registro y autenticación | ✅ | ✅ | |
| OCPP-03 | Heartbeat + detección de cargadores offline | ✅ | ✅ | |
| OCPP-04 | StatusNotification → Redis (latencia < 5s) | ✅ | ✅ | |
| OCPP-05 | transactionId persiste a BD ANTES de StartTransaction.conf | ✅ | ✅ | Crítico — no se negocia |
| OCPP-06 | MeterValues — acumulación de kWh | ✅ | ✅ | |
| OCPP-07 | StopTransaction.req como fuente de verdad | ✅ | ✅ | Crítico — no se negocia |
| OCPP-08 | RemoteStartTransaction / RemoteStopTransaction | ✅ | ✅ | |
| OCPP-09 | Reconexión de cargador sin pérdida de sesión activa | ✅ | ✅ | |

---

### Sesiones de Carga

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| SESS-01 | Usuario inicia sesión desde app | ✅ | ✅ | |
| SESS-02 | App muestra kWh, duración y costo en tiempo real | ✅ | ✅ | |
| SESS-03 | Usuario detiene sesión desde app | ✅ | ✅ | |
| SESS-04 | Detención automática si vehículo se desconecta | ✅ | ✅ | |
| SESS-05 | Resumen al finalizar: kWh, duración, costo, desglose | ✅ | ✅ | |
| SESS-06 | Historial de sesiones en app | ✅ | ✅ | |

---

### Modelo de Precios

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| PRICE-01 | Precio calculado en backend por kWh (meterStart/meterStop) | ✅ | ✅ | Nunca en frontend |
| PRICE-02 | Bajada de bandera (cargo fijo de conexión) | ✅ | ✅ | |
| PRICE-03 | Admin configura precio por cargador | ✅ | ✅ | |
| PRICE-04 | Cargadores gratuitos ($0) sin transacción de pago | ✅ | ✅ | |
| PRICE-05 | Comisión porcentual configurable por transacción | ✅ | ✅ | |
| PRICE-06 | Precio estimado visible antes de iniciar sesión | ✅ | ✅ | |

---

### Pagos y Facturación

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| PAY-01 | Usuario registra método de pago | ✅ | ✅ | |
| PAY-02 | Integración MercadoPago: pre-auth + captura automática | ✅ | ✅ | |
| PAY-03 | Cobro DESPUÉS de StopTransaction.req (nunca antes) | ✅ | ✅ | Crítico — no se negocia |
| PAY-05 | Comprobante de pago por email y en app | ✅ | ✅ | |
| PAY-06 | Webhooks idempotentes + manejo de fallos | ✅ | ✅ | |
| PAY-07 | Reembolsos parciales / totales desde admin | ✅ | ✅ | |

---

### Notificaciones

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| NOTIF-01 | Push notification: fin de sesión | ✅ | ✅ | |
| NOTIF-02 | Push + email: cobro exitoso | ✅ | ✅ | |
| NOTIF-03 | Alerta admin: cargador offline | ✅ | ✅ | |
| NOTIF-05 | Push: sesión abierta / vehículo inactivo | ✅ | ✅ | |

---

### Panel Admin

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| ADM-01 | Estado en tiempo real de todos los cargadores | ✅ | ✅ | |
| ADM-02 | Dashboard KPIs: sesiones activas, ingresos, online/offline | ✅ | ✅ | |
| ADM-03 | Bloquear / desbloquear cualquier cargador | ✅ | ✅ | |
| ADM-04 | Gestión de usuarios: ver, suspender, eliminar | ✅ | ✅ | |
| ADM-05 | Exportar reportes CSV / Excel con filtros | ✅ | ✅ | |
| ADM-06 | Log del sistema filtrable por ID de cargador | ✅ | ✅ | Grafana/Loki ya disponibles en POC |
| ADM-07 | Configurar plan de distribución de fondos por cliente | ✅ | ✅ | |
| ADM-08 | Ver detalle de cualquier sesión de carga | ✅ | ✅ | |

---

### Panel Empresa (Propietario)

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| OWN-01 | Ver sus cargadores y estado actual | ✅ | ✅ | |
| OWN-02 | Ver historial de sesiones de sus cargadores | ✅ | ✅ | |

---

### Infraestructura

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| INF-01 | PostgreSQL 16 + Flyway | ✅ | ✅ | |
| INF-02 | Redis para caché de estado de cargadores | ✅ | ✅ | |
| INF-03 | HTTPS / WSS con TLS 1.2+ | ✅ | ✅ | |
| INF-04 | Autenticación OCPP Basic Auth | ✅ | ✅ | |
| INF-05 | Logs estructurados con nivel y correlación (ya existe en POC) | ✅ | ✅ | |
| INF-06 | Health checks para servicios críticos | ✅ | ✅ | |
| INF-07 | Disponibilidad 99.5% + zero-downtime deployments | ✅ | ✅ | |

---

## Los 4 requerimientos diferidos a v2

### Features de producto (v2)

| ID | Requerimiento |
|---|---|
| OCPP-10 | Reconciliación automática de sesiones interrumpidas |
| PAY-08 | Historial de ingresos y liquidaciones para propietario |
| NOTIF-04 | Alerta admin por error técnico OCPP |

### Infraestructura avanzada (v2)

| ID | Requerimiento |
|---|---|
| INF-08 | Load testing 500 sesiones concurrentes |

---

## Fase 3 — Futuro lejano (fuera del alcance de v1 y v2)

Funcionalidades que requieren infraestructura de cargadores privados o seguridad avanzada, sin fecha comprometida.

| ID | Requerimiento |
|---|---|
| AUTH-04 (Veedor) | Rol Veedor — visibilidad agregada multi-empresa |
| CHRG-03 | Cargador público / privado por invitación |
| CHRG-06 | Propietario invita usuarios a cargadores privados |
| CHRG-07 | Propietario revoca acceso de usuario invitado |

---

## Lo que NO cambia entre versiones

El flujo de valor central permanece 100% intacto en ambos MVPs:

```
Conductor abre app
    → ve cargador disponible
    → inicia sesión (RemoteStart via OCPP)
    → monitorea kWh y costo en tiempo real
    → detiene sesión (RemoteStop via OCPP)
    → se cobra automáticamente via MercadoPago
    → recibe comprobante
    → Prosepac ve todo desde el panel admin
```

---

## Criterio de decisión para los diferidos

Un requerimiento se difirió a v2 si cumple **al menos una** de estas condiciones:

1. **Prosepac puede operar sin él** en los primeros meses usando un proceso manual equivalente
2. **No bloquea ninguna sesión de carga** real de un usuario final
3. **Su ausencia no genera pérdida de dinero** ni inconsistencias de datos
4. **Existe una alternativa operacional** accesible para Prosepac (ej: MercadoPago dashboard, Grafana/Loki)

---

*Creado: 2026-03-22*
*Revisar con Prosepac antes de confirmar el scope de 4 meses*
