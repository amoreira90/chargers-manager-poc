# Requirements: Prosepac — EVSE Platform

**Defined:** 2026-03-18
**Core Value:** Un conductor puede encontrar un cargador disponible, iniciar y pagar una sesión de carga, y el propietario recibe su liquidación — todo sin fricción operativa.

## v1 Requirements

### Fase 0 — Cierre de decisiones pre-desarrollo

- [ ] **DEC-01**: Proveedor de pagos definido (Stripe vs MercadoPago) y disponibilidad de Marketplace API para Uruguay verificada con MercadoPago
- [ ] **DEC-02**: Moneda de operación definida (pesos uruguayos vs dólares) con implicancias fiscales evaluadas (IVA, DGI e-factura)
- [ ] **DEC-03**: Modelo de comisión definido: monto mínimo fijo + % fijo + decisión de tope máximo
- [ ] **DEC-04**: Modelo de liquidación definido: por transacción vs mensual
- [ ] **DEC-05**: Flujo de alta de cargadores confirmado: solo admin da de alta en MVP (requiere aprobación formal de Prosepac)
- [x] **DEC-06**: Jerarquía de roles definida — 4 roles: Admin (Prosepac), Veedor, Empresa, Usuario
- [ ] **DEC-07**: Flujo de sesión abierta / manguera trabada definido: tiempo de gracia, monto de multa, flujo de notificaciones, RemoteStop automático
- [ ] **DEC-08**: UX de estimación de precio pre-sesión definida (sin % de batería conocido)
- [ ] **DEC-09**: Decisión sobre billeteras digitales en MVP: sí o no
- [ ] **DEC-10**: Alcance del Panel Propietario en MVP vs Fase 2 definido
- [ ] **DEC-11**: Especificación Panel Admin: mapa o lista de cargadores, filtros, log por ID de cargador, reportes
- [ ] **DEC-12**: Nombre de plataforma unificado (CARGÁ / Cargapp / PlugUY)
- [ ] **DEC-13**: Confirmar variante OCPP del hardware de Prosepac: OCPP 1.6J (JSON/WebSocket) vs 1.6S (SOAP)

### Autenticación y Roles

- [ ] **AUTH-01**: Usuario puede registrarse con email y contraseña
- [ ] **AUTH-03**: Usuario puede recuperar contraseña mediante email
- [ ] **AUTH-04**: Sistema soporta 4 roles: Admin (Prosepac — acceso total a la plataforma), Veedor (grupo económico — visibilidad agregada multi-empresa), Empresa (propietario de cargadores — ve solo los suyos), Usuario (conductor final)
- [ ] **AUTH-06**: Admin puede suspender o eliminar cuentas de usuario
- [ ] **AUTH-08**: Tokens de autenticación tienen expiración y soportan revocación

### Gestión de Cargadores

- [ ] **CHRG-01**: Admin puede registrar un cargador con: nombre, ubicación (lat/lng), tipo de conector, potencia máxima (kW), fotos, ocppChargePointId
- [ ] **CHRG-02**: Sistema mapea ocppChargePointId (string del hardware) al ChargerId de plataforma (UUID)
- [ ] **CHRG-04**: Admin o propietario puede habilitar/deshabilitar un cargador manualmente
- [ ] **CHRG-05**: Sistema registra historial de estados de cada cargador con timestamp

### OCPP 1.6 — Central System

- [ ] **OCPP-01**: Backend actúa como Central System OCPP 1.6J (JSON/WebSocket)
- [ ] **OCPP-02**: Sistema maneja BootNotification y registra/autentica el cargador
- [ ] **OCPP-03**: Sistema procesa Heartbeat y detecta cargadores offline
- [ ] **OCPP-04**: Sistema procesa StatusNotification y actualiza estado en tiempo real (latencia máx 5s)
- [ ] **OCPP-05**: Sistema persiste transactionId a base de datos ANTES de enviar StartTransaction.conf
- [ ] **OCPP-06**: Sistema procesa MeterValues y acumula energía kWh durante sesión
- [ ] **OCPP-07**: Sistema procesa StopTransaction.req como fuente de verdad para cierre de sesión
- [ ] **OCPP-08**: Sistema envía RemoteStartTransaction y RemoteStopTransaction
- [ ] **OCPP-09**: Sistema maneja reconexiones de cargadores sin pérdida de sesión activa

