import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import authService from '../../services/authService';

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await authService.getUser();
    setUser(userData);
  };

  const latestStatus = {
    node: 'Purok Boracay',
    nodeNumber: 4,
    status: 'HIGH',
    temp: 89,
    humidity: 80,
    smokeLevel: 280,
    time: 'Today, 3:47 PM',
  };

  const historyData = [
    { node: 1, risk: 'High', date: '7/1/2025 | 5:40PM' },
    { node: 2, risk: 'High', date: '5/25/2025 | 9:40AM' },
    { node: 4, risk: 'Critical', date: '1/20/2025 | 10:00PM' },
    { node: 2, risk: 'High', date: '10/1/2024 | 1:40PM' },
    { node: 3, risk: 'Critical', date: '6/29/2024 | 5:00PM' },
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
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Welcome back, {user?.username || 'User'}!
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.accountButton}
          onPress={() => router.push('/account')}
        >
          <Image 
            source={{ uri: 'https://via.placeholder.com/50' }}
            style={styles.accountImage}
          />
          <Text style={styles.accountText}>Account</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Latest Status Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View>
                <Text style={styles.statusLocation}>
                  {latestStatus.node} <Text style={styles.nodeNumber}>(Node {latestStatus.nodeNumber})</Text>
                </Text>
              </View>
              <Text style={styles.statusTime}>{latestStatus.time}</Text>
            </View>
            
            <View style={styles.statusBody}>
              <View style={styles.statusLeft}>
                <Text style={styles.statusLevel}>{latestStatus.status}</Text>
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
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyPage}>Page 1/3</Text>
            </View>
            
            <View style={styles.historyTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colNode]}>Node</Text>
                <Text style={[styles.tableHeaderText, styles.colRisk]}>Risk</Text>
                <Text style={[styles.tableHeaderText, styles.colDate]}>Date | Time</Text>
              </View>

              {historyData.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colNode]}>{item.node}</Text>
                  <Text style={[styles.tableCell, styles.colRisk, { color: getRiskColor(item.risk) }]}>
                    {item.risk}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDate]}>{item.date}</Text>
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
  accountButton: {
    alignItems: 'center',
  },
  accountImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
  },
  accountText: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '400',
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
    backgroundColor: '#FFEDD5',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  nodeNumber: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
  },
  statusTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBody: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  statusLeft: {
    flex: 1,
    width: '100%',
  },
  statusLevel: {
    fontSize: 72,
    fontWeight: '700',
    color: '#EA580C',
    letterSpacing: -3,
    alignSelf: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 20,
  },
  iconItem: {
    alignItems: 'center',
    flexDirection: 'row',
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
    color: '#1F2937',
    fontWeight: '400',
  },
  colNode: {
    width: '20%',
  },
  colRisk: {
    width: '25%',
  },
  colDate: {
    flex: 1,
  },
  nextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingTop: 8,
  },
  nextText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
