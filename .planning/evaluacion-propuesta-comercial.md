# Evaluacion de la Propuesta Comercial v2

**Fecha:** Marzo 2026
**Precio/hora base:** $25 USD
**Fuentes:** ROADMAP-MVP.md, ROADMAP.md, REQUIREMENTS.md, propuesta-comercial.md

---

## 1. Costo Real de Desarrollo

| Dato | Valor |
|---|---|
| Equipo | 3 Senior Software Engineers |
| Horas totales | 1,125h (15 semanas x 75h/semana) |
| Costo desarrollo ($25/h) | $28,125 USD |
| Soporte 24 meses (10h/mes x $25) | $6,000 USD |
| Gestion + contingencia | $5,875 USD |
| **Total a recuperar** | **$40,000 USD** |

---

## 2. Recuperacion en 24 Meses — Validacion

### Solo con minimos garantizados (peor caso)

| Fase | Meses | Minimo/Mes | Subtotal |
|---|---|---|---|
| Adopcion (1-6) | 6 | $1,200 | $7,200 |
| Crecimiento (7-12) | 6 | $1,500 | $9,000 |
| Madurez (13-24) | 12 | $2,000 | $24,000 |
| **Total** | **24** | | **$40,200** |

**Resultado:** Recuperacion completa en mes 24 incluso si las comisiones nunca superan el minimo. Margen de $200 USD como buffer.

### Con volumen moderado (500 cargas/mes desde mes 7)

| Periodo | Ingreso/Mes | Subtotal | Acumulado |
|---|---|---|---|
| Meses 1-6 | $1,200 (minimo) | $7,200 | $7,200 |
| Meses 7-12 | $2,000 | $12,000 | $19,200 |
| Meses 13-18 | $3,000 | $18,000 | $37,200 |
| Meses 19-24 | $4,000 | $24,000 | $61,200 |

**Resultado:** Recuperacion en mes ~20. Ganancia neta meses 21-24: ~$12,000 USD.

---

## 3. Carga Impositiva Uruguay

### Impuestos del proveedor (nosotros)

| Impuesto | Tasa | Sobre que aplica | Impacto real |
|---|---|---|---|
| **IVA** | 22% | Comisiones facturadas | Se traslada al cliente — no es costo nuestro |
| **IRAE** | 25% | Renta neta | **Exonerable** bajo Ley 19.637 si somos SAS/SRL con >50% costos en UY |
| **CFE** | — | Toda factura | Obligatorio, costo de implementacion ~$20-50/mes |

**Con exoneracion IRAE (Ley 19.637):** La carga fiscal efectiva sobre nuestro ingreso es **~0-5%** (solo costos de CFE y contabilidad). Sin exoneracion: **~15-20%** efectivo sobre renta neta.

### Impuestos del cliente (Prosepac)

| Impuesto | Tasa | Sobre que aplica |
|---|---|---|
| IVA cobrado al usuario | 22% | Precio de cada carga |
| IVA pagado a nosotros (credito fiscal) | 22% | Comisiones — es deducible |
| IRAE | 25% | Ganancia neta del negocio |

### Comisiones MercadoPago Uruguay

| Modalidad | Comision | Notas |
|---|---|---|
| Checkout Pro — inmediato | 5.99% + IVA (~7.31%) | La paga Prosepac |
| Checkout Pro — 21 dias | 4.99% + IVA (~6.09%) | Mejor margen, demora cobro |

---

## 4. Margen Neto Real por Transaccion

### Ejemplo: carga de $300 UYU, comision 12%, con exoneracion IRAE

| Concepto | Monto |
|---|---|
| Comision bruta | $36 UYU |
| IVA (lo paga el cliente) | +$7.92 UYU |
| Facturamos al cliente | $43.92 UYU |
| Nuestro ingreso neto | **$36 UYU** |
| IRAE | **$0** (exonerado) |
| Costos operativos (CFE, contabilidad) | ~$1-2 UYU por transaccion |
| **Margen neto real** | **~$34-35 UYU (~94%)** |

### Sin exoneracion IRAE

| Concepto | Monto |
|---|---|
| Comision bruta | $36 UYU |
| Gastos deducibles (~40%) | -$14.40 UYU |
| Base imponible IRAE | $21.60 UYU |
| IRAE (25%) | -$5.40 UYU |
| **Margen neto real** | **~$30.60 UYU (~85%)** |

---

## 5. Impacto Fiscal en la Recuperacion

| Escenario | Ingreso bruto 24 meses | IRAE | Neto real |
|---|---|---|---|
| Peor caso (solo minimos) + sin exoneracion | $40,200 | ~$6,000 | $34,200 |
| Peor caso (solo minimos) + con exoneracion | $40,200 | $0 | $40,200 |
| Moderado + sin exoneracion | $61,200 | ~$9,000 | $52,200 |
| Moderado + con exoneracion | $61,200 | $0 | $61,200 |

> **Conclusion critica:** Sin exoneracion IRAE, en el peor caso (solo minimos) NO recuperamos la inversion completa ($34,200 vs $40,000). La exoneracion IRAE es **imprescindible** para que los numeros cierren en el escenario pesimista.

---

## 6. Acciones Requeridas — Impositivo

| Prioridad | Accion | Responsable |
|---|---|---|
| **CRITICA** | Constituir SAS o SRL uruguaya (no unipersonal) | Proveedor |
| **CRITICA** | Tramitar exoneracion IRAE bajo Ley 19.637 | Proveedor + contador |
| **ALTA** | Implementar facturacion electronica CFE v25/v25.1 | Proveedor |
| **ALTA** | Confirmar que Prosepac tiene RUT activo y emite CFE | Cliente |
| **MEDIA** | Evaluar regimen de promocion de inversiones (Decreto 329/025) | Proveedor + contador |
| **BAJA** | Evaluar zona franca si se expande a clientes internacionales | Proveedor (futuro) |

---

## 7. Cambios Clave vs Propuesta v1

| Aspecto | v1 (original) | v2 (ajustada) |
|---|---|---|
| Minimo fase Adopcion | $600/mes | **$1,200/mes** |
| Minimo fase Crecimiento | $1,000/mes | **$1,500/mes** |
| Minimo fase Madurez | $1,200/mes | **$2,000/mes** |
| Total garantizado 24 meses | $24,000 | **$40,200** |
| Recuperacion peor caso | Mes 33+ | **Mes 24** |
| IVA mencionado | No | **Si, explicito** |
| IRAE analizado | No | **Si, con exoneracion** |
| Comision MP detallada | No | **Si (5.99% + IVA)** |
| Soporte definido | "Incluido" (abierto) | **10h/mes, excedente a $25/h** |
| Personalizaciones | "Parte de la plataforma" | **<8h incluido, >8h se cotiza** |
| Infra estimada | No | **$80-$600/mes segun escenario** |

---

*Evaluacion actualizada: 2026-03-24*