### Sesiones de Carga

- [ ] **SESS-01**: Usuario inicia sesión seleccionando cargador disponible en la app
- [ ] **SESS-02**: App muestra en tiempo real durante sesión: kWh cargados, duración, costo acumulado
- [ ] **SESS-03**: Usuario puede detener sesión desde la app en cualquier momento
- [ ] **SESS-04**: Sesión se detiene automáticamente si vehículo se desconecta
- [ ] **SESS-05**: Al finalizar sesión se genera resumen: kWh, duración, costo total, desglose de comisión
- [ ] **SESS-06**: Historial de sesiones del usuario es accesible desde la app

### Modelo de Precios

- [ ] **PRICE-01**: Precio base calculado por kWh consumido (meterStart/meterStop como fuente de verdad — NUNCA calculado en frontend)
- [ ] **PRICE-02**: Sistema soporta cargo fijo de conexión ("bajada de bandera") adicional al precio por kWh
- [ ] **PRICE-03**: Admin configura precio por kWh por cargador en nombre del propietario
- [ ] **PRICE-04**: Sistema soporta cargadores gratuitos ($0) que no generan transacción de pago
- [ ] **PRICE-05**: Sistema cobra comisión porcentual configurable por transacción paga (modelo definido en DEC-03)
- [ ] **PRICE-06**: Precio total estimado de sesión visible para usuario ANTES de iniciarla (UX definida en DEC-08)

### Pagos y Facturación

- [ ] **PAY-01**: Usuario registra método de pago antes de primera sesión paga
- [ ] **PAY-02**: Sistema integra proveedor de pagos seleccionado en DEC-01 con preauthorización al inicio + captura al cierre
- [ ] **PAY-03**: Cobro al usuario se realiza DESPUÉS de recibir StopTransaction.req (nunca antes)
- [ ] **PAY-05**: Usuario recibe comprobante de pago por email y en app al finalizar sesión
- [ ] **PAY-06**: Sistema maneja webhooks de confirmación asíncrona y fallos de pago con idempotencia
- [ ] **PAY-07**: Admin puede gestionar reembolsos parciales o totales

### Notificaciones

- [ ] **NOTIF-01**: Usuario recibe push notification cuando sesión de carga finaliza (FCM)
- [ ] **NOTIF-02**: Usuario recibe notificación (push + email) al realizarse cobro exitoso
- [ ] **NOTIF-03**: Admin recibe alerta cuando cargador se desconecta (offline)
- [ ] **NOTIF-05**: Usuario recibe notificación de multa por sesión abierta / manguera trabada (parámetros de DEC-07)

### Panel Admin (MVP)

- [ ] **ADM-01**: Admin ve estado en tiempo real de todos los cargadores (vista mapa o lista — definida en DEC-11)
- [ ] **ADM-02**: Dashboard muestra KPIs globales: sesiones activas, ingresos del día/mes, cargadores online/offline
- [ ] **ADM-03**: Admin puede bloquear/desbloquear cualquier cargador
- [ ] **ADM-04**: Admin puede gestionar usuarios: ver, suspender, eliminar
- [ ] **ADM-05**: Admin puede exportar reportes de sesiones e ingresos en CSV (filtros definidos en DEC-11)
- [ ] **ADM-06**: Admin puede ver log del sistema con filtro por ID de cargador (si confirmado en DEC-11)
- [ ] **ADM-07**: Admin puede configurar plan de distribución de fondos
- [ ] **ADM-08**: Admin puede ver detalle de cualquier sesión de carga

### Panel Propietario (MVP)

- [ ] **OWN-01**: Propietario puede ver sus cargadores y estado actual (alcance definido en DEC-10)
- [ ] **OWN-02**: Propietario puede ver historial de sesiones de sus cargadores (alcance definido en DEC-10)

### Infraestructura y Datos

