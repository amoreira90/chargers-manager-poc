// Tipos de usuario
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

// Tipos de cargador
export interface ChargerStation {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  availability: 'available' | 'charging' | 'maintenance';
  powerOutput: number; // en kW
  connectorType: 'CCS' | 'CHAdeMO' | 'Type2';
  pricePerKwh: number;
}

// Tipos de sesión de carga
export interface ChargingSession {
  id: string;
  userId: string;
  chargerId: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'cancelled';
  energyDelivered: number; // en kWh
  totalCost: number;
  chargerName: string;
}

// Tipos de pago
export interface Payment {
  id: string;
  sessionId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'authorized' | 'captured' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'mercadopago' | 'google_pay' | 'apple_pay';
  timestamp: string;
}

// Pre-autorización de pago (retención de fondos)
export interface PaymentPreAuth {
  id: string;
  sessionId: string;
  userId: string;
  authorizedAmount: number; // Monto máximo retenido
  capturedAmount?: number; // Monto real cobrado (después de captura)
  currency: string;
  status: 'pending' | 'authorized' | 'captured' | 'released' | 'failed';
  paymentMethod: 'mercadopago' | 'google_pay' | 'apple_pay';
  paymentToken?: string; // Token del método de pago (Google/Apple Pay)
  paymentMethodId?: string; // ID del método de pago (MercadoPago)
  gatewayReference: string; // Referencia del gateway (ID de transacción)
  authorizedAt: string;
  capturedAt?: string;
  expiresAt: string; // Cuándo expira la retención
}

// Tipos de autenticación
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignout: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Tipos de estado global
export interface AppState {
  user: User | null;
  currentSession?: ChargingSession;
  chargingHistory: ChargingSession[];
  userPayments: Payment[];
}
