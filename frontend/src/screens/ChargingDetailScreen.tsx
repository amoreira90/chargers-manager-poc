import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paymentService } from '../api';
import { useTheme } from '../context/ThemeContext';

type MachineStatus =
  | 'idle' // Esperando QR
  | 'scanned' // QR escaneado, listo para conectar
  | 'connecting' // Conectando con la máquina
  | 'connected' // Conectado, listo para activar
  | 'activating' // Activando la máquina
  | 'active' // Máquina activa, cargando
  | 'stopping' // Deteniendo carga
  | 'completed'; // Carga completada

const ChargingDetailScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  let charger = route.params?.charger;

  // Si no hay charger, crear uno dummy para que funcione el scanner
  if (!charger) {
    charger = {
      id: route.params?.chargerId || 'unknown',
      name: 'Cargador ProseApp',
      location: {
        latitude: -34.9058,
        longitude: -56.1913,
        address: 'Montevideo, Uruguay',
      },
      availability: 'available',
      powerOutput: 150,
      connectorType: 'CCS',
      pricePerKwh: 2.5,
    };
  }

  // Si viene con autoStart (retorno de PreAuthPayment), arrancar directo
  const autoStart = route.params?.autoStart === true;
  const initialPreAuth = route.params?.preAuth || null;

  const [machineStatus, setMachineStatus] = useState<MachineStatus>(
    autoStart ? 'activating' : 'idle',
  );
  const [sessionTime, setSessionTime] = useState(0);
  const [energyDelivered, setEnergyDelivered] = useState(0);
  const [currentPower, setCurrentPower] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(25); // Simular batería inicial
  const [scannedQRCode, setScannedQRCode] = useState<string | null>(
    autoStart ? `QR-${charger.id}` : null,
  );
  const [statusMessage, setStatusMessage] = useState(
    autoStart ? 'Activando el cargador...' : 'Escanea el QR del cargador para comenzar',
  );

  // Pre-autorización de pago
  const [preAuth] = useState<{
    preAuthId: string;
    authorizedAmount: number;
    gatewayReference: string;
    expiresAt: string;
    paymentMethod: string;
  } | null>(initialPreAuth);

  // Animación de pulso para status activo
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Iniciar animación de pulso cuando está cargando
  useEffect(() => {
    if (machineStatus === 'active') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [machineStatus, pulseAnim]);

  // Timer y simulación de carga
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (machineStatus === 'active') {
      timer = setInterval(() => {
        setSessionTime((t) => t + 1);
        const randomPower = Math.floor(Math.random() * 30) + 100;
        setCurrentPower(randomPower);
        setEnergyDelivered((e) => e + randomPower / 3600);
        setBatteryLevel((b) => Math.min(100, b + 0.02));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [machineStatus]);

  // Detectar QR escaneado desde parámetros de navegación
  useEffect(() => {
    if (route.params?.qrScanned && machineStatus === 'idle') {
      const qrData = route.params?.scannedQRData || 'QR desconocido';
      setScannedQRCode(qrData);
      setMachineStatus('scanned');
      setStatusMessage('QR verificado. Conectando con la máquina...');

      // Iniciar conexión automática después de 1 segundo
      setTimeout(() => connectToMachine(qrData), 1000);
    }
  }, [route.params?.qrScanned, route.params?.scannedQRData]);

  // Auto-iniciar la carga cuando se vuelve de PreAuthPayment con autoStart
  useEffect(() => {
    if (autoStart && machineStatus === 'activating') {
      // Simular la activación directa (el QR y la conexión ya se hicieron antes)
      const doAutoStart = async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          setStatusMessage('Inicializando flujo de energía...');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setMachineStatus('active');
          setStatusMessage('⚡ Cargando en progreso');
        } catch {
          setMachineStatus('connected');
          setStatusMessage('Error al activar. Intenta nuevamente.');
        }
      };
      doAutoStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simular conexión con la máquina
  const connectToMachine = async (qrData: string) => {
    setMachineStatus('connecting');
    setStatusMessage('Estableciendo conexión con el cargador...');

    try {
      // Simular handshake con la máquina (1.5-3 segundos)
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1500));

      // Simular verificación del cargador
      setStatusMessage('Verificando disponibilidad del cargador...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMachineStatus('connected');
      setStatusMessage('Cargador conectado. Listo para activar la carga.');
    } catch (error) {
      setMachineStatus('idle');
      setStatusMessage('Error de conexión. Intenta escanear el QR nuevamente.');
      Alert.alert(
        'Error de Conexión',
        'No se pudo conectar con el cargador. Verifica que estés cerca del equipo.',
      );
    }
  };

  // Detener carga y capturar pago automáticamente
  const stopCharging = async () => {
    Alert.alert('Detener Carga', '¿Estás seguro de que quieres detener la carga?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Detener',
        style: 'destructive',
        onPress: async () => {
          setMachineStatus('stopping');
          setStatusMessage('Finalizando sesión de carga...');

          await new Promise((resolve) => setTimeout(resolve, 2000));

          const actualAmount = energyDelivered * charger.pricePerKwh;

          // Capturar el pago real de la pre-autorización
          let captureResult = null;
          if (preAuth) {
            try {
              setStatusMessage('Procesando cobro...');
              captureResult = await paymentService.capturePayment(
                preAuth.preAuthId,
                actualAmount,
                scannedQRCode || charger.id, // sessionId
              );
            } catch (error: any) {
              // Si falla la captura, igual mostrar resumen.
              // El backend debería reintentar.
              console.warn('Error al capturar pago:', error);
            }
          }

          setMachineStatus('completed');
          setStatusMessage('Carga completada');

          // Navegar al resumen de pago
          setTimeout(() => {
            navigation.navigate('Payment', {
              amount: actualAmount,
              sessionData: {
                chargerName: charger.name,
                energyDelivered,
                sessionTime,
                qrCode: scannedQRCode,
              },
              // Datos de pre-auth para mostrar en el recibo
              preAuth: preAuth
                ? {
                    authorizedAmount: preAuth.authorizedAmount,
                    capturedAmount: captureResult?.capturedAmount ?? actualAmount,
                    paymentMethod: preAuth.paymentMethod,
                    status: captureResult ? 'captured' : 'pending',
                  }
                : null,
            });
          }, 1500);
        },
      },
    ]);
  };

  // Navegar a pre-autorización de pago antes de activar la carga
  const handleActivateWithPreAuth = () => {
    navigation.navigate('PreAuthPayment', { charger });
  };

  const handleScanQR = () => {
    navigation.navigate('Scanner', {
      chargerId: charger.id,
      chargerName: charger.name,
      charger: charger,
    });
  };

  const handleSkipQR = () => {
    // Guard: solo ejecutar si estamos en estado idle
    if (machineStatus !== 'idle') return;

    const skippedQRData = `QR-OMITIDO-${charger.id}`;
    setScannedQRCode(skippedQRData);
    setMachineStatus('scanned');
    setStatusMessage('Continuando sin escaneo QR. Conectando con la máquina...');
    setTimeout(() => connectToMachine(skippedQRData), 800);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalCost = energyDelivered * charger.pricePerKwh;

  // Colores y textos según estado
  const getStatusColor = () => {
    switch (machineStatus) {
      case 'idle':
        return '#9E9E9E';
      case 'scanned':
        return '#FF9800';
      case 'connecting':
        return '#FF9800';
      case 'connected':
        return '#2196F3';
      case 'activating':
        return '#FF9800';
      case 'active':
        return '#4CAF50';
      case 'stopping':
        return '#FF9800';
      case 'completed':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (): string => {
    switch (machineStatus) {
      case 'idle':
        return 'qrcode-scan';
      case 'scanned':
        return 'check-circle';
      case 'connecting':
        return 'wifi';
      case 'connected':
        return 'check-network';
      case 'activating':
        return 'lightning-bolt';
      case 'active':
        return 'flash';
      case 'stopping':
        return 'stop-circle';
      case 'completed':
        return 'check-all';
      default:
        return 'help-circle';
    }
  };

  const isLoading =
    machineStatus === 'connecting' ||
    machineStatus === 'activating' ||
    machineStatus === 'stopping';

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
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{charger.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Status Card - Estado de la máquina */}
        <View
          style={[
            styles.card,
            styles.statusCard,
            {
              borderLeftColor: getStatusColor(),
              backgroundColor: colors.card,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.statusHeader}>
            {isLoading ? (
              <ActivityIndicator size="small" color={getStatusColor()} />
            ) : (
              <Animated.View
                style={
                  machineStatus === 'active' ? { transform: [{ scale: pulseAnim }] } : undefined
                }
              >
                <MaterialCommunityIcons
                  name={getStatusIcon() as any}
                  size={28}
                  color={getStatusColor()}
                />
              </Animated.View>
            )}
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusTitle, { color: getStatusColor() }]}>
                {machineStatus === 'idle' && 'Esperando QR'}
                {machineStatus === 'scanned' && 'QR Verificado'}
                {machineStatus === 'connecting' && 'Conectando...'}
                {machineStatus === 'connected' && 'Máquina Conectada'}
                {machineStatus === 'activating' && 'Activando...'}
                {machineStatus === 'active' && '⚡ Cargando'}
                {machineStatus === 'stopping' && 'Finalizando...'}
                {machineStatus === 'completed' && '✓ Completado'}
              </Text>
              <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                {statusMessage}
              </Text>
            </View>
          </View>

          {/* Progress Steps */}
          <View style={styles.stepsContainer}>
            {[
              { label: 'QR', done: machineStatus !== 'idle' },
              {
                label: 'Conexión',
                done: ['connected', 'activating', 'active', 'stopping', 'completed'].includes(
                  machineStatus,
                ),
              },
              {
                label: 'Pago',
                done: !!preAuth,
              },
              {
                label: 'Carga',
                done: ['active', 'stopping', 'completed'].includes(machineStatus),
              },
            ].map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={[styles.stepDot, step.done && styles.stepDotDone]} />
                {index < 3 && (
                  <View
                    style={[
                      styles.stepLine,
                      step.done && styles.stepLineDone,
                      !step.done && { backgroundColor: colors.border },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.stepLabel,
                    step.done && styles.stepLabelDone,
                    !step.done && { color: colors.textTertiary },
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Charger Details */}
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Detalles del Cargador</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color={colors.warning} />
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Potencia</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {charger.powerOutput}kW
              </Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="flash" size={24} color={colors.primary} />
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Tipo</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {charger.connectorType}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="currency-usd" size={24} color={colors.success} />
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Precio</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                ${charger.pricePerKwh}/kWh
              </Text>
            </View>
          </View>
          <View style={[styles.locationContainer, { borderTopColor: colors.borderLight }]}>
            <MaterialCommunityIcons name="map-marker" size={18} color="#FF6B6B" />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              {charger.location.address}
            </Text>
          </View>
        </View>

        {/* Charging Session Info - Solo cuando está cargando o completado */}
        {(machineStatus === 'active' ||
          machineStatus === 'stopping' ||
          machineStatus === 'completed') && (
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Sesión de Carga</Text>

            {/* Battery Level Visual */}
            <View style={styles.batteryContainer}>
              <View style={[styles.batteryOuter, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.batteryFill,
                    {
                      width: `${batteryLevel}%`,
                      backgroundColor:
                        batteryLevel > 80 ? '#4CAF50' : batteryLevel > 40 ? '#FF9800' : '#f44336',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.batteryText, { color: colors.text }]}>
                {batteryLevel.toFixed(0)}%
              </Text>
            </View>

            <View
              style={[
                styles.statsContainer,
                { backgroundColor: isDark ? colors.surface : '#f9f9f9' },
              ]}
            >
              <View
                style={[styles.statItem, { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }]}
              >
                <MaterialCommunityIcons name="timer-outline" size={20} color="#1E90FF" />
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Tiempo</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatTime(sessionTime)}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="flash" size={20} color={colors.warning} />
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Energía</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {energyDelivered.toFixed(2)} kWh
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View
                style={[styles.statItem, { borderTopRightRadius: 12, borderBottomRightRadius: 12 }]}
              >
                <MaterialCommunityIcons name="currency-usd" size={20} color={colors.success} />
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Costo</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  ${totalCost.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Power gauge */}
            <View style={styles.powerSection}>
              <View style={styles.powerHeader}>
                <Text style={[styles.powerLabel, { color: colors.text }]}>Potencia Actual</Text>
                <Text style={[styles.powerValue, { color: colors.primary }]}>
                  {currentPower} kW
                </Text>
              </View>
              <View style={[styles.powerBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.powerBarFill,
                    {
                      width: `${Math.min(100, (currentPower / charger.powerOutput) * 100)}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* QR Info Card - Si ya se escaneó */}
        {scannedQRCode && (
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.qrInfoRow}>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color={colors.success} />
              <Text style={[styles.qrInfoLabel, { color: colors.success }]}>QR Escaneado</Text>
            </View>
            <Text style={[styles.qrInfoData, { color: colors.textTertiary }]} numberOfLines={2}>
              {scannedQRCode}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {machineStatus === 'idle' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#1E90FF' }]}
              onPress={handleScanQR}
            >
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={22}
                color="#fff"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.actionButtonText}>Escanear QR del Cargador</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.secondaryActionButton,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={handleSkipQR}
            >
              <MaterialCommunityIcons
                name="skip-next"
                size={22}
                color={colors.textSecondary}
                style={{ marginRight: 10 }}
              />
              <Text style={[styles.secondaryActionButtonText, { color: colors.textSecondary }]}>
                Saltear escaneo de QR
              </Text>
            </TouchableOpacity>
          </>
        )}

        {machineStatus === 'connected' && !preAuth && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#1E90FF' }]}
            onPress={handleActivateWithPreAuth}
          >
            <MaterialCommunityIcons
              name="lock-check"
              size={22}
              color="#fff"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.actionButtonText}>Autorizar Pago e Iniciar</Text>
          </TouchableOpacity>
        )}

        {machineStatus === 'active' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f44336' }]}
            onPress={stopCharging}
          >
            <MaterialCommunityIcons
              name="stop-circle"
              size={22}
              color="#fff"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.actionButtonText}>Detener Carga</Text>
          </TouchableOpacity>
        )}

        {isLoading && (
          <View style={[styles.actionButton, { backgroundColor: '#E0E0E0' }]}>
            <ActivityIndicator size="small" color="#666" style={{ marginRight: 10 }} />
            <Text style={[styles.actionButtonText, { color: '#666' }]}>Procesando...</Text>
          </View>
        )}

        <View style={styles.spacer} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusCard: {
    borderLeftWidth: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  stepItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  stepDotDone: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  stepLine: {
    width: 36,
    height: 2,
    backgroundColor: '#E0E0E0',
  },
  stepLineDone: {
    backgroundColor: '#4CAF50',
  },
  stepLabel: {
    position: 'absolute',
    top: 20,
    fontSize: 10,
    color: '#999',
    width: 60,
    textAlign: 'center',
    left: -23,
  },
  stepLabelDone: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  locationText: {
    marginLeft: 8,
    color: '#666',
    flex: 1,
    fontSize: 13,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  detailValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  batteryOuter: {
    flex: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 12,
  },
  batteryText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 45,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  statValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  powerSection: {
    paddingTop: 8,
  },
  powerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  powerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  powerValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E90FF',
  },
  powerBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  powerBarFill: {
    height: '100%',
    backgroundColor: '#1E90FF',
    borderRadius: 4,
  },
  qrInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrInfoLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  qrInfoData: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryActionButton: {
    borderWidth: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});

export default ChargingDetailScreen;
