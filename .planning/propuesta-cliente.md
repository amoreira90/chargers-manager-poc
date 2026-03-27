# PROPUESTA COMERCIAL

## Plataforma de Gestión y Cobro para Cargadores de Vehículos Eléctricos

**Modelo de Monetización:** Comisión por Sesión — sin costo fijo cuando la red genera tráfico

**Fecha:** Marzo 2026

**Confidencial**

**Preparado para:** Prosepac Movilidad Eléctrica

---

## 1. Resumen Ejecutivo

La presente propuesta describe el desarrollo, implementación y modelo de monetización de una plataforma integral de gestión y cobro para estaciones de carga de vehículos eléctricos (EV). El software cubre el ciclo completo del negocio: desde que un conductor escanea un cargador hasta que el propietario recibe su liquidación mensual.

El modelo de monetización se basa en **comisión por sesion de carga**: sin costo inicial de desarrollo, sin cuota fija de software, sin gestión de infraestructura por parte del cliente. El proveedor financia el desarrollo completo de la plataforma — MVP y expansión v2 — y administra la infraestructura de producción. A cambio, percibe un porcentaje sobre el valor de cada sesión procesada por la plataforma. Cuando el volumen de la red genera comisiones suficientes, el cliente no abona ningún monto adicional (*).

(*) En los periodos en que las comisiones acumuladas del mes no alcancen el mínimo operativo acordado, el cliente cubre la diferencia hasta ese valor. Ver sección 4.

---

## 2. Alcance del Software — Roadmap Completo

### v1 — MVP (Go-live: julio 2026)

- Gestión de estaciones: monitoreo en tiempo real, alertas, estado por cargador.
- Autenticación y roles: Admin (Prosepac), Veedor, Empresa, Usuario con JWT.
- Comunicación OCPP 1.6J: BootNotification, Heartbeat, StatusNotification, StartTransaction, StopTransaction, MeterValues, RemoteStart/Stop.
- Motor de precios: bajada de bandera + precio por kWh + franjas horarias.
- Cobros: MercadoPago Checkout Pro con pre-autorización y captura post-sesión.
- Notificaciones push y email (FCM): fin de sesión, cobro, cargador offline.
- Panel Admin: estado real, KPIs, gestión usuarios, exportación CSV/Excel.
- Panel Empresa: cargadores propios, historial de sesiones y ganancias.
- App mobile iOS/Android (React Native + Expo).
- Observabilidad: Prometheus, Grafana, Loki.

\newpage

### v2 — Expansión (durante el contrato, julio 2026 — julio 2027)

- Mapa interactivo con cargadores públicos, filtros y estado en tiempo real.
- QR code para inicio de sesión.
- OAuth Google/Apple y 2FA TOTP para admin.
- Onboarding autoservicio de empresas con flujo solicitud/aprobación.
- Panel Propietario completo: gestión de cargadores, reportes de ingresos, integración factura UTE.
- Tarifas dinámicas pico/valle.
- Cargadores hogareños con modelo peer-to-peer.
- Interoperabilidad OCPI 2.2 (roaming con otras redes EV).
- Web app (complemento al mobile).
- 500 sesiones concurrentes (load testing formal).
- Reconciliacion automática de sesiones interrumpidas.

Para el detalle completo de fechas y entregables por módulo, ver el Roadmap adjunto.

---

## 3. Inversión del Proveedor

El modelo de comisión por sesión es posible porque el proveedor financia y ejecuta el desarrollo completo antes de percibir cualquier ingreso. Esta sección describe lo que el proveedor pone sobre la mesa.

### 3.1 Horas de Desarrollo

**v1 — MVP (1,125 horas)**

| Fase | Sprints |
|---|---|
| DB + Autenticación | Sprint 1-2 |
| Central System OCPP | Sprint 3-5 |
| Sesiones y Precios | Sprint 6-7 |
| Pagos MercadoPago + Notificaciones | Sprint 8-9 |
| Panel Admin + Panel Empresa | Sprint 10-12 |
| Deploy OCI + QA Final + Go-live | Sprint 13-15 |

**v2 — Expansión (875 horas)**