- [ ] **INF-01**: Base de datos migrada de H2 a PostgreSQL 16 con Flyway antes de cualquier trabajo OCPP
- [ ] **INF-02**: Redis para cache de estado de cargadores (requisito de latencia <5s)
- [ ] **INF-03**: Toda comunicación usa HTTPS/WSS con TLS 1.2+
- [ ] **INF-04**: Autenticación OCPP entre cargadores y backend (Basic Auth o certificados)
- [ ] **INF-05**: Sistema expone logs estructurados con nivel y correlación de requests
- [ ] **INF-06**: Health checks para todos los servicios críticos
- [ ] **INF-07**: Disponibilidad objetivo 99.5% con zero-downtime deployments

## v2 Requirements

### OCPP Avanzado

- **OCPP-10**: Sistema reconcilia sesiones interrumpidas por pérdida de conectividad automáticamente

### Pagos y Reportes

- **PAY-08**: Propietario puede ver historial de ingresos y liquidaciones

### Notificaciones

- **NOTIF-04**: Admin recibe alerta ante errores técnicos reportados vía OCPP

### Infraestructura

- **INF-08**: Soporte de al menos 500 sesiones de carga concurrentes (load testing formal)

### Seguridad Avanzada

- **AUTH-02**: Usuario puede autenticarse con Google o Apple (OAuth 2.0)
- **AUTH-07**: Panel de administración requiere 2FA (TOTP)

### Mapa y Descubrimiento

- **MAP-01**: App muestra mapa con cargadores públicos disponibles
- **MAP-02**: Cargadores privados visibles solo para usuarios autorizados
- **MAP-03**: Mapa actualiza estados en tiempo real (máx 30s polling)
- **MAP-04**: Filtros por tipo de conector, potencia mínima, disponibilidad

### Onboarding de Actores Privados (autoservicio)

- **ENT-01**: Solicitud de alta de actores vía formulario
- **ENT-02**: Admin aprueba/rechaza solicitudes con notificación

### Panel Propietario Completo

- **OWN-F2-01**: Propietario puede habilitar/deshabilitar sus cargadores
- **OWN-F2-02**: Propietario puede ver reportes de ingresos (bruto, comisión, neto)
- **OWN-F2-03**: Propietario hogareño puede subir factura UTE para recalcular precios

### Expansión

- **EXP-01**: QR code para inicio de sesión
- **EXP-02**: Tarifas dinámicas por franja horaria (pico/valle)
- **EXP-03**: Cargadores hogareños con modelo peer-to-peer
- **EXP-04**: Interoperabilidad OCPI 2.2 (roaming)
- **EXP-05**: Web app

## Fase 3 Requirements (Futuro lejano)

Funcionalidades que dependen de infraestructura de cargadores privados o seguridad avanzada. Sin fecha comprometida.

### Roles avanzados

- **AUTH-04 (Veedor)**: Rol Veedor — visibilidad agregada multi-empresa (grupo económico)

### Cargadores privados

- **CHRG-03**: Cargador puede marcarse como público o privado (por invitación)
- **CHRG-06**: Propietario puede invitar usuarios específicos a sus cargadores privados
- **CHRG-07**: Propietario puede revocar acceso de un usuario invitado

---

## Out of Scope

