# Roadmap MVP — Plataforma EVSE Prosepac
**Inicio:** 24 de marzo 2026
**Go-live estimado:** febrero 2027
**Equipo:** 3 personas + Claude Code + herramientas IA
**Carga horaria:** 2 horas/persona/día promedio · 5 días/semana = ~10h efectivas/persona/semana

---

## Equipo y modelo de trabajo

| Sigla | Perfil | Responsabilidad en el proyecto |
|---|---|---|
| **PL** | Project Leader | Coordinación, comunicación con Prosepac, gestión de riesgos, validación funcional, features livianas |
| **TL** | Tech Leader | Arquitectura, módulos de máxima complejidad (OCPP, pagos), code review, define patrones |
| **DEV** | Software Developer | Ejecución backend y frontend siguiendo patrones del TL, principal operador de Claude Code |

---

## Impacto de la carga horaria

A 2h/día por persona la capacidad real es el **25% de una jornada completa (8h)**.

| Concepto | Full time (8h/día) | 2h/día | Factor |
|---|---|---|---|
| Horas efectivas por semana/persona | 40h | 10h | 0.25x |
| Multiplicador de calendario | 1x | ~4x | — |
| Go-live (scope completo original) | ago 2026 | jul 2027 | +11 meses |
| Go-live (scope MVP refinado) | — | **feb 2027** | — |

**Nota sobre context switching:** A 2h/día cada sesión arranca con 10-15 min de re-orientación.
En módulos complejos (OCPP, pagos) el tiempo efectivo de producción por sesión es ~1.5-1.7h reales.
Claude Code ayuda a recuperar contexto más rápido pero no elimina este costo.

---

## Qué trae la POC — trabajo ya hecho

### Backend

| Componente | Estado |
|---|---|
| Arquitectura hexagonal completa | ✅ Listo |
| Agregado `Charger` con transiciones de estado | ✅ Listo |
| Value objects, mappers, exception handler | ✅ Listos |
| `LoggingAspect` + `MetricsAspect` + Prometheus + Grafana + Loki | ✅ Listos |
| Docker Compose base | ✅ Listo |
| Tests de dominio y servicio | ✅ Listos |
| Config base OCI deploy (`feature/oci-deploy-config`) | ✅ Iniciado |
| Auth, roles, JWT, PostgreSQL, Redis, OCPP, sesiones, pagos | ❌ No existe |

### Frontend

| Componente | Estado |
|---|---|
| Estructura React Native + Expo + navegación completa | ✅ Lista |
| Todas las pantallas con UI real (Auth, Charging, Payment, History...) | ✅ Listas |
| `ChargingDetailScreen` con máquina de estados, timer, kWh, animaciones | ✅ Avanzada (simulada) |
| `AuthContext` (reducer + AsyncStorage) | ✅ Listo en estructura (mock user) |
| Axios client + estructura de servicios | ✅ Lista |
| Auth real, roles, push notifications, panel admin | ❌ No existe |

---

## Scope MVP — requerimientos incluidos

**70 requerimientos activos** distribuidos en 7 fases de desarrollo.

| Módulo | En MVP | Fuera de MVP |
|---|---|---|
| Auth y Roles | AUTH-01, 03, 04, 06, 08 (5) | AUTH-02 OAuth → v2, AUTH-07 2FA → v2 |
| Cargadores | CHRG-01, 02, 04, 05 (4) | CHRG-03/06/07 → fase 3 |
| OCPP | OCPP-01 al 09 (9) | OCPP-10 reconciliación → v2 |
| Sesiones | SESS-01 al 06 (6) | SESS-07 manguera trabada → descartado |
| Precios | PRICE-01 al 06 (6) | — |
| Pagos | PAY-01, 02, 03, 05, 06, 07 (6) | PAY-04 split auto → descartado, PAY-08 → v2 |
| Notificaciones | NOTIF-01, 02, 03, 05 (4) | NOTIF-04 → v2 |
| Panel Admin | ADM-01 al 08 (8) | — |
| Panel Empresa | OWN-01, 02 (2) | — |
| Infraestructura | INF-01 al 07 (7) | INF-08 load testing → v2 |
| Decisiones Fase 0 | DEC-01 al 13 (13) | — |