| Feature | Horas |
|---|---|
| Mapa interactivo + filtros | 90h |
| OCPI 2.2 roaming | 150h |
| Web app | 180h |
| Cargadores peer-to-peer | 100h |
| Tarifas dinámicas pico/valle | 50h |
| Panel Propietario completo | 80h |
| Onboarding autoservicio de empresas | 40h |
| OAuth Google/Apple + 2FA TOTP | 45h |
| QR code + reconciliacion + load testing | 80h |
| Buffer QA e integraciones | 60h |

**Total: 2,000 horas de desarrollo**

### 3.2 Inversión Total del Proveedor

| Concepto | Monto |
|---|---|
| Mano de obra (desarrollo + QA) | $50,000 USD |
| Infraestructura de staging y producción | $4,680 USD |
| Constitución legal y certificaciones | $900 USD |
| Contingencia (protocolo, integración hardware) | $2,800 USD |
| Provision fiscal | $7,000 USD |
| **Total inversion proveedor** | **~$65,380 USD** |

> Esta es la inversión que el proveedor realiza antes de recibir el primer peso. El modelo de comisión por sesión es el mecanismo por el cual se recupera esa inversión a lo largo de los 36 meses del contrato — alineando directamente el éxito del proveedor con el crecimiento de la red del cliente.

---

## 4. Modelo Comercial

> **Propuesta de valor clave:**
> Sin inversión inicial. Sin cuota fija de software. El cliente paga únicamente una comisión sobre lo que ya está cobrando por cada sesión de carga. La plataforma completa — desarrollo, infraestructura y operación — está financiada por el proveedor y se recupera a través del volumen de la red.

### 4.1 Estructura de Precios

| Concepto | Detalle |
|---|---|
| Comisión por sesion | Porcentaje aplicado sobre el **valor total de la sesión calculado por el motor de precios de la plataforma**: kWh consumidos × tarifa configurada + bajada de bandera. Si la configuración del cargador incluye multa por no desconexión al completar la carga, dicho monto también integra la base de comisión. Si la multa es $0, no genera comisión adicional. Este valor es la base de comisión independientemente de si la sesión genera cobro al usuario final. Las sesiones configuradas como gratuitas ($0 para el usuario) siguen generando comisión calculada sobre su valor tarifario de referencia. La diferencia la absorbe el operador. |
| Costo inicial de desarrollo | **$0 USD** — sin cobro por adelantado |
| Infraestructura y operación | **$0 USD adicionales** — financiada y administrada por el proveedor |

(*) **Mínimo mensual de referencia:** Al cierre de cada mes se acumulan todas las comisiones del periodo. Si ese total supera el mínimo acordado, se factura únicamente el total de comisiones. Si no lo alcanza, el cliente abona la diferencia hasta ese valor. Ambos conceptos nunca se suman.

\newpage

### 4.2 Estructura del Acuerdo

| Periodo | Comision por sesión | (*) Mínimo mensual |
|---|---|---|
| **Meses 1-36** | **12% IVA incluido** | $1,850 USD + IVA |
| **Mes 37+ (renovacion)** | **12% IVA incluido** | $800 USD + IVA |

La comisión es del **12% sobre el valor de cada sesión, IVA incluido**, y aplica de forma uniforme durante toda la vigencia del acuerdo y sus renovaciones.

---

## 5. Contexto Impositivo

### 5.1 IVA (22%)

- Tasa básica aplicable a todos los servicios digitales y de software en Uruguay.
- La comisión del 12% por sesión es **IVA incluido**: el cliente paga exactamente ese porcentaje sobre el valor de cada sesión, sin conceptos adicionales. El proveedor declara y deposita el IVA correspondiente ante DGI.
- El mínimo mensual de referencia, cuando aplica, se factura como servicio separado: **$1,850 neto + $407 IVA = $2,257 USD/mes total**.

### 5.2 Facturación Electrónica (CFE)

- Obligatoria para todos los contribuyentes IVA desde enero de 2025.
- Desde marzo 2026: DGI rechaza CFE que no cumplan especificación **v25/v25.1**.
- El proveedor emite CFE por cada factura de comisión o mínimo.
- Se requiere que Prosepac tenga RUT activo y capacidad de emisión CFE vigente.

### 5.3 Comisión MercadoPago (costo de Prosepac, no del proveedor)

