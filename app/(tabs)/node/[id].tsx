import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import fireEventsService, { FireEvent } from '../../../services/fireEventsService';

/**
 * Format timestamp for display
 * 
 * Non-Technical: Converts database timestamp to readable format
 * Technical: Formats ISO timestamp strings for user display
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

export default function NodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nodeNumber = parseInt(id || '1');

  const [latestEvent, setLatestEvent] = useState<FireEvent | null>(null);
  const [historyEvents, setHistoryEvents] = useState<FireEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();

    // Subscribe to real-time updates for this specific node
    const subscription = fireEventsService.subscribeToEvents((newEvent) => {
      // Only update if the event is from this node
      if (newEvent.node === nodeNumber) {
        console.log(`🔥 New event for Node ${nodeNumber}:`, newEvent);
        setLatestEvent(newEvent);
        loadHistory(currentPage);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [nodeNumber]);

  useEffect(() => {
    loadHistory(currentPage);
  }, [currentPage, nodeNumber]);

  /**
   * Load initial data for this specific node
   * 
   * Non-Technical: Loads the latest sensor reading and history for this node only
   * Technical: Fetches node-specific data using fireEventsService.getEventsByNode()
   */
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLatestEvent(),
        loadHistory(1),
      ]);
    } catch (error) {
      console.error('Error loading node data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh data when user pulls down
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  /**
   * Load the most recent event for this specific node
   * 
   * Non-Technical: Gets the newest sensor reading from this node only
   * Technical: Fetches all events for this node and takes the first one
   */
  const loadLatestEvent = async () => {
    const events = await fireEventsService.getEventsByNode(nodeNumber);
    if (events.length > 0) {
      setLatestEvent(events[0]); // First event is the most recent
    } else {
      setLatestEvent(null);
    }
  };

  /**
   * Load paginated history for this specific node
   * 
   * Non-Technical: Loads past fire events for this node (5 per page)
   * Technical: Implements manual pagination for node-filtered results
   */
  const loadHistory = async (page: number) => {
    const allEvents = await fireEventsService.getEventsByNode(nodeNumber);
    
    // Manual pagination
    const limit = 5;
    const offset = (page - 1) * limit;
    const paginatedEvents = allEvents.slice(offset, offset + limit);
    const totalPages = Math.ceil(allEvents.length / limit);
    
    setHistoryEvents(paginatedEvents);
    setTotalPages(totalPages);
  };

  /**
   * Navigate to next page
   */
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  /**
   * Navigate to previous page
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
   */
  const getRiskColor = (risk: string) => {
    const riskUpper = risk?.toUpperCase();
    if (riskUpper === 'CRITICAL') return '#DC2626';
    if (riskUpper === 'HIGH') return '#EA580C';
    return '#6B7280';
  };

  /**
   * Get background and border colors for status card
   */
  const getCardColors = (risk: string) => {
    const riskUpper = risk?.toUpperCase();
    if (riskUpper === 'CRITICAL') {
      return {
        backgroundColor: '#FEE2E2',
        borderColor: '#FCA5A5',
      };
    }
    if (riskUpper === 'HIGH') {
      return {
        backgroundColor: '#FFEDD5',
        borderColor: '#FDBA74',
      };
    }
    return {
      backgroundColor: '#F3F4F6',
      borderColor: '#E5E7EB',
    };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#EA580C" />
        <Text style={styles.loadingText}>Loading node data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Node {nodeNumber}</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EA580C"
          />
        }
      >
        {/* Latest Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Status</Text>

          {latestEvent ? (
            <View
              style={[
                styles.statusCard,
                getCardColors(latestEvent.risk),
              ]}
            >
              <View style={styles.statusHeader}>
                <View style={styles.statusHeaderLeft}>
                  <Text style={styles.statusTime}>
                    {formatEventTime(latestEvent.event_timestamp)}
                  </Text>
                  <Text style={styles.statusLocation}>
                    {latestEvent.sensor_nodes.latitude.toFixed(4)}°N, {' '} {latestEvent.sensor_nodes.longitude.toFixed(4)}°E {' '}({latestEvent.sensor_nodes.location_name})
                  </Text>
                </View>
              </View>

              <View style={styles.statusBody}>
                <Text
                  style={[
                    styles.statusLevel,
                    { color: getRiskColor(latestEvent.risk) }
                  ]}
                >
                  {latestEvent.risk.toUpperCase()}
                </Text>

                <View style={styles.iconRow}>
                  <View style={styles.iconItem}>
                    <FontAwesome6
                      name="temperature-three-quarters"
                      size={16}
                      color="#1F2937"
                    />
                    <Text style={styles.iconText}>
                      {latestEvent.temperature?.toFixed(1) ?? 'N/A'}°C
                    </Text>
                  </View>

                  <View style={styles.iconItem}>
                    <Entypo name="air" size={16} color="#1F2937" />
                    <Text style={styles.iconText}>
                      {latestEvent.humidity?.toFixed(1) ?? 'N/A'}%
                    </Text>
                  </View>

                  <View style={styles.iconItem}>
                    <MaterialCommunityIcons
                      name="smoke"
                      size={16}
                      color="#1F2937"
                    />
                    <Text style={styles.iconText}>
                      {latestEvent.smoke_gas?.toFixed(0) ?? 'N/A'}PPM
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.statusCard}>
              <Text style={styles.noDataText}>
                No events recorded for Node {nodeNumber}
              </Text>
            </View>
          )}
        </View>

        {/* Node History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Node History</Text>

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
                    <Text style={[styles.tableHeaderText, styles.colRisk]}>
                      Risk
                    </Text>
                    <Text style={[styles.tableHeaderText, styles.colDate]}>
                      Date | Time
                    </Text>
                  </View>

                  {historyEvents.map((event) => (
                    <View key={event.id} style={styles.tableRow}>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.colRisk,
                          { color: getRiskColor(event.risk) },
                        ]}
                      >
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
              <Text style={styles.noDataText}>
                No history available for Node {nodeNumber}
              </Text>
            )}
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
    padding: 20,
    paddingVertical: 24,
    borderWidth: 1,
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

  statusBody: {
    alignItems: 'center',
  },
  statusLevel: {
    fontSize: 64,
    fontWeight: '500',
    marginVertical: 16,
    letterSpacing: -2,
  },

  iconRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 12,
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