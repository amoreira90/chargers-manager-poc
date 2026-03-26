---
header-includes:
  - \widowpenalty=10000
  - \clubpenalty=10000
  - \usepackage{needspace}
  - \usepackage{etoolbox}
  - \preto{\section}{\needspace{8\baselineskip}}
  - \preto{\subsection}{\needspace{8\baselineskip}}
  - \preto{\subsubsection}{\needspace{6\baselineskip}}
---

# Roadmap Completo — Plataforma de Gestion y Cobro EVSE

**Proyecto:** Plataforma integral de gestión de cargadores eléctricos
**Preparado para:** Prosepac Movilidad Electrica
**Fecha:** Marzo 2026
**Confidencial**

---

## Vision General

| | v1 — MVP | v2 — Expansion |
|---|---|---|
| Periodo | Mar 2026 — Jul 2026 | Jul 2026 — Jul 2027 |
| Duracion | 15 semanas | 12 meses |
| Horas | 1,125h | 875h |
| Estado | En desarrollo | Incluido en el contrato |
| Go-live | **07 de julio 2026** | **julio 2027** |

La plataforma se entrega en dos etapas incluidas en el mismo contrato. El MVP pone en produccion el nucleo operacional completo. La expansion v2 se desarrolla durante el primer ano de contrato, agregando funcionalidades avanzadas sin costo adicional.

---


## v1 — MVP (15 semanas, mar — jul 2026)

### Modulo 1: Base e Identidad
**Semanas 1-2 | Entregable: 6 de abril 2026**

- Base de datos PostgreSQL 16 con migraciones versionadas.
- Sistema de autenticacion JWT con sesiones persistentes y recupero de contrasena.
- Cuatro roles de acceso: Administrador, Veedor, Empresa, Usuario.
- Registro y configuracion de cargadores: ubicacion, tipo de conector, potencia, ID de protocolo, tarifa.
- Control de acceso por rol en todas las APIs.

---


### Modulo 2: Protocolo OCPP 1.6J
**Semanas 3-5 | Entregable: 27 de abril 2026**

- Conexion segura de cargadores fisicos al servidor via WebSocket cifrado (WSS/TLS 1.2+).
- Autenticacion de cargadores via OCPP Basic Auth.
- Procesamiento de mensajes OCPP: BootNotification, Heartbeat, StatusNotification, StartTransaction, MeterValues, StopTransaction.
- Actualizacion de estado del cargador en el sistema en menos de 5 segundos.
- Control remoto: inicio y parada de sesion desde el servidor (RemoteStart/RemoteStop).
- Recuperacion automatica de sesion activa ante reconexion del cargador sin perdida de datos.

> **Hito: primer cargador fisico conectado al backend — 13 de abril 2026.**

---


### Modulo 3: Sesiones y Motor de Precios
**Semanas 6-7 | Entregable: 11 de mayo 2026**

- Inicio de sesion desde la app mobile: el usuario selecciona el cargador y arranca la carga.
- Monitoreo en tiempo real: kWh consumidos, duracion y costo estimado actualizados durante la sesion.
- Motor de precios servidor: bajada de bandera + precio por kWh + franjas horarias configurables.
- Calculo de costo final en el servidor desde los valores reales de energia del protocolo.
- Detencion de sesion desde la app en cualquier momento.
- Cargadores con tarifa $0: completan la sesion sin generar transaccion de pago.
- Sesion suspendida: reconciliacion automatica ante perdida de conectividad.
- Vehiculo inactivo: deteccion, notificacion al usuario y parada automatica tras periodo de gracia.
- Historial de sesiones con detalle de desglose por franja horaria.

> **Hito: sesion de carga end-to-end con pricing real — 11 de mayo 2026.**

---


### Modulo 4: Cobros MercadoPago
**Semanas 8-9 | Entregable: 25 de mayo 2026**

- Checkout Pro de MercadoPago: tarjeta de credito/debito, cuenta MP, Abitab, Red Pagos.
- Pre-autorizacion al inicio de sesion; captura automatica del monto exacto al finalizar.
- El cobro ocurre unicamente despues de confirmar la energia consumida real.
- Comprobante de pago por email y en la app inmediatamente tras el cobro.
- Webhooks idempotentes: sin cobros duplicados ante reintentos.
- Reembolsos parciales y totales gestionados desde el panel admin.
- Todo el dinero acreditado en la cuenta MercadoPago de Prosepac; liquidacion a empresas mensual.