---

## Fases y calendario

### Fase 0 — Cierre de decisiones pendientes
**Duración:** 2 semanas
**Fechas:** 24/03/2026 → 05/04/2026

La Fase 0 depende principalmente de la disponibilidad de Prosepac, no del tiempo de desarrollo.

| Tarea | Responsable |
|---|---|
| Confirmar nombre de la plataforma con Prosepac | PL |
| Confirmar modelo OCPP del hardware (1.6J WSS — ya probable) | PL + TL |
| Confirmar disponibilidad MercadoPago Marketplace en Uruguay | TL + PL |
| Definir modelo de comisión y cadencia de liquidación | PL + Prosepac |
| Actualizar documentación con decisiones cerradas | DEV + Claude Code |

**Entregable:** Todas las decisiones bloqueantes documentadas. Verde para Fase 1.

---

### Fase 1 — Base de Datos y Autenticación
**Duración:** 5 semanas
**Fechas:** 06/04/2026 → 10/05/2026

Requerimientos: INF-01, INF-02, AUTH-01, AUTH-03, AUTH-04, AUTH-06, AUTH-08, CHRG-01, CHRG-02, CHRG-04, CHRG-05

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-2 | Migración H2 → PostgreSQL 16 + Flyway. Diseño del esquema: usuarios, roles (Admin/Veedor/Empresa/Usuario), cargadores. Redis. | Con Claude Code: genera migrations, entidades User/Role/Charger, mappers, configura entornos dev/staging. | Valida entornos. Coordina acceso a infra con Prosepac. |
| 3-4 | JWT: registro, login, refresh token, revocación (AUTH-08). Guards por rol. | Con Claude Code: conecta AuthContext del frontend con auth real. Reemplaza mock user. Navegación condicional por rol. | Testing de flujos auth y roles en dispositivo real. |
| 5 | Recupero de contraseña por email (AUTH-03). Alta/baja/suspensión de usuarios (AUTH-06). Code review. | Con Claude Code: pantalla recupero contraseña. Registro de cargadores desde admin (CHRG-01, CHRG-04, CHRG-05). Tests. | UAT: flujos auth completos. Sign-off. |

**Entregable:** Auth real con 4 roles. PostgreSQL + Redis. H2 eliminado. Admin puede registrar cargadores.

---

### Fase 2 — Central System OCPP 1.6J
**Duración:** 9 semanas *(era 12 — ahorradas 3 semanas gracias a SteVe)*
**Fechas:** 11/05/2026 → 12/07/2026

Requerimientos: OCPP-01 al 09, INF-03, INF-04

Esta es la fase más crítica. El context switching en OCPP es costoso — cada sesión de 2h requiere retomar el estado del protocolo, los mensajes en vuelo y la lógica de reconexión.

**Recomendación:** Concentrar las 2h del TL en bloques continuos sin interrupciones durante esta fase.

**Acelerador clave — SteVe:** `steve-master/` en el repo es un Central System OCPP 1.6J completo. Leer `.planning/research/OCPP-STEVE-ANALYSIS.md` antes de empezar. Los patrones de WebSocket handler, pipeline de mensajes, `FutureResponseContextStore` y la dependencia `de.rwth.idsg:ocpp-jaxb` están resueltos y se adoptan directamente. Esto elimina ~3 semanas de research.

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-2 | Leer `OCPP-STEVE-ANALYSIS.md`. Agregar `ocpp-jaxb` al pom.xml. Adaptar `AbstractWebSocketEndpoint` + `OcppWebSocketUpgrader` (Basic Auth) + `IncomingPipeline` al módulo OCPP hexagonal. | Configura SteVe como simulador OCPP 1.6J en Docker (ya está en el repo). Con Claude Code: scaffolding del módulo `ocpp/` en infrastructure. Define escenarios de test. | Consigue ficha técnica del cargador físico de Prosepac. Valida que es OCPP 1.6J WSS. |
| 3-5 | BootNotification (OCPP-02). Heartbeat + `@Scheduled` job de detección offline (OCPP-03). StatusNotification → BD + Redis <5s (OCPP-04). WSS TLS 1.2+ (INF-03). OCPP Basic Auth (INF-04). | Con Claude Code: extiende `ChargerStatus` + UI estado en tiempo real. Mapeo `ocppChargePointId` → UUID (CHRG-02). Tests de integración BootNotification. | Conecta simulador. Valida BootNotification y transiciones de estado. |
| 6-8 | StartTransaction — transactionId a BD ANTES de conf (OCPP-05, crítico). MeterValues — acumulación kWh en Redis (OCPP-06). StopTransaction como fuente de verdad (OCPP-07). RemoteStart/RemoteStop via `ChargePointCommandService` (OCPP-08). Reconexión sin pérdida de sesión (OCPP-09). | Con Claude Code: suite de tests de integración OCPP. Manejo de errores en UI. Pantalla detalle cargador con datos reales. | Test ciclo completo con simulador. Valida persistencia de transactionId. Valida latencia <5s. |
| 9 | Code review completo del módulo OCPP. Ajustes y estabilización. Documentación técnica. | Bug fixes. Tests finales. | Testing de aceptación. Sign-off del módulo OCPP. |

