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

# PROPUESTA COMERCIAL

## Plataforma de Gestion y Cobro para Cargadores de Vehiculos Electricos

**Modelo de Monetizacion:** Comision por Sesion — sin costo fijo cuando la red genera trafico

**Fecha:** Marzo 2026

**Confidencial**

**Preparado para:** Prosepac Movilidad Electrica

---

## 1. Resumen Ejecutivo

La presente propuesta describe el desarrollo, implementacion y modelo de monetizacion de una plataforma integral de gestion y cobro para estaciones de carga de vehiculos electricos (EV). El software cubre el ciclo completo del negocio: desde que un conductor escanea un cargador hasta que el propietario recibe su liquidacion mensual.

El modelo de monetizacion se basa en **comision por sesion de carga**: sin costo inicial de desarrollo, sin cuota fija de software, sin gestion de infraestructura por parte del cliente. El proveedor financia el desarrollo completo de la plataforma — MVP y expansion v2 — y administra la infraestructura de produccion. A cambio, percibe un porcentaje sobre el valor de cada sesion procesada por la plataforma. Cuando el volumen de la red genera comisiones suficientes, el cliente no abona ningun monto adicional (*).

(*) En los periodos en que las comisiones acumuladas del mes no alcancen el minimo operativo acordado, el cliente cubre la diferencia hasta ese valor. Ver seccion 4.

---


## 2. Alcance del Software — Roadmap Completo

### v1 — MVP (Go-live: julio 2026)

- Gestion de estaciones: monitoreo en tiempo real, alertas, estado por cargador.
- Autenticacion y roles: Admin (Prosepac), Veedor, Empresa, Usuario con JWT.
- Comunicacion OCPP 1.6J: BootNotification, Heartbeat, StatusNotification, StartTransaction, StopTransaction, MeterValues, RemoteStart/Stop.
- Motor de precios: bajada de bandera + precio por kWh + franjas horarias.
- Cobros: MercadoPago Checkout Pro con pre-autorizacion y captura post-sesion.
- Notificaciones push y email (FCM): fin de sesion, cobro, cargador offline.
- Panel Admin: estado real, KPIs, gestion usuarios, exportacion CSV/Excel.
- Panel Empresa: cargadores propios, historial de sesiones y ganancias.
- App mobile iOS/Android (React Native + Expo).
- Observabilidad: Prometheus, Grafana, Loki.

### v2 — Expansion (durante el contrato, julio 2026 — julio 2027)

- Mapa interactivo con cargadores publicos, filtros y estado en tiempo real.
- QR code para inicio de sesion.
- OAuth Google/Apple y 2FA TOTP para admin.
- Onboarding autoservicio de empresas con flujo solicitud/aprobacion.
- Panel Propietario completo: gestion de cargadores, reportes de ingresos, integracion factura UTE.
- Tarifas dinamicas pico/valle.
- Cargadores hogareños con modelo peer-to-peer.
- Interoperabilidad OCPI 2.2 (roaming con otras redes EV).
- Web app (complemento al mobile).
- 500 sesiones concurrentes (load testing formal).
- Reconciliacion automatica de sesiones interrumpidas.

Para el detalle completo de fechas y entregables por modulo, ver el Roadmap adjunto.

---


## 3. Inversion del Proveedor

El modelo de comision por sesion es posible porque el proveedor financia y ejecuta el desarrollo completo antes de percibir cualquier ingreso. Esta seccion describe lo que el proveedor pone sobre la mesa.

### 3.1 Horas de Desarrollo

**v1 — MVP (1,125 horas)**

| Fase | Sprints |
|---|---|
| DB + Autenticacion | Sprint 1-2 |
| Central System OCPP | Sprint 3-5 |
| Sesiones y Precios | Sprint 6-7 |
| Pagos MercadoPago + Notificaciones | Sprint 8-9 |
| Panel Admin + Panel Empresa | Sprint 10-12 |
| Deploy OCI + QA Final + Go-live | Sprint 13-15 |

**v2 — Expansion (875 horas)**

| Feature | Horas |
|---|---|
| Mapa interactivo + filtros | 90h |
| OCPI 2.2 roaming | 150h |
| Web app | 180h |
| Cargadores peer-to-peer | 100h |
| Tarifas dinamicas pico/valle | 50h |
| Panel Propietario completo | 80h |
| Onboarding autoservicio de empresas | 40h |
| OAuth Google/Apple + 2FA TOTP | 45h |
| QR code + reconciliacion + load testing | 80h |
| Buffer QA e integraciones | 60h |