> **Hito: primer cobro real en sandbox MercadoPago — 18 de mayo 2026.**

---


### Modulo 5: Notificaciones
**Semana 8 (paralelo con Cobros) | Entregable: 25 de mayo 2026**

- Push notification al usuario al finalizar una sesion de carga (dentro de 30 segundos).
- Push notification y email al usuario cuando se cobra un pago.
- Alerta al admin cuando un cargador se desconecta (timeout de Heartbeat).
- Alerta al admin cuando OCPP reporta un fallo tecnico en un cargador.
- Notificacion de vehiculo inactivo (manguera trabada) y de parada automatica.
- Restauracion del estado de sesion activa al reabrir la app tras perdida de conectividad.

---


### Modulo 6: Paneles de Gestion y Observabilidad
**Semanas 10-12 | Entregable: 15 de junio 2026**

**Panel Administrador (web)**

- Estado en tiempo real de todos los cargadores: online/offline, disponible/cargando/fallo.
- KPIs globales: sesiones activas, ingresos del dia/mes, tasa de disponibilidad.
- Bloqueo y desbloqueo remoto de cargadores.
- Gestion de usuarios: crear, suspender, eliminar cuentas.
- Configuracion de planes de distribucion de fondos.
- Exportacion de reportes de sesiones e ingresos como CSV/Excel con filtros.
- Log del sistema filtrable por ID de cargador.
- Auditoria de operaciones criticas sobre cuentas.

**Panel Empresa (web)**

- Vista de cargadores propios con estado actual.
- Historial de sesiones y ganancias por cargador.

**Observabilidad (produccion)**

- Metricas en tiempo real con Prometheus y Grafana.
- Logs estructurados con Loki.
- Health checks automaticos.

---


### Modulo 7: Deploy, QA y Go-live
**Semanas 13-15 | Go-live: 7 de julio 2026**

- Infraestructura de produccion en Oracle Cloud Infrastructure (OCI).
- Despliegues sin tiempo de inactividad (rolling deployments).
- Certificados SSL/TLS y gestion de secretos.
- Auditoria de seguridad: OWASP Top 10, autenticacion OCPP, validacion JWT.
- Tests end-to-end con hardware fisico de Prosepac.
- Publicacion en App Store (iOS) y Google Play (Android).
- Capacitacion al equipo de Prosepac.
- Runbook de operaciones entregado.

---


### Calendario MVP

| Semana | Fechas | Modulo | Entregable clave |
|---|---|---|---|
| 1-2 | 24/03 — 06/04 | Base + Auth + Cargadores | PostgreSQL, JWT, 4 roles, CRUD cargadores |
| 3-5 | 07/04 — 27/04 | OCPP 1.6J | **Primer cargador conectado (13/04)**, ciclo completo |
| 6-7 | 28/04 — 11/05 | Sesiones + Precios | Sesion E2E con pricing real |
| 8-9 | 12/05 — 25/05 | Cobros + Notificaciones | **Primer cobro sandbox (18/05)**, push notifications |
| 10-12 | 26/05 — 15/06 | Paneles + Observabilidad | Admin, Empresa, Grafana |
| 13-14 | 16/06 — 29/06 | Deploy + QA | Infra OCI, hardware fisico, release candidate |
| 15 | 30/06 — 07/07 | Go-live | **Produccion** |

---

### Hitos MVP

| Hito | Fecha |
|---|---|
| Auth con 4 roles operativo | 06/04/2026 |
| Primer cargador fisico conectado via OCPP | 13/04/2026 |
| Ciclo OCPP completo (Boot → Start → Stop) | 27/04/2026 |
| Sesion end-to-end con pricing real | 11/05/2026 |
| Primer cobro real en sandbox MercadoPago | 18/05/2026 |
| Feature complete — sign-off Prosepac | 15/06/2026 |
| Release candidate validado con hardware fisico | 29/06/2026 |
| **Go-live en produccion** | **07/07/2026** |

---


## v2 — Expansion (12 meses, jul 2026 — jul 2027)

La expansion v2 se desarrolla durante el primer ano de contrato en paralelo a la operacion del MVP en produccion. Las funcionalidades se agrupan en tres olas segun impacto y dependencias.

### Ola 1 — Experiencia de Usuario y Operacion (ago — nov 2026)

