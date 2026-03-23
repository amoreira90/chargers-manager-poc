# Roadmap 2.0 MVP — Plataforma EVSE Prosepac

**Inicio:** 24 de marzo 2026
**Go-live estimado:** 07 de julio 2026
**Duracion total:** 15 semanas
**Equipo:** 3 Senior Software Engineers
**Dedicacion:** 3h/dia L-V + 5h/dia S-D = 25h/persona/semana
**Capacidad total:** 75h/semana equipo

---

## Modelo de trabajo

### Equipo

Tres ingenieros senior con autonomia completa. No hay jerarquia de ejecucion — los tres disenan, codean, testean y hacen code review. La coordinacion con Prosepac rota semanalmente.

| Ingeniero | Especialidad natural | Modulos donde lidera |
|---|---|---|
| **Eng-A** | Backend / protocolos | OCPP core, pagos backend, APIs admin |
| **Eng-B** | Full-stack / mobile | Frontend RN, panel admin React, UX |
| **Eng-C** | Backend / infra / QA | DB, auth, webhooks, deploy OCI, tests E2E |

Todos usan Claude Code. Todos pueden trabajar en cualquier modulo. La asignacion es por eficiencia, no por capacidad.

### Claude Code como multiplicador

| Tarea | Sin IA | Con Claude Code | Ahorro |
|---|---|---|---|
| Migrations Flyway + entidades JPA | 8h | 2h | 75% |
| Mappers MapStruct + DTOs | 4h | 1h | 75% |
| Tests unitarios + integracion | 6h | 2h | 67% |
| Scaffolding modulo hexagonal | 6h | 1.5h | 75% |
| Adaptar pantallas RN existentes | 4h | 1.5h | 63% |
| Endpoints REST + validaciones | 4h | 1h | 75% |
| WebSocket handlers (con SteVe ref) | 8h | 3h | 63% |
| Panel Admin React (CRUD completo) | 16h | 5h | 69% |

**Estimacion conservadora:** Claude Code reduce el trabajo mecanico en **~65%**. El tiempo restante se invierte en decisiones de arquitectura, debugging y testing de integracion — donde los seniors aportan el valor real.

### Ritmo semanal

| Dia | Horas | Uso ideal |
|---|---|---|
| Lunes | 3h | Planning semanal (15 min) + desarrollo |
| Martes-Viernes | 3h | Desarrollo enfocado |
| Sabado | 5h | **Deep work**: modulos complejos (OCPP, pagos, state machines) |
| Domingo | 5h | **Integracion + testing**: merge branches, tests E2E, code review cruzado |

**Regla de finde libre:** 1 finde libre cada 4 semanas (ya contemplado en estimaciones).

---

## Arquitectura de sprints

El roadmap usa **sprints semanales** con entregable visible cada semana. Las dependencias estrictas son:

```
Sprint 1-2 (Foundation) -> Sprint 3-5 (OCPP) -> Sprint 6-7 (Sessions)
                                                       |
                                                       v
                                              Sprint 8-9 (Payments + Notif)
                                                       |
                                                       v
                                              Sprint 10-12 (Admin Panels)
                                                       |
                                                       v
                                              Sprint 13-15 (Deploy + QA)
```

---

## Sprint 1 — Foundation: DB + Auth (semana 1)
**Fechas:** 24/03/2026 -> 30/03/2026
**Requerimientos:** INF-01, INF-02, AUTH-01, AUTH-08

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| PostgreSQL 16 + Flyway. Esquema: `users`, `roles`, `chargers`, `charger_configs`. Redis config. Entidades JPA + mappers con Claude Code. | Frontend: conecta AuthContext con endpoints reales. Login, registro, refresh token. Reemplaza mock user. Navegacion por rol. | JWT completo: registro, login, refresh, revocacion (AUTH-08). Guards por rol `@PreAuthorize`. Spring Security config. |

**Entregable:** App conectada a PostgreSQL con auth JWT real. 4 roles funcionando. Redis operativo.

---

## Sprint 2 — Auth completo + Cargadores (semana 2)
**Fechas:** 31/03/2026 -> 06/04/2026
**Requerimientos:** AUTH-03, AUTH-04, AUTH-06, CHRG-01, CHRG-02, CHRG-04, CHRG-05

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| CRUD de cargadores backend: registro con ubicacion, tipo conector, potencia, ID OCPP, tarifa (CHRG-01, CHRG-04, CHRG-05). Mapeo `ocppChargePointId` -> UUID (CHRG-02). | Pantalla recupero contrasena (AUTH-03). Pantalla registro de cargadores desde admin. Tests E2E auth en dispositivo real. | Alta/baja/suspension de usuarios (AUTH-06). Tests de integracion auth completos. Code review Sprint 1-2. |

