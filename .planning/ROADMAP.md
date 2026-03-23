# Roadmap: Prosepac — Plataforma EVSE

## Descripción General

Partiendo del chargers-manager-poc como base, este roadmap evoluciona el codebase hacia una plataforma de gestión de cargadores de vehículos eléctricos lista para producción. El trabajo se divide en siete fases naturales dictadas por dependencias de datos estrictas: las decisiones deben cerrarse antes de escribir código, la base de datos debe existir antes de que OCPP pueda conectarse, OCPP debe ser confiable antes de rastrear sesiones, las sesiones deben ser estables antes de capturar pagos, y la infraestructura operacional (notificaciones, admin, panel de propietario) se construye sobre un núcleo probado. El camino crítico es Fase 0 → 1 → 2 → 3 → 4; las Fases 5 y 6 pueden comenzar una vez que la Fase 3 esté completa.

## Fases

**Numeración de fases:**
- Fases enteras (0, 1, 2, 3...): Trabajo planificado del milestone
- Fases decimales (2.1, 2.2): Inserciones urgentes (marcadas como INSERTADA)

Las fases decimales aparecen entre sus enteros circundantes en orden numérico.

- [ ] **Fase 0: Cierre de Decisiones** - Cerrar las 13 decisiones de negocio abiertas antes de escribir código
- [ ] **Fase 1: Base de Datos y Autenticación** - Migración a PostgreSQL, auth, roles, registro de cargadores, modelo de tarifas
- [ ] **Fase 2: Central System OCPP** - Comunicación OCPP 1.6J bidireccional con cargadores físicos
- [ ] **Fase 3: Ciclo de Vida de Sesiones y Precios** - Máquina de estados completa de sesión de carga con facturación en tiempo real
- [ ] **Fase 4: Integración de Pagos** - Captura automática de pago, distribución de fondos, comprobantes
- [ ] **Fase 5: Notificaciones y Resiliencia Offline** - Push notifications y recuperación ante pérdida de conectividad
- [ ] **Fase 6: Panel Admin, Panel Propietario y Observabilidad** - Visibilidad operacional y superficies de control

## Detalle de Fases

### Fase 0: Cierre de Decisiones
**Objetivo**: Todas las decisiones de negocio bloqueantes están documentadas con respuesta aprobada por el propietario del producto, para que la implementación de la Fase 1 pueda avanzar sin retrabajo
**Depende de**: Nada (pre-desarrollo)
**Requisitos**: DEC-01, DEC-02, DEC-03, DEC-04, DEC-05, DEC-06, DEC-07, DEC-08, DEC-09, DEC-10, DEC-11, DEC-12, DEC-13
**Criterios de éxito** (qué debe ser VERDAD):
  1. El proveedor de pagos está seleccionado (Stripe o MercadoPago) y la disponibilidad de su API Marketplace de pagos divididos para Uruguay está confirmada por escrito
  2. La moneda de operación está definida, con las implicancias fiscales (IVA, e-factura DGI) documentadas
  3. El modelo de comisión (mínimo + porcentaje + tope) y la cadencia de liquidación (por transacción o mensual) están decididos y documentados
  4. Los parámetros de sesión abierta / manguera trabada están definidos: duración del período de gracia, monto de la multa, secuencia de notificaciones y trigger de RemoteStop automático
  5. La especificación del panel admin, el alcance MVP del panel de propietario, la jerarquía de roles (incluida la decisión del "admin de cartera intermedio") y el nombre de la plataforma están todos resueltos y documentados en las Decisiones Clave del PROJECT.md
**Planes**: A definir

### Fase 1: Base de Datos y Autenticación
**Objetivo**: Los usuarios pueden autenticarse con identidades seguras, los admins pueden registrar cargadores con precios, y todos los datos persisten durablemente en PostgreSQL con una línea base de migración Flyway
**Depende de**: Fase 0
**Requisitos**: INF-01, INF-02, AUTH-01, AUTH-03, AUTH-04, AUTH-06, AUTH-08, CHRG-01, CHRG-02, CHRG-04, CHRG-05
**Criterios de éxito** (qué debe ser VERDAD):
  1. El usuario puede registrarse con email/contraseña e iniciar sesión; la sesión persiste entre reinicios de la app mediante JWT
  2. El usuario puede recuperar una contraseña olvidada mediante enlace de email
  3. El sistema aplica controles de acceso basados en roles (Admin, Veedor, Empresa, Usuario) y el admin puede gestionar cuentas de usuario
  4. El admin puede registrar un cargador con todos los campos requeridos (ubicación, tipo de conector, potencia, ID OCPP, tarifa) y el cargador aparece en el sistema con el estado correcto
  5. La aplicación arranca correctamente contra PostgreSQL con esquema base Flyway; H2 está eliminado; Redis está corriendo y conectado