| Feature | Descripcion | Horas |
|---|---|---|
| QR code | Inicio de sesion escaneando el QR del cargador desde la app | 25h |
| OAuth Google/Apple | Login social para usuarios (reduccion de friccion en registro) | 25h |
| Panel Propietario completo | Gestion de cargadores propios, reportes de ingresos, historial de liquidaciones | 80h |
| Onboarding autoservicio de empresas | Flujo de solicitud y aprobacion de nuevas empresas sin intervencion manual del admin | 40h |
| Alertas tecnicas OCPP | Notificaciones al admin ante errores de hardware reportados por el cargador | 15h |
| Historial de liquidaciones propietario | Vista de pagos recibidos por periodo con detalle por sesion | 25h |
| **Subtotal Ola 1** | | **210h** |

---


### Ola 2 — Plataforma Inteligente (dic 2026 — mar 2027)

| Feature | Descripcion | Horas |
|---|---|---|
| Mapa interactivo | Cargadores publicos con filtros (tipo conector, disponibilidad, precio) y estado en tiempo real | 90h |
| Tarifas dinamicas pico/valle | Precios que varian automaticamente segun franja horaria configurada | 50h |
| 2FA TOTP para admin | Segundo factor de autenticacion para cuentas administrativas | 20h |
| 500 sesiones concurrentes | Load testing formal y ajuste de infraestructura para alta concurrencia | 25h |
| Reconciliacion automatica de sesiones | Cierre correcto de sesiones interrumpidas sin intervencion manual | 30h |
| **Subtotal Ola 2** | | **215h** |

---


### Ola 3 — Ecosistema y Escala (abr — jul 2027)

| Feature | Descripcion | Horas |
|---|---|---|
| Cargadores hogareños peer-to-peer | Modelo para que particulares ofrezcan su cargador a otros usuarios | 100h |
| Web app | Version web complementaria a la app mobile (misma funcionalidad core) | 180h |
| Interoperabilidad OCPI 2.2 | Roaming con otras redes de carga EV (estandar europeo) | 150h |
| Buffer v2 | Integraciones adicionales, QA, ajustes segun feedback de produccion | 120h |
| **Subtotal Ola 3** | | **550h** |

---

### Calendario v2

| Periodo | Ola | Features principales | Entregable |
|---|---|---|---|
| Ago — Nov 2026 | Ola 1 | QR, OAuth, Panel Propietario, Onboarding empresas | Experiencia completa para propietarios y usuarios |
| Dic 2026 — Mar 2027 | Ola 2 | Mapa interactivo, tarifas dinamicas, load testing | Red visible publicamente, precios inteligentes |
| Abr — Jul 2027 | Ola 3 | Peer-to-peer, web app, OCPI 2.2 | Plataforma abierta e interoperable |

---


## Resumen Total del Contrato

### Horas por etapa

| Etapa | Sprints / Periodo | Horas |
|---|---|---|
| v1 — MVP | 15 sprints (15 semanas) | 1,125h |
| v2 — Expansion | 3 olas (12 meses) | 875h |
| **Total** | | **2,000h** |

### Timeline consolidado

```
2026
  Mar ----[Inicio desarrollo]
  Abr ----[OCPP: primer cargador conectado]
  May ----[Primer cobro MercadoPago]
  Jun ----[Feature complete MVP]
  Jul ----[GO-LIVE v1]----[Inicio v2 Ola 1]
  Ago     [Ola 1: QR, OAuth, Panel Propietario]
  Sep
  Oct
  Nov ----[Entregable Ola 1]----[Inicio Ola 2]
  Dic     [Ola 2: Mapa, Tarifas dinamicas]
2027
  Ene
  Feb
  Mar ----[Entregable Ola 2]----[Inicio Ola 3]
  Abr     [Ola 3: Peer-to-peer, Web app, OCPI]
  May
  Jun
  Jul ----[PLATAFORMA COMPLETA v2]
          [Inicio periodo de renovacion $800/mes]
```

### Condiciones

- El desarrollo de v1 y v2 esta incluido en el minimo mensual de $1,850 USD durante 36 meses.
- Sin costo adicional por agregar nuevos cargadores a la plataforma.
- 10 horas mensuales de soporte incluidas. Horas adicionales a $25 USD/h + IVA.
- Infraestructura de produccion administrada por el proveedor: incluida en el minimo mensual.
- El orden de desarrollo dentro de cada ola puede ajustarse por prioridad operativa de Prosepac.

---

*Documento preparado en marzo 2026. Sujeto a ajustes menores de calendario por condiciones tecnicas o de hardware.*
