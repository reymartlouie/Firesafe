import { supabase } from '../lib/supabaseClient';

/**
 * Interface for Fire Event data structure
 * 
 * Non-Technical: This defines what information each fire event contains.
 * Now includes nodes data via JOIN for location information.
 * 
 * Technical: TypeScript interface matching the fire_events table schema
 * with nested nodes relationship from JOIN query.
 */
export interface FireEvent {
  id: string;
  node: number;
  event_timestamp: string;
  risk: string;
  temperature: number;
  smoke_gas: number;
  humidity: number;
  servo_angle: string;
  notification_sent_at: string | null;
  notified: boolean;
  created_at: string;
  session_id: string | null;
  
  // Nested nodes data (from JOIN)
  nodes: {
    location_name: string;
    latitude: number;
    longitude: number;
  };
}

class FireEventsService {
  /**
   * Base Supabase select query with nodes JOIN
   * 
   * Non-Technical: Standard query template that includes location data
   * Technical: Supabase automatically JOINs via foreign key relationship
   */
  private baseSelect = `
    *,
    nodes (
      location_name,
      latitude,
      longitude
    )
  `;

  /**
   * Get the latest fire event (most recent by event_timestamp)
   * 
   * Non-Technical: Gets the most recent sensor reading with location info
   * Technical: Queries fire_events with nodes JOIN, ordered by
   * event_timestamp descending, returns single record
   * 
   * @returns Promise<FireEvent | null> - Latest event or null if none exist
   */
  async getLatestEvent(): Promise<FireEvent | null> {
    try {
      const { data, error } = await supabase
        .from('fire_events')
        .select(this.baseSelect)
        .order('event_timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data as unknown as FireEvent;
    } catch (error) {
      console.error('Error fetching latest event:', error);
      return null;
    }
  }

  /**
   * Get paginated fire events history
   * 
   * Non-Technical: Gets a list of past fire events with locations,
   * showing newest first, with support for pagination (e.g., page 1, 2, 3)
   * 
   * Technical: Queries fire_events with pagination (limit + offset),
   * ordered by event_timestamp descending. Also fetches total count for
   * calculating total pages. Includes nodes JOIN.
   * 
   * @param page - Page number (1-indexed)
   * @param limit - Number of records per page (default: 5)
   * @returns Object containing events array, totalCount, and totalPages
   */
  async getEventHistory(page: number = 1, limit: number = 5): Promise<{
    events: FireEvent[];
    totalCount: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      // Get total count for pagination
      const { count } = await supabase
        .from('fire_events')
        .select('*', { count: 'exact', head: true });

      // Get paginated events with location data
      const { data, error } = await supabase
        .from('fire_events')
        .select(this.baseSelect)
        .order('event_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        events: (data as unknown as FireEvent[]) || [],
        totalCount,
        totalPages,
      };
    } catch (error) {
      console.error('Error fetching event history:', error);
      return {
        events: [],
        totalCount: 0,
        totalPages: 0,
      };
    }
  }

  /**
   * Get events by node number
   * 
   * Non-Technical: Gets all events from a specific sensor node with location
   * (e.g., all readings from Node 1)
   * 
   * Technical: Filters fire_events by node column, includes nodes JOIN
   * 
   * @param nodeNumber - The node ID (1, 2, 3, or 4)
   * @returns Array of FireEvent objects for that node
   */
  async getEventsByNode(nodeNumber: number): Promise<FireEvent[]> {
    try {
      const { data, error } = await supabase
        .from('fire_events')
        .select(this.baseSelect)
        .eq('node', nodeNumber)
        .order('event_timestamp', { ascending: false });

      if (error) throw error;
      return (data as unknown as FireEvent[]) || [];
    } catch (error) {
      console.error('Error fetching events by node:', error);
      return [];
    }
  }

  /**
   * Get events by risk level
   * 
   * Non-Technical: Gets all events that match a specific risk level
   * (e.g., all "High" risk events) with location information
   * 
   * Technical: Filters fire_events by risk column (case-insensitive match),
   * includes nodes JOIN
   * 
   * @param riskLevel - Risk level string (e.g., 'High', 'Critical')
   * @returns Array of FireEvent objects matching the risk level
   */
  async getEventsByRisk(riskLevel: string): Promise<FireEvent[]> {
    try {
      const { data, error } = await supabase
        .from('fire_events')
        .select(this.baseSelect)
        .eq('risk', riskLevel)
        .order('event_timestamp', { ascending: false });

      if (error) throw error;
      return (data as unknown as FireEvent[]) || [];
    } catch (error) {
      console.error('Error fetching events by risk:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time fire events
   * 
   * Non-Technical: Listens for new sensor readings in real-time. When a new
   * fire event is detected, your callback function runs automatically.
   * 
   * Technical: Uses Supabase realtime subscriptions to listen for INSERT events
   * on fire_events table. Since realtime doesn't support JOINs, we manually
   * fetch nodes data for each new event. Cleanup is handled by calling
   * .unsubscribe() on the returned subscription.
   * 
   * @param callback - Function to call when new event arrives
   * @returns Subscription object (call .unsubscribe() to stop listening)
   */
  subscribeToEvents(callback: (event: FireEvent) => void, channelId: string = 'default') {
    const subscription = supabase
      .channel(`fire_events_channel_${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fire_events',
        },
        async (payload) => {
          const newEvent = payload.new as any;
          
          // Fetch nodes data for this event
          // (realtime subscriptions don't support JOINs)
          const { data: sensorNode } = await supabase
            .from('nodes')
            .select('location_name, latitude, longitude')
            .eq('node_number', newEvent.node)
            .single();

          // Combine event with nodes data
          const enrichedEvent: FireEvent = {
            ...newEvent,
            nodes: sensorNode || {
              location_name: `Node ${newEvent.node}`,
              latitude: 0,
              longitude: 0,
            },
          };

          callback(enrichedEvent);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Get node name mapping (legacy method)
   * 
   * Non-Technical: Converts node numbers (1, 2, 3, 4) to readable location names
   * (e.g., 1 → "Purok Maligaya")
   * 
   * Technical: Maps node numbers to location names using a hardcoded object.
   * This method is kept for backward compatibility but new code should use
   * event.nodes.location_name instead.
   * 
   * @param nodeNumber - Node ID (1-4)
   * @returns Location name string
   */
  getNodeName(nodeNumber: number): string {
    const nodeNames: { [key: number]: string } = {
      1: 'Purok Maligaya',
      2: 'Purok Bugtong Bato',
      3: 'Purok Bakhaw',
      4: 'Purok Boracay',
    };

    return nodeNames[nodeNumber] || `Node ${nodeNumber}`;
  }

  /**
   * Get risk level color
   * 
   * Non-Technical: Returns the display color for each risk level
   * - Red for Critical (immediate danger)
   * - Orange for High (elevated risk)
   * 
   * Technical: Maps risk strings to hex color codes for UI display.
   * System only uses Critical and High risk levels.
   * 
   * @param risk - Risk level string ('Critical' or 'High')
   * @returns Hex color code
   */
  getRiskColor(risk: string): string {
    const riskUpper = risk?.toUpperCase();
    if (riskUpper === 'CRITICAL') return '#DC2626'; // red-600
    if (riskUpper === 'HIGH') return '#EA580C';     // orange-600
    return '#6B7280'; // gray-500 fallback (shouldn't occur)
  }
}

export default new FireEventsService();