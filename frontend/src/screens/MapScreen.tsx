import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chargerService } from '../api';
import { useTheme } from '../context/ThemeContext';
import { ChargerStation } from '../types';

/** Haversine distance in km between two coordinates */
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const MapScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const cameraRef = useRef<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [chargers, setChargers] = useState<ChargerStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharger, setSelectedCharger] = useState<ChargerStation | null>(null);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        loadChargers();
      } else {
        Alert.alert('Permiso', 'Se requiere acceso a ubicación para usar el mapa');
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
      const data = await chargerService.getAvailableChargers();
      setChargers(data);
      setLoading(false);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los cargadores');
      setLoading(false);
    }
  };

  const handleChargerPress = (charger: ChargerStation) => {
    setSelectedCharger(charger);
  };

  const handleStartCharging = () => {
    if (selectedCharger) {
      navigation.navigate('ChargingDetail', {
        charger: selectedCharger,
      });
    }
  };

  const getDistanceText = (charger: ChargerStation): string | null => {
    if (!location) return null;
    const km = getDistanceKm(
      location.coords.latitude,
      location.coords.longitude,
      charger.location.latitude,
      charger.location.longitude,
    );
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  };

  const handleNavigateTo = (charger: ChargerStation) => {
    const { latitude, longitude } = charger.location;
    const label = encodeURIComponent(charger.name);

    const appleMapsUrl = `maps://?daddr=${latitude},${longitude}&q=${label}`;
    const googleMapsUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
    const wazeUrl = `waze://?ll=${latitude},${longitude}&navigate=yes`;

    type NavOption = { name: string; url: string };

    const checkApps = async (): Promise<NavOption[]> => {
      const apps: NavOption[] = [];
      if (await Linking.canOpenURL(appleMapsUrl))
        apps.push({ name: 'Apple Maps', url: appleMapsUrl });
      if (await Linking.canOpenURL(googleMapsUrl))
        apps.push({ name: 'Google Maps', url: googleMapsUrl });
      if (await Linking.canOpenURL(wazeUrl)) apps.push({ name: 'Waze', url: wazeUrl });
      return apps;
    };

    checkApps().then((apps) => {
      if (apps.length === 0) {
        // Fallback: abrir en navegador
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
        );
        return;
      }
      if (apps.length === 1) {
        Linking.openURL(apps[0].url);
        return;
      }
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: [...apps.map((a) => a.name), 'Cancelar'],
            cancelButtonIndex: apps.length,
            title: 'Abrir con...',
          },
          (index) => {
            if (index < apps.length) Linking.openURL(apps[index].url);
          },
        );
      } else {
        Alert.alert('Abrir con...', undefined, [
          ...apps.map((a) => ({ text: a.name, onPress: () => Linking.openURL(a.url) })),
          { text: 'Cancelar', style: 'cancel' as const },
        ]);
      }
    });
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
            charger.availability === 'available'
              ? 'Disponible'
              : charger.availability === 'charging'
                ? 'En carga'
                : 'Mantenimiento';

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
                charger.availability === 'available'
                  ? '#4CAF50'
                  : charger.availability === 'charging'
                    ? '#FF9800'
                    : '#f44336'
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
        <MaterialCommunityIcons name="crosshairs-gps" size={24} color={colors.primary} />
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
                      selectedCharger.availability === 'available'
                        ? '#4CAF50'
                        : selectedCharger.availability === 'charging'
                          ? '#FF9800'
                          : '#f44336',
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {selectedCharger.availability === 'available'
                    ? 'Disponible'
                    : selectedCharger.availability === 'charging'
                      ? 'En carga'
                      : 'Mantenimiento'}
                </Text>
              </View>
            </View>
            <View style={styles.addressRow}>
              <Text style={[styles.selectedAddress, { color: colors.textSecondary, flex: 1 }]}>
                {selectedCharger.location.address}
              </Text>
              {getDistanceText(selectedCharger) && (
                <View style={styles.distanceBadge}>
                  <MaterialCommunityIcons
                    name="map-marker-distance"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={[styles.distanceText, { color: colors.primary }]}>
                    {getDistanceText(selectedCharger)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.selectedStats}>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Potencia:</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {selectedCharger.powerOutput} kW
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Conector:</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {selectedCharger.connectorType}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Precio:</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  ${selectedCharger.pricePerKwh}/kWh
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.directionsButton, { borderColor: colors.primary }]}
              onPress={() => handleNavigateTo(selectedCharger)}
            >
              <MaterialCommunityIcons name="directions" size={22} color={colors.primary} />
              <Text style={[styles.directionsButtonText, { color: colors.primary }]}>
                Cómo llegar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scanButton, { flex: 1 }]}
              onPress={handleStartCharging}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Iniciar Carga</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedChargerInfo: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedAddress: {
    fontSize: 13,
    color: '#666',
  },
  selectedStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 13,
    color: '#000',
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  directionsButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
  },
  directionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centerLocationButton: {
    position: 'absolute',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default MapScreen;
