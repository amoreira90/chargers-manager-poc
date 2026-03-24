# PROPUESTA COMERCIAL

## Plataforma de Gestion y Cobro para Cargadores de Vehiculos Electricos

**Modelo de Monetizacion:** Comision por Transaccion + Minimo Mensual Constante

**Fecha:** Marzo 2026

**Confidencial**

**Preparado por:** [Tu Empresa / Tu Nombre]
**Preparado para:** [Nombre del Cliente]

---

## 1. Resumen Ejecutivo

La presente propuesta describe el desarrollo, implementacion y modelo de monetizacion de una plataforma integral de gestion y cobro para estaciones de carga de vehiculos electricos (EV). El software cubre el ciclo completo del negocio: desde que un conductor escanea un cargador hasta que el propietario recibe su liquidacion mensual.

Proponemos un modelo sin costo inicial: nosotros invertimos el desarrollo completo de la plataforma — MVP y expansion v2 — y lo recuperamos mediante un minimo mensual fijo de **$2,750 USD** durante 24 meses, distribuido de forma constante e igualitaria. Al finalizar el contrato, el minimo baja a **$800 USD/mes** para cubrir unicamente costos operativos. Cualquier comision por volumen de cargas que supere esos valores es ganancia directa.

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
> Cero inversion inicial. Desarrollamos el MVP y la expansion v2 completos. El minimo mensual es fijo e igual durante los 24 meses — sin escaladas ni sorpresas. Al mes 25, el minimo baja a $800 USD para solo cubrir operacion.

### 3.1 Estructura de Precios

| Concepto | Detalle |
|---|---|
| Comision por transaccion | Porcentaje sobre el valor de cada carga procesada |
| Minimo mensual garantizado | Monto fijo mensual. Si las comisiones del mes lo superan, se cobra solo el total de comisiones. Si no lo alcanzan, el cliente paga la diferencia hasta el minimo. Nunca se suman ambos. |
| Costo inicial de desarrollo | **$0 USD** — sin cobro por adelantado |

Todos los montos son netos. Se agrega **IVA 22%** sobre cada factura emitida segun normativa DGI Uruguay.

### 3.2 Estructura del Acuerdo

| Periodo | Comision | Minimo Mensual (neto) | Minimo c/ IVA 22% | Proposito |
|---|---|---|---|---|
| **Meses 1-12** | 10% | **$2,750 USD** | $3,355 USD | Amortizacion MVP + inicio v2 |
| **Meses 13-24** | 12% | **$2,750 USD** | $3,355 USD | Amortizacion v2 + operacion |
| **Mes 25+ (renovacion)** | 15% | **$800 USD** | $976 USD | Solo costos operativos |

El minimo es **identico en todos los meses del contrato**: $2,750 USD + IVA. No hay escalonamiento ni aceleracion. La inversion queda completamente amortizada al finalizar el mes 24.

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
| Constitucion legal + certificaciones | SAS/SRL, tramites, CFE | $900 |
| Contingencia (5%) | Riesgos de protocolo, integracion hardware | $2,500 |
| **Subtotal directo** | | **$55,200** |
| Provision IRAE sin exoneracion (~15% efectivo) | Ver seccion 5 | $9,800 |
| **Total inversion** | | **$65,000 USD** |

### 4.3 Amortizacion en 24 Meses

| Calculo | Valor |
|---|---|
| Inversion total | $65,000 USD |
| Meses de contrato | 24 |
| Minimo mensual necesario | $65,000 / 24 = **$2,708** |
| Minimo acordado (con buffer $42/mes) | **$2,750 USD/mes** |
| Total recuperado en 24 meses | $2,750 × 24 = **$66,000 USD** |
| Buffer sobre inversion | +$1,000 USD |

> El minimo de $2,750 USD/mes cubre exactamente la amortizacion de la inversion total en 24 meses, con un buffer de $1,000 USD. Sin variaciones, sin escaladas.

---

## 5. Proyeccion Financiera

### 5.1 Recuperacion Garantizada (solo con minimos)

