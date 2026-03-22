# EVSE Platform — Documento de Requerimientos

**CARGÁ / Cargapp / PlugUY**
Sistema de Gestión de Cargadores de Vehículos Eléctricos
*Spec Driven Development — Versión 1.0 · Marzo 2026*

---

## 1. Contexto y Alcance del Proyecto

EVSE Platform es un sistema de gestión de cargadores de vehículos eléctricos que conecta tres tipos de actores: usuarios finales (conductores), propietarios de cargadores (empresas/parkings y particulares), y administradores de plataforma.

El sistema opera bajo el protocolo OCPP 1.6 para la comunicación con los cargadores físicos, y está diseñado para escalar desde un MVP centrado en empresas/parkings hasta incorporar cargadores hogareños en fases posteriores.

> **Modelo de negocio central:** Las empresas y parkings registran sus puntos de carga en la plataforma. Los usuarios finales pagan por el uso. La plataforma cobra una comisión por transacción. En Fase 2 se incorporarán cargadores hogareños con modelo peer-to-peer.

### 1.1 Fases de desarrollo

- **MVP (Fase 1):** Backend/API + App mobile. Flujo principal centrado en empresas/parkings: gestión de cargadores, sesiones de carga, pagos y panel de administración.
- **Fase 2:** Cargadores hogareños (alta, pricing basado en factura UTE, modelo peer-to-peer), interoperabilidad OCPI 2.2 (roaming), mapa público de cargadores, web app.

---

## 2. Actores del Sistema

### 2.1 Usuario Final (Conductor)

- Persona con vehículo eléctrico que busca puntos de carga.
- Puede registrarse libremente (acceso a cargadores públicos) o por invitación (acceso a cargadores privados).
- Paga por las sesiones de carga mediante el método de pago registrado.
- Recibe notificaciones sobre el estado de sus sesiones.

### 2.2 Propietario de Cargador (Actor Privado)

- Actor Privado que gestiona uno o más cargadores en la plataforma.
- Se incorpora mediante flujo de solicitud + aprobación por parte del admin.
- Define el precio de la carga a través de sus cargadores y puede ofrecer carga gratuita o paga.
- Puede gestionar visibilidad de sus cargadores (públicos o privados por invitación).

### 2.3 Administrador de Plataforma

- Visión global de todos los cargadores, sesiones e ingresos.
- Aprueba o rechaza solicitudes de alta de empresas.
- Gestiona incidentes técnicos y configuración global del sistema.

---

## 3. Requerimientos Funcionales

### 3.1 Autenticación y Gestión de Usuarios

| ID | Requerimiento | Prioridad | Fase |
|---|---|---|---|
| AUTH-01 | El usuario puede registrarse con email y contraseña | MUST | MVP |
| AUTH-02 | El usuario puede autenticarse con Google o Apple (OAuth 2.0) | MUST | MVP |
| AUTH-03 | El sistema soporta registro por invitación (link con token de acceso limitado) | SHOULD | Fase 2 |
| AUTH-04 | El usuario puede recuperar su contraseña mediante email | MUST | MVP |
| AUTH-05 | El sistema implementa roles: Usuario Final, Propietario Hogareño, Empresa/Parking, Administrador | MUST | MVP |
| AUTH-06 | Un usuario puede tener múltiples roles simultáneamente (ej: conductor + propietario) | SHOULD | MVP |
| AUTH-07 | El administrador puede suspender o eliminar cuentas de usuario | MUST | MVP |

### 3.2 Gestión de Cargadores

| ID | Requerimiento | Prioridad | Fase |
|---|---|---|---|
| CHRG-01 | El propietario puede registrar un cargador con: nombre, ubicación (lat/lng), tipo de conector, potencia máxima (kW), y fotos | MUST | MVP |
| CHRG-02 | El sistema comunica el estado de cada cargador en tiempo real vía OCPP 1.6 (Disponible / Ocupado / Fuera de servicio) | MUST | MVP |
| CHRG-03 | El cargador puede ser marcado como público (visible en mapa para todos) o privado (visible solo para usuarios invitados) | MUST | MVP |
| CHRG-04 | El propietario o administrador puede habilitar/deshabilitar un cargador manualmente | MUST | MVP |
| CHRG-05 | El sistema registra el historial de estados de cada cargador con timestamp | MUST | MVP |
| CHRG-06 | El administrador puede registrar cargadores en nombre de empresas/parkings | MUST | MVP |