**Entregable:** Auth completo. Admin registra cargadores. Recupero de contrasena. Tests verdes.

---

## Sprint 3 — OCPP: WebSocket + Boot + Status (semana 3)
**Fechas:** 07/04/2026 -> 13/04/2026
**Requerimientos:** OCPP-01, OCPP-02, OCPP-03, OCPP-04, INF-03, INF-04

Todos leen `OCPP-STEVE-ANALYSIS.md` el lunes. Deep work de OCPP en el finde.

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| Modulo OCPP hexagonal: `ocpp-jaxb` en pom.xml. Adapta `AbstractWebSocketEndpoint` + `OcppWebSocketUpgrader` + `IncomingPipeline` de SteVe. BootNotification handler (OCPP-02). Heartbeat + deteccion offline (OCPP-03). | UI estado cargador en tiempo real. Extiende `ChargerStatus` con estados OCPP. Pantalla detalle cargador con datos reales. | SteVe como simulador en Docker. WSS TLS 1.2+ (INF-03). OCPP Basic Auth (INF-04). StatusNotification -> BD + Redis <5s (OCPP-04). Tests BootNotification. |

**Entregable:** Simulador conectado via WSS. BootNotification + Heartbeat + StatusNotification funcionando.

> **Hito: primer cargador conectado al backend via OCPP.**

---

## Sprint 4 — OCPP: Transacciones (semana 4)
**Fechas:** 14/04/2026 -> 20/04/2026
**Requerimientos:** OCPP-05, OCPP-06, OCPP-07, OCPP-08

El finde de 5h es critico: StartTransaction y MeterValues requieren deep work.

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| StartTransaction — transactionId a BD ANTES de .conf (OCPP-05, critico). MeterValues — acumulacion kWh en Redis (OCPP-06). StopTransaction como fuente de verdad (OCPP-07). | Frontend: pantalla de sesion activa con datos OCPP reales (kWh, duracion). Manejo de errores y estados de carga en UI. | RemoteStart/RemoteStop via `ChargePointCommandService` (OCPP-08). Tests de integracion Start/Meter/Stop. Test ciclo completo con simulador. |

**Entregable:** Ciclo Start -> MeterValues -> Stop completo. RemoteStart/Stop desde backend.

---

## Sprint 5 — OCPP: Reconexion + Estabilizacion (semana 5)
**Fechas:** 21/04/2026 -> 27/04/2026
**Requerimientos:** OCPP-09

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| Reconexion sin perdida de sesion (OCPP-09): recuperar transactionId, connectorId, meterStart de BD al reconectar. Edge cases: cargador se cae durante MeterValues. | Tests de reconexion en frontend. Restauracion de sesion activa tras reapertura de app. Coordina con Prosepac: ficha tecnica cargador. | Suite completa tests OCPP (happy path + edge cases). Code review modulo OCPP completo. Documentacion tecnica. |

**Finde libre recomendado** (semana 4, primer descanso).

**Entregable:** Modulo OCPP estable y testeado. Ciclo completo Boot -> Start -> MeterValues -> Stop -> Reconexion.

---

## Sprint 6 — Sesiones + Motor de Precios (semana 6)
**Fechas:** 28/04/2026 -> 04/05/2026
**Requerimientos:** SESS-01, SESS-02, SESS-03, SESS-04, PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05, PRICE-06

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| Maquina de estados de sesion backend. Motor de precios server-side: bajada de bandera + franjas horarias + precio/kWh + comision configurable (PRICE-01 al 06). Modelo franjas horarias en BD. | Reemplaza simulacion de ChargingDetailScreen con API real. kWh y costo en tiempo real (SESS-02). Precio estimado con franja activa pre-sesion (PRICE-06). | Cargadores gratuitos $0 sin transaccion (PRICE-04). Detencion automatica si vehiculo desconecta (SESS-04). Tests de calculos de precio con casos reales. |

**Entregable:** Sesiones reales con pricing por franjas horarias. ChargingDetailScreen conectado a datos OCPP.

---