**Entregable:** Simulador OCPP conectado vía WSS. Ciclo completo (Boot → Start → MeterValues → Stop) funcionando y persistido.

> **Hito crítico — semana 5** (~mediados de junio 2026): primer cargador conectado al backend vía OCPP.

---

### Fase 3 — Ciclo de Vida de Sesiones y Precios
**Duración:** 6 semanas
**Fechas:** 13/07/2026 → 23/08/2026

Requerimientos: SESS-01 al 06, PRICE-01 al 06, NOTIF-05

**Qué trae la POC:** `ChargingDetailScreen` ya tiene toda la UI y lógica simulada (máquina de estados, timer, kWh, costo). El trabajo es conectar con datos OCPP reales.

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-3 | Máquina de estados de sesión en backend. Motor de precios server-side: bajada de bandera + precio por kWh + comisión configurable por cargador (PRICE-01 al 06). Cargadores gratuitos $0 sin transacción (PRICE-04). | Con Claude Code: reemplaza simulación de ChargingDetailScreen con llamadas reales a la API. kWh y costo en tiempo real (SESS-02). Precio estimado pre-sesión (PRICE-06). | Valida cálculos de precio con casos reales de Prosepac. Test inicio/parada desde app. |
| 4-6 | Detención automática si vehículo desconecta (SESS-04). Resumen post-sesión (SESS-05). Push notification cuando vehículo queda inactivo (NOTIF-05). | Con Claude Code: historial de sesiones (SESS-06). Pantalla resumen post-sesión. Restauración de sesión activa tras reapertura de app. Tests. | Test del ciclo completo inicio → parada → resumen. UAT con Prosepac. Sign-off. |

**Entregable:** Sesión real con datos OCPP. kWh y costo calculados en backend en tiempo real. Historial accesible.

---

### Fase 4 — Integración de Pagos
**Duración:** 8 semanas
**Fechas:** 24/08/2026 → 18/10/2026

Requerimientos: PAY-01, PAY-02, PAY-03, PAY-05, PAY-06, PAY-07

**Qué trae la POC:** `PreAuthPaymentScreen` y `PaymentScreen` con UI completa. `paymentService` estructurado.

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-3 | Research MercadoPago SDK Java. Diseño de flujo: registro de método de pago (PAY-01) → pre-auth al inicio → captura DESPUÉS de StopTransaction.req (PAY-03, crítico). | Con Claude Code: integra SDK MercadoPago en PreAuthPaymentScreen. Setup sandbox. Pantalla de registro de tarjeta. | Coordina credenciales sandbox MercadoPago con Prosepac. Confirma disponibilidad Marketplace. |
| 4-6 | Webhooks idempotentes + manejo de fallos de pago (PAY-06). Cobro automático post-sesión. Comprobante por email y en app (PAY-05). | Con Claude Code: PaymentScreen con cobro real. Email transaccional de comprobante. Tests del ciclo pago sandbox. | Test ciclo pago sandbox. Valida timing de cobro post-StopTransaction. |
| 7-8 | Reembolsos parciales / totales desde panel admin (PAY-07). Code review módulo pagos. Estabilización. | Con Claude Code: gestión de reembolsos en panel admin. Tests de pagos fallidos y reintentos. | Test de reembolsos. Sign-off módulo pagos. |

