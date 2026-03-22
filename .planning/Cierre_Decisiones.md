# Cierre de decisiones
**Reunión de definición con cliente — Marzo 2026**

---

## 💳 Pagos y facturación

### 1. ¿En qué moneda se cobra al usuario final? 🔴
> ¿Pesos uruguayos o dólares? Si es pesos: ¿tienen RUT activo y van a emitir facturas electrónicas (DGI)?

**Respuesta:** En pesos uruguayos. Se arranca con MercadoPago; billeteras virtuales quedan como next steps. Se habilita un modo sin pago. Prosepac cobra un porcentaje y/o monto mínimo fijo por el uso de la plataforma.

---

### 2. ¿Cómo se liquida al propietario del cargador? 🔴
> ¿Recibe el dinero automáticamente por cada sesión, o se acumula y liquida a fin de mes?

**Respuesta:** Liquidación mensual por cliente — una vez por mes.

---

### 3. ¿Cuál es el monto mínimo fijo y el porcentaje de comisión? 🔴
> Ya acordamos que hay un mínimo fijo + un % fijo. Falta definir los números concretos y si existe un tope máximo por transacción.

**Respuesta:** Configurable por cliente. Pueden existir combinaciones de monto mínimo, monto máximo y porcentaje por transacción. Prosepac elige la configuración de costo fijo y forma de cobro para cada empresa según lo acordado.

---

## ⚡ Sesiones de carga

### 4. ¿Qué parámetros aplican cuando el auto termina de cargar pero el conductor no retira la manguera? 🔴
> Necesitamos definir: tiempo de gracia, monto de la multa, a quién va ese dinero, y si el sistema desbloquea la manguera automáticamente.

**Respuesta:** El tiempo de gracia es configurable por cliente. Vencido el tiempo de gracia, comienza a correr una multa por minuto (monto a definir). La distribución del dinero de la multa sigue la misma lógica que el resto de los costos: se divide según la configuración de cada cliente. La manguera **no se desconecta automáticamente**.

---

### 5. ¿Cómo ve el usuario el precio antes de iniciar la sesión? 🔴
> Sin conocer el % de batería no se puede estimar el total exacto. Opciones: mostrar "bajada de bandera + $X por kWh", o pedirle al usuario los kWh que quiere cargar.

**Respuesta:** Depende del tipo de corriente:
- **Corriente alterna:** el costo total nunca se puede saber de antemano.
- **Corriente continua:** el costo se conoce solo al momento de la conexión.

En ambos casos se muestra: **costo de bajada de bandera + costo por tipo horario + comisión de Prosepac**.

**Comportamiento ante caída de conexión:**
- **V1:** si la carga se interrumpe por una falla, se inicia un nuevo proceso de carga (igual que la competencia).
- **V2 (fase 2):** se implementará reconexión automática sin nueva bajada de bandera.

---

## 🏢 Roles y acceso

### 6. ¿Existe el rol de "administrador de cartera de edificios"? 🟠
> ¿Hay alguien que gestiona varios edificios/propietarios y necesita verlos todos juntos, mientras cada propietario solo ve el suyo?

**Respuesta:** Se definen cuatro roles:

| Rol | Descripción |
|---|---|
| **Admin** | Prosepac — acceso total a la plataforma |
| **Veedor** | Grupo económico — visibilidad agregada de múltiples empresas |
| **Empresa** | Owners de cargadores — ven únicamente sus propios cargadores |
| **User** | Usuario final del sistema |

---

## 🔧 Gestión de cargadores

### 7. ¿Cómo se define el precio de un cargador? 🟠
> ¿El propietario lo propone y Prosepac aprueba, o Prosepac lo define directamente? ¿Puede el propietario solicitar un cambio después?

**Respuesta:** El precio es configurable por el Admin (Prosepac), acordado previamente con la empresa propietaria de los cargadores.

---

## 🖥️ Panel Admin

### 8. ¿Qué reportes necesitás exportar y en qué formato? 🟡
> Por ejemplo: sesiones por cargador, ingresos por empresa, sesiones por rango de fechas. ¿CSV, Excel?

**Respuesta:** Para el MVP, la reportería inicial debe mostrar el **consumo total por cada nivel de usuario**, con el objetivo de poder cobrar y distribuir costos y ganancias correctamente entre Admin, Veedor, Empresa y Usuario. Cada registro debe estar asociado al **momento de la carga**, ya que pueden existir diferentes franjas horarias de cobro que afectan el precio aplicado. Exportación disponible en **CSV y Excel**.

---

## 📱 Plataforma y marca

### 9. ¿Cuál es el nombre final de la plataforma? 🟡
> En los documentos aparece CARGÁ, Cargapp y PlugUY. Necesitamos uno solo para el MVP.

> ⚠️ **Sin respuesta registrada.** Pendiente de definición.

---

## 🔌 Hardware y protocolo

### 10. ¿Los cargadores físicos hablan OCPP 1.6J (JSON/WebSocket) o 1.6S (SOAP)? 🔴
> Necesitamos confirmarlo antes de arrancar la integración. ¿Pueden compartir el manual o ficha técnica del modelo de cargador?

**Respuesta:** Los cargadores se comunican vía **WebSocket (OCPP 1.6J)**. El servidor OCPP lo construye el equipo de desarrollo.

> ⚠️ **Pendiente:** compartir manual o ficha técnica del modelo de cargador.

---

## 📋 Resumen de pendientes

| # | Tema | Estado |
|---|---|---|
| 1 | Moneda y facturación electrónica (DGI/RUT) | ✅ Respondida parcialmente |
| 2 | Liquidación mensual | ✅ Definida |
| 3 | Comisiones y montos | ✅ Definida (configurable) |
| 4 | Multa por no retiro de manguera | ✅ Definida |
| 5 | Reconexión sin bajada de bandera — V1: nuevo proceso / V2: automático | ✅ Definida |
| 6 | Roles de acceso | ✅ Definida |
| 7 | Definición de precio por cargador | ✅ Definida |
| 8 | Reportería MVP — consumo por nivel de usuario, franjas horarias, CSV y Excel | ✅ Definida |
| 9 | Nombre final de la plataforma | 🔲 Sin respuesta |
| 10 | Protocolo OCPP — WebSocket confirmado, ficha técnica pendiente | ⚠️ Parcial |
