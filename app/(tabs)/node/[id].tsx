import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Temporary hardcoded data (replace with backend later)
  const nodes = [
    {
      id: '1',
      location: 'Purok Boracay',
      status: 'HIGH',
      temp: 89,
      humidity: 80,
      smokeLevel: 280,
      time: 'Today, 3:47 PM',
    },
    {
      id: '2',
      location: 'Brgy. Siquior',
      status: 'CRITICAL',
      temp: 89,
      humidity: 80,
      smokeLevel: 280,
      time: 'Today, 3:47 PM',
    },
    {
      id: '3',
      location: 'Brgy. Batumbakal',
      status: 'CRITICAL',
      temp: 89,
      humidity: 80,
      smokeLevel: 280,
      time: 'Today, 3:47 PM',
    },
  ];

  const latestStatus = nodes.find(n => n.id === id) ?? nodes[0];

  const historyData = [
    { risk: 'Critical', date: '7/1/2025 | 5:40PM' },
    { risk: 'High', date: '5/25/2025 | 9:40AM' },
    { risk: 'Critical', date: '1/20/2025 | 10:00PM' },
  ];

  const getRiskColor = (risk: string) => {
    if (risk === 'Critical') return '#DC2626';
    if (risk === 'High') return '#EA580C';
    return '#16A34A';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Node {id}</Text>
          <Text style={styles.headerSubtitle}>
            Early alerts. Safer communities.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/nodes')}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Latest Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Status</Text>

          <View
            style={[
              styles.statusCard,
              latestStatus.status === 'CRITICAL' && styles.criticalCard,
              latestStatus.status === 'HIGH' && styles.highCard,
            ]}
          >
            <View style={styles.statusHeader}>
              <Text style={styles.statusLocation}>
                {latestStatus.location}
              </Text>
              <Text style={styles.statusTime}>{latestStatus.time}</Text>
            </View>

            <View style={styles.statusBody}>
              <Text
                style={[
                  styles.statusLevel,
                  latestStatus.status === 'CRITICAL' && styles.criticalText,
                  latestStatus.status === 'HIGH' && styles.highText,
                ]}
              >
                {latestStatus.status}
              </Text>

              <View style={styles.iconRow}>
                <View style={styles.iconItem}>
                  <FontAwesome6
                    name="temperature-three-quarters"
                    size={16}
                    color="#1F2937"
                  />
                  <Text style={styles.iconText}>
                    {latestStatus.temp}°C
                  </Text>
                </View>

                <View style={styles.iconItem}>
                  <Entypo name="air" size={16} color="#1F2937" />
                  <Text style={styles.iconText}>
                    {latestStatus.humidity}%
                  </Text>
                </View>

                <View style={styles.iconItem}>
                  <MaterialCommunityIcons
                    name="smoke"
                    size={16}
                    color="#1F2937"
                  />
                  <Text style={styles.iconText}>
                    {latestStatus.smokeLevel}PPM
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Node History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Node History</Text>

          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyPage}>Page 1/3</Text>
            </View>

            <View style={styles.historyTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colRisk]}>
                  Risk
                </Text>
                <Text style={[styles.tableHeaderText, styles.colDate]}>
                  Date | Time
                </Text>
              </View>

              {historyData.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.colRisk,
                      { color: getRiskColor(item.risk) },
                    ]}
                  >
                    {item.risk}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDate]}>
                    {item.date}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.nextIndicator}>
              <Text style={styles.nextText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '400',
  },
  backButton: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
  },

  statusCard: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
  },
  highCard: {
    backgroundColor: '#FFEDD5',
    borderColor: '#FDBA74',
  },
  criticalCard: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },

  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusTime: {
    fontSize: 12,
    color: '#6B7280',
  },

  statusBody: {
    alignItems: 'center',
  },
  statusLevel: {
    fontSize: 72,
    fontWeight: '700',
    marginBottom: 16,
  },
  highText: {
    color: '#EA580C',
  },
  criticalText: {
    color: '#7F1D1D',
  },

  iconRow: {
    flexDirection: 'row',
    gap: 20,
  },
  iconItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '400',
  },

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyHeader: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  historyPage: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  historyTable: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
    marginBottom: 10,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1F2937',
  },
  colRisk: {
    width: '30%',
  },
  colDate: {
    flex: 1,
  },

  nextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  nextText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