### 3.3 Modelo de Precios

> **Nota:** El esquema de precios debe ser validado con el equipo de negocio antes del desarrollo. Se propone el modelo base descrito abajo, sujeto a revisión.

| ID | Requerimiento | Prioridad | Fase |
|---|---|---|---|
| PRICE-01 | El precio base de una sesión se calcula por kWh consumido | MUST | MVP |
| PRICE-02 | El sistema soporta un cargo fijo de conexión ("bajada de bandera") adicional al precio por kWh | MUST | MVP |
| PRICE-03 | El actor privado define el precio por kWh de cada uno de sus cargadores | MUST | MVP |
| PRICE-04 | El sistema soporta configuración de tarifas dinámicas por franja horaria (ej: pico/valle) | MUST | MVP |
| PRICE-05 | Un actor privado puede configurar sus cargadores como gratuitos para sus usuarios | MUST | MVP |
| PRICE-06 | La plataforma cobra una comisión porcentual configurable por cada transacción paga | MUST | MVP |
| PRICE-07 | El precio total estimado de la sesión es visible para el usuario ANTES de iniciarla | MUST | MVP |

### 3.4 Sesiones de Carga

| ID | Requerimiento | Prioridad | Fase |
|---|---|---|---|
| SESS-01 | El usuario inicia una sesión seleccionando un cargador disponible en la app | MUST | MVP |
| SESS-02 | El inicio de sesión puede realizarse mediante QR code en el cargador físico | SHOULD | MVP |
| SESS-03 | El sistema envía el comando de inicio al cargador vía OCPP (RemoteStartTransaction) | MUST | MVP |
| SESS-04 | Durante la sesión, la app muestra en tiempo real: kWh cargados, duración, costo acumulado | MUST | MVP |
| SESS-05 | El usuario puede detener la sesión desde la app en cualquier momento | MUST | MVP |
| SESS-06 | La sesión se detiene automáticamente si el vehículo se desconecta del cargador | MUST | MVP |
| SESS-07 | Al finalizar la sesión se genera un resumen: kWh, duración, costo total, desglose de comisión | MUST | MVP |
| SESS-08 | El historial de sesiones del usuario es accesible desde la app | MUST | MVP |
| SESS-09 | El sistema maneja detección de sesiones interrumpidas por pérdida de conexión del cargador para ajustar cobro | MUST | MVP |

### 3.5 Pagos y Facturación

| ID | Requerimiento | Prioridad | Fase |
|---|---|---|---|
| PAY-01 | El usuario debe registrar un método de pago antes de iniciar su primera sesión paga | MUST | MVP |
| PAY-02 | El sistema integra un proveedor externo de pagos (Stripe o equivalente para Uruguay/LatAm) | MUST | MVP |
| PAY-03 | El cobro al usuario se realiza automáticamente al finalizar la sesión | MUST | MVP |
| PAY-04 | Los fondos se distribuyen de acuerdo a la configuración establecida por el administrador según el contrato entre partes | MUST | MVP |
| PAY-05 | El usuario recibe un comprobante de pago por email y en la app al finalizar cada sesión | MUST | MVP |
| PAY-06 | El propietario del cargador puede ver el historial de ingresos y liquidaciones | MUST | MVP |
| PAY-07 | El sistema soporta reembolsos parciales o totales gestionados por el administrador | MUST | MVP |
| PAY-08 | El sistema permite la configuración de sesiones gratuitas (tarifa $0) que no generan transacciones de pago | MUST | MVP |

### 3.6 Onboarding de Actores Privados

| ID | Requerimiento | Prioridad | Fase |
|---|---|---|---|
| ENT-01 | El sistema debe permitir la solicitud de alta de actores a través de un formulario/petición | MUST | Fase 2 |
| ENT-02 | El administrador recibe notificación de cada nueva solicitud de empresa | MUST | Fase 2 |
| ENT-03 | El administrador puede aprobar o rechazar la solicitud con comentario opcional | MUST | Fase 2 |
| ENT-04 | Al ser aprobada, la empresa recibe acceso a su panel de gestión y puede agregar cargadores | MUST | MVP |
| ENT-05 | La empresa puede invitar usuarios específicos a sus cargadores privados mediante email | MUST | MVP |
| ENT-06 | La empresa puede revocar acceso de un usuario invitado en cualquier momento | MUST | MVP |