| Periodo | Minimo/Mes | Ingreso Periodo | Acumulado | Estado |
|---|---|---|---|---|
| Meses 1-6 | $2,750 | $16,500 | $16,500 | Amortizacion |
| Meses 7-12 | $2,750 | $16,500 | $33,000 | Amortizacion |
| Meses 13-18 | $2,750 | $16,500 | $49,500 | Amortizacion |
| Meses 19-24 | $2,750 | $16,500 | $66,000 | Amortizacion |

> **Inversion recuperada: Mes 24.** Exacto. Sin riesgo de shortfall.

### 5.2 Escenarios con Volumen de Cargas (mes 13+, comision 12%)

Precio promedio de carga: $300 UYU (~$7 USD). Comision 12% = ~$0.84 USD por carga.

| Escenario | Cargas/Mes | Comision/Mes | vs Minimo $2,750 | Ingreso Real |
|---|---|---|---|---|
| Solo minimo | < 327 cargas | < $2,750 | Paga minimo | $2,750 |
| Punto de umbral | 327 cargas (~11/dia) | = $2,750 | Igual al minimo | $2,750 |
| Moderado | 600 cargas (~20/dia) | ~$5,040 | +$2,290 | $5,040 |
| Optimista | 1,200 cargas (~40/dia) | ~$10,080 | +$7,330 | $10,080 |
| Agresivo | 2,500 cargas (~83/dia) | ~$21,000 | +$18,250 | $21,000 |

### 5.3 Proyeccion 24 Meses — Escenario Moderado

| Periodo | Ingreso/Mes | Subtotal | Acumulado |
|---|---|---|---|
| Meses 1-12 (10%, ~400 cargas/mes) | $2,750 (minimo) | $33,000 | $33,000 |
| Meses 13-18 (12%, ~600 cargas/mes) | $5,040 | $30,240 | $63,240 |
| Meses 19-24 (12%, ~800 cargas/mes) | $6,720 | $40,320 | $103,560 |

En el escenario moderado, el ingreso total a 24 meses es **$103,560 USD** — un retorno del **59% sobre la inversion** una vez recuperados los $65,000.

---

## 6. Contexto Impositivo Uruguay

### 6.1 IVA (22%)

- Tasa basica aplicable a todos los servicios digitales y de software en Uruguay.
- El IVA lo paga el cliente adicional al minimo acordado. No afecta nuestro ingreso neto — se declara y deposita en DGI.
- **Factura real del cliente:** $2,750 neto + $605 IVA = **$3,355 USD/mes total**.

### 6.2 IRAE (25%) y Exoneracion para Software

- Tasa nominal: 25% sobre renta neta.
- **Exoneracion total disponible (Ley 19.637):** empresas constituidas como SAS, SRL o SAU en Uruguay pueden quedar exoneradas de IRAE si mas del 50% de sus costos directos se incurren en territorio nacional.
- **Sin exoneracion:** provision de ~$9,800 incluida en el calculo de inversion (ya contemplada en los $65,000).
- **Con exoneracion:** esos $9,800 se convierten en margen adicional. Accion requerida: constituir SAS/SRL antes del primer ejercicio fiscal activo.

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

## 7. Costos de Infraestructura (a cargo del cliente)

| Servicio | Proveedor recomendado | Costo Mensual |
|---|---|---|
| App server + load balancer | OCI free tier (ARM, 24GB RAM) | **$0** |
| PostgreSQL 16 | OCI / AWS RDS | $50-$100 |
| Redis | OCI / AWS | $20-$40 |
| Object storage | OCI free tier (20GB) | **$0-$10** |
| Firebase push notifications | Firebase | **$0** |
| Email transaccional | SendGrid free tier | **$0-$15** |
| Dominio .com.uy | NIC Uruguay | ~$4/mes |
| App Store fees | Google + Apple | ~$10/mes |

| Escenario | Costo Mensual | Costo Anual |
|---|---|---|
| Minimo (OCI free tier maximizado) | **$80-$130** | $960-$1,560 |
| Produccion recomendado | **$150-$250** | $1,800-$3,000 |
| Alta disponibilidad | **$350-$550** | $4,200-$6,600 |

