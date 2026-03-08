# EVSE Admin Web

Template administrativo responsive en `admin/` con estilo dashboard moderno.

## Stack

- React + TypeScript
- Vite
- CSS custom (sin dependencia de framework de componentes)
- Axios

## Modulos incluidos

- `Login`: autenticacion local de demo con persistencia en `sessionStorage`
- `Dashboard`: KPIs operativos, salud y alertas recientes
- `Chargers`: alta de cargadores + acciones (`start/stop/activate/deactivate`)
- `Sessions`: tabla de sesiones recientes (mock derivado del estado real)
- `Users`: listado base de usuarios administradores
- `Settings`: configuracion de intervalo de refresh del polling

## Integracion backend real

El modulo de `Chargers` consume:

- `GET /api/v1/chargers`
- `POST /api/v1/chargers`
- `PATCH /api/v1/chargers/:id/activate`
- `PATCH /api/v1/chargers/:id/deactivate`
- `PATCH /api/v1/chargers/:id/start-charging`
- `PATCH /api/v1/chargers/:id/stop-charging`

## Ejecutar local

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

- UI: `http://localhost:5173`
- Backend esperado: `http://localhost:8080`

## Variables de entorno

- `VITE_API_BASE_URL`: URL base del backend (default: `http://localhost:8080`)