| Feature | Razón |
|---|---|
| Multi-rol simultáneo por usuario (AUTH-05) | Un usuario tiene un único rol en el sistema — innecesario en cualquier fase |
| OAuth Google / Apple (AUTH-02) | Diferido a v2 — email/contraseña alcanza para el lanzamiento |
| Manguera trabada: multa automática (SESS-07) | Descartado — fuera de scope en todas las fases |
| Split automático plataforma/empresa (PAY-04) | Descartado — fuera de scope en todas las fases |
| 2FA TOTP para admin (AUTH-07) | Diferido a v2 — contraseña fuerte es suficiente para el lanzamiento |
| Registro de cargadores por propietario en MVP | Configuración técnica compleja — solo admin en MVP (feedback Prosepac) |
| QR code en MVP | Descartado por Prosepac para primera versión |
| RFID / tarjetas de acceso | No mencionado por Prosepac, alta complejidad |
| Billeteras digitales in-app | A resolver en DEC-09 — probablemente v2 |
| Precios calculados en frontend | Riesgo de billing — backend es única fuente de verdad |
| OCPI roaming | Fase 2 explícita |
| Web app | Mobile-first, web es Fase 2 |
| Multi-moneda | Moneda única por definir en DEC-02 |
| Owner self-registration | Solo admin da de alta en MVP |

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| DEC-01 | Phase 0 | Pending |
| DEC-02 | Phase 0 | Pending |
| DEC-03 | Phase 0 | Pending |
| DEC-04 | Phase 0 | Pending |
| DEC-05 | Phase 0 | Pending |
| DEC-06 | Phase 0 | Pending |
| DEC-07 | Phase 0 | Pending |
| DEC-08 | Phase 0 | Pending |
| DEC-09 | Phase 0 | Pending |
| DEC-10 | Phase 0 | Pending |
| DEC-11 | Phase 0 | Pending |
| DEC-12 | Phase 0 | Pending |
| DEC-13 | Phase 0 | Pending |
| INF-01 | Phase 1 | Pending |
| INF-02 | Phase 1 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| AUTH-08 | Phase 1 | Pending |
| CHRG-01 | Phase 1 | Pending |
| CHRG-02 | Phase 1 | Pending |
| CHRG-04 | Phase 1 | Pending |
| CHRG-05 | Phase 1 | Pending |
| OCPP-01 | Phase 2 | Pending |
| OCPP-02 | Phase 2 | Pending |
| OCPP-03 | Phase 2 | Pending |
| OCPP-04 | Phase 2 | Pending |
| OCPP-05 | Phase 2 | Pending |
| OCPP-06 | Phase 2 | Pending |
| OCPP-07 | Phase 2 | Pending |
| OCPP-08 | Phase 2 | Pending |
| OCPP-09 | Phase 2 | Pending |
| INF-03 | Phase 2 | Pending |
| INF-04 | Phase 2 | Pending |
| SESS-01 | Phase 3 | Pending |
| SESS-02 | Phase 3 | Pending |
| SESS-03 | Phase 3 | Pending |
| SESS-04 | Phase 3 | Pending |
| SESS-05 | Phase 3 | Pending |
| SESS-06 | Phase 3 | Pending |
| PRICE-01 | Phase 3 | Pending |
| PRICE-02 | Phase 3 | Pending |
| PRICE-03 | Phase 3 | Pending |
| PRICE-04 | Phase 3 | Pending |
| PRICE-05 | Phase 3 | Pending |
| PRICE-06 | Phase 3 | Pending |
| PAY-01 | Phase 4 | Pending |
| PAY-02 | Phase 4 | Pending |
| PAY-03 | Phase 4 | Pending |
| PAY-05 | Phase 4 | Pending |
| PAY-06 | Phase 4 | Pending |
| PAY-07 | Phase 4 | Pending |
| NOTIF-01 | Phase 5 | Pending |
| NOTIF-02 | Phase 5 | Pending |
| NOTIF-03 | Phase 5 | Pending |
| NOTIF-05 | Phase 5 | Pending |
| INF-05 | Phase 5 | Pending |
| INF-06 | Phase 5 | Pending |
| ADM-01 | Phase 6 | Pending |
| ADM-02 | Phase 6 | Pending |
| ADM-03 | Phase 6 | Pending |
| ADM-04 | Phase 6 | Pending |
| ADM-05 | Phase 6 | Pending |
| ADM-06 | Phase 6 | Pending |
| ADM-07 | Phase 6 | Pending |
| ADM-08 | Phase 6 | Pending |
| OWN-01 | Phase 6 | Pending |
| OWN-02 | Phase 6 | Pending |
| INF-07 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 70 total
- Mapped to phases: 70
- Unmapped: 0 (100% coverage verified)

**Note on previous count:** The initial draft stated 65 requirements. After individual enumeration it was 82; AUTH-05 (multi-rol simultáneo) was subsequently removed as out of scope, leaving 81.

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 — traceability populated after roadmap creation*