**Entregable:** Cobro real automático post-sesión, comprobante entregado, reembolsos operativos desde admin.

> **Contingencia:** Si MercadoPago Marketplace no está disponible en Uruguay, distribución de fondos manual mensual por Prosepac. No bloquea go-live.

---

### Fase 5 — Notificaciones
**Duración:** 3 semanas
**Fechas:** 19/10/2026 → 08/11/2026

Requerimientos: NOTIF-01, NOTIF-02, NOTIF-03

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-2 | FCM server-side: triggers para fin de sesión (NOTIF-01), cobro exitoso (NOTIF-02), cargador offline (NOTIF-03). Email transaccional. | Con Claude Code: setup FCM en app Android/iOS. UI de notificaciones. Tests en dispositivos reales. | Test de notificaciones en Android e iOS reales. |
| 3 | Ajustes y estabilización. Code review. | Bug fixes notificaciones. | Sign-off. |

**Entregable:** Push notifications en todos los eventos críticos del sistema.

---

### Fase 6 — Panel Admin, Panel Empresa y Observabilidad
**Duración:** 8 semanas
**Fechas:** 09/11/2026 → 03/01/2027

Requerimientos: ADM-01 al 08, OWN-01, OWN-02, INF-05, INF-06, INF-07

**Qué trae la POC:** AOP + Prometheus + Grafana + Loki ya configurados. La observabilidad del backend está. El trabajo es construir el panel admin y ajustar dashboards para producción.

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-3 | APIs de admin: estado en tiempo real de cargadores (ADM-01), KPIs globales (ADM-02), bloquear/desbloquear cargadores (ADM-03), gestión de usuarios (ADM-04), configuración de planes de distribución (ADM-07), detalle de sesión (ADM-08). | Con Claude Code: Panel Admin web (React) — dashboard + KPIs en tiempo real + gestión de usuarios + bloqueo de cargadores. | Valida con datos reales. Test operaciones de admin. |
| 4-6 | APIs de reportería: exportación CSV/Excel con filtros (ADM-05). Log filtrable por ID de cargador vía Grafana/Loki (ADM-06 — POC ya lo tiene). APIs Panel Empresa (OWN-01, OWN-02). | Con Claude Code: reportes y exportación CSV. Panel Empresa (cargadores, historial de sesiones). Logs en Grafana. | Valida reportes con datos reales. UAT Panel Empresa con Prosepac. |
| 7-8 | Health checks (INF-06). Logs estructurados producción (INF-05). Ajuste de dashboards Grafana para producción. Buffer para ajustes post-UAT. | Bug fixes UAT. Pulido de UX. Documentación. | UAT completo de todos los panels con Prosepac. Sign-off funcional. |

**Entregable:** Prosepac opera la plataforma desde el panel admin. Panel Empresa operativo. Observabilidad lista para producción.

---

### Deploy y QA Final
**Duración:** 7 semanas
**Fechas:** 04/01/2027 → 21/02/2027

Requerimientos: INF-03 (ya en Fase 2), INF-07 (zero-downtime deployments)

Base: rama `feature/oci-deploy-config` ya iniciada.

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-2 | Infraestructura OCI producción: rolling deployments zero-downtime (INF-07), SSL/TLS, secrets management. Testing con hardware físico real de Prosepac. | Testing E2E automatizado. Security audit básico (OWASP top 10, OCPP auth). | Coordina hardware físico con Prosepac. Inicia proceso publicación App Store / Play Store. |
| 3-4 | Ajustes con hardware físico real. Tuning PostgreSQL y Redis bajo carga real. Monitoreo activo con Grafana. | Bug fixing. Compatibilidad iOS/Android definitiva. Release candidate. | Gestiona feedback UAT final con Prosepac. |
| 5-6 | Estabilización + runbook de operaciones. Capacitación a Prosepac. | Smoke testing en producción. | Sign-off formal con Prosepac. Coordinación go-live. |
| 7 | Buffer para imprevistos del go-live. | — | — |

**Entregable:** Sistema en producción estable. Runbook entregado a Prosepac.

---

## Resumen de calendario

