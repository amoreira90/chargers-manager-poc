export type ChargerStatus = 'AVAILABLE' | 'CHARGING' | 'OUT_OF_SERVICE';

export interface Charger {
  id: string;
  name: string;
  status: ChargerStatus;
  address: string;
  latitude: number;
  longitude: number;
  powerKilowatts: number;
}

export interface CreateChargerPayload {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  powerKilowatts: number;
}

export type ChargerAction = 'activate' | 'deactivate' | 'start-charging' | 'stop-charging';
