import { Entypo, FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NodeDetailScreen() {
  const { id } = useLocalSearchParams();

  // Hardcoded anay kay wala pa ang values from sensors
  const nodes = [
    {
      id: '1',
      location: 'Purok Boracay',
      status: 'High',
      temp: 89,
      humidity: 80,
      smokeLevel: 280,
      time: 'Today, 3:47 PM',
    },
    {
      id: '2',
      location: 'Brgy. Siqior',
      status: 'Critical',
      temp: 89,
      humidity: 80,
      smokeLevel: 280,
      time: 'Today, 3:47 PM',
    },
    {
      id: '3',
      location: 'Brgy. Batumbakal',
      status: 'Critical',
      temp: 89,
      humidity: 80,
      smokeLevel: 280,
      time: 'Today, 3:47 PM',
    },
  ];

  const latestStatus = nodes.find((n) => n.id === id) || nodes[0];

  const historyData = [
    { risk: 'Critical', date: '7/1/2025 | 5:40PM' },
    { risk: 'High', date: '5/25/2025 | 9:40AM' },
    { risk: 'Critical', date: '1/20/2025 | 10:00PM' },
  ];

  const getRiskColor = (risk: string) => {
    if (risk === 'Critical') return '#7F1D1D';
    if (risk === 'High') return '#EA580C';
    return '#16A34A';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.fixedHeader}>
        <View>
          <Text style={styles.headerTitle}>Node {id}</Text>
          <Text style={styles.headerSubtitle}>Early alerts. Safer communities.</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/nodes')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* scroll content */}
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
              latestStatus.status === 'Critical' && styles.criticalCard,
              latestStatus.status === 'High' && styles.highCard,
            ]}
          >
            <View style={styles.statusHeader}>
              <Text style={styles.statusLocation}>{latestStatus.location}</Text>
              <Text style={styles.statusTime}>{latestStatus.time}</Text>
            </View>

            <View style={styles.statusBody}>
              <Text
                style={[
                  styles.statusLevel,
                  latestStatus.status === 'Critical' && styles.criticalText,
                  latestStatus.status === 'High' && styles.highText,
                ]}
              >
                {latestStatus.status}
              </Text>

              <View style={styles.iconRow}>
                <View style={styles.iconItem}>
                  <FontAwesome6 name="temperature-three-quarters" size={16} color="#1F2937" />
                  <Text style={styles.iconText}>{latestStatus.temp}°C</Text>
                </View>
                <View style={styles.iconItem}>
                  <Entypo name="air" size={16} color="#1F2937" />
                  <Text style={styles.iconText}>{latestStatus.humidity}%</Text>
                </View>
                <View style={styles.iconItem}>
                  <MaterialCommunityIcons name="smoke" size={16} color="#1F2937" />
                  <Text style={styles.iconText}>{latestStatus.smokeLevel}PPM</Text>
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
                <Text style={[styles.tableHeaderText, styles.colRisk]}>Risk</Text>
                <Text style={[styles.tableHeaderText, styles.colDate]}>Date | Time</Text>
              </View>

              {historyData.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colRisk, { color: getRiskColor(item.risk) }]}>
                    {item.risk}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDate]}>{item.date}</Text>
                </View>
              ))}
            </View>

            <View style={styles.swipeIndicator}>
              <Text style={styles.swipeText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  /* Header */
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  headerTitle: { fontSize: 36, fontWeight: '700', color: '#000', marginBottom: 10 },
  headerSubtitle: { fontSize: 15, color: '#000', fontWeight: '400' },
  backButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  /* Scrollable part */
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 16 },

  /* Cards */
  statusCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    marginBottom: 20,
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
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  statusLocation: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  statusTime: { fontSize: 12, color: '#6B7280' },

  statusBody: { alignItems: 'center', marginTop: 10, width: '100%' },
  statusLevel: { fontSize: 72, fontWeight: '700', textAlign: 'center' },
  highText: { color: '#EA580C' },
  criticalText: { color: '#7F1D1D' },

  iconRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  iconItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  iconText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },

  /* History */
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyHeader: { alignItems: 'flex-end', marginBottom: 20 },
  historyPage: { fontSize: 12, color: '#9CA3AF' },

  historyTable: { marginBottom: 20 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
    marginBottom: 10,
  },
  tableHeaderText: { fontSize: 13, fontWeight: '700', color: '#000' },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: { fontSize: 14, color: '#1F2937', fontWeight: '400' },
  colRisk: { width: '30%' },
  colDate: { flex: 1 },

  swipeIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  swipeText: { fontSize: 13, color: '#9CA3AF' },
});
