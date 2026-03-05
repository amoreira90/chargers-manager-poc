import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { paymentService } from "../api";
import { useTheme } from "../context/ThemeContext";

/**
 * PreAuthPaymentScreen
 *
 * Se muestra ANTES de iniciar la carga. Retiene fondos en el método de pago
 * elegido para garantizar el cobro post-carga.
 *
 * Flujo backend por proveedor:
 * - MercadoPago: POST /v1/payments { capture: false } → retiene sin cobrar
 * - Stripe (Google/Apple Pay): PaymentIntent { capture_method: 'manual' }
 *
 * Al volver a ChargingDetail, pasa el preAuthId para que al finalizar
 * la carga se capture solo el monto real consumido.
 */
const PreAuthPaymentScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { charger } = route.params;

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Estimación de monto máximo: carga completa de 60 kWh (batería típica EV)
  const ESTIMATED_MAX_KWH = 60;
  const maxAmount = ESTIMATED_MAX_KWH * charger.pricePerKwh;

  const paymentMethods = [
    {
      id: "mercadopago",
      name: "Mercado Pago",
      icon: "credit-card" as const,
      color: "#009EE3",
      description: "Tarjeta, cuenta MP o dinero en cuenta",
    },
    ...(Platform.OS === "android"
      ? [
          {
            id: "google_pay" as const,
            name: "Google Pay",
            icon: "google" as const,
            color: "#4285F4",
            description: "Pago rápido con Google",
          },
        ]
      : []),
    ...(Platform.OS === "ios"
      ? [
          {
            id: "apple_pay" as const,
            name: "Apple Pay",
            icon: "apple" as const,
            color: "#000",
            description: "Pago rápido con Face ID / Touch ID",
          },
        ]
      : []),
  ];

  const handlePreAuthorize = async () => {
    if (!selectedMethod) return;

    try {
      setLoading(true);

      // Llamada a la API de pre-autorización
      // El backend se encarga del pasamanos con MercadoPago/Stripe según el método
      const result = await paymentService.preAuthorize({
        chargerId: charger.id,
        paymentMethod: selectedMethod as
          | "mercadopago"
          | "google_pay"
          | "apple_pay",
        maxAmount,
        // paymentToken y paymentMethodId vendrían del SDK nativo
        // de Google Pay / Apple Pay / MercadoPago respectivamente.
        // Por ahora se manejan en el backend con el método guardado del usuario.
      });

      setLoading(false);

      const preAuthData = {
        preAuthId: result.preAuthId,
        authorizedAmount: result.authorizedAmount,
        gatewayReference: result.gatewayReference,
        expiresAt: result.expiresAt,
        paymentMethod: selectedMethod,
      };

      // Volver a ChargingDetail con toda la info necesaria.
      // El native stack puede desmontar la pantalla anterior, así que
      // pasamos charger + preAuth + autoStart para que pueda reanudar.
      navigation.navigate("ChargingDetail", {
        charger,
        preAuth: preAuthData,
        autoStart: true,
      });
    } catch (error: any) {
      setLoading(false);

      const message =
        error?.response?.data?.message ||
        "No se pudo autorizar el pago. Verificá tu método de pago e intentá de nuevo.";

      Alert.alert("Error de Autorización", message, [{ text: "Entendido" }]);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Autorizar Pago
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Info Card - Explicación */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark ? "#1a2533" : "#EBF5FB",
              borderLeftColor: "#1E90FF",
            },
          ]}
        >
          <MaterialCommunityIcons
            name="shield-lock"
            size={24}
            color="#1E90FF"
          />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Retención de fondos
            </Text>
            <Text
              style={[styles.infoDescription, { color: colors.textSecondary }]}
            >
              Antes de iniciar la carga, retendremos hasta{" "}
              <Text style={{ fontWeight: "bold" }}>
                ${maxAmount.toFixed(2)}
              </Text>{" "}
              como garantía. Al finalizar, solo se cobrará el monto real
              consumido y se liberará el excedente automáticamente.
            </Text>
          </View>
        </View>

        {/* Charger Summary */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            Cargador
          </Text>
          <View
            style={[
              styles.summaryRow,
              { borderBottomColor: colors.borderLight },
            ]}
          >
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Nombre
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {charger.name}
            </Text>
          </View>
          <View
            style={[
              styles.summaryRow,
              { borderBottomColor: colors.borderLight },
            ]}
          >
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Potencia
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {charger.powerOutput} kW
            </Text>
          </View>
          <View
            style={[
              styles.summaryRow,
              { borderBottomColor: colors.borderLight },
            ]}
          >
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Precio por kWh
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${charger.pricePerKwh}
            </Text>
          </View>
          <View
            style={[
              styles.summaryRow,
              styles.totalRow,
              { backgroundColor: isDark ? colors.surface : "#FFF8E1" },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Retención máxima
            </Text>
            <Text style={styles.totalValue}>${maxAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Seleccioná tu método de pago
        </Text>

        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethodCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
              selectedMethod === method.id && {
                borderColor: "#1E90FF",
                backgroundColor: isDark ? "#1a2533" : "#EBF5FB",
              },
            ]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <View style={styles.paymentMethodContent}>
              <View
                style={[
                  styles.paymentMethodIcon,
                  { backgroundColor: method.color },
                ]}
              >
                <MaterialCommunityIcons
                  name={method.icon}
                  size={24}
                  color="#fff"
                />
              </View>
              <View style={styles.paymentMethodTextContainer}>
                <Text
                  style={[styles.paymentMethodName, { color: colors.text }]}
                >
                  {method.name}
                </Text>
                <Text
                  style={[
                    styles.paymentMethodDesc,
                    { color: colors.textTertiary },
                  ]}
                >
                  {method.description}
                </Text>
              </View>
            </View>
            {selectedMethod === method.id && (
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color="#1E90FF"
              />
            )}
          </TouchableOpacity>
        ))}

        {/* Security Notice */}
        <View
          style={[
            styles.securityNotice,
            { backgroundColor: isDark ? "#1a2e1a" : "#f0f8f5" },
          ]}
        >
          <MaterialCommunityIcons
            name="shield-check"
            size={16}
            color="#4CAF50"
          />
          <Text style={styles.securityText}>
            Tu información de pago está protegida por encriptación SSL. Solo se
            cobrará el consumo real.
          </Text>
        </View>

        {/* Authorize Button */}
        <TouchableOpacity
          style={[
            styles.authorizeButton,
            !selectedMethod && styles.authorizeButtonDisabled,
          ]}
          onPress={handlePreAuthorize}
          disabled={loading || !selectedMethod}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="lock-check"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.authorizeButtonText}>
                Autorizar e Iniciar Carga
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>
          Al autorizar, aceptás que se retengan fondos de tu método de pago
          seleccionado. El cobro final será por el consumo real de energía.
        </Text>

        <View style={styles.spacer} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    padding: 16,
  },
  infoCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    alignItems: "flex-start",
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingVertical: 12,
    marginTop: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF9800",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  paymentMethodCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethodContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  paymentMethodTextContainer: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 15,
    fontWeight: "600",
  },
  paymentMethodDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 16,
  },
  securityText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#2e7d32",
    flex: 1,
  },
  authorizeButton: {
    backgroundColor: "#1E90FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#1E90FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  authorizeButtonDisabled: {
    opacity: 0.5,
  },
  authorizeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disclaimerText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  spacer: {
    height: 20,
  },
});

export default PreAuthPaymentScreen;
