# Roadmap MVP — Plataforma EVSE Prosepac
**Inicio:** 24 de marzo 2026
**Go-live estimado:** agosto / septiembre 2027
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
| Multiplicador de calendario | 1x | ~4-4.5x | — |
| Go-live (mismo alcance) | ago 2026 | ago-sep 2027 | +12 meses |

**Nota sobre context switching:** A 2h/día cada sesión arranca con 10-15 min de re-orientación.
En módulos complejos (OCPP, pagos) el tiempo efectivo de producción por sesión es ~1.5-1.7h reales.
Claude Code ayuda a recuperar contexto más rápido pero no elimina este costo.

---

## Qué trae la POC — trabajo ya hecho

### Backend

| Componente | Estado |
|---|---|
| Arquitectura hexagonal completa | Listo |
| Agregado `Charger` con transiciones de estado | Listo |
| Value objects, mappers, exception handler | Listos |
| `LoggingAspect` + `MetricsAspect` + Prometheus + Grafana + Loki | **Listos** |
| Docker Compose base | Listo |
| Tests de dominio y servicio | Listos |
| Auth, roles, JWT, PostgreSQL, Redis, OCPP, sesiones, pagos | **No existe** |

### Frontend

| Componente | Estado |
|---|---|
| Estructura React Native + Expo + navegación completa | Lista |
| Todas las pantallas con UI real (Auth, Charging, Payment, History...) | **Listas** |
| `ChargingDetailScreen` con máquina de estados, timer, kWh, animaciones | **Avanzada** (simulada) |
| `AuthContext` (reducer + AsyncStorage) | Listo en estructura (mock user) |
| Axios client + estructura de servicios | Lista |
| Auth real, roles, push notifications, panel admin | **No existe** |

---

## Fases y calendario

### Fase 0 — Cierre de decisiones pendientes
**Duración:** 1-2 semanas
**Fechas:** 24/03/2026 → 05/04/2026

A 2h/día la Fase 0 no cambia mucho porque depende principalmente de la disponibilidad de Prosepac, no del tiempo de desarrollo.

| Tarea | Responsable |
|---|---|
| Confirmar nombre de la plataforma con Prosepac | PL |
| Conseguir ficha técnica del modelo de cargador | PL |
| Confirmar disponibilidad MercadoPago Marketplace en Uruguay | TL + PL |
| Actualizar documentación con decisiones cerradas | DEV + Claude Code |

**Entregable:** Decisiones bloqueantes documentadas. Verde para Fase 1.

---

### Fase 1 — Base de Datos y Autenticación
**Duración:** 8 semanas (2 semanas a full time × 4)
**Fechas:** 06/04/2026 → 31/05/2026

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-2 | Migración H2 → PostgreSQL 16 + Flyway + Redis. Diseño del esquema de usuarios y roles. | Con Claude Code: genera migrations, entidades User/Role, mappers. Configura entornos. | Valida entornos dev/staging. |
| 3-4 | JWT: registro, login, refresh token, revocación. | Con Claude Code: conecta AuthContext del frontend con auth real. Reemplaza mock user. | Testing de flujos auth básicos. |
| 5-6 | OAuth Google + Apple. Recupero de contraseña. | Con Claude Code: pantallas OAuth, recupero de contraseña. Tests de integración. | Testing de OAuth en dispositivos reales. |
| 7-8 | Sistema de 4 roles (Admin/Veedor/Empresa/Usuario) + multi-rol. Code review. | Con Claude Code: navegación condicional por rol. Tests de permisos. | Testing de roles y validación UAT. |

**Entregable:** Auth real. PostgreSQL + Redis. H2 eliminado. 4 roles activos.

---

### Fase 2 — Central System OCPP 1.6J
**Duración:** 16 semanas (4 semanas a full time × 4)
**Fechas:** 01/06/2026 → 20/09/2026

Esta es la fase más crítica y la que más sufre con 2h/día. El context switching en OCPP es costoso — cada sesión de 2h requiere retomar el estado del protocolo, los mensajes en vuelo y la lógica de reconexión.