| Fase | Inicio | Fin | Semanas | Riesgo |
|---|---|---|---|---|
| 0 — Cierre de decisiones | 24/03/2026 | 05/04/2026 | 2 | Bajo |
| 1 — DB y Autenticación | 06/04/2026 | 10/05/2026 | 5 | Bajo |
| 2 — OCPP Central System | 11/05/2026 | 12/07/2026 | 9 | **Alto** |
| 3 — Sesiones y Precios | 13/07/2026 | 23/08/2026 | 6 | Medio |
| 4 — Pagos | 24/08/2026 | 18/10/2026 | 8 | **Alto** |
| 5 — Notificaciones | 19/10/2026 | 08/11/2026 | 3 | Bajo |
| 6 — Panel Admin y Observabilidad | 09/11/2026 | 03/01/2027 | 8 | Medio |
| Deploy y QA Final | 04/01/2027 | 21/02/2027 | 7 | Medio |
| **Total** | **24/03/2026** | **21/02/2027** | **~48 sem** | |

---

## Hitos clave

| Hito | Fecha estimada |
|---|---|
| Decisiones 100% cerradas | 05/04/2026 |
| Auth real con 4 roles funcionando | 10/05/2026 |
| Primer cargador conectado vía OCPP | ~mediados junio 2026 |
| Ciclo OCPP completo con simulador | 12/07/2026 |
| Sesión end-to-end con datos reales (sin pago) | 23/08/2026 |
| Primer cobro real en sandbox | ~septiembre 2026 |
| Feature complete | 03/01/2027 |
| **Go-live producción** | **21/02/2027** |

---

## Escenarios según dedicación

| Dedicación | Horas/semana/persona | Multiplicador | Go-live estimado |
|---|---|---|---|
| Full time | 40h | 1x | junio 2026 |
| 4h/día | 20h | 2x | septiembre 2026 |
| **2h/día (actual)** | **10h** | **4x** | **febrero 2027** |
| 1h/día | 5h | 8x | fines 2027 |

---

## Riesgos con 2h/día

| Riesgo | Fase afectada | Impacto |
|---|---|---|
| Context switching: 10-15 min de re-orientación por sesión en OCPP | Fase 2 | Fase 2 efectivamente más lenta que 4x |
| Momentum: bugs difíciles de depurar en sesiones cortas | Fase 2, Fase 4 | Puede bloquear días enteros sin avanzar |
| Hardware físico: si Prosepac no lo provee a tiempo | Deploy + QA | Retrasa la validación final |
| MercadoPago Marketplace no disponible en Uruguay | Fase 4 | Requiere distribución manual — no bloquea go-live |
| Prosepac espera avances — hitos visibles cada 4-6 semanas | Todas | Riesgo de pérdida de confianza del cliente |

---

## Recomendaciones para trabajar a 2h/día eficientemente

1. **Sesiones del TL sin interrupciones en Fase 2 y 4**: OCPP y pagos son donde más importa el foco sostenido
2. **Claude Code como punto de entrada**: empezar cada sesión leyendo el contexto con Claude Code — recupera contexto más rápido que revisar código manualmente
3. **Tareas con resultado visible en 2h**: planificar cada sesión con un entregable concreto ("hoy termino el BootNotification handler")
4. **TL y DEV en paralelo**: cuando TL investiga/arquitectura, DEV trabaja en frontend — evitar dependencias que anulen sesiones
5. **Sprints de dedicación intensiva**: una semana cada 2 meses a full time en las Fases 2 y 4 puede acortar el go-live hasta 6-8 semanas

---

## Supuestos

- 2 horas por persona por día promedio, 5 días/semana (10h efectivas/persona/semana)
- Prosepac provee hardware físico antes de enero 2027 (inicio de QA con hardware real)
- Ficha técnica del cargador disponible en Fase 0 o primera semana de Fase 2
- MercadoPago Marketplace confirmado (o descartado con plan de contingencia) en Fase 0
- Panel Admin es web app React separada del frontend mobile
- Rama `feature/oci-deploy-config` como base del deploy en OCI

---

*Creado: 2026-03-22*
*Actualizado: 2026-03-22 — scope refinado con decisiones del equipo. 70 reqs activos. Fase 2 reducida 12→9 sem (SteVe). Go-live febrero 2027. 48 sem total.*