**Total: 2,000 horas de desarrollo**

### 3.2 Inversion Total del Proveedor

| Concepto | Monto |
|---|---|
| Mano de obra (desarrollo + QA) | $50,000 USD |
| Infraestructura de staging y produccion | $4,680 USD |
| Constitucion legal y certificaciones | $900 USD |
| Contingencia (protocolo, integracion hardware) | $2,800 USD |
| Provision fiscal | $7,000 USD |
| **Total inversion proveedor** | **~$65,380 USD** |

> Esta es la inversion que el proveedor realiza antes de recibir el primer peso. El modelo de comision por sesion es el mecanismo por el cual se recupera esa inversion a lo largo de los 36 meses del contrato — alineando directamente el exito del proveedor con el crecimiento de la red del cliente.

---


## 4. Modelo Comercial

> **Propuesta de valor clave:**
> Sin inversion inicial. Sin cuota fija de software. El cliente paga unicamente una comision sobre lo que ya esta cobrando por cada sesion de carga. La plataforma completa — desarrollo, infraestructura y operacion — esta financiada por el proveedor y se recupera a traves del volumen de la red.

### 4.1 Estructura de Precios

| Concepto | Detalle |
|---|---|
| Comision por sesion | Porcentaje aplicado sobre el **valor total de la sesion calculado por el motor de precios de la plataforma**: kWh consumidos × tarifa configurada + bajada de bandera. Si la configuracion del cargador incluye multa por no desconexion al completar la carga, dicho monto tambien integra la base de comision. Si la multa es $0, no genera comision adicional. Este valor es la base de comision independientemente de si la sesion genera cobro al usuario final. Las sesiones configuradas como gratuitas ($0 para el usuario) siguen generando comision calculada sobre su valor tarifario de referencia. La diferencia la absorbe el operador. |
| Costo inicial de desarrollo | **$0 USD** — sin cobro por adelantado |
| Infraestructura y operacion | **$0 USD adicionales** — financiada y administrada por el proveedor |

(*) **Minimo mensual de referencia:** Al cierre de cada mes se acumulan todas las comisiones del periodo. Si ese total supera el minimo acordado, se factura unicamente el total de comisiones. Si no lo alcanza, el cliente abona la diferencia hasta ese valor. Ambos conceptos nunca se suman.

### 4.2 Estructura del Acuerdo

| Periodo | Comision por sesion | (*) Minimo mensual |
|---|---|---|
| **Meses 1-36** | **12% IVA incluido** | $1,850 USD + IVA |
| **Mes 37+ (renovacion)** | **12% IVA incluido** | $800 USD + IVA |

La comision es del **12% sobre el valor de cada sesion, IVA incluido**, y aplica de forma uniforme durante toda la vigencia del acuerdo y sus renovaciones.

---


## 5. Contexto Impositivo

### 5.1 IVA (22%)

- Tasa basica aplicable a todos los servicios digitales y de software en Uruguay.
- La comision del 12% por sesion es **IVA incluido**: el cliente paga exactamente ese porcentaje sobre el valor de cada sesion, sin conceptos adicionales. El proveedor declara y deposita el IVA correspondiente ante DGI.
- El minimo mensual de referencia, cuando aplica, se factura como servicio separado: **$1,850 neto + $407 IVA = $2,257 USD/mes total**.

### 5.2 Facturacion Electronica (CFE)

- Obligatoria para todos los contribuyentes IVA desde enero 2025.
- Desde marzo 2026: DGI rechaza CFE que no cumplan especificacion **v25/v25.1**.
- El proveedor emite CFE por cada factura de comision o minimo.
- Se requiere que Prosepac tenga RUT activo y capacidad de emision CFE vigente.

### 5.3 Comision MercadoPago (costo de Prosepac, no del proveedor)

| Modalidad | Comision MP (IVA incluido) | Lo paga |
|---|---|---|
| Checkout Pro — cobro inmediato | ~7.31% del cobro | Prosepac |
| Checkout Pro — acreditacion 21 dias | ~6.09% del cobro | Prosepac |

MercadoPago descuenta su comision directamente del cobro recibido por Prosepac en cada sesion. No afecta ni el minimo ni la comision acordada con el proveedor de software.

---


\newpage

