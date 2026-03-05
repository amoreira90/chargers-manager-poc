import apiClient from "./client";

// ─────────────────────────────────────────────
// Flag para usar respuestas simuladas mientras
// las APIs del backend no estén disponibles.
// Poner en false cuando el back esté listo.
// ─────────────────────────────────────────────
const USE_MOCK = true;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let mockPreAuthCounter = 1;

export const paymentService = {
  // ─────────────────────────────────────────────
  // PRE-AUTORIZACIÓN (retención de fondos)
  // ─────────────────────────────────────────────

  /**
   * Retiene fondos en el método de pago del usuario ANTES de iniciar la carga.
   *
   * Backend según proveedor:
   * - MercadoPago: POST /v1/payments con { capture: false }
   * - Stripe (Google/Apple Pay): PaymentIntent con capture_method: 'manual'
   */
  preAuthorize: async (params: {
    chargerId: string;
    paymentMethod: "mercadopago" | "google_pay" | "apple_pay";
    maxAmount: number;
    paymentToken?: string;
    paymentMethodId?: string;
  }) => {
    if (USE_MOCK) {
      await delay(1500); // Simular latencia de red + gateway
      const id = `preauth_${Date.now()}_${mockPreAuthCounter++}`;
      return {
        preAuthId: id,
        authorizedAmount: params.maxAmount,
        gatewayReference: `gw_ref_${id}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "authorized" as const,
      };
    }
    const response = await apiClient.post("/payments/pre-authorize", params);
    return response.data as {
      preAuthId: string;
      authorizedAmount: number;
      gatewayReference: string;
      expiresAt: string;
      status: "authorized";
    };
  },

  /**
   * Captura (cobra) el monto real consumido de una pre-autorización existente.
   * El monto capturado debe ser <= al monto autorizado.
   *
   * Backend según proveedor:
   * - MercadoPago: PUT /v1/payments/{id} con { capture: true, transaction_amount }
   * - Stripe: POST /v1/payment_intents/{id}/capture con amount_to_capture
   */
  capturePayment: async (
    preAuthId: string,
    actualAmount: number,
    sessionId: string,
  ) => {
    if (USE_MOCK) {
      await delay(1200); // Simular latencia de captura
      return {
        paymentId: `pay_${Date.now()}`,
        capturedAmount: actualAmount,
        status: "captured" as const,
      };
    }
    const response = await apiClient.post(
      `/payments/pre-authorize/${preAuthId}/capture`,
      {
        amount: actualAmount,
        sessionId,
      },
    );
    return response.data as {
      paymentId: string;
      capturedAmount: number;
      status: "captured";
    };
  },

  /**
   * Libera (cancela) una pre-autorización sin cobrar.
   */
  releasePreAuth: async (preAuthId: string) => {
    if (USE_MOCK) {
      await delay(800);
      return { status: "released" as const };
    }
    const response = await apiClient.post(
      `/payments/pre-authorize/${preAuthId}/release`,
    );
    return response.data as {
      status: "released";
    };
  },

  /**
   * Obtiene el estado actual de una pre-autorización.
   */
  getPreAuthStatus: async (preAuthId: string) => {
    if (USE_MOCK) {
      await delay(600);
      return {
        preAuthId,
        authorizedAmount: 150,
        status: "authorized" as const,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    const response = await apiClient.get(
      `/payments/pre-authorize/${preAuthId}`,
    );
    return response.data as {
      preAuthId: string;
      authorizedAmount: number;
      capturedAmount?: number;
      status: "authorized" | "captured" | "released" | "expired";
      expiresAt: string;
    };
  },

  // ─────────────────────────────────────────────
  // PAGOS DIRECTOS (legacy - mantener compatibilidad)
  // ─────────────────────────────────────────────

  initiatePayment: async (sessionId: string, amount: number) => {
    if (USE_MOCK) {
      await delay(1000);
      return { paymentId: `pay_${Date.now()}`, status: "pending" };
    }
    const response = await apiClient.post("/payments/initiate", {
      sessionId,
      amount,
    });
    return response.data;
  },

  processPaymentWithMercadoPago: async (
    sessionId: string,
    amount: number,
    paymentMethodId: string,
  ) => {
    if (USE_MOCK) {
      await delay(2000);
      return { paymentId: `pay_mp_${Date.now()}`, status: "completed" };
    }
    const response = await apiClient.post("/payments/mercadopago", {
      sessionId,
      amount,
      paymentMethodId,
    });
    return response.data;
  },

  processPaymentWithGooglePay: async (sessionId: string, token: string) => {
    if (USE_MOCK) {
      await delay(1500);
      return { paymentId: `pay_gp_${Date.now()}`, status: "completed" };
    }
    const response = await apiClient.post("/payments/google-pay", {
      sessionId,
      token,
    });
    return response.data;
  },

  processPaymentWithApplePay: async (sessionId: string, token: string) => {
    if (USE_MOCK) {
      await delay(1500);
      return { paymentId: `pay_ap_${Date.now()}`, status: "completed" };
    }
    const response = await apiClient.post("/payments/apple-pay", {
      sessionId,
      token,
    });
    return response.data;
  },

  // ─────────────────────────────────────────────
  // HISTORIAL Y CONSULTAS
  // ─────────────────────────────────────────────

  getPaymentHistory: async () => {
    if (USE_MOCK) {
      await delay(500);
      return [];
    }
    const response = await apiClient.get("/payments/history");
    return response.data;
  },

  getPaymentDetails: async (paymentId: string) => {
    if (USE_MOCK) {
      await delay(500);
      return { id: paymentId, amount: 0, status: "completed" };
    }
    const response = await apiClient.get(`/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Obtiene los métodos de pago guardados del usuario.
   */
  getSavedPaymentMethods: async () => {
    if (USE_MOCK) {
      await delay(500);
      return [
        {
          id: "mp_default",
          type: "mercadopago" as const,
          label: "Visa ****4242",
          lastFourDigits: "4242",
          isDefault: true,
        },
      ];
    }
    const response = await apiClient.get("/payments/methods");
    return response.data as Array<{
      id: string;
      type: "mercadopago" | "google_pay" | "apple_pay";
      label: string;
      lastFourDigits?: string;
      isDefault: boolean;
    }>;
  },
};