### 3.7 Mapa y Descubrimiento de Cargadores

| ID | Requerimiento | Prioridad | Fase |
|---|---|---|---|
| MAP-01 | La app muestra un mapa con todos los cargadores públicos disponibles | MUST | Fase 2 |
| MAP-02 | Los cargadores privados solo son visibles en el mapa para usuarios con acceso autorizado | MUST | Fase 2 |
| MAP-03 | El mapa muestra el estado actual de cada cargador (disponible/ocupado/fuera de servicio) con íconos diferenciados | MUST | Fase 2 |
| MAP-04 | El usuario puede filtrar cargadores por: tipo de conector, potencia mínima, disponibilidad actual | MUST | Fase 2 |
| MAP-05 | Al seleccionar un cargador, se muestra: dirección, potencia, tipo de conector, precio estimado y fotos | MUST | Fase 2 |
| MAP-06 | El mapa actualiza los estados de los cargadores en tiempo real o con polling corto (máx 30 seg) | MUST | Fase 2 |

### 3.8 Notificaciones

| ID | Requerimiento | Prioridad | Fase |
|---|---|---|---|
| NOTIF-01 | El usuario recibe push notification cuando su sesión de carga finaliza | MUST | MVP |
| NOTIF-02 | El usuario recibe notificación (push + email) al realizarse un cobro exitoso | MUST | MVP |
| NOTIF-03 | El administrador recibe alerta cuando un cargador se desconecta (offline) | MUST | MVP |
| NOTIF-04 | El administrador recibe alerta ante errores técnicos reportados por un cargador vía OCPP | MUST | MVP |
| NOTIF-05 | El propietario del cargador recibe notificación cuando su cargador queda offline | SHOULD | Fase 2 |

### 3.9 Panel de Administrador

| ID | Requerimiento | Prioridad | Fase |
|---|---|---|---|
| ADM-01 | El administrador puede ver el estado en tiempo real de todos los cargadores registrados | MUST | MVP |
| ADM-02 | El dashboard muestra KPIs globales: sesiones activas, ingresos del día/mes, cargadores online/offline | MUST | MVP |
| ADM-03 | El administrador puede bloquear o desbloquear cualquier cargador de la plataforma | MUST | MVP |
| ADM-04 | El administrador puede gestionar usuarios: ver, suspender, eliminar cuentas | MUST | MVP |
| ADM-05 | El administrador puede aprobar o rechazar solicitudes de alta de empresas | MUST | Fase 2 |
| ADM-06 | El administrador puede exportar reportes de sesiones e ingresos en CSV | SHOULD | MVP |
| ADM-07 | El administrador puede configurar el plan de distribución de fondos | MUST | MVP |
| ADM-08 | El administrador puede ver el detalle de cualquier sesión de carga | MUST | MVP |
| ADM-09 | El administrador puede gestionar reembolsos | SHOULD | MVP |

### 3.10 Panel de Empresa / Propietario

| ID | Requerimiento | Prioridad | Fase |
|---|---|---|---|
| OWN-01 | El propietario puede ver el listado de sus cargadores y el estado actual de cada uno | MUST | Fase 2 |
| OWN-02 | El propietario puede ver el historial de sesiones de sus cargadores | MUST | Fase 2 |
| OWN-03 | El propietario puede habilitar o deshabilitar sus cargadores | MUST | Fase 2 |
| OWN-04 | El propietario puede ver reportes de ingresos (monto bruto, comisión plataforma, monto neto) | MUST | Fase 2 |
| OWN-05 | El propietario hogareño puede subir/actualizar su factura de UTE para recalcular precios | MUST | Fase 2 |
| OWN-06 | El propietario puede invitar usuarios específicos a sus cargadores privados | MUST | Fase 2 |

---

## 4. Requerimientos No Funcionales

### 4.1 Rendimiento

