# Configuración del Proyecto ProseApp Frontend

## 🔗 Conexión con el Backend

### URLs por Ambiente

| Ambiente    | URL Backend              | Puerto |
| ----------- | ------------------------ | ------ |
| Development | http://localhost:8080    | 8080   |
| Production  | https://api.proseapp.com | 443    |

### Endpoints Disponibles (Backend Java Spring Boot)

#### Swagger UI

- **URL**: http://localhost:8080/swagger-ui.html
- **Descripción**: Documentación interactiva de la API

#### API Docs

- **URL**: http://localhost:8080/api-docs
- **Descripción**: Especificación OpenAPI en formato JSON

#### H2 Console (Solo Dev)

- **URL**: http://localhost:8080/h2-console
- **JDBC URL**: jdbc:h2:mem:chargersdb
- **Username**: sa
- **Password**: (vacío)

#### Actuator (Monitoreo)

- **Health**: http://localhost:8080/actuator/health
- **Metrics**: http://localhost:8080/actuator/metrics
- **Prometheus**: http://localhost:8080/actuator/prometheus
- **Base Path**: /actuator

## 📱 Variables de Entorno

### Requeridas

```env
EXPO_PUBLIC_API_URL=http://localhost:8080
```

### Opcionales

```env
EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
EXPO_PUBLIC_GOOGLE_PAY_MERCHANT_ID=xxx
```

## 🚀 Inicio Rápido

### 1. Backend (Java)

```bash
# Desde la raíz del proyecto
./mvnw spring-boot:run

# O usando Docker
docker-compose up
```

### 2. Frontend (React Native + Expo)

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

## 🔍 Verificar Conexión

### Test del Backend

```bash
# Health check
curl http://localhost:8080/actuator/health

# Swagger UI
open http://localhost:8080/swagger-ui.html
```

### Test desde el Frontend

El archivo `src/api/client.ts` está configurado para:

- Conectarse a `EXPO_PUBLIC_API_URL`
- Timeout de 10 segundos
- Headers: `Content-Type: application/json`
- Logging de errores en consola

## 📝 Notas Importantes

1. **Variables de Entorno en Expo**: Deben tener el prefijo `EXPO_PUBLIC_` para estar disponibles en el código.

2. **iOS Simulator**: Para conectar con localhost desde iOS, usa `http://localhost:8080`

3. **Android Emulator**: Para conectar con localhost desde Android, usa `http://10.0.2.2:8080`
   - Puedes crear `.env.android` con esta configuración

4. **Dispositivo Físico**: Asegúrate de que el dispositivo esté en la misma red y usa la IP local del backend (ej: `http://192.168.1.100:8080`)

## 🐛 Troubleshooting

### Error: Network Request Failed

- Verifica que el backend esté corriendo en el puerto 8080
- Revisa que la URL en `.env` sea correcta
- En Android Emulator, usa `10.0.2.2` en lugar de `localhost`

### Error: Timeout

- Aumenta el `EXPO_PUBLIC_API_TIMEOUT` en `.env`
- Verifica la conexión de red

### Error: CORS

- El backend debe permitir requests desde el origen del frontend
- Verifica la configuración de CORS en el backend Spring Boot
