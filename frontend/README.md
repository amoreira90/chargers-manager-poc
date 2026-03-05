# ProseApp - App de Cargadores Eléctricos

Una aplicación móvil multiplataforma (iOS/Android) para encontrar cargadores de vehículos eléctricos, escanear códigos QR, iniciar sesiones de carga y realizar pagos de forma segura.

## 📱 Características Principales

- **Autenticación Segura**: Registro e inicio de sesión con persistencia de sesión
- **Escaneo QR**: Integración de cámara para escanear códigos QR de cargadores
- **Mapa de Cargadores**: Visualiza cargadores disponibles cercanos
- **Monitor de Carga**: Seguimiento en tiempo real de:
  - Tiempo de carga
  - Energía entregada (kWh)
  - Potencia actual
  - Costo acumulado
- **Múltiples Métodos de Pago**:
  - Mercado Pago
  - Google Pay
  - Apple Pay
- **Historial de Cargas**: Registro detalle de todas las sesiones
- **Perfil de Usuario**: Gestiona tu información personal

## 🛠️ Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- Expo CLI: \`npm install -g expo-cli\`
- Un dispositivo o emulador (Android/iOS)

## 📦 Instalación

1. **Navega al directorio del frontend**:
   \`\`\`bash
   cd chargers-manager-poc/frontend
   \`\`\`

2. **Instala las dependencias**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Configura variables de entorno**:
   Copia el archivo de ejemplo y actualízalo:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

   Edita \`.env\` con tus valores:
   \`\`\`env
   EXPO_PUBLIC_API_URL=http://localhost:8080
   EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_token_aqui
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
   \`\`\`

## 🚀 Ejecución

### Desarrollo Local

\`\`\`bash

# Inicia el servidor Expo

npm start

# O específicamente:

npm run android # Para Android
npm run ios # Para iOS
npm run web # Para Web
\`\`\`

## 📁 Estructura del Proyecto

```
ProseApp/
├── src/
│   ├── api/                 # Servicios de API
│   │   ├── authService.ts   # Autenticación
│   │   ├── chargerService.ts # Cargadores
│   │   ├── paymentService.ts # Pagos
│   │   ├── client.ts        # Cliente HTTP
│   │   └── index.ts         # Exportaciones
│   ├── context/             # Context API
│   │   └── AuthContext.tsx  # Gestión de autenticación
│   ├── screens/             # Pantallas de la app
│   │   ├── AuthScreen.tsx   # Login/Registro
│   │   ├── HomeScreen.tsx   # Inicio
│   │   ├── QRScannerScreen.tsx # Escaneo QR
│   │   ├── ChargingDetailScreen.tsx # Detalles de carga
│   │   ├── PaymentScreen.tsx # Pagos
│   │   ├── HistoryScreen.tsx # Historial
│   │   ├── ProfileScreen.tsx # Perfil
│   │   └── index.ts
│   ├── types/               # Tipos TypeScript
│   │   └── index.ts
│   ├── utils/               # Utilidades
│   ├── components/          # Componentes reutilizables
│   └── navigation/
│       └── RootNavigator.tsx # Navegación principal
├── App.tsx                  # Entrada principal
├── app.json                 # Configuración Expo
└── package.json
```

## 🔌 Endpoints de API Requeridos

La aplicación está lista para conectarse con tu backend.

### Autenticación

- \`POST /auth/register\` - Registrar nuevo usuario
- \`POST /auth/login\` - Iniciar sesión
- \`POST /auth/logout\` - Cerrar sesión
- \`GET /auth/profile\` - Obtener perfil
- \`PUT /auth/profile\` - Actualizar perfil

### Cargadores

- \`GET /chargers\` - Listar cargadores disponibles
- \`GET /chargers/:id\` - Detalles de un cargador
- \`POST /charging-sessions\` - Iniciar carga
- \`GET /charging-sessions/:id\` - Estado de carga
- \`POST /charging-sessions/:id/stop\` - Detener carga
- \`GET /charging-sessions/history\` - Historial

## 📚 Librerías Principales

- React Native - Framework base
- Expo - Plataforma de desarrollo
- React Navigation - Navegación entre pantallas
- Axios - Cliente HTTP
- TypeScript - Type safety
- expo-camera - Acceso a cámara para QR
- react-native-svg-charts - Gráficos
- @react-native-async-storage - Almacenamiento local

## 🎨 Diseño

- **Color primario**: #1E90FF (Azul)
- **Verde**: #4CAF50 (Éxito)
- **Naranja**: #FF9800 (Advertencia)
- **Rojo**: #f44336 (Error)

## 📱 Compatibilidad

- **iOS**: 13.0+
- **Android**: 8.0+
- **Web**: Soporte experimental

---

**Desarrollado para ProseApp**