> Oracle Cloud Infrastructure (OCI) ofrece un free tier permanente que incluye servidor principal, load balancer y 200GB de almacenamiento. Arquitectura disenada para maximizar este beneficio desde el dia 1.

---

## 8. Costo Total para el Cliente (24 meses)

| Concepto | Minimo | Moderado |
|---|---|---|
| Minimos garantizados (neto) | $66,000 | $66,000-$103,560 |
| IVA sobre minimos/comisiones (22%) | $14,520 | $14,520-$22,783 |
| Infraestructura cloud (24 meses) | $1,920 | $3,600 |
| **Total 24 meses** | **~$82,440** | **~$84,120-$129,943** |

Comparacion:

| Modelo | Desembolso ano 1 | Costo total 24 meses | Riesgo |
|---|---|---|---|
| Desarrollo clasico a precio fijo | $65,000 upfront + IVA | ~$95,000-$110,000 | Muy alto |
| Freelancers (mercado) | $40,000-$60,000 + riesgo calidad | ~$80,000-$120,000 | Alto |
| **Esta propuesta** | **$0 upfront** | **~$82,000-$130,000** | **Bajo** |

---

## 9. Condiciones del Acuerdo

### 9.1 Duracion y Exclusividad

- Contrato de 24 meses desde la puesta en produccion del MVP (go-live estimado: julio 2026).
- Exclusividad: el cliente se compromete a utilizar unicamente esta plataforma como sistema de gestion y cobro de cargas durante la vigencia del contrato.
- Renovacion automatica por periodos de 12 meses al minimo de $800 USD/mes + IVA, salvo notificacion escrita con 60 dias de anticipacion.

### 9.2 Propiedad Intelectual

- El proveedor mantiene la propiedad intelectual total del codigo fuente.
- El cliente recibe licencia de uso exclusiva para su operacion durante la vigencia.
- Ajustes menores (menos de 8 horas) incluidos en las 10h de soporte mensual. Desarrollos mayores se cotizan a $25 USD/h + IVA.

### 9.3 Clausula de Terminacion Anticipada

- Si el cliente termina antes del mes 24, paga el **saldo pendiente de amortizacion**: $65,000 menos el total de comisiones netas (sin IVA) acumuladas hasta la fecha.
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
- Infraestructura de produccion: a cargo del cliente (ver seccion 7).
- Ambas partes emiten CFE segun normativa DGI vigente.

---

## 10. Beneficios para el Cliente

| Beneficio | Descripcion |
|---|---|
| Cero inversion inicial | Sin desembolso de $65,000 USD por adelantado. |
| Minimo fijo, sin sorpresas | $2,750 USD/mes constante durante 24 meses. Sin escaladas ni renegociaciones. |
| MVP + expansion incluidos | La plataforma completa (v1 + v2) esta incluida en el acuerdo. No hay cotizaciones adicionales por las features planificadas. |
| Minimo post-contrato bajo | Desde el mes 25, el minimo baja a $800 USD/mes — unicamente costos operativos. |
| Infraestructura optimizada | Arquitectura para OCI free tier: servidor principal, load balancer y storage pueden ser $0/mes. |
| Alineacion de intereses | Nuestro ingreso crece solo cuando el volumen de cargas crece. |

---

## 11. Proximos Pasos

1. Revision de esta propuesta y cierre de preguntas.
2. Confirmacion del porcentaje exacto de comision por fase.
3. Consulta con asesor tributario: exoneracion IRAE (Ley 19.637), estructura societaria, CFE.
4. Firma del acuerdo comercial.
5. Inicio del desarrollo. **Go-live MVP: 07 de julio 2026** (15 semanas).
6. Inicio del contrato de 24 meses desde la fecha de go-live.

---

## Firmas

| Por el Proveedor | Por el Cliente |
|---|---|
| [Nombre y Cargo] | [Nombre y Cargo] |
| Fecha: _______________ | Fecha: _______________ |
