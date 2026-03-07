import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { ChargingSession } from '../types';

const HistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [history, setHistory] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      // Mock data - se conectaría con la API real
      const mockHistory: ChargingSession[] = [
        {
          id: '1',
          userId: 'user1',
          chargerId: '1',
          startTime: new Date(Date.now() - 86400000).toISOString(),
          endTime: new Date(Date.now() - 85000000).toISOString(),
          status: 'completed',
          energyDelivered: 45.5,
          totalCost: 113.75,
          chargerName: 'Cargador Centro',
        },
        {
          id: '2',
          userId: 'user1',
          chargerId: '2',
          startTime: new Date(Date.now() - 172800000).toISOString(),
          endTime: new Date(Date.now() - 170000000).toISOString(),
          status: 'completed',
          energyDelivered: 32.0,
          totalCost: 73.6,
          chargerName: 'Cargador Zona Norte',
        },
      ];
      setHistory(mockHistory);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#f44336';
      case 'active':
        return '#FF9800';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      case 'active':
        return 'En Progreso';
      default:
        return 'Desconocido';
    }
  };

  const renderHistoryItem = ({ item }: { item: ChargingSession }) => (
    <View
      style={[styles.historyCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
    >
      <View
        style={[
          styles.cardHeader,
          {
            backgroundColor: isDark ? colors.surface : '#fafafa',
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <View>
          <Text style={[styles.chargerName, { color: colors.text }]}>{item.chargerName}</Text>
          <Text style={[styles.dateText, { color: colors.textTertiary }]}>
            {formatDate(item.startTime)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <MaterialCommunityIcons name="lightning-bolt" size={18} color={colors.warning} />
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Energía Entregada
            </Text>
          </View>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {item.energyDelivered.toFixed(2)} kWh
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <MaterialCommunityIcons name="currency-usd" size={18} color={colors.success} />
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Costo Total</Text>
          </View>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            ${item.totalCost.toFixed(2)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Duración</Text>
          </View>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {item.endTime
              ? Math.floor(
                  (new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / 60000,
                ) + ' min'
              : 'En progreso'}
          </Text>
        </View>
      </View>
    </View>
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
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Historial de Cargas</Text>
      </View>

      {history.length > 0 ? (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="history"
            size={48}
            color={colors.textTertiary}
            style={{ marginBottom: 16 }}
          />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No hay cargas registradas
          </Text>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chargerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    marginLeft: 8,
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default HistoryScreen;
