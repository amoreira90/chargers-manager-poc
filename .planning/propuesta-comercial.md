# PROPUESTA COMERCIAL

## Plataforma de Gestion y Cobro para Cargadores de Vehiculos Electricos

**Modelo de Monetizacion:** Comision por Sesion — solo pagas cuando tu red genera trafico

**Fecha:** Marzo 2026

**Confidencial**

**Preparado por:** [Tu Empresa / Tu Nombre]
**Preparado para:** Prosepac Movilidad Electrica

---

## 1. Resumen Ejecutivo

La presente propuesta describe el desarrollo, implementacion y modelo de monetizacion de una plataforma integral de gestion y cobro para estaciones de carga de vehiculos electricos (EV). El software cubre el ciclo completo del negocio: desde que un conductor escanea un cargador hasta que el propietario recibe su liquidacion mensual.

El modelo de monetizacion se basa en **comision por sesion de carga**: sin costo inicial de desarrollo, sin cuota fija de software, sin gestion de infraestructura por parte del cliente. El proveedor financia el desarrollo completo de la plataforma — MVP y expansion v2 — y administra la infraestructura de produccion. A cambio, percibe un porcentaje sobre el valor de cada sesion procesada por la plataforma. Cuando el volumen de la red genera comisiones suficientes, el cliente no abona ningun monto adicional (*).

(*) En los periodos en que las comisiones acumuladas del mes no alcancen el minimo operativo acordado, el cliente cubre la diferencia hasta ese valor. Ver seccion 3.

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

---

## 3. Modelo Comercial

> **Propuesta de valor clave:**
> Sin inversion inicial. Sin cuota fija de software. El cliente paga unicamente una comision sobre lo que ya esta cobrando por cada sesion de carga. La plataforma completa — desarrollo, infraestructura y operacion — esta financiada por el proveedor y se recupera a traves del volumen de la red.

### 3.1 Estructura de Precios

| Concepto | Detalle |
|---|---|
| Comision por sesion | Porcentaje aplicado sobre el **valor total de la sesion calculado por el motor de precios de la plataforma**: kWh consumidos × tarifa configurada + bajada de bandera. Si la configuracion del cargador incluye multa por no desconexion al completar la carga, dicho monto tambien integra la base de comision. Si la multa es $0, no genera comision adicional. Este valor es la base de comision independientemente de si la sesion genera cobro al usuario final. Las sesiones configuradas como gratuitas ($0 para el usuario) siguen generando comision calculada sobre su valor tarifario de referencia. La diferencia la absorbe el operador. |
| Costo inicial de desarrollo | **$0 USD** — sin cobro por adelantado |
| Infraestructura y operacion | **$0 USD adicionales** — financiada y administrada por el proveedor |

(*) **Minimo mensual de referencia:** Al cierre de cada mes se acumulan todas las comisiones del periodo. Si ese total supera el minimo acordado, se factura unicamente el total de comisiones. Si no lo alcanza, el cliente abona la diferencia hasta ese valor. Ambos conceptos nunca se suman. El minimo esta disenado para operar como piso de proteccion — con el nivel de actividad de una red mediana (ver seccion 5), las comisiones lo superan con holgura.

Todos los montos son netos. Se agrega **IVA 22%** sobre cada factura emitida segun normativa DGI Uruguay.

### 3.2 Estructura del Acuerdo

| Periodo | Comision por sesion | (*) Minimo mensual |
|---|---|---|
| **Meses 1-36** | **12% IVA incluido** | $1,850 USD + IVA |
| **Mes 37+ (renovacion)** | **12% IVA incluido** | $800 USD + IVA |

La comision es del **12% sobre el valor de cada sesion, IVA incluido**, y aplica de forma uniforme durante toda la vigencia del acuerdo y sus renovaciones.

---

## 4. Calculo de la Inversion

### 4.1 Horas por Fase

**v1 — MVP (1,125 horas)**

| Fase | Sprints | Horas |
|---|---|---|
| DB + Autenticacion | Sprint 1-2 | 150h |
| Central System OCPP | Sprint 3-5 | 225h |
| Sesiones y Precios | Sprint 6-7 | 150h |
| Pagos MercadoPago + Notificaciones | Sprint 8-9 | 150h |
| Panel Admin + Panel Empresa | Sprint 10-12 | 225h |
| Deploy OCI + QA Final + Go-live | Sprint 13-15 | 225h |
| **Subtotal MVP** | **15 sprints** | **1,125h** |

**v2 — Expansion (875 horas)**