**Recomendación:** Si es posible, intentar en estas semanas concentrar las 2h del TL en bloques continuos sin interrupciones — es donde más importa el foco sostenido.

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-3 | Research + arquitectura OCPP: librería Java-OCA-OCPP, diseño del WebSocket handler, estrategia de idempotencia. Documenta antes de codear. | Instala y configura simulador SteVe. Con Claude Code: scaffolding del módulo OCPP en estructura hexagonal existente. Define escenarios de test. | Coordina ficha técnica del cargador físico con Prosepac. |
| 4-6 | WebSocket server WSS + OCPP Basic Auth + BootNotification. | Con Claude Code: Heartbeat + StatusNotification → Redis. Extiende ChargerStatus. Pantalla listado de cargadores con estado real. | Conecta simulador. Valida BootNotification y transiciones de estado. |
| 7-10 | StartTransaction (transactionId a BD ANTES de conf). MeterValues acumulación kWh. | Con Claude Code: StopTransaction. Reconexión sin pérdida de sesión activa. Pantalla detalle cargador. | Test del ciclo completo con simulador. Valida persistencia de transactionId. |
| 11-14 | RemoteStart/Stop. Manejo completo de reconexión. WSS TLS 1.2+. | Con Claude Code: suite de tests de integración OCPP. Manejo de errores en UI. | Stress test con simulador. Valida latencia < 5s. |
| 15-16 | Code review completo del módulo OCPP. Ajustes y estabilización. | Documentación técnica del módulo con Claude Code. | Testing de aceptación. Sign-off. |

**Entregable:** Simulador OCPP conectado. Ciclo completo funcionando y persistido.

> **Hito crítico — semana 6** (~julio 2026): primer cargador conectado al backend via OCPP.

---

### Fase 3 — Ciclo de Vida de Sesiones y Precios
**Duración:** 8 semanas (2 semanas a full time × 4)
**Fechas:** 21/09/2026 → 15/11/2026

**Qué trae la POC:** `ChargingDetailScreen` ya tiene toda la UI y lógica simulada. El trabajo es conectar con datos OCPP reales.

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-3 | Máquina de estados de sesión en backend. Motor de precios: bajada de bandera + kWh + franjas horarias + comisión configurable. | Con Claude Code: reemplaza simulación de ChargingDetailScreen con llamadas reales a la API. Pantalla de resumen post-sesión. | Valida cálculos de precio con casos de Prosepac. |
| 4-6 | Cargadores gratuitos ($0). Reconciliación de sesiones suspendidas. | Con Claude Code: historial de sesiones. Restauración de sesión activa tras reapertura de app. Tests. | Test del ciclo completo inicio → parada. |
| 7-8 | Flujo manguera trabada: tiempo de gracia configurable + multa por minuto. | Con Claude Code: UI de aviso manguera trabada. Tests de multa. | Valida configurabilidad por cliente. UAT. |

**Entregable:** Sesión real con datos OCPP. kWh y costo calculados en backend en tiempo real.

---

### Fase 4 — Integración de Pagos
**Duración:** 10 semanas (2.5 semanas a full time × 4)
**Fechas:** 16/11/2026 → 24/01/2027

**Qué trae la POC:** `PreAuthPaymentScreen` y `PaymentScreen` con UI completa. `paymentService` estructurado.

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-3 | Research MercadoPago + SDK Java. Diseño de flujo pre-auth → captura + webhooks idempotentes. | Con Claude Code: integra SDK MercadoPago en PreAuthPaymentScreen. Setup sandbox. | Coordina credenciales sandbox con Prosepac. |
| 4-6 | Pre-auth al inicio + captura post-StopTransaction. Split plataforma/empresa configurable. | Con Claude Code: PaymentScreen con cobro real. Email de comprobante. Panel ingresos Empresa. | Test ciclo pago sandbox. Valida timing de cobro. |
| 7-8 | Webhooks: idempotencia, reintentos, fallos. Liquidación mensual. | Con Claude Code: tests de webhooks. Documentación. | Test de pagos fallidos. |
| 9-10 | Reembolsos desde admin. Code review. Estabilización. | Con Claude Code: gestión de reembolsos en panel admin. Tests. | Test de reembolsos. Sign-off módulo. |

