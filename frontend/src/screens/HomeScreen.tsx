import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { ChargerStation } from "../types";

const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [chargers, setChargers] = useState<ChargerStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChargers();
  }, []);

  const loadChargers = async () => {
    try {
      setLoading(true);
      // Por ahora usamos datos mock, se conectará con la API real
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
      ];
      setChargers(mockChargers);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los cargadores");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleScanQR = () => {
    navigation.navigate("Scanner");
  };

  const handleViewMap = () => {
    navigation.navigate("Map");
  };

  const handleChargerSelect = (charger: ChargerStation) => {
    navigation.navigate("ChargingDetail", { charger });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChargers();
  };

  const renderChargerItem = ({ item }: { item: ChargerStation }) => (
    <TouchableOpacity
      style={[
        styles.chargerCard,
        { backgroundColor: colors.card, shadowColor: colors.shadow },
      ]}
      onPress={() => handleChargerSelect(item)}
    >
      <View style={styles.chargerHeader}>
        <Text style={[styles.chargerName, { color: colors.text }]}>
          {item.name}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.availability === "available"
                  ? "#4CAF50"
                  : item.availability === "charging"
                    ? "#FF9800"
                    : "#f44336",
            },
          ]}
        >
          <Text style={styles.statusText}>
            {item.availability === "available"
              ? "Disponible"
              : item.availability === "charging"
                ? "En uso"
                : "Mantenimiento"}
          </Text>
        </View>
      </View>

      <Text style={[styles.chargerLocation, { color: colors.textSecondary }]}>
        {item.location.address}
      </Text>

      <View style={styles.chargerDetails}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={16}
            color={colors.warning}
          />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.powerOutput}kW
          </Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons
            name="currency-usd"
            size={16}
            color={colors.success}
          />
          <Text style={[styles.detailText, { color: colors.text }]}>
            ${item.pricePerKwh}/kWh
          </Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons
            name="flash"
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.connectorType}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Cargadores Disponibles
        </Text>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#fff",
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  mapButton: {
    flex: 1,
    backgroundColor: "#FF6B6B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanButton: {
    flex: 1,
    backgroundColor: "#1E90FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  scanButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chargerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chargerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chargerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  chargerLocation: {
    color: "#666",
    fontSize: 14,
    marginBottom: 12,
  },
  chargerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    marginLeft: 6,
    color: "#333",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default HomeScreen;
