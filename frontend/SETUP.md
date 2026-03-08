# 🚀 Guía de Setup - ProseApp

Esta guía te ayudará a configurar el proyecto de ProseApp desde cero.

## Pasos Iniciales

### 1. Clonar o descargar el proyecto

Si ya tienes los archivos en tu computadora, asegúrate de estar en el directorio correcto:

```bash
cd /Users/fxer0x/Proyectos/ProseApp
```

### 2. Instalar Node.js y npm

Si no los tienes instalados:

```bash
# Usando Homebrew (macOS)
brew install node

# Verifica las versiones
node --version
npm --version
```

### 3. Instalar Expo CLI Globalmente

```bash
npm install -g expo-cli
```

Verifica la instalación:

```bash
expo --version
```

### 4. Instalar dependencias del proyecto

```bash
npm install
```

Esto instalará todas las librerías necesarias listadas en `package.json`.

### 5. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Luego edita `.env` e ingresa tus valores reales:

```env
# Backend local (Spring Boot en puerto 8080)
EXPO_PUBLIC_API_URL=http://localhost:8080

# Claves de servicios externos
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_llave_publica_mercadopago
EXPO_PUBLIC_GOOGLE_PAY_MERCHANT_ID=tu_merchant_id_google
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_google_maps
```

**Nota importante**: En Expo, las variables de entorno deben tener el prefijo `EXPO_PUBLIC_` para estar disponibles en el código.

## Ejecutar la Aplicación

### En Desarrollo Local

```bash
npm start
```

Esto abrirá el menú de Expo. Aquí puedes:

- Presionar `i` para abrir en iOS Simulator
- Presionar `a` para abrir en Android Emulator
- Presionar `w` para abrir en navegador web (Metro)
- Usar la cámara del teléfono para escanear el código QR con la app Expo Go

### Usando Expo Go (Teléfono Físico)

1. Descarga la app **Expo Go** desde Play Store o App Store
2. Ejecuta `npm start`
3. Escanea el código QR con tu teléfono
4. ¡Tu app se cargará en el dispositivo!

### En Emulador Android

Asegúrate de tener Android Studio instalado y configurado:

```bash
npm run android
```

### En Simulador iOS

Solo disponible en macOS:

```bash
npm run ios
```

## Estructura de Carpetas Explicada

### `/src/api`

Contiene los servicios para comunicarse con el backend:

- `client.ts` - Configuración del cliente HTTP (Axios)
- `authService.ts` - Login, registro, perfil
- `chargerService.ts` - Información de cargadores
- `paymentService.ts` - Procesamiento de pagos

### `/src/screens`

Las principales pantallas de la app:

- `AuthScreen.tsx` - Login y registro
- `HomeScreen.tsx` - Listado de cargadores
- `QRScannerScreen.tsx` - Escaneo de códigos QR
- `ChargingDetailScreen.tsx` - Monitor de carga en vivo
- `PaymentScreen.tsx` - Selección y procesamiento de pago
- `HistoryScreen.tsx` - Historial de cargas
- `ProfileScreen.tsx` - Perfil del usuario

### `/src/context`

Estado global de la aplicación:

- `AuthContext.tsx` - Maneja la autenticación y sesión del usuario

### `/src/types`

Definiciones de tipos TypeScript para toda la app:

- `index.ts` - Interfaces: User, ChargerStation, Payment, etc.

### `/src/navigation`

Configuración de navegación:

- `RootNavigator.tsx` - Stack de navegación principal

## Conectar tu Backend

Para que la app funcione completamente, necesitas un backend que proporcione estos endpoints:

### Ejemplo de integración (Backend Node.js):

```javascript
// POST /auth/register
{
  "name": "string",
  "email": "string",
  "password": "string"
}
// Response:
{
  "user": { id, name, email, createdAt }
}

// POST /auth/login
{
  "email": "string",
  "password": "string"
}
// Response:
{
  "user": { id, name, email },
  "token": "jwt_token"
}

// GET /chargers
// Response:
{
  "chargers": [
    {
      "id": "string",
      "name": "string",
      "location": { latitude, longitude, address },
      "availability": "available|charging|maintenance",
      "powerOutput": 150,
      "connectorType": "CCS|Type2|CHAdeMO",
      "pricePerKwh": 2.5
    }
  ]
}
```

## Testing

### En Desarrollo

La app simula datos para poder testear sin backend real:

- Los cargadores son datos mock
- Los pagos son simulados
- Los datos de carga se generan aleatoriamente

Ver `HomeScreen.tsx` línea ~45 para los datos mock.

## Compilar para Producción

### Usando EAS Build (Recomendado)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login a tu cuenta Expo
eas login

# Compilar para iOS
eas build --platform ios

# Compilar para Android
eas build --platform android
```

## Troubleshooting

### "npm command not found"

Instala Node.js desde nodejs.org

### "expo command not found"

```bash
npm install -g expo-cli
```

### "Cannot find module 'react-native-camera'"

```bash
npm install
npm start -- --reset-cache
```

### La cámara no funciona en el emulador

Algunos emuladores no tienen soporte para cámara. Usa un teléfono físico con Expo Go.

### Error de CORS desde el backend

Asegúrate que tu backend tenga habilitado CORS:

```javascript
// Express ejemplo
app.use(
  cors({
    origin: '*', // En desarrollo
    credentials: true,
  }),
);
```

## Variables de Entorno Importantes

| Variable                           | Descripción                       | Ejemplo               |
| ---------------------------------- | --------------------------------- | --------------------- |
| EXPO_PUBLIC_API_URL                | URL base del backend              | http://localhost:8080 |
| EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY | Llave pública de Mercado Pago     | APP_USR-1234567890... |
| EXPO_PUBLIC_GOOGLE_MAPS_API_KEY    | API Key de Google Maps            | AIzaSy...             |
| EXPO_PUBLIC_ENV                    | Ambiente (development/production) | development           |

## Próximos Pasos

1. **Conecta tu backend** actalizando los endpoints en `/src/api/`
2. **Configura autenticación real** reemplazando MockAuth en `AuthContext.tsx`
3. **Testa en dispositivo físico** descargando Expo Go
4. **Compila para stores** usando EAS Build
5. **Configura notificaciones push** con Expo Notifications

## Documentación Oficial

- [Expo Docs](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)

## Soporte

Para preguntas o problemas:

1. Revisa el README.md
2. Consulta la documentación oficial
3. Revisa los logs en la consola (Ctrl+J en el terminal de Expo)

---

¡Listo para empezar a desarrollar! 🎉