| Modalidad | Comisión MP (IVA incluido) | Lo paga |
|---|---|---|
| Checkout Pro — cobro inmediato | ~7.31% del cobro | Prosepac |
| Checkout Pro — acreditacion 21 dias | ~6.09% del cobro | Prosepac |

MercadoPago descuenta su comisión directamente del cobro recibido por Prosepac en cada sesión. No afecta ni el mínimo ni la comisión acordada con el proveedor de software.

---

\newpage

## 6. Infraestructura de Producción (Administrada y Financiada por el Proveedor)

La infraestructura de producción es responsabilidad exclusiva del proveedor. El cliente no gestiona ningún proveedor cloud, no recibe facturas de terceros y no asume riesgos de costos variables. Todo está incluido en la estructura operativa del acuerdo.

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

### 7.1 Duración y Exclusividad

- Contrato de 36 meses desde la puesta en producción del MVP (go-live estimado: julio 2026).
- Exclusividad: el cliente se compromete a utilizar únicamente esta plataforma como sistema de gestión y cobro de cargas durante la vigencia del contrato.
- Renovación automática por periodos de 12 meses al mínimo de $800 USD/mes + IVA, salvo notificación escrita con 60 días de anticipación.

### 7.2 Propiedad Intelectual

- El proveedor mantiene la propiedad intelectual total del código fuente.
- El cliente recibe licencia de uso exclusiva para su operación durante la vigencia.
- Ajustes menores (menos de 8 horas) incluidos en las 10h de soporte mensual. Los desarrollos mayores se cotizan a $25 USD/h + IVA.

### 7.3 Clausula de Terminacion Anticipada

- Si el cliente termina antes del mes 36, abona el **saldo operativo pendiente**: monto equivalente a los meses restantes al mínimo de referencia vigente, descontando las comisiones netas (sin IVA) acumuladas hasta la fecha de terminación.
- Si el proveedor termina el contrato, entrega el código fuente y provee 90 días de soporte de transición sin costo.
- Fuerza mayor: ambas partes negocian de buena fe.

### 7.4 Escalabilidad

- Sin costo adicional por agregar nuevos cargadores a la plataforma.

\newpage

### 7.5 Soporte y Mantenimiento

- **10 horas mensuales de soporte** incluidas (L-V 9-18h UYT).
- Horas adicionales: $25 USD/h + IVA.
- Bugs críticos y actualizaciones de seguridad: sin costo.
- Nuevas funcionalidades fuera del roadmap acordado: se cotizan.
- Infraestructura de producción: a cargo del proveedor (ver sección 6).
- Ambas partes emiten CFE según normativa DGI vigente.

---

## 8. Beneficios para el Cliente

| Beneficio | Descripcion |
|---|---|
| Solo se paga cuando se genera tráfico | El cliente abona una comisión sobre lo que su red ya está cobrando. Si el volumen es suficiente, no existe ningún otro costo. |
| Sin inversión inicial | Sin desembolso por desarrollo ni por infraestructura. La plataforma completa — MVP y expansión v2 — está financiada por el proveedor. |
| Sin gestión de infraestructura | El proveedor administra y financia toda la infraestructura de producción. El cliente no tiene cuentas cloud, no recibe facturas de terceros y no asume costos variables. |
| Plataforma completa incluida | El MVP y la expansión v2 están incluidos en el acuerdo. No hay cotizaciones adicionales por las funcionalidades planificadas en el roadmap. |
| Alineacion total de intereses | El ingreso del proveedor crece únicamente cuando el volumen de la red crece. Ambas partes tienen el mismo incentivo. |
| Condiciones estables a largo plazo | La comisión y el mínimo de referencia son constantes durante los 36 meses — sin escaladas ni renegociaciones. Desde el mes 37 el mínimo baja a $800 USD/mes. |

---

## 9. Próximos Pasos

1. Revisión de esta propuesta y cierre de preguntas.
2. Confirmación del porcentaje de comisión y condiciones finales.
3. Firma del acuerdo comercial.
4. Inicio del desarrollo. **Go-live MVP: 07 de julio 2026** (15 semanas desde la firma).
5. Inicio del contrato de 36 meses desde la fecha de go-live.

---

## Firmas

| Por el Proveedor | Por el Cliente |
|---|---|
| _______________ | _______________ |
| Fecha: _______________ | Fecha: _______________ |
