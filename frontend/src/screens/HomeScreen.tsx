import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [chargers, setChargers] = useState<ChargerStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );

  useEffect(() => {
    loadChargers();
    loadLocation();
  }, []);

  const loadLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch {
      // Silently fail — distance just won't show
    }
  };

  const loadChargers = async () => {
    try {
      setLoading(true);
      const data = await chargerService.getAvailableChargers();
      setChargers(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los cargadores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleScanQR = () => {
    navigation.navigate('Scanner');
  };

  const handleViewMap = () => {
    navigation.navigate('Map');
  };

  const handleChargerSelect = (charger: ChargerStation) => {
    navigation.navigate('ChargingDetail', { charger });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChargers();
  };

  const getDistanceText = (charger: ChargerStation): string | null => {
    if (!userLocation) return null;
    const km = getDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
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

  const renderChargerItem = ({ item }: { item: ChargerStation }) => (
    <TouchableOpacity
      style={[styles.chargerCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
      onPress={() => handleChargerSelect(item)}
    >
      <View style={styles.chargerHeader}>
        <Text style={[styles.chargerName, { color: colors.text }]}>{item.name}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.availability === 'available'
                  ? '#4CAF50'
                  : item.availability === 'charging'
                    ? '#FF9800'
                    : '#f44336',
            },
          ]}
        >
          <Text style={styles.statusText}>
            {item.availability === 'available'
              ? 'Disponible'
              : item.availability === 'charging'
                ? 'En uso'
                : 'Mantenimiento'}
          </Text>
        </View>
      </View>

      <Text style={[styles.chargerLocation, { color: colors.textSecondary }]}>
        {item.location.address}
      </Text>

      <View style={styles.chargerDetails}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="lightning-bolt" size={16} color={colors.warning} />
          <Text style={[styles.detailText, { color: colors.text }]}>{item.powerOutput}kW</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="currency-usd" size={16} color={colors.success} />
          <Text style={[styles.detailText, { color: colors.text }]}>${item.pricePerKwh}/kWh</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="flash" size={16} color={colors.primary} />
          <Text style={[styles.detailText, { color: colors.text }]}>{item.connectorType}</Text>
        </View>
      </View>

      {/* Distance & directions row */}
      {getDistanceText(item) && (
        <View style={[styles.distanceRow, { borderTopColor: colors.borderLight || '#f0f0f0' }]}>
          <View style={styles.distanceInfo}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={15}
              color={colors.textTertiary}
            />
            <Text style={[styles.distanceValue, { color: colors.textSecondary }]}>
              {getDistanceText(item)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.directionsLink}
            onPress={() => handleNavigateTo(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="directions" size={16} color={colors.primary} />
            <Text style={[styles.directionsText, { color: colors.primary }]}>Cómo llegar</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: colors.headerBg,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cargadores Disponibles</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.mapButton} onPress={handleViewMap}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#fff" />
            <Text style={styles.buttonText}>Mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#fff" />
            <Text style={styles.buttonText}>Escanear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={chargers}
        renderItem={renderChargerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mapButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanButton: {
    flex: 1,
    backgroundColor: '#1E90FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  scanButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chargerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chargerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chargerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chargerLocation: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
  },
  chargerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 6,
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
  },
  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  directionsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  directionsText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default HomeScreen;
