import axios from 'axios';
import type { Charger, ChargerAction, CreateChargerPayload } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const getApiBaseUrl = (): string => API_BASE_URL;

export const fetchChargers = async (): Promise<Charger[]> => {
  const response = await api.get<Charger[]>('/api/v1/chargers');
  return response.data;
};

export const createCharger = async (payload: CreateChargerPayload): Promise<Charger> => {
  const response = await api.post<Charger>('/api/v1/chargers', payload);
  return response.data;
};

export const runChargerAction = async (
  chargerId: string,
  action: ChargerAction,
): Promise<Charger> => {
  const response = await api.patch<Charger>(`/api/v1/chargers/${chargerId}/${action}`);
  return response.data;
};

export const toApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    const message = error.response?.data?.message;

    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (error.response?.status) {
      return `Backend respondio con estado ${error.response.status}`;
    }
    if (error.request) {
      return 'No hubo respuesta del backend';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Error inesperado';
};
