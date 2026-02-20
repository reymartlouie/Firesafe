import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const hPad        = Math.min(Math.round(width * 0.07),   48);
  const cardPadV    = Math.min(Math.round(width * 0.064),  40);
  const histPad     = Math.min(Math.round(width * 0.075),  48);
  const statusFont  = Math.min(Math.round(width * 0.14),   68);
  const rowPadV     = Math.min(Math.round(width * 0.037),  20);
  const cellFont    = Math.min(Math.round(width * 0.037),  16);
  const hdrFont     = Math.min(Math.round(width * 0.034),  15);
  const titleFont   = Math.min(Math.round(width * 0.096),  44);
  const sectionFont = Math.min(Math.round(width * 0.075),  36);
  const bodyFont    = Math.min(Math.round(width * 0.04),   18);
  const smallFont   = Math.min(Math.round(width * 0.032),  14);
  const avatarSize  = Math.min(Math.round(width * 0.128),  56);
  const iconSize    = Math.min(Math.round(width * 0.043),  20);
  const iconGap     = Math.min(Math.round(width * 0.064),  28);

  const [user, setUser] = useState<any>(null);
  const [latestEvent, setLatestEvent] = useState<FireEvent | null>(null);
  const [historyEvents, setHistoryEvents] = useState<FireEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Ref so the realtime callback always reads the latest page without a stale closure
  const currentPageRef = useRef(1);
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    loadInitialData();

    // Subscribe to real-time updates
    const subscription = fireEventsService.subscribeToEvents((newEvent) => {
      console.log('🔥 New fire event detected:', newEvent);
      setLatestEvent(newEvent);
      // Refresh history using the ref so we always reload the currently viewed page
      loadHistory(currentPageRef.current);
    }, 'dashboard');

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

  const getRiskBadgeColors = (risk: string) => {
    const riskUpper = risk?.toUpperCase();
    if (riskUpper === 'CRITICAL') {
      return { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' };
    }
    return { backgroundColor: '#FFEDD5', borderColor: '#FDBA74' };
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
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <View>
          <Text style={[styles.headerTitle, { fontSize: titleFont }]}>Dashboard</Text>
          <Text style={[styles.headerSubtitle, { fontSize: bodyFont }]}>
            Welcome back, {user?.username || 'User'}!
          </Text>
        </View>
        <TouchableOpacity
          style={styles.accountButton}
          onPress={() => router.push('/account')}
        >
          <View style={[styles.accountEmojiContainer, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
            <Text style={[styles.accountEmoji, { fontSize: Math.round(avatarSize * 0.58) }]}>👤</Text>
          </View>
          <Text style={[styles.accountText, { fontSize: smallFont }]}>Account</Text>
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
        <View style={[styles.section, { paddingHorizontal: hPad }]}>
          <Text style={[styles.sectionTitle, { fontSize: sectionFont }]}>Latest Status</Text>

          {latestEvent ? (
            <View style={[styles.statusCard, getRiskCardColors(latestEvent.risk), { padding: hPad, paddingVertical: cardPadV }]}>
              <View style={styles.statusHeader}>
                <View style={styles.statusHeaderLeft}>
                  <Text style={[styles.statusTime, { fontSize: smallFont }]}>
                    {formatEventTime(latestEvent.event_timestamp)}
                  </Text>
                  <Text style={[styles.statusLocation, { fontSize: bodyFont }]}>
                    {latestEvent.nodes?.location_name ?? 'Unknown Location'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusBody}>
                <View style={styles.statusLeft}>
                  <Text
                    numberOfLines={1}
                    style={[styles.statusLevel, { color: getRiskColor(latestEvent.risk), fontSize: statusFont }]}
                  >
                    {latestEvent.risk.toUpperCase()}
                  </Text>
                  <View style={[styles.iconRow, { gap: iconGap }]}>
                    <View style={styles.iconItem}>
                      <FontAwesome6 name="temperature-three-quarters" size={iconSize} color="#1F2937" />
                      <Text style={[styles.iconText, { fontSize: cellFont }]}>{latestEvent.temperature?.toFixed(1) ?? 'N/A'}°C</Text>
                    </View>
                    <View style={styles.iconItem}>
                      <Entypo name="air" size={iconSize} color="#1F2937" />
                      <Text style={[styles.iconText, { fontSize: cellFont }]}>{latestEvent.humidity?.toFixed(1) ?? 'N/A'}%</Text>
                    </View>
                    <View style={styles.iconItem}>
                      <MaterialCommunityIcons name="smoke" size={iconSize} color="#1F2937" />
                      <Text style={[styles.iconText, { fontSize: cellFont }]}>{latestEvent.smoke_gas?.toFixed(0) ?? 'N/A'}PPM</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.statusCard, { padding: hPad, paddingVertical: cardPadV }]}>
              <Text style={[styles.noDataText, { fontSize: cellFont }]}>No fire events recorded yet</Text>
            </View>
          )}
        </View>

        {/* History Section */}
        <View style={[styles.section, { paddingHorizontal: hPad }]}>
          <Text style={[styles.sectionTitle, { fontSize: sectionFont }]}>History</Text>
          <View style={[styles.historyCard, { padding: histPad }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyPage, { fontSize: smallFont }]}>
                Page {currentPage}/{totalPages || 1}
              </Text>
            </View>
            
            {historyEvents.length > 0 ? (
              <>
                <View style={styles.historyTable}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.colRisk, { fontSize: hdrFont }]}>Risk</Text>
                    <Text style={[styles.tableHeaderText, styles.colDate, { fontSize: hdrFont }]}>Date | Time</Text>
                    <Text style={[styles.tableHeaderText, styles.colNode, { fontSize: hdrFont }]}>Node</Text>
                  </View>

                  {historyEvents.map((event) => (
                    <View key={event.id} style={[styles.tableRow, { paddingVertical: rowPadV }]}>
                      <View style={styles.colRisk}>
                        <View style={[styles.riskBadge, getRiskBadgeColors(event.risk)]}>
                          <Text style={[styles.tableCell, { color: getRiskColor(event.risk), fontSize: cellFont }]}>
                            {event.risk}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.tableCell, styles.colDate, { fontSize: cellFont }]}>
                        {formatEventTime(event.event_timestamp, true)}
                      </Text>
                      <Text style={[styles.tableCell, styles.colNode, { fontSize: cellFont }]}>{event.node}</Text>
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
                      { fontSize: smallFont },
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
                      { fontSize: smallFont },
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
              <Text style={[styles.noDataText, { fontSize: cellFont }]}>No history available</Text>
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
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
  },
  headerSubtitle: {
    color: '#000000',
    fontWeight: '400',
  },
  accountButton: {
    alignItems: 'center',
  },
  accountEmojiContainer: {
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountEmoji: {},
  accountText: {
    color: '#000000',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  section: {
    paddingTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#FFEDD5',
    borderRadius: 24,
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
    color: '#6B7280',
    marginBottom: 4,
  },
  statusLocation: {
    fontWeight: '600',
    color: '#1F2937',
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
    marginTop: 12,
  },
  iconItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  iconText: {
    color: '#1F2937',
    fontWeight: '400',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyHeader: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  historyPage: {
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
    fontWeight: '700',
    color: '#000000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    color: '#1F2937',
    fontWeight: '400',
  },
  colNode: {
    width: '20%',
    paddingLeft: 8,
    textAlign: 'right',
  },
  colRisk: {
    width: '32%',
    justifyContent: 'center',
    flexShrink: 0,
  },
  riskBadge: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 4,
    alignSelf: 'flex-start',
  },
  colDate: {
    flex: 1,
    paddingLeft: 8,
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
    color: '#9CA3AF',
  },
  paginationTextDisabled: {
    color: '#D1D5DB',
  },
  noDataText: {
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
});