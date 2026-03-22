# Comparación de Scope — MVP Original vs MVP 4 meses

**Fecha:** 22 de marzo 2026
**Restricción:** 2 horas/persona/día · equipo de 3 · máximo 4 meses calendario

---

## Resumen ejecutivo

| | MVP Original | MVP 4 meses |
|---|---|---|
| Requerimientos funcionales | 69 | 52 |
| Diferidos a v2 | 0 | 17 |
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
| AUTH-02 | OAuth Google / Apple | ✅ | ❌ | Diferido — email/pass alcanza para lanzar |
| AUTH-03 | Recupero de contraseña por email | ✅ | ✅ | |
| AUTH-04 | 4 roles: Admin / Veedor / Empresa / Usuario | ✅ | ⚠️ | 3 roles — Veedor diferido a v2 |
| AUTH-05 | Multi-rol simultáneo por usuario | ✅ | ❌ | Diferido |
| AUTH-06 | Admin suspende / elimina usuarios | ✅ | ✅ | |
| AUTH-07 | 2FA (TOTP) para panel admin | ✅ | ❌ | Diferido — contraseña fuerte es suficiente al inicio |
| AUTH-08 | Tokens con expiración y revocación | ✅ | ✅ | |

---

### Gestión de Cargadores

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| CHRG-01 | Admin registra cargador (nombre, lat/lng, conector, kW, fotos, ocppId) | ✅ | ✅ | |
| CHRG-02 | Mapeo ocppChargePointId → ChargerId UUID | ✅ | ✅ | Crítico para OCPP |
| CHRG-03 | Cargador público / privado por invitación | ✅ | ❌ | Diferido — todos públicos al inicio |
| CHRG-04 | Habilitar / deshabilitar cargador manualmente | ✅ | ✅ | |
| CHRG-05 | Historial de estados con timestamp | ✅ | ✅ | |
| CHRG-06 | Propietario invita usuarios a cargadores privados | ✅ | ❌ | Diferido con CHRG-03 |
| CHRG-07 | Propietario revoca acceso de usuario invitado | ✅ | ❌ | Diferido con CHRG-03 |

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
| OCPP-10 | Sesiones interrumpidas — reconciliación automática | ✅ | ❌ | V1: nueva sesión al reconectar (ya definido en Cierre de Decisiones) |

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
| SESS-07 | Manguera trabada: gracia + multa + notificación | ✅ | ❌ | Diferido — Prosepac gestiona manualmente si ocurre |

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
| PAY-04 | Split automático plataforma / empresa | ✅ | ❌ | Diferido — Prosepac distribuye manualmente cada mes |
| PAY-05 | Comprobante de pago por email y en app | ✅ | ✅ | |
| PAY-06 | Webhooks idempotentes + manejo de fallos | ✅ | ✅ | |
| PAY-07 | Reembolsos parciales / totales desde admin | ✅ | ❌ | Diferido — Prosepac gestiona directo con MercadoPago |
| PAY-08 | Historial de ingresos y liquidaciones (propietario) | ✅ | ❌ | Diferido a v2 |

---

### Notificaciones

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| NOTIF-01 | Push notification: fin de sesión | ✅ | ✅ | |
| NOTIF-02 | Push + email: cobro exitoso | ✅ | ✅ | |
| NOTIF-03 | Alerta admin: cargador offline | ✅ | ✅ | |
| NOTIF-04 | Alerta admin: error técnico OCPP | ✅ | ❌ | Diferido — admin revisa logs manualmente |
| NOTIF-05 | Push: multa por manguera trabada | ✅ | ❌ | Diferido con SESS-07 |

---

### Panel Admin

| ID | Requerimiento | MVP Original | MVP 4 meses | Nota |
|---|---|:---:|:---:|---|
| ADM-01 | Estado en tiempo real de todos los cargadores | ✅ | ✅ | |
| ADM-02 | Dashboard KPIs: sesiones activas, ingresos, online/offline | ✅ | ✅ | |
| ADM-03 | Bloquear / desbloquear cualquier cargador | ✅ | ✅ | |
| ADM-04 | Gestión de usuarios: ver, suspender, eliminar | ✅ | ✅ | |
| ADM-05 | Exportar reportes CSV / Excel con filtros | ✅ | ❌ | Diferido — exportación manual desde BD si necesario |
| ADM-06 | Log del sistema filtrable por ID de cargador | ✅ | ❌ | Diferido — Grafana/Loki ya disponibles (POC) |
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
| INF-07 | Disponibilidad 99.5% + zero-downtime deployments | ✅ | ❌ | Diferido — deploy básico rolling, SLA formal en v2 |
| INF-08 | Soporte de 500 sesiones concurrentes (load testing) | ✅ | ❌ | Diferido — load testing formal en v2 |

---

## Los 17 requerimientos diferidos a v2

### Operaciones manuales temporales (Prosepac asume hasta v2)

| ID | Requerimiento | Cómo se opera en v1 |
|---|---|---|
| PAY-04 | Split automático plataforma / empresa | Prosepac distribuye manualmente cada mes (ya acordado en cierre de decisiones) |
| PAY-07 | Reembolsos desde admin | Prosepac gestiona directo desde panel MercadoPago |
| SESS-07 | Manguera trabada: multa + notificación | Prosepac monitorea y actúa manualmente si ocurre |

### Features de producto (no bloquean el flujo principal)

| ID | Requerimiento |
|---|---|
| AUTH-02 | OAuth Google / Apple |
| AUTH-04 | Rol Veedor (lanza con 3 roles) |
| AUTH-05 | Multi-rol simultáneo por usuario |
| AUTH-07 | 2FA para admin |
| CHRG-03 | Cargadores públicos / privados por invitación |
| CHRG-06 | Invitar usuarios a cargadores privados |
| CHRG-07 | Revocar acceso de usuario invitado |
| OCPP-10 | Reconciliación automática de sesiones interrumpidas |
| PAY-08 | Historial de ingresos y liquidaciones para propietario |
| NOTIF-04 | Alerta admin por error técnico OCPP |
| NOTIF-05 | Push por manguera trabada |

### Infraestructura avanzada (post-estabilización)

| ID | Requerimiento |
|---|---|
| ADM-05 | Exportar reportes CSV / Excel |
| ADM-06 | Log del sistema filtrable por cargador |
| INF-07 | SLA formal 99.5% + zero-downtime |
| INF-08 | Load testing 500 sesiones concurrentes |

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
