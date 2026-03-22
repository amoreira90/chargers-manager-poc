import { ChargerStation } from '../types';
import apiClient from './client';

// Respuesta del backend (solo campos que vienen de la BD)
interface ChargerApiResponse {
  id: string;
  name: string;
  status: string;
  address: string;
  latitude: number;
  longitude: number;
  powerKilowatts: number;
}

// Mapeo de status del backend al formato del frontend
const mapStatus = (status: string): ChargerStation['availability'] => {
  const statusMap: Record<string, ChargerStation['availability']> = {
    AVAILABLE: 'available',
    CHARGING: 'charging',
    MAINTENANCE: 'maintenance',
    OUT_OF_SERVICE: 'maintenance',
  };
  return statusMap[status] || 'maintenance';
};

// Campos que no vienen del backend se mockean con defaults
const mapToChargerStation = (charger: ChargerApiResponse): ChargerStation => {
  // Distribuir tipos de conectores basado en el ID del cargador de forma determinística
  const connectorTypes: Array<ChargerStation['connectorType']> = ['CCS', 'CHAdeMO', 'Type2'];
  const connectorIndex = parseInt(charger.id, 10) % connectorTypes.length;
  const connectorType = connectorTypes[connectorIndex] || 'CCS';

  return {
    id: charger.id,
    name: charger.name,
    location: {
      latitude: charger.latitude,
      longitude: charger.longitude,
      address: charger.address,
    },
    availability: mapStatus(charger.status),
    powerOutput: charger.powerKilowatts,
    connectorType, // mock: varía según el ID del cargador
    pricePerKwh: 2.5, // mock: no está en la BD
  };
};

export const chargerService = {
  getAvailableChargers: async (): Promise<ChargerStation[]> => {
    const response = await apiClient.get<ChargerApiResponse[]>('/api/v1/chargers');
    return response.data.map(mapToChargerStation);
  },

  getChargerDetails: async (chargerId: string): Promise<ChargerStation> => {
    const response = await apiClient.get<ChargerApiResponse>(`/api/v1/chargers/${chargerId}`);
    return mapToChargerStation(response.data);
  },

  startChargingSession: async (chargerId: string) => {
    const response = await apiClient.post('/api/v1/charging-sessions', {
      chargerId,
    });
    return response.data;
  },

  getChargingSessionStatus: async (sessionId: string) => {
    const response = await apiClient.get(`/api/v1/charging-sessions/${sessionId}`);
    return response.data;
  },

  stopChargingSession: async (sessionId: string) => {
    const response = await apiClient.post(`/api/v1/charging-sessions/${sessionId}/stop`);
    return response.data;
  },

  getChargingHistory: async () => {
    const response = await apiClient.get('/api/v1/charging-sessions/history');
    return response.data;
  },
};
