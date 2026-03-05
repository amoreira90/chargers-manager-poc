import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const PaymentScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { amount, sessionData, preAuth } = route.params;
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(
    // Si viene con pre-auth capturado, ya está pagado
    preAuth?.status === "captured",
  );
  const [scaleAnim] = useState(
    new Animated.Value(preAuth?.status === "captured" ? 1 : 0),
  );

  // Si viene con pre-auth capturado, animar entrada
  React.useEffect(() => {
    if (preAuth?.status === "captured") {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  const paymentMethods = [
    {
      id: "mercadopago",
      name: "Mercado Pago",
      icon: "credit-card",
      color: "#009EE3",
    },
    ...(Platform.OS === "android"
      ? [
          {
            id: "google_pay",
            name: "Google Pay",
            icon: "google",
            color: "#4285F4",
          },
        ]
      : []),
    ...(Platform.OS === "ios"
      ? [
          {
            id: "apple_pay",
            name: "Apple Pay",
            icon: "apple",
            color: "#000",
          },
        ]
      : []),
  ];

  const goToHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "HomeScreen" }],
      }),
    );
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;

    try {
      setLoading(true);
      // Simular procesamiento de pago (2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setLoading(false);
      setPaymentSuccess(true);

      // Animación de éxito
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      setLoading(false);
    }
  };

  // Pantalla de éxito post-pago
  if (paymentSuccess) {
    return (
      <View
        style={[
          styles.successContainer,
          {
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 20,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Animated.View
          style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}
        >
          <MaterialCommunityIcons name="check" size={64} color="#fff" />
        </Animated.View>
        <Text style={[styles.successTitle, { color: colors.text }]}>
          {preAuth ? "¡Cobro Realizado!" : "¡Pago Exitoso!"}
        </Text>
        <Text style={styles.successAmount}>${amount.toFixed(2)}</Text>
        <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
          Cargador: {sessionData.chargerName}
        </Text>
        <Text style={[styles.successDetail, { color: colors.textTertiary }]}>
          Energía: {sessionData.energyDelivered.toFixed(2)} kWh • Tiempo:{" "}
          {Math.floor(sessionData.sessionTime / 60)} min
        </Text>
        {preAuth && (
          <View style={styles.preAuthReceipt}>
            <Text style={[styles.receiptLine, { color: colors.textSecondary }]}>
              Monto retenido: ${preAuth.authorizedAmount.toFixed(2)}
            </Text>
            <Text style={[styles.receiptLine, { color: colors.textSecondary }]}>
              Monto cobrado: ${preAuth.capturedAmount.toFixed(2)}
            </Text>
            {preAuth.authorizedAmount > preAuth.capturedAmount && (
              <Text style={[styles.receiptLine, { color: "#4CAF50" }]}>
                Liberado: $
                {(preAuth.authorizedAmount - preAuth.capturedAmount).toFixed(2)}
              </Text>
            )}
            <Text style={[styles.receiptLine, { color: colors.textTertiary }]}>
              Método:{" "}
              {preAuth.paymentMethod === "mercadopago"
                ? "Mercado Pago"
                : preAuth.paymentMethod === "google_pay"
                  ? "Google Pay"
                  : "Apple Pay"}
            </Text>
          </View>
        )}

        <View style={styles.successActions}>
          <TouchableOpacity style={styles.successButton} onPress={goToHome}>
            <MaterialCommunityIcons
              name="home"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.successButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
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
          Pago de Carga
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Summary */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            Resumen de Carga
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
              Cargador
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {sessionData.chargerName}
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
              Energía Entregada
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {sessionData.energyDelivered.toFixed(2)} kWh
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
              Tiempo de Carga
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {Math.floor(sessionData.sessionTime / 60)} min
            </Text>
          </View>

          <View
            style={[
              styles.summaryRow,
              styles.totalRow,
              { backgroundColor: isDark ? colors.surface : "#f9f9f9" },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total a Pagar
            </Text>
            <Text style={styles.totalValue}>${amount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Método de Pago
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
                borderColor: "#4CAF50",
                backgroundColor: isDark ? "#1a2e1a" : "#f0f8f5",
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
              <Text style={[styles.paymentMethodName, { color: colors.text }]}>
                {method.name}
              </Text>
            </View>
            {selectedMethod === method.id && (
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color="#4CAF50"
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
            Tu información de pago está protegida por encriptación SSL
          </Text>
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            !selectedMethod && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={loading || !selectedMethod}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="check"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.payButtonText}>
                Realizar Pago ${amount.toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  paymentMethodCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedPaymentMethod: {
    borderColor: "#4CAF50",
    backgroundColor: "#f0f8f5",
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
  paymentMethodName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8f5",
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
  payButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  spacer: {
    height: 20,
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  successAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 16,
  },
  successSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  successDetail: {
    fontSize: 14,
    color: "#999",
    marginBottom: 16,
    textAlign: "center",
  },
  preAuthReceipt: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: "100%",
    alignItems: "center",
  },
  receiptLine: {
    fontSize: 14,
    marginVertical: 2,
  },
  successActions: {
    width: "100%",
  },
  successButton: {
    backgroundColor: "#1E90FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PaymentScreen;