- El estado de los cargadores debe actualizarse con una latencia máxima de 5 segundos desde el evento OCPP.
- La API debe responder en menos de 500ms para el 95% de los requests bajo carga normal.
- El sistema debe soportar al menos 500 sesiones de carga concurrentes en el MVP.

### 4.2 Seguridad

- Toda comunicación debe usar HTTPS / WSS con TLS 1.2 o superior.
- Los datos de pago nunca se almacenan en los servidores propios; se delegan al proveedor de pagos (PCI DSS).
- La comunicación OCPP entre cargadores y backend debe autenticarse (Basic Auth o certificados).
- Los tokens de autenticación deben tener expiración y soportar revocación.
- El acceso al panel de administración debe requerir 2FA.

### 4.3 Disponibilidad

- El sistema debe tener una disponibilidad objetivo del 99.5% (permite ~22 horas de downtime al año).
- Las actualizaciones deben poder realizarse con zero-downtime (rolling deployments).

### 4.4 Escalabilidad

- La arquitectura debe permitir escalar horizontalmente los servicios de backend.
- El diseño de base de datos debe soportar multi-tenancy (múltiples empresas aisladas).

### 4.5 Observabilidad

- El sistema debe exponer logs estructurados con nivel (info, warn, error) y correlación de requests.
- Se deben implementar health checks para todos los servicios críticos.
- Se deben monitorear y alertar anomalías en el procesamiento de pagos.

---

## 5. Integraciones Externas

### 5.1 OCPP 1.6 (Cargadores físicos)

- El backend actúa como Central System OCPP 1.6.
- Mensajes requeridos en MVP: BootNotification, Heartbeat, StatusNotification, StartTransaction, StopTransaction, MeterValues, RemoteStartTransaction, RemoteStopTransaction, ChangeAvailability.
- El sistema debe manejar reconexiones de cargadores sin pérdida de sesión activa.

### 5.2 Proveedor de Pagos (Stripe / MercadoPago)

- Gestión de métodos de pago de usuarios (tarjetas, wallets).
- Procesamiento de cobros post-sesión.
- Split payments: distribución automática entre propietario y plataforma.
- Webhooks para confirmación asíncrona de pagos y manejo de fallos.

### 5.3 Notificaciones Push

- Integración con Firebase Cloud Messaging (FCM) para Android e iOS.
- Soporte de notificaciones en background y foreground.

### 5.4 OCPI — Roaming (Fase 2)

- Implementar OCPI 2.2 para interoperabilidad con otras plataformas EVSE.
- Permitir que usuarios externos se autentiquen en cargadores de la plataforma.
- Gestionar cobro federado entre plataformas con trazabilidad completa.

---

## 6. Puntos Abiertos y Decisiones Pendientes

> Estos ítems deben resolverse antes de iniciar el desarrollo de los módulos relacionados.

| # | Pregunta / Decisión pendiente | Impacto | Urgencia |
|---|---|---|---|
| G-01 | ¿Quién define el precio de la tarifa de carga? ¿El admin global, la empresa, o ambos con jerarquía de override? | PRICE-01 a PRICE-07 | Alta |
| G-02 | Modelo de comisión: ¿porcentaje fijo para todos los tipos de propietario, o variable por tipo? | PAY-04, PAY-07 | Alta |
| G-04 | ¿El sistema debe manejar disputas de cobro entre usuario y empresa? ¿Cuál es el flujo de resolución? | PAY-07 | Media |
| G-05 | Proveedor de pagos específico: ¿Stripe (internacional) o MercadoPago (Uruguay/LatAm)? Impacta en split payments y disponibilidad de fondos. | Todo el módulo PAY | Alta |
| G-06 | Moneda de operación: ¿pesos uruguayos, dólares, o multi-moneda? | Todo el módulo PAY | Alta |

---

## 7. Leyenda

| Etiqueta | Significado |
|---|---|
| MUST | Requerimiento obligatorio. El sistema no puede lanzarse sin él. |
| SHOULD | Requerimiento importante pero no bloqueante para el lanzamiento. |
| MVP | Incluido en la primera entrega (Backend + App Mobile). |
| Fase 2 | Planificado para iteración posterior al MVP. |
