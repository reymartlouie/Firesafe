import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { 
  Image, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import authService from '../../services/authService';
import fireEventsService, { FireEvent } from '../../services/fireEventsService';

/**
 * Format timestamp for display
 * 
 * Non-Technical: Converts database timestamp to readable format
 * like "Today, 3:47 PM" or "12/17/2025 | 5:40PM"
 * 
 * Technical: Formats ISO timestamp strings for user display.
 * Checks if date is today and formats accordingly.
 * 
 * @param timestamp - ISO timestamp string
 * @param includeDate - Whether to include full date (for history)
 * @returns Formatted date string
 */
const formatEventTime = (timestamp: string, includeDate: boolean = false) => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (includeDate) {
      // Format: "12/17/2025 | 5:40PM"
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      
      return `${month}/${day}/${year} | ${displayHours}:${displayMinutes}${ampm}`;
    }

    if (isToday) {
      // Format: "Today, 3:47 PM"
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      
      return `Today, ${displayHours}:${displayMinutes} ${ampm}`;
    }

    // Format: "Dec 17, 3:47 PM"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${month} ${day}, ${displayHours}:${displayMinutes} ${ampm}`;
  } catch (error) {
    return timestamp;
  }
};

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [latestEvent, setLatestEvent] = useState<FireEvent | null>(null);
  const [historyEvents, setHistoryEvents] = useState<FireEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();
    
    // Subscribe to real-time updates
    const subscription = fireEventsService.subscribeToEvents((newEvent) => {
      console.log('🔥 New fire event detected:', newEvent);
      setLatestEvent(newEvent);
      // Refresh history to include new event
      loadHistory(currentPage);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadHistory(currentPage);
  }, [currentPage]);

  /**
   * Load all initial data (user and fire events)
   * 
   * Non-Technical: Loads your user info and the latest fire event data
   * when the screen first opens
   * 
   * Technical: Calls multiple async functions in parallel using Promise.all
   * for optimal performance
   */
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUser(),
        loadLatestEvent(),
        loadHistory(1),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh data when user pulls down
   * 
   * Non-Technical: When you pull down on the screen, it reloads all the data
   * Technical: React Native's pull-to-refresh pattern using RefreshControl
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  /**
   * Load current user data
   */
  const loadUser = async () => {
    const userData = await authService.getUser();
    setUser(userData);
  };

  /**
   * Load the most recent fire event
   * 
   * Non-Technical: Gets the newest sensor reading with GPS coordinates
   * Technical: Fetches the latest event from fireEventsService
   */
  const loadLatestEvent = async () => {
    const event = await fireEventsService.getLatestEvent();
    setLatestEvent(event);
  };

  /**
   * Load paginated history
   * 
   * Non-Technical: Loads a page of past fire events (5 per page)
   * Technical: Fetches events for a specific page, updates state with
   * events array and pagination metadata
   */
  const loadHistory = async (page: number) => {
    const { events, totalPages } = await fireEventsService.getEventHistory(page, 5);
    setHistoryEvents(events);
    setTotalPages(totalPages);
  };

  /**
   * Navigate to next page of history
   * 
   * Non-Technical: Shows the next page of fire events
   * Technical: Increments currentPage state, which triggers useEffect
   * to load new data
   */
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  /**
   * Navigate to previous page of history
   */
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  /**
   * Get color based on risk level
   *
   * Non-Technical: Returns red for Critical, orange for High
   * Technical: Maps risk string to hex color code (case-insensitive)
   * System only uses Critical and High risk levels
   */
  const getRiskColor = (risk: string) => {
    const riskUpper = risk?.toUpperCase();
    if (riskUpper === 'CRITICAL') return '#DC2626'; // red-600
    if (riskUpper === 'HIGH') return '#EA580C';     // orange-600
    return '#6B7280'; // gray-500 fallback (shouldn't occur in production)
  };

  /**
   * Get card background colors based on risk level
   *
   * Non-Technical: Returns light red background for Critical, light orange for High
   * Technical: Maps risk string to background and border colors for the status card
   */
  const getRiskCardColors = (risk: string) => {
    const riskUpper = risk?.toUpperCase();
    if (riskUpper === 'CRITICAL') {
      return {
        backgroundColor: '#FEE2E2', // red-100
        borderColor: '#FCA5A5',     // red-300
      };
    }
    // Default to HIGH (orange)
    return {
      backgroundColor: '#FFEDD5', // orange-100
      borderColor: '#FDBA74',     // orange-300
    };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#EA580C" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EA580C"
          />
        }
      >
        {/* Latest Status Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Status</Text>
          
          {latestEvent ? (
            <View style={[styles.statusCard, getRiskCardColors(latestEvent.risk)]}>
              <View style={styles.statusHeader}>
                <View style={styles.statusHeaderLeft}>
                  <Text style={styles.statusTime}>
                    {formatEventTime(latestEvent.event_timestamp)}
                  </Text>
                  <Text style={styles.statusLocation}>
                    {latestEvent.latitude.toFixed(4)}°N, {latestEvent.longitude.toFixed(4)}°E{' '}
                    <Text style={styles.nodeNumber}>(Node {latestEvent.node})</Text>
                  </Text>
                </View>
              </View>
              
              <View style={styles.statusBody}>
                <View style={styles.statusLeft}>
                  <Text style={[
                    styles.statusLevel,
                    { color: getRiskColor(latestEvent.risk) }
                  ]}>
                    {latestEvent.risk.toUpperCase()}
                  </Text>
                  <View style={styles.iconRow}>
                    <View style={styles.iconItem}>
                      <FontAwesome6 name="temperature-three-quarters" size={16} color="#1F2937" />
                      <Text style={styles.iconText}>{latestEvent.temperature?.toFixed(1) ?? 'N/A'}°C</Text>
                    </View>
                    <View style={styles.iconItem}>
                      <Entypo name="air" size={16} color="#1F2937" />
                      <Text style={styles.iconText}>{latestEvent.humidity?.toFixed(1) ?? 'N/A'}%</Text>
                    </View>
                    <View style={styles.iconItem}>
                      <MaterialCommunityIcons name="smoke" size={16} color="#1F2937" />
                      <Text style={styles.iconText}>{latestEvent.smoke_gas?.toFixed(0) ?? 'N/A'}PPM</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.statusCard}>
              <Text style={styles.noDataText}>No fire events recorded yet</Text>
            </View>
          )}
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyPage}>
                Page {currentPage}/{totalPages || 1}
              </Text>
            </View>
            
            {historyEvents.length > 0 ? (
              <>
                <View style={styles.historyTable}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.colNode]}>Node</Text>
                    <Text style={[styles.tableHeaderText, styles.colRisk]}>Risk</Text>
                    <Text style={[styles.tableHeaderText, styles.colDate]}>Date | Time</Text>
                  </View>

                  {historyEvents.map((event) => (
                    <View key={event.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.colNode]}>{event.node}</Text>
                      <Text style={[
                        styles.tableCell,
                        styles.colRisk,
                        { color: getRiskColor(event.risk) }
                      ]}>
                        {event.risk}
                      </Text>
                      <Text style={[styles.tableCell, styles.colDate]}>
                        {formatEventTime(event.event_timestamp, true)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Pagination Controls */}
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    onPress={handlePreviousPage}
                    disabled={currentPage === 1}
                    style={styles.paginationButton}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={16}
                      color={currentPage === 1 ? '#D1D5DB' : '#9CA3AF'}
                    />
                    <Text style={[
                      styles.paginationText,
                      currentPage === 1 && styles.paginationTextDisabled
                    ]}>
                      Previous
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleNextPage}
                    disabled={currentPage >= totalPages}
                    style={styles.paginationButton}
                  >
                    <Text style={[
                      styles.paginationText,
                      currentPage >= totalPages && styles.paginationTextDisabled
                    ]}>
                      Next
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={currentPage >= totalPages ? '#D1D5DB' : '#9CA3AF'}
                    />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.noDataText}>No history available</Text>
            )}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
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
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#FFEDD5',
    borderRadius: 24,
    padding: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  statusHeader: {
    marginBottom: 12,
  },
  statusHeaderLeft: {
    flex: 1,
  },
  statusTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusLocation: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  nodeNumber: {
    fontSize: 13,
    fontWeight: '400',
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
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2,
    alignSelf: 'center',
    marginVertical: 16,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  paginationTextDisabled: {
    color: '#D1D5DB',
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
});