| Feature | Horas |
|---|---|
| Mapa interactivo + filtros (MAP-01 a MAP-04) | 90h |
| OCPI 2.2 roaming (EXP-04) | 150h |
| Web app (EXP-05) | 180h |
| Cargadores peer-to-peer (EXP-03) | 100h |
| Tarifas dinamicas pico/valle (EXP-02) | 50h |
| Panel Propietario completo (OWN-F2-01/02/03) | 80h |
| Onboarding autoservicio de empresas (ENT-01/02) | 40h |
| OAuth Google/Apple (AUTH-02) | 25h |
| QR code (EXP-01) | 25h |
| 500 sesiones concurrentes / load testing (INF-08) | 25h |
| Reconciliacion automatica sesiones (OCPP-10) | 30h |
| 2FA TOTP admin (AUTH-07) | 20h |
| Historial liquidaciones propietario (PAY-08) | 25h |
| Alertas tecnicas OCPP (NOTIF-04) | 15h |
| Buffer v2 (integraciones, QA) | 120h |
| **Subtotal v2** | | **875h** |

**Total: 1,125h + 875h = 2,000 horas**

### 4.2 Inversion Total

| Concepto | Detalle | Monto |
|---|---|---|
| Mano de obra | 2,000h × $25 USD/h | $50,000 |
| Infraestructura de desarrollo | Staging MVP (4 meses) + v2 (12 meses) | $1,800 |
| Infraestructura de produccion | OCI free tier + servicios auxiliares (36 meses, promedio $80/mes) | $2,880 |
| Constitucion legal + certificaciones | SAS/SRL, tramites, CFE | $900 |
| Contingencia (5%) | Riesgos de protocolo, integracion hardware, infra | $2,800 |
| **Subtotal directo** | | **$58,380** |
| Provision IRPF (persona fisica, tasa progresiva ~11% efectivo sobre renta neta) | Ver seccion 6.2 | $7,000 |
| **Total inversion** | | **$65,380 USD** |

### 4.3 Amortizacion en 36 Meses

| Calculo | Valor |
|---|---|
| Inversion total (desarrollo + infra produccion + legal + contingencia + IRPF) | $65,380 USD |
| Meses de contrato | 36 |
| Minimo mensual necesario | $65,380 / 36 = **$1,816** |
| Minimo acordado (con buffer $34/mes) | **$1,850 USD/mes** |
| Total recuperado en 36 meses | $1,850 × 36 = **$66,600 USD** |
| Buffer sobre inversion | +$1,220 USD |

> El minimo de referencia de $1,850 USD/mes es el piso operativo del acuerdo. Con el nivel de actividad proyectado para una red mediana (ver seccion 5), las comisiones lo superan en los primeros meses de operacion real.

---

## 5. Proyeccion Financiera

### 5.1 Escenarios por Valor de Sesiones (comision 12% IVA incluido)

La comision es 12% sobre el **valor tarifario calculado de todas las sesiones del mes** — incluyendo sesiones pagas y sesiones configuradas como gratuitas para el usuario.

Asumiendo valor promedio de sesion de $300 UYU (~$7 USD) calculado por la plataforma:

Asumiendo valor promedio de sesion de $300 UYU (~$7 USD) calculado por la plataforma:

| Escenario | Valor sesiones/mes | Comision 12% | Lo que abona el cliente |
|---|---|---|---|
| Red con baja actividad (*) | < $15,417 USD | < $1,850 | Minimo de $1,850 USD |
| Umbral de cobertura | $15,417 USD (~2,202 sesiones avg $7) | = $1,850 | $1,850 USD (solo comision) |
| Red activa — moderado | $30,000 USD (~143 sesiones/dia) | ~$3,600 | $3,600 USD (solo comision) |
| Red activa — optimista | $60,000 USD (~286 sesiones/dia) | ~$7,200 | $7,200 USD (solo comision) |
| Red activa — agresivo | $120,000 USD (~571 sesiones/dia) | ~$14,400 | $14,400 USD (solo comision) |

> El umbral a partir del cual el cliente paga unicamente comision es de **~2,202 sesiones/mes (~73/dia)**. Con una red de 50 cargadores eso representa 1.5 sesiones por cargador por dia — nivel de actividad muy bajo y facilmente alcanzable en los primeros meses de operacion.

### 5.2 Proyeccion de Comisiones — Escenario Moderado (36 meses)

| Periodo | Valor sesiones/mes | Comision 12% | Lo que abona el cliente |
|---|---|---|---|
| Meses 1-12 | En crecimiento | 12% | Comision o minimo segun volumen alcanzado |
| Meses 13-24 | ~$30,000 USD | ~$3,600 | $3,600 (solo comision) |
| Meses 25-36 | ~$50,000 USD | ~$6,000 | $6,000 (solo comision) |

En el escenario moderado, una vez que la red alcanza su ritmo de operacion el cliente paga exclusivamente la comision sobre el volumen real — la misma tasa del primer dia al ultimo.

---

## 6. Contexto Impositivo Uruguay

### 6.1 IVA (22%)

- Tasa basica aplicable a todos los servicios digitales y de software en Uruguay.
- La comision del 12% por sesion es **IVA incluido**: el cliente paga exactamente ese porcentaje sobre el valor de cada sesion, sin conceptos adicionales. El proveedor declara y deposita el IVA correspondiente ante DGI.
- El minimo mensual de referencia se factura como servicio separado: **$1,850 neto + $407 IVA = $2,257 USD/mes** en los casos en que aplica.

### 6.2 IRPF (Impuesto a la Renta de las Personas Fisicas)

- Aplica a personas fisicas que operan como unipersonales o prestadores independientes de servicios.
- Categoria II — Trabajo fuera de relacion de dependencia. Tasa progresiva sobre renta neta.
- **Escala 2026 (aproximada):** 0% hasta ~BPC 84/ano, luego 10%, 15%, 24%, 25%, 27%, 31%.
- **Ventaja clave respecto a IRAE:** los costos reales del negocio (desarrollo, infraestructura, legal, contingencia) son deducibles antes de calcular la base imponible. En los primeros anios del contrato, la renta neta es baja o nula — el IRPF efectivo es minimo hasta que la inversion queda amortizada.
- **Provision estimada en el calculo de inversion:** $7,000 USD sobre los 36 meses (~11% efectivo sobre renta neta proyectada acumulada, considerando que los anios 1-2 tienen alta carga de costos deducibles y el IRPF se concentra principalmente en el ano 3).
- **Accion requerida:** inscripcion como unipersonal ante DGI y BPS. Los aportes BPS obligatorios para trabajadores independientes son un costo operativo adicional a contemplar (aproximadamente $150-300 USD/mes segun nivel de ingresos declarados) — verificar con asesor contable antes del inicio del contrato.

### 6.3 Facturacion Electronica (CFE)

- Obligatoria para todos los contribuyentes IVA desde enero 2025.
- Desde marzo 2026: DGI rechaza CFE que no cumplan especificacion **v25/v25.1**.
- El proveedor emite CFE por cada factura de minimo o comision.

### 6.4 Comision MercadoPago (costo de Prosepac, no del proveedor)

| Modalidad | Comision MP (+ IVA) | Lo paga |
|---|---|---|
| Checkout Pro inmediato | ~7.31% del cobro | Prosepac |
| Checkout Pro 21 dias | ~6.09% del cobro | Prosepac |

MercadoPago descuenta su comision directamente del cobro recibido por Prosepac en cada sesion. No afecta el minimo ni la comision acordada con el proveedor de software.

---

## 7. Infraestructura de Produccion (Administrada y Financiada por el Proveedor)

La infraestructura de produccion es responsabilidad exclusiva del proveedor. El cliente no gestiona ningun proveedor cloud, no recibe facturas de terceros y no asume riesgo de costos variables. Todo esta incluido en la estructura operativa del acuerdo.

| Servicio | Proveedor | Costo Mensual (a cargo del Proveedor) |
|---|---|---|
| App server + load balancer | OCI free tier (ARM, 24GB RAM) | $0 |
| PostgreSQL 16 | OCI / AWS RDS | $50-$100 |
| Redis | OCI / AWS | $20-$40 |
| Object storage | OCI free tier (20GB) | $0-$10 |
| Firebase push notifications | Firebase | $0 |
| Email transaccional | SendGrid free tier | $0-$15 |
| Dominio .com.uy | NIC Uruguay | ~$4/mes |
| App Store fees | Google + Apple | ~$10/mes |

| Escenario operativo | Costo Mensual (Proveedor) | Como se financia |
|---|---|---|
| Inicial (OCI free tier maximizado) | $80-$130 | A cargo del proveedor |
| Produccion recomendado | $150-$250 | A cargo del proveedor |
| Alta disponibilidad | $350-$550 | A cargo del proveedor |

> Oracle Cloud Infrastructure (OCI) ofrece un free tier permanente que incluye servidor principal, load balancer y 200GB de almacenamiento. La arquitectura esta disenada para operar desde $0/mes en los primeros meses, creciendo en costo solo cuando el volumen de sesiones lo justifica — momento en que el excedente de comisiones lo cubre con holgura.

---

## 8. Costo Total para el Cliente (36 meses)

La infraestructura de produccion esta a cargo del proveedor. El cliente abona unicamente la comision sobre el volumen de sesiones de su red — sin costos adicionales de cloud ni sorpresas operativas.

| Concepto | Escenario bajo actividad (*) | Escenario red activa |
|---|---|---|
| Comisiones acumuladas 36 meses (neto) | $66,600 | $66,600-$137,400 |
| IVA (22%) | $14,652 | $14,652-$30,228 |
| **Total abonado 36 meses** | **$81,252** | **$81,252-$167,628** |