**Planes**: A definir

### Fase 2: Central System OCPP
**Objetivo**: Los cargadores físicos pueden conectarse al backend vía WSS/OCPP 1.6J, el backend procesa correctamente todos los mensajes OCPP requeridos, y las actualizaciones de estado del cargador son visibles en el sistema en menos de 5 segundos
**Depende de**: Fase 1
**Requisitos**: OCPP-01, OCPP-02, OCPP-03, OCPP-04, OCPP-05, OCPP-06, OCPP-07, OCPP-08, OCPP-09, INF-03, INF-04
**Criterios de éxito** (qué debe ser VERDAD):
  1. Un simulador de cargador (o cargador físico) se conecta exitosamente vía WSS, completa el handshake BootNotification y su registro persiste en la base de datos
  2. Los cambios de estado del cargador (Disponible, Cargando, Fallo, No disponible) se reflejan en el sistema dentro de los 5 segundos de recibir el StatusNotification
  3. El backend puede enviar RemoteStartTransaction y RemoteStopTransaction a un cargador conectado y recibe la confirmación correspondiente
  4. Cuando un cargador se reconecta tras una desconexión, el transactionId, connectorId y meterStart de cualquier sesión abierta se recuperan de la base de datos sin pérdida de datos
  5. Toda la comunicación WebSocket OCPP usa WSS (TLS 1.2+) y los cargadores se autentican vía OCPP Basic Auth antes de procesar cualquier mensaje
**Planes**: A definir

### Fase 3: Ciclo de Vida de Sesiones y Precios
**Objetivo**: Un usuario puede iniciar, monitorear y detener una sesión de carga desde la app, el backend rastrea el consumo de energía desde los MeterValues OCPP, y el costo final se calcula en el servidor a partir de meterStart/meterStop
**Depende de**: Fase 2
**Requisitos**: SESS-01, SESS-02, SESS-03, SESS-04, SESS-05, SESS-06, PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05, PRICE-06
**Criterios de éxito** (qué debe ser VERDAD):
  1. El usuario selecciona un cargador disponible en la app, inicia una sesión y el cargador comienza a suministrar energía; la app muestra kWh, duración y costo estimado en tiempo real en segundos
  2. El usuario puede detener la sesión desde la app en cualquier momento; la sesión solo cierra después de recibir StopTransaction.req del cargador y persistir el monto final de energía
  3. Una sesión que pierde conectividad entra en estado SUSPENDIDA; al reconectarse el sistema reconcilia desde los últimos MeterValues conocidos y produce un costo final sin intervención manual
  4. Un cargador configurado con tarifa $0 completa una sesión sin crear ninguna transacción de pago
  5. Cuando un vehículo permanece conectado después de completar la carga, el sistema detecta la condición de inactividad, envía una push notification al usuario y dispara RemoteStop después del período de gracia configurado
**Planes**: A definir

### Fase 4: Integración de Pagos
**Objetivo**: Cada sesión paga completada carga automáticamente el método de pago guardado del usuario, distribuye los fondos entre plataforma y propietario, y entrega un comprobante de pago; los pagos fallidos se reintentan sin pérdida de datos
**Depende de**: Fase 3
**Requisitos**: PAY-01, PAY-02, PAY-03, PAY-05, PAY-06, PAY-07
**Criterios de éxito** (qué debe ser VERDAD):
  1. El usuario puede registrar un método de pago antes de su primera sesión paga; el método se almacena de forma segura vía el proveedor de pagos (no en servidores de la plataforma)
  2. Después de que finaliza una sesión (StopTransaction.req confirmado), el usuario es cobrado automáticamente por el monto exacto de kWh; el cobro nunca ocurre antes de recibir StopTransaction.req
  3. Los fondos se dividen automáticamente entre la plataforma y el propietario del cargador según el modelo de comisión configurado; el propietario puede ver sus ganancias
  4. El usuario recibe un comprobante de pago por email y en la app inmediatamente después del cobro exitoso
  5. Si un pago falla o un webhook se retrasa, el sistema reintenta de forma idempotente y no cobra dos veces; el admin puede emitir reembolsos parciales o totales
