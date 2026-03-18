# PLUG UY — EVSE Platform

## What This Is

Plataforma de gestión de cargadores de vehículos eléctricos para PLUG UY (Uruguay). Conecta tres actores: usuarios finales que cargan su vehículo, empresas/parkings que ofrecen el servicio, y administradores de plataforma. Opera bajo OCPP 1.6 para comunicación con cargadores físicos y cobra comisión por transacción.

El proyecto parte del POC existente (chargers-manager-poc) como base técnica a evolucionar hacia producción.

## Core Value

Un conductor puede encontrar un cargador disponible, iniciar y pagar una sesión de carga, y el propietario del cargador recibe su liquidación — todo sin fricción operativa.

## Requirements

### Validated

(None yet — ship to validate)

### Active

#### Fase 0 — Definición y cierre de decisiones (PRE-DESARROLLO)

- [ ] Cerrar proveedor de pagos: Stripe vs MercadoPago
- [ ] Definir moneda de operación: pesos uruguayos vs dólares (+ implicancias fiscales/impositivas)
- [ ] Definir modelo de comisión: % fijo, mínimo fijo, tope
- [ ] Definir modelo de liquidación: por transacción vs mensual
- [ ] Resolver flujo de alta de cargadores: ¿propietario o solo admin?
- [ ] Definir rol intermedio "admin de cartera de edificios" (jerarquía de roles)
- [ ] Definir flujo de sesión abierta / manguera trabada: multa, monto, tiempo de gracia, notificaciones
- [ ] Definir UX de estimación de precio pre-sesión sin % de batería conocido
- [ ] Decisión sobre billeteras digitales: sí o no en MVP
- [ ] Definir alcance del Panel Propietario en MVP vs Fase 2
- [ ] Especificar Panel Admin: mapa o lista, filtros, log por ID de cargador
- [ ] Decidir moneda de facturación y cumplimiento DGI para pagos en pesos
- [ ] Definir nombre de plataforma (CARGÁ / Cargapp / PlugUY — actualmente inconsistente)

#### Fase 1 — MVP Backend + App Mobile

- [ ] Autenticación: email/password + OAuth (Google/Apple) + recupero de contraseña
- [ ] Sistema de roles: Usuario Final, Propietario, Admin (+ rol intermedio TBD)
- [ ] Un usuario puede tener múltiples roles simultáneos (conductor + propietario)
- [ ] Alta de cargadores (solo admin en MVP según feedback de PLUG UY)
- [ ] Comunicación OCPP 1.6: BootNotification, Heartbeat, StatusNotification, Start/StopTransaction, MeterValues, RemoteStart/Stop, ChangeAvailability
- [ ] Estado en tiempo real de cargadores (latencia máx 5s)
- [ ] Modelo de precios: bajada de bandera + precio por kWh por cargador
- [ ] Cargadores gratuitos (tarifa $0) sin generar transacción de pago
- [ ] Sesiones: inicio desde app, detención manual y automática, historial
- [ ] Manejo de pérdida de conectividad durante sesión (ajuste de cobro)
- [ ] Flujo de sesión abierta al completar carga (multa + notificaciones)
- [ ] Pagos: cobro automático al finalizar sesión, split automático plataforma/propietario
- [ ] Webhooks de confirmación asíncrona y manejo de fallos de pago
- [ ] Comprobante de pago por email y en app
- [ ] Notificaciones push: fin de sesión, cobro, cargador offline (FCM)
- [ ] Panel Admin MVP: estado cargadores, KPIs, bloqueo/desbloqueo, gestión usuarios, exportar CSV
- [ ] Panel Propietario MVP: TBD (a definir en Fase 0)
- [ ] Seguridad: HTTPS/WSS TLS 1.2+, autenticación OCPP, 2FA para admin
- [ ] Disponibilidad 99.5%, zero-downtime deployments
- [ ] Soporte 500 sesiones concurrentes

#### Fase 2 — Expansión (Post-MVP)

- [ ] Mapa con cargadores públicos y privados, filtros, estado en tiempo real
- [ ] QR code para inicio de sesión
- [ ] Onboarding de actores privados con flujo solicitud → aprobación
- [ ] Panel Propietario completo: listado, historial, reportes de ingresos
- [ ] Cargadores hogareños con modelo peer-to-peer y pricing basado en factura UTE
- [ ] Interoperabilidad OCPI 2.2 (roaming con otras plataformas EVSE)
- [ ] Web app
- [ ] Tarifas dinámicas por franja horaria (pico/valle)

### Out of Scope

- Registro de cargadores por el propietario en MVP — solo admin puede dar de alta (feedback PLUG UY)
- QR code en MVP — descartado por PLUG UY para la primera versión
- OCPI roaming en MVP — Fase 2
- Web app en MVP — mobile-first

## Context

- **Documento de requerimientos**: `EVSE - Requerimientos.docx` v1.0 (Marzo 2026) — spec driven development
- **Feedback del cliente**: `PLUG UY-Devolución.pdf` — resumen de devolución de PLUG UY con puntos abiertos
- **POC existente**: `chargers-manager-poc` — backend Java hexagonal (Spring Boot) + React Native + Expo. Cubre: CRUD de cargadores, estados, mapa básico, autenticación, AOP para métricas/logging, observabilidad con Prometheus/Grafana/Loki
- **Protocolo físico**: OCPP 1.6 (Central System en backend)
- **Actor clave**: Prosepac = nombre de la empresa que opera los cargadores y carga la configuración

## Constraints

- **Protocolo**: OCPP 1.6 — no negociable, dictado por los cargadores físicos de PLUG UY
- **Plataforma inicial**: Mobile-first (React Native + Expo) — web es Fase 2
- **Equipo**: Pequeño (2-3 personas)
- **Presión de tiempo**: Informal, sin fecha comprometida — pero cliente espera avances
- **Geografía**: Uruguay — implicancias en proveedor de pagos, moneda, fiscalidad
- **Base de código**: POC existente es el punto de partida — no greenfield

## Key Decisions

| Decisión | Rationale | Outcome |
|---|---|---|
| OCPP 1.6 como protocolo | Dictado por hardware de PLUG UY | — Pendiente validación de versión exacta |
| POC como base de evolución | Evitar reescritura total, reutilizar arquitectura hexagonal | — Pending |
| Solo admin da de alta cargadores en MVP | Feedback explícito de PLUG UY: configuración técnica compleja | — Pending aprobación equipo |
| QR descartado en MVP | PLUG UY lo consideró no necesario para primera versión | — Pending |
| Stripe vs MercadoPago | Sin definir — bloqueante crítico | — Pending reunión con PLUG UY |
| Moneda (pesos vs USD) | Sin definir — PLUG UY prefiere pesos, hay implicancias fiscales | — Pending |

---
*Last updated: 2026-03-18 after initialization*