**Entregable:** Cobro real, fondos distribuidos, comprobante entregado, reembolsos operativos.

> **Contingencia:** Si MercadoPago Marketplace no está disponible en Uruguay, distribución manual mensual por Prosepac. No bloquea go-live.

---

### Fase 5 — Notificaciones y Resiliencia Offline
**Duración:** 4 semanas (1 semana a full time × 4)
**Fechas:** 25/01/2027 → 22/02/2027

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-2 | FCM server-side: todos los triggers (fin sesión, cobro, cargador offline, manguera trabada). Email transaccional. | Con Claude Code: setup FCM en app Android/iOS. UI de notificaciones en historial. | Test de notificaciones en dispositivos reales. |
| 3-4 | Reconciliación de estado de sesión al reconectarse (backend). | Con Claude Code: restauración automática de sesión activa en app. Tests. | Test flujo offline → reconexión. Sign-off. |

**Entregable:** Push notifications en todos los eventos críticos. App resiliente ante pérdida de conexión.

---

### Fase 6 — Panel Admin, Panels Empresa/Veedor y Observabilidad
**Duración:** 12 semanas (3 semanas a full time × 4)
**Fechas:** 23/02/2027 → 17/05/2027

**Qué trae la POC:** AOP + Prometheus + Grafana + Loki ya configurados. La observabilidad del backend está. Fase 6 agrega el panel admin web y ajusta dashboards para producción.

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-3 | APIs de admin: estado en tiempo real, KPIs, bloquear/desbloquear, gestión usuarios. 2FA (TOTP). | Con Claude Code: Panel Admin web (React) — dashboard + KPIs + gestión usuarios + 2FA. | Valida con datos reales. Test operaciones admin. |
| 4-6 | APIs de reportería: sesiones + ingresos con filtros + exportación CSV y Excel. Config planes de distribución. | Con Claude Code: reportes y exportación. Panel Veedor (multi-empresa). Tests. | Valida reportes. Confirma desglose por franja horaria. |
| 7-9 | Panel Empresa APIs. Ajuste dashboards Grafana producción. Alertas anomalías en pagos. | Con Claude Code: Panel Empresa (cargadores, historial, ingresos). Documentación. | UAT de todos los panels con Prosepac. |
| 10-12 | Health checks. Buffer para ajustes post-UAT. Code review final. | Bug fixes UAT. Pulido de UX. | Sign-off funcional completo. |

**Entregable:** Prosepac opera la plataforma. Panels de Empresa y Veedor operativos. Observabilidad lista para producción.

---

### Deploy y QA Final
**Duración:** 10 semanas (2.5 semanas a full time × 4)
**Fechas:** 18/05/2027 → 26/07/2027

| Semanas | TL | DEV | PL |
|---|---|---|---|
| 1-3 | Infraestructura OCI producción: rolling deployments, SSL, secrets. (Base en `feature/oci-deploy-config`). Testing con hardware físico real de Prosepac. | Testing E2E automatizado. Security audit (OWASP top 10, OCPP auth, PCI). | Coordina hardware físico. Inicia publicación en App Store / Play Store. |
| 4-6 | Load testing: 500 sesiones concurrentes + tuning PostgreSQL y Redis. Ajustes de issues con hardware real. | Bug fixing. Compatibilidad iOS/Android. Release candidate. | Gestiona feedback UAT final con Prosepac. |
| 7-8 | Estabilización + monitoring activo + runbook. | Smoke testing en producción. | Sign-off con Prosepac. Coordinación go-live. |
| 9-10 | Buffer para imprevistos del go-live. | — | — |

**Entregable:** Sistema en producción estable. Runbook entregado a Prosepac.

---

## Resumen de calendario