## Sprint 7 — Sesiones: Historial + Resumen (semana 7)
**Fechas:** 05/05/2026 -> 11/05/2026
**Requerimientos:** SESS-05, SESS-06, NOTIF-05

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| Resumen post-sesion con desglose franja horaria (SESS-05). Push notification vehiculo inactivo (NOTIF-05). Code review Sprint 6-7. | Historial de sesiones en app (SESS-06). Pantalla resumen post-sesion. Restauracion sesion activa tras reapertura. | Tests E2E ciclo completo: inicio -> carga -> parada -> resumen -> historial. UAT con Prosepac. |

**Entregable:** Sesion end-to-end con datos reales, pricing, historial. Sign-off con Prosepac.

---

## Sprint 8 — Pagos MercadoPago + Notificaciones (semana 8)
**Fechas:** 12/05/2026 -> 18/05/2026
**Requerimientos:** PAY-01, PAY-02, PAY-03, PAY-06, NOTIF-01, NOTIF-02, NOTIF-03

Pagos y notificaciones son independientes entre si — se ejecutan en paralelo. 2 ingenieros en pagos, 1 en notificaciones.

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| SDK Java MP + Orders API. Preferencia con `capture: false` para pre-auth. Creacion de Order + callback. Modelo de pagos en BD. Captura post-StopTransaction (PAY-02, PAY-03). | Adapta `PreAuthPaymentScreen` para Checkout Pro via Custom Tabs / Safari VC. Configura sandbox con MCP tools. `PaymentScreen` simplificado (cobro server-side). | FCM server-side: triggers fin de sesion (NOTIF-01), cobro exitoso (NOTIF-02), cargador offline (NOTIF-03). Setup FCM en app. Templates email transaccional. |

**Entregable:** Primer cobro real en sandbox. Push notifications operativas.

> **Hito: primer cobro real en sandbox MercadoPago.**

---

## Sprint 9 — Pagos: Webhooks + Reembolsos + Cierre (semana 9)
**Fechas:** 19/05/2026 -> 25/05/2026
**Requerimientos:** PAY-05, PAY-06, PAY-07

**Finde libre recomendado** (semana 8, segundo descanso).

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| Reembolsos parciales/totales (PAY-07). Quality checklist MP. 3DS 2.0 opcional. Code review modulo pagos. | Comprobante por email y en app (PAY-05). UI gestion reembolsos en panel admin. Tests pagos fallidos y reintentos. | Webhooks idempotentes con validacion de firma (PAY-06). Configura/simula webhooks con MCP tools. Tests E2E ciclo pago completo. Quality evaluation. |

**Entregable:** Pagos completos: pre-auth -> carga -> captura -> comprobante. Reembolsos. Webhooks. Quality checklist aprobado.

---

## Sprint 10 — Panel Admin: APIs + Dashboard (semana 10)
**Fechas:** 26/05/2026 -> 01/06/2026
**Requerimientos:** ADM-01, ADM-02, ADM-03, ADM-04, ADM-07, ADM-08

3 modulos independientes en paralelo: APIs, Panel Admin UI, Panel Empresa.

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| APIs admin: estado real cargadores (ADM-01), KPIs globales (ADM-02), bloquear/desbloquear (ADM-03), gestion usuarios (ADM-04), config planes distribucion (ADM-07), detalle sesion (ADM-08). | Panel Admin web React: scaffolding con Claude Code. Dashboard KPIs en tiempo real. Gestion usuarios. Bloqueo cargadores. | Health checks (INF-06). Logs estructurados produccion (INF-05). Panel Empresa inicio: APIs OWN-01, OWN-02. |

**Entregable:** Panel Admin funcional con dashboard, KPIs y gestion basica.

---

## Sprint 11 — Panel Empresa + Reporteria (semana 11)
**Fechas:** 02/06/2026 -> 08/06/2026
**Requerimientos:** ADM-05, ADM-06, OWN-01, OWN-02

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| Reporteria: exportacion CSV/Excel con filtros (ADM-05). Log filtrable por ID cargador via Grafana/Loki (ADM-06). | Reportes en Panel Admin UI. Pulido UX admin. | Panel Empresa React: cargadores propios, historial sesiones, ganancias (OWN-01, OWN-02). |

**Entregable:** Reporteria con exportacion. Panel Empresa operativo.

---

## Sprint 12 — Admin: Estabilizacion + UAT (semana 12)
**Fechas:** 09/06/2026 -> 15/06/2026

