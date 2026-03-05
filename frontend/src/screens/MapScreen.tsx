import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { ChargerStation } from "../types";

const MapScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const cameraRef = useRef<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [chargers, setChargers] = useState<ChargerStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharger, setSelectedCharger] = useState<ChargerStation | null>(
    null,
  );

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        loadChargers();
      } else {
        Alert.alert(
          "Permiso",
          "Se requiere acceso a ubicación para usar el mapa",
        );
        // Usar ubicación por defecto (Montevideo)
        setLocation({
          coords: {
            latitude: -34.9058,
            longitude: -56.1913,
          },
        });
        loadChargers();
      }
    } catch (error) {
      // Error al obtener ubicación, se usa fallback
      // Usar ubicación por defecto (Montevideo)
      setLocation({
        coords: {
          latitude: -34.9058,
          longitude: -56.1913,
        },
      });
      loadChargers();
    }
  };

  useEffect(() => {
    requestLocationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadChargers = async () => {
    try {
      const mockChargers: ChargerStation[] = [
        {
          id: "1",
          name: "Cargador Intendencia",
          location: {
            latitude: -34.9063,
            longitude: -56.191,
            address: "18 de Julio 1360, Montevideo",
          },
          availability: "available",
          powerOutput: 150,
          connectorType: "CCS",
          pricePerKwh: 2.5,
        },
        {
          id: "2",
          name: "Cargador Tres Cruces",
          location: {
            latitude: -34.8932,
            longitude: -56.1677,
            address: "Bulevar Artigas 1825, Montevideo",
          },
          availability: "charging",
          powerOutput: 120,
          connectorType: "Type2",
          pricePerKwh: 2.3,
        },
        {
          id: "3",
          name: "Cargador Punta Carretas",
          location: {
            latitude: -34.9215,
            longitude: -56.159,
            address: "Ellauri 350, Montevideo",
          },
          availability: "available",
          powerOutput: 100,
          connectorType: "CCS",
          pricePerKwh: 2.7,
        },
        {
          id: "4",
          name: "Cargador Ciudad Vieja",
          location: {
            latitude: -34.907,
            longitude: -56.205,
            address: "Sarandí 460, Montevideo",
          },
          availability: "available",
          powerOutput: 180,
          connectorType: "CCS",
          pricePerKwh: 3.0,
        },
      ];
      setChargers(mockChargers);
      setLoading(false);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los cargadores");
      setLoading(false);
    }
  };

  const handleChargerPress = (charger: ChargerStation) => {
    setSelectedCharger(charger);
  };

  const handleStartCharging = () => {
    if (selectedCharger) {
      navigation.navigate("ChargingDetail", {
        charger: selectedCharger,
      });
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 12, backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initialRegion = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: -34.9058,
        longitude: -56.1913,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        zoomEnabled
        scrollEnabled
        pitchEnabled
        rotateEnabled
        ref={cameraRef}
      >
        {/* Marker de ubicación actual */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Tu ubicación"
            pinColor="#1E90FF"
          />
        )}

        {/* Markers de cargadores */}
        {chargers.map((charger) => {
          const statusText =
            charger.availability === "available"
              ? "Disponible"
              : charger.availability === "charging"
                ? "En carga"
                : "Mantenimiento";

          return (
            <Marker
              key={charger.id}
              coordinate={{
                latitude: charger.location.latitude,
                longitude: charger.location.longitude,
              }}
              title={charger.name}
              description={`${statusText} • ${charger.powerOutput}kW ${charger.connectorType}\n$${charger.pricePerKwh}/kWh`}
              pinColor={
                charger.availability === "available"
                  ? "#4CAF50"
                  : charger.availability === "charging"
                    ? "#FF9800"
                    : "#f44336"
              }
              onPress={() => handleChargerPress(charger)}
            />
          );
        })}
      </MapView>

      {/* Custom center location button */}
      <TouchableOpacity
        style={[
          styles.centerLocationButton,
          {
            top: insets.top + 16,
            right: 16,
            backgroundColor: colors.card,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={() => {
          if (location && cameraRef.current) {
            cameraRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }}
      >
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>

      {selectedCharger && (
        <View
          style={[
            styles.bottomCard,
            {
              paddingBottom: insets.bottom + 12,
              backgroundColor: colors.card,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.selectedChargerInfo}>
            <View style={styles.headerRow}>
              <Text style={[styles.selectedName, { color: colors.text }]}>
                {selectedCharger.name}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      selectedCharger.availability === "available"
                        ? "#4CAF50"
                        : selectedCharger.availability === "charging"
                          ? "#FF9800"
                          : "#f44336",
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {selectedCharger.availability === "available"
                    ? "Disponible"
                    : selectedCharger.availability === "charging"
                      ? "En carga"
                      : "Mantenimiento"}
                </Text>
              </View>
            </View>
            <Text
              style={[styles.selectedAddress, { color: colors.textSecondary }]}
            >
              {selectedCharger.location.address}
            </Text>
            <View style={styles.selectedStats}>
              <View style={styles.statRow}>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Potencia:
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {selectedCharger.powerOutput} kW
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Conector:
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {selectedCharger.connectorType}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Precio:
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  ${selectedCharger.pricePerKwh}/kWh
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleStartCharging}
          >
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={24}
              color="#fff"
            />
            <Text style={styles.scanButtonText}>Iniciar Carga</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    flex: 1,
  },
  bottomCard: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedChargerInfo: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  selectedAddress: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  selectedStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 13,
    color: "#000",
    fontWeight: "600",
  },
  scanButton: {
    flexDirection: "row",
    backgroundColor: "#1E90FF",
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  centerLocationButton: {
    position: "absolute",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default MapScreen;