| Fase | Inicio | Fin | Semanas | Riesgo |
|---|---|---|---|---|
| 0 — Cierre de decisiones | 24/03/2026 | 05/04/2026 | 2 | Bajo |
| 1 — DB y Autenticación | 06/04/2026 | 31/05/2026 | 8 | Bajo |
| 2 — OCPP Central System | 01/06/2026 | 20/09/2026 | 16 | **Alto** |
| 3 — Sesiones y Precios | 21/09/2026 | 15/11/2026 | 8 | Medio |
| 4 — Pagos | 16/11/2026 | 24/01/2027 | 10 | **Alto** |
| 5 — Notificaciones y Offline | 25/01/2027 | 22/02/2027 | 4 | Bajo |
| 6 — Panels y Observabilidad | 23/02/2027 | 17/05/2027 | 12 | Medio |
| Deploy y QA Final | 18/05/2027 | 26/07/2027 | 10 | Medio |
| **Total** | **24/03/2026** | **26/07/2027** | **~70 sem** | |

---

## Hitos clave

| Hito | Fecha estimada |
|---|---|
| Decisiones 100% cerradas | 05/04/2026 |
| Auth real + roles funcionando | 31/05/2026 |
| Primer cargador conectado via OCPP | ~julio 2026 |
| Ciclo OCPP completo con simulador | 20/09/2026 |
| Sesión end-to-end con datos reales (sin pago) | 15/11/2026 |
| Primer cobro real en sandbox | ~enero 2027 |
| Feature complete | 17/05/2027 |
| **Go-live producción** | **26/07/2027** |

---

## Escenarios según dedicación

| Dedicación | Horas/semana/persona | Multiplicador | Go-live estimado |
|---|---|---|---|
| Full time | 40h | 1x | agosto 2026 |
| 4h/día | 20h | 2x | febrero 2027 |
| **2h/día (actual)** | **10h** | **4x** | **julio 2027** |
| 1h/día | 5h | 8x | 2028 |

---

## Riesgos con 2h/día

| Riesgo específico de baja dedicación | Impacto |
|---|---|
| Context switching: 10-15 min de re-orientación por sesión en OCPP | Fase 2 efectivamente más lenta que 4x |
| Momentum: bugs difíciles de depurar en sesiones cortas | Puede bloquear días enteros sin avanzar |
| Prosepac espera avances — con 2h/día los entregables visibles tardan meses | Riesgo de pérdida de confianza del cliente |
| Dependencias: si TL está bloqueado, DEV no puede avanzar | Puede desperdiciar sesiones de 2h esperando |

---

## Recomendaciones para trabajar a 2h/día eficientemente

1. **Sesiones de TL bloqueadas**: en Fase 2 (OCPP), el TL debería tener las 2h sin interrupciones — es donde más importa el foco
2. **Claude Code como punto de entrada**: empezar cada sesión leyendo el contexto con Claude Code en lugar de revisando código manualmente — recupera contexto más rápido
3. **Tareas con resultado visible en 2h**: planificar cada sesión con un entregable concreto ("hoy termino el BootNotification handler") en lugar de trabajar en algo que no cierra
4. **DEV y TL en paralelo**: cuando TL está en investigación/arquitectura, DEV trabaja en frontend — evitar dependencias que anulen sesiones
5. **Considerar sprints de dedicación intensiva**: si es posible, una semana cada 2 meses a full time acelera significativamente las fases más complejas

---

## Supuestos

- 2 horas por persona por día promedio, 5 días/semana (10h efectivas/persona/semana)
- Si alguna semana hay más disponibilidad, las fases más complejas (OCPP, pagos) son las primeras candidatas a absorberla
- Prosepac provee hardware físico antes de mayo 2027 (inicio de QA)
- Ficha técnica del cargador disponible en Fase 0 o primera semana de Fase 2
- MercadoPago Marketplace confirmado (o descartado) en Fase 0
- Panel Admin es web app React separada

---

*Creado: 2026-03-22*
*Revisión: ajustar al cierre de cada fase según velocidad real del equipo*