**Finde libre recomendado** (semana 12, tercer descanso).

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| Ajuste dashboards Grafana para produccion. Code review panels. APIs pendientes y ajustes. | Bug fixes UAT. Pulido UX final. Documentacion usuario. | UAT completo panels con Prosepac. Valida reportes con datos reales. Sign-off funcional. |

**Entregable:** Panels completos y validados por Prosepac. Observabilidad lista.

---

## Sprint 13 — Deploy: Infraestructura OCI (semana 13)
**Fechas:** 16/06/2026 -> 22/06/2026
**Requerimientos:** INF-07

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| Infraestructura OCI produccion: rolling deployments zero-downtime (INF-07). SSL/TLS. Secrets management. | Inicia proceso publicacion App Store / Play Store. Compatibilidad iOS/Android definitiva. | Security audit: OWASP top 10, OCPP auth, SQL injection, JWT validation. Testing E2E automatizado. |

**Entregable:** Infraestructura OCI lista. App en review de stores. Audit de seguridad completado.

---

## Sprint 14 — Deploy: Hardware fisico + QA (semana 14)
**Fechas:** 23/06/2026 -> 29/06/2026

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| Testing con hardware fisico real de Prosepac. Tuning PostgreSQL y Redis bajo carga real. | Bug fixing critico. Release candidate. Smoke testing. | Monitoreo activo con Grafana. Tests E2E en hardware real. Gestiona feedback UAT final. |

**Entregable:** Release candidate validado con hardware fisico.

---

## Sprint 15 — Go-live (semana 15)
**Fechas:** 30/06/2026 -> 07/07/2026

| Eng-A | Eng-B | Eng-C |
|---|---|---|
| Runbook de operaciones. Capacitacion a Prosepac. Monitoreo post-deploy. | Smoke testing produccion. App publicada en stores. | Sign-off formal con Prosepac. Coordinacion go-live. Buffer imprevistos. |

**Entregable:** Sistema en produccion. Runbook entregado. Go-live.

---

## Resumen de calendario

| Sprint | Semana | Fechas | Modulo | Entregable clave |
|---|---|---|---|---|
| 1 | 1 | 24/03 -> 30/03 | DB + Auth base | PostgreSQL + JWT + 4 roles |
| 2 | 2 | 31/03 -> 06/04 | Auth completo + Cargadores | CRUD cargadores, recupero pass |
| 3 | 3 | 07/04 -> 13/04 | OCPP: WebSocket + Boot | **Primer cargador conectado** |
| 4 | 4 | 14/04 -> 20/04 | OCPP: Transacciones | Ciclo Start/Meter/Stop |
| 5 | 5 | 21/04 -> 27/04 | OCPP: Reconexion | Modulo OCPP estable |
| 6 | 6 | 28/04 -> 04/05 | Sesiones + Precios | Pricing por franjas horarias |
| 7 | 7 | 05/05 -> 11/05 | Historial + Resumen | Sesion E2E con datos reales |
| 8 | 8 | 12/05 -> 18/05 | Pagos + Notificaciones | **Primer cobro sandbox** |
| 9 | 9 | 19/05 -> 25/05 | Webhooks + Reembolsos | Pagos completos |
| 10 | 10 | 26/05 -> 01/06 | Panel Admin APIs + UI | Dashboard admin funcional |
| 11 | 11 | 02/06 -> 08/06 | Panel Empresa + Reports | Reporteria + exportacion |
| 12 | 12 | 09/06 -> 15/06 | Estabilizacion + UAT | Sign-off Prosepac |
| 13 | 13 | 16/06 -> 22/06 | Deploy OCI + Security | Infra produccion lista |
| 14 | 14 | 23/06 -> 29/06 | Hardware fisico + QA | Release candidate |
| 15 | 15 | 30/06 -> 07/07 | **Go-live** | **Produccion** |

---

## Metricas del roadmap

| Metrica | Valor |
|---|---|
| Semanas totales | **15** |
| Horas totales equipo | 15 x 75h = **1,125h** |
| Horas por requerimiento (57 req) | ~20h |
| Sprints con entregable visible | 15/15 (100%) |
| Findes libres planificados | 3 (semanas 4, 8, 12) |
| Hitos visibles para Prosepac | cada 2-3 semanas |

---

## Hitos clave

