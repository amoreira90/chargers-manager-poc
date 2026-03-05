import apiClient from "./client";

export const chargerService = {
  getAvailableChargers: async (latitude?: number, longitude?: number) => {
    const response = await apiClient.get("/chargers", {
      params: {
        latitude,
        longitude,
      },
    });
    return response.data;
  },

  getChargerDetails: async (chargerId: string) => {
    const response = await apiClient.get(`/chargers/${chargerId}`);
    return response.data;
  },

  startChargingSession: async (chargerId: string) => {
    const response = await apiClient.post("/charging-sessions", {
      chargerId,
    });
    return response.data;
  },

  getChargingSessionStatus: async (sessionId: string) => {
    const response = await apiClient.get(`/charging-sessions/${sessionId}`);
    return response.data;
  },

  stopChargingSession: async (sessionId: string) => {
    const response = await apiClient.post(
      `/charging-sessions/${sessionId}/stop`,
    );
    return response.data;
  },

  getChargingHistory: async () => {
    const response = await apiClient.get("/charging-sessions/history");
    return response.data;
  },
};