(*) En el escenario de baja actividad, el cliente cubre el minimo de referencia todos los meses. En cuanto el volumen de sesiones supera el umbral de cobertura, deja de aplicar y el cliente paga exclusivamente comision.

Comparacion con alternativas de desarrollo:

| Modelo | Desembolso ano 1 | Costo total 36 meses | Riesgo |
|---|---|---|---|
| Desarrollo clasico a precio fijo | $65,000 upfront + IVA + infra propia | ~$100,000-$120,000 | Muy alto |
| Freelancers (mercado) | $40,000-$60,000 + riesgo calidad + infra propia | ~$85,000-$125,000 | Alto |
| **Esta propuesta** | **$0 upfront. Sin gestion de infra.** | **~$81,000-$168,000** | **Bajo** |

---

## 9. Condiciones del Acuerdo

### 9.1 Duracion y Exclusividad

- Contrato de 36 meses desde la puesta en produccion del MVP (go-live estimado: julio 2026).
- Exclusividad: el cliente se compromete a utilizar unicamente esta plataforma como sistema de gestion y cobro de cargas durante la vigencia del contrato.
- Renovacion automatica por periodos de 12 meses al minimo de $800 USD/mes + IVA, salvo notificacion escrita con 60 dias de anticipacion.

### 9.2 Propiedad Intelectual

- El proveedor mantiene la propiedad intelectual total del codigo fuente.
- El cliente recibe licencia de uso exclusiva para su operacion durante la vigencia.
- Ajustes menores (menos de 8 horas) incluidos en las 10h de soporte mensual. Desarrollos mayores se cotizan a $25 USD/h + IVA.

### 9.3 Clausula de Terminacion Anticipada

- Si el cliente termina antes del mes 36, abona el **saldo operativo pendiente**: monto equivalente a los meses restantes al minimo de referencia vigente, descontando las comisiones netas (sin IVA) acumuladas hasta la fecha de terminacion.
- Si el proveedor termina el contrato, entrega el codigo fuente y provee 90 dias de soporte de transicion sin costo.
- Fuerza mayor: ambas partes negocian de buena fe.

### 9.4 Escalabilidad

- Sin costo adicional por agregar nuevos cargadores a la plataforma.
- Volumenes superiores a 5,000 cargas/mes se negocian con tarifas de comision preferenciales.

### 9.5 Soporte y Mantenimiento

- **10 horas mensuales de soporte** incluidas (L-V 9-18h UYT).
- Horas adicionales: $25 USD/h + IVA.
- Bugs criticos y actualizaciones de seguridad: sin costo.
- Nuevas funcionalidades fuera del roadmap acordado: se cotizan.
- Infraestructura de produccion: a cargo del proveedor (ver seccion 7).
- Ambas partes emiten CFE segun normativa DGI vigente.

---

## 10. Beneficios para el Cliente

| Beneficio | Descripcion |
|---|---|
| Solo se paga cuando se genera trafico | El cliente abona una comision sobre lo que su red ya esta cobrando. Si el volumen es suficiente, no existe ningun otro costo. |
| Sin inversion inicial | Sin desembolso por desarrollo ni por infraestructura. La plataforma completa — MVP y expansion v2 — esta financiada por el proveedor. |
| Sin gestion de infraestructura | El proveedor administra y financia toda la infraestructura de produccion. El cliente no tiene cuentas cloud, no recibe facturas de terceros y no asume costos variables. |
| Plataforma completa incluida | El MVP y la expansion v2 estan incluidos en el acuerdo. No hay cotizaciones adicionales por las funcionalidades planificadas en el roadmap. |
| Alineacion total de intereses | El ingreso del proveedor crece unicamente cuando el volumen de la red crece. Ambas partes tienen el mismo incentivo. |
| Condiciones estables a largo plazo | El minimo de referencia es constante durante los 36 meses — sin escaladas ni renegociaciones. Desde el mes 37 baja a $800 USD/mes. |

---

## 11. Proximos Pasos

1. Revision de esta propuesta y cierre de preguntas.
2. Confirmacion del porcentaje exacto de comision por fase.
3. Consulta con asesor tributario: exoneracion IRAE (Ley 19.637), estructura societaria, CFE.
4. Firma del acuerdo comercial.
5. Inicio del desarrollo. **Go-live MVP: 07 de julio 2026** (15 semanas).
6. Inicio del contrato de 36 meses desde la fecha de go-live.

---

## Firmas

| Por el Proveedor | Por el Cliente |
|---|---|
| [Nombre y Cargo] | [Nombre y Cargo] |
| Fecha: _______________ | Fecha: _______________ |