| Hito | Fecha | Sprint |
|---|---|---|
| Auth real con 4 roles | 06/04/2026 | Sprint 2 |
| **Primer cargador conectado OCPP** | 13/04/2026 | Sprint 3 |
| Ciclo OCPP completo | 27/04/2026 | Sprint 5 |
| Sesion E2E con pricing real | 11/05/2026 | Sprint 7 |
| **Primer cobro sandbox MP** | 18/05/2026 | Sprint 8 |
| Feature complete | 15/06/2026 | Sprint 12 |
| Release candidate | 29/06/2026 | Sprint 14 |
| **Go-live produccion** | **07/07/2026** | Sprint 15 |

---

## Comparativa de escenarios

| Escenario | h/sem equipo | Semanas | Go-live |
|---|---|---|---|
| 3 Sr + full time (8h L-V) | 120h | ~10 | mayo 2026 |
| **3 Sr + 3h L-V + 5h S-D (actual)** | **75h** | **15** | **jul 2026** |
| 3 Jr/Mid + 3h L-V + 5h S-D | 75h | ~22 | sep 2026 |
| 3 Sr + 2h L-V only | 30h | ~33 | nov 2026 |
| 2 devs + 1 PL + 2h L-V only | 20h | ~44 | ene 2027 |

---

## Decisiones tecnicas confirmadas

| Tema | Decision | Fuente |
|---|---|---|
| Base de datos | PostgreSQL 16 + Flyway + Redis | POC + Cierre_Decisiones |
| Auth | JWT con refresh token + 4 roles | AUTH-01, AUTH-08 |
| OCPP | 1.6J WebSocket, patrones de SteVe, `ocpp-jaxb` | OCPP-STEVE-ANALYSIS.md |
| Pagos | Checkout Pro + Orders API (captura diferida) | Research MCP MercadoPago |
| Pagos frontend | Custom Tabs (Android) / Safari VC (iOS) | No hay SDK nativo MP para RN |
| Liquidacion | Mensual por cliente a cuenta Prosepac | Cierre_Decisiones DEC-04 |
| Medios de pago | Tarjeta, Abitab, Red Pagos, cuenta MP | MCP MercadoPago (MLU) |
| Panel Admin | Web app React separada | Cierre_Decisiones |
| Deploy | OCI, rama `feature/oci-deploy-config` | POC |
| Observabilidad | Prometheus + Grafana + Loki (ya en POC) | POC |

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| OCPP: bugs de protocolo en integracion | Media | +1-2 sem | SteVe como referencia. Simulador desde Sprint 3. Deep work en findes. |
| Hardware fisico no disponible a tiempo | Media | +2 sem | Pedir a Prosepac para junio 2026. Simulador cubre hasta entonces. |
| Fatiga: 7 dias/semana x 15 semanas | Media | Calidad baja | 3 findes libres planificados. Si hay burnout, extender a 18 sem (ago 2026). |
| MercadoPago sandbox issues en Uruguay | Baja | +1 sem | MCP tools para testing. Usuarios de prueba desde Sprint 8. |
| App Store review demora | Baja | +1-2 sem | Iniciar submission en Sprint 13 (3 semanas antes de go-live). |
| Merge conflicts con 3 devs en paralelo | Baja | Horas perdidas | Feature branches + code review diario + CI. |

---

## Supuestos

- 3 Senior Software Engineers con experiencia en Java/Spring, React/RN y sistemas distribuidos
- 3h/dia L-V + 5h/dia S-D por persona (25h/semana, 75h/semana equipo)
- 3 findes libres planificados (semanas 4, 8, 12) ya contemplados
- Claude Code disponible para los 3 ingenieros en todas las sesiones
- Prosepac provee hardware fisico antes de junio 2026
- Ficha tecnica del cargador disponible en Sprint 3
- Checkout Pro como producto de pago MP (confirmado via MCP)
- MCP MercadoPago disponible para configurar sandbox, webhooks y quality checks

---

## Plan de contingencia

Si el ritmo no es sostenible o hay bloqueos externos:

| Escenario | Ajuste | Nuevo go-live |
|---|---|---|
| Burnout en semana 8 -> bajan a 2h L-V | +5 semanas | ago 2026 |
| Hardware fisico recien en agosto | +3 semanas deploy | ago 2026 |
| OCPP requiere 2 sprints extra | +2 semanas | jul 2026 (fin) |
| Todo sale bien | Sin cambios | **07/07/2026** |

**Peor caso realista:** agosto 2026. **Mejor caso:** principios de julio 2026.

---

*Creado: 2026-03-23*
*Roadmap 2.0 — 3 Sr Engineers, Claude Code como multiplicador, sprints semanales, go-live julio 2026.*