**Planes**: A definir

### Fase 5: Notificaciones y Resiliencia Offline
**Objetivo**: Los usuarios y admins reciben push notifications oportunas para todos los eventos críticos de sesión y sistema, y la app mobile se recupera graciosamente cuando el usuario pierde y recupera conectividad durante una sesión activa
**Depende de**: Fase 3
**Requisitos**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05, INF-05, INF-06
**Criterios de éxito** (qué debe ser VERDAD):
  1. El usuario recibe una push notification cuando su sesión de carga finaliza (dentro de los 30 segundos del evento de cierre)
  2. El usuario recibe una push notification y email cuando se cobra un pago a su cuenta
  3. El admin recibe una push notification de alerta cuando un cargador se desconecta (timeout de Heartbeat) y cuando OCPP reporta un fallo técnico
  4. El usuario recibe una push notification de advertencia cuando su vehículo está inactivo (manguera trabada) y una notificación de seguimiento si se dispara el RemoteStop
  5. Cuando un usuario pierde conectividad mobile durante una sesión y reabre la app, la pantalla de sesión se restaura con el estado actual sin requerir actualización manual
**Planes**: A definir

### Fase 6: Panel Admin, Panel Propietario y Observabilidad
**Objetivo**: Los admins pueden monitorear y controlar toda la plataforma desde un panel dedicado con estado de cargadores en tiempo real y dashboards de KPIs; los propietarios de cargadores pueden ver sus cargadores y ganancias; la salud del sistema es visible mediante logs estructurados y health checks
**Depende de**: Fase 4, Fase 5
**Requisitos**: ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06, ADM-07, ADM-08, OWN-01, OWN-02, INF-07, INF-08
**Criterios de éxito** (qué debe ser VERDAD):
  1. El admin puede ver el estado en tiempo real de todos los cargadores (online/offline, disponible/cargando/fallo) y KPIs (sesiones activas, ingresos del día/mes, tasa de disponibilidad de cargadores) desde el panel admin
  2. El admin puede bloquear o desbloquear cualquier cargador (vía ChangeAvailability), suspender o eliminar cualquier cuenta de usuario, y configurar planes de distribución de fondos desde el panel
  3. El admin puede exportar reportes de sesiones e ingresos como CSV con filtros, ver logs del sistema filtrados por ID de cargador, y ver el detalle de cualquier sesión individual
  4. Las operaciones críticas sobre cuentas admin son auditadas en log
  5. El propietario de cargador puede iniciar sesión y ver el estado actual de sus cargadores y el historial de sesiones y ganancias en sus cargadores
**Planes**: A definir

## Progreso

**Orden de ejecución:**
Las fases se ejecutan en orden numérico: 0 → 1 → 2 → 3 → 4 → 5 → 6
Las Fases 5 y 6 pueden comenzar una vez que la Fase 3 esté completa (la Fase 4 NO es un requisito previo para la Fase 5).

| Fase | Planes completados | Estado | Completada |
|------|--------------------|--------|------------|
| 0. Cierre de Decisiones | 0/TBD | No iniciada | - |
| 1. Base de Datos y Autenticación | 0/TBD | No iniciada | - |
| 2. Central System OCPP | 0/TBD | No iniciada | - |
| 3. Ciclo de Vida de Sesiones y Precios | 0/TBD | No iniciada | - |
| 4. Integración de Pagos | 0/TBD | No iniciada | - |
| 5. Notificaciones y Resiliencia Offline | 0/TBD | No iniciada | - |
| 6. Panel Admin, Panel Propietario y Observabilidad | 0/TBD | No iniciada | - |

## Indicadores de Investigación

Las siguientes fases requieren `/gsd:research-phase` antes de planificar:

- **Fase 2 (Central System OCPP):** Versión actual de la librería Java-OCA-OCPP, handshake del subprotocolo OCPP en Spring WebSocket, comportamiento de buffer de mensajes offline, estrategia de idempotencia de transactionId
- **Fase 4 (Integración de Pagos):** Disponibilidad de la API Marketplace de MercadoPago para Uruguay (crítico — puede requerir cambio de arquitectura si no está disponible), ventana de expiración de preautorización, flujo OAuth de onboarding de vendedor en Marketplace, versión actual del SDK Java de MercadoPago

Todas las demás fases usan patrones estándar y bien documentados y pueden proceder directamente a `/gsd:plan-phase`.