## 6. Infraestructura de Produccion (Administrada y Financiada por el Proveedor)

La infraestructura de produccion es responsabilidad exclusiva del proveedor. El cliente no gestiona ningun proveedor cloud, no recibe facturas de terceros y no asume riesgo de costos variables. Todo esta incluido en la estructura operativa del acuerdo.

| Servicio | Proveedor |
|---|---|
| App server + load balancer | Oracle Cloud Infrastructure (OCI) |
| Base de datos PostgreSQL 16 | OCI / AWS RDS |
| Cache Redis | OCI / AWS |
| Object storage | OCI |
| Push notifications | Firebase |
| Email transaccional | SendGrid |
| Dominio .com.uy | NIC Uruguay |
| App Store (iOS + Android) | Google + Apple |

---


## 7. Condiciones del Acuerdo

### 7.1 Duracion y Exclusividad

- Contrato de 36 meses desde la puesta en produccion del MVP (go-live estimado: julio 2026).
- Exclusividad: el cliente se compromete a utilizar unicamente esta plataforma como sistema de gestion y cobro de cargas durante la vigencia del contrato.
- Renovacion automatica por periodos de 12 meses al minimo de $800 USD/mes + IVA, salvo notificacion escrita con 60 dias de anticipacion.

### 7.2 Propiedad Intelectual

- El proveedor mantiene la propiedad intelectual total del codigo fuente.
- El cliente recibe licencia de uso exclusiva para su operacion durante la vigencia.
- Ajustes menores (menos de 8 horas) incluidos en las 10h de soporte mensual. Desarrollos mayores se cotizan a $25 USD/h + IVA.

### 7.3 Clausula de Terminacion Anticipada

- Si el cliente termina antes del mes 36, abona el **saldo operativo pendiente**: monto equivalente a los meses restantes al minimo de referencia vigente, descontando las comisiones netas (sin IVA) acumuladas hasta la fecha de terminacion.
- Si el proveedor termina el contrato, entrega el codigo fuente y provee 90 dias de soporte de transicion sin costo.
- Fuerza mayor: ambas partes negocian de buena fe.

### 7.4 Escalabilidad

- Sin costo adicional por agregar nuevos cargadores a la plataforma.

### 7.5 Soporte y Mantenimiento

- **10 horas mensuales de soporte** incluidas (L-V 9-18h UYT).
- Horas adicionales: $25 USD/h + IVA.
- Bugs criticos y actualizaciones de seguridad: sin costo.
- Nuevas funcionalidades fuera del roadmap acordado: se cotizan.
- Infraestructura de produccion: a cargo del proveedor (ver seccion 6).
- Ambas partes emiten CFE segun normativa DGI vigente.

---


## 8. Beneficios para el Cliente

| Beneficio | Descripcion |
|---|---|
| Solo se paga cuando se genera trafico | El cliente abona una comision sobre lo que su red ya esta cobrando. Si el volumen es suficiente, no existe ningun otro costo. |
| Sin inversion inicial | Sin desembolso por desarrollo ni por infraestructura. La plataforma completa — MVP y expansion v2 — esta financiada por el proveedor. |
| Sin gestion de infraestructura | El proveedor administra y financia toda la infraestructura de produccion. El cliente no tiene cuentas cloud, no recibe facturas de terceros y no asume costos variables. |
| Plataforma completa incluida | El MVP y la expansion v2 estan incluidos en el acuerdo. No hay cotizaciones adicionales por las funcionalidades planificadas en el roadmap. |
| Alineacion total de intereses | El ingreso del proveedor crece unicamente cuando el volumen de la red crece. Ambas partes tienen el mismo incentivo. |
| Condiciones estables a largo plazo | La comision y el minimo de referencia son constantes durante los 36 meses — sin escaladas ni renegociaciones. Desde el mes 37 el minimo baja a $800 USD/mes. |

---


## 9. Proximos Pasos

1. Revision de esta propuesta y cierre de preguntas.
2. Confirmacion del porcentaje de comision y condiciones finales.
3. Firma del acuerdo comercial.
4. Inicio del desarrollo. **Go-live MVP: 07 de julio 2026** (15 semanas desde la firma).
5. Inicio del contrato de 36 meses desde la fecha de go-live.

---

## Firmas

| Por el Proveedor | Por el Cliente |
|---|---|
| _______________ | _______________ |
| Fecha: _______________ | Fecha: _______________ |
