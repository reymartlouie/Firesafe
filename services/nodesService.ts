import { supabase } from '../lib/supabaseClient';

export interface Node {
  id: number;
  node_number: number;
  location_name: string;
  latitude: number;
  longitude: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface UpdateNodeLocationParams {
  node_number: number;
  location_name: string;
  latitude: number;
  longitude: number;
  description?: string;
}

export interface SimulatedFireEventParams {
  node_number: number;
  risk: 'HIGH' | 'CRITICAL';
  temperature?: number;
  humidity?: number;
  smoke_gas?: number;
  description?: string;
}

export interface FireEvent {
  id: number;
  node: number;
  risk: string;
  temperature: number;
  humidity: number;
  smoke_gas: number;
  servo_angle: number | null;
  notified: boolean;
  notification_sent_at: string | null;
  session_id: string | null;
  description: string | null;
  event_timestamp: string;
}

class NodeManagementService {
  async isAdmin(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  async isSuperAdmin(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_super_admin');
      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }
  }

  async getAllNodes(): Promise<Node[]> {
    try {
      const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .order('node_number', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching nodes:', error);
      return [];
    }
  }

  async getNodeByNumber(nodeNumber: number): Promise<Node | null> {
    try {
      const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .eq('node_number', nodeNumber)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching node ${nodeNumber}:`, error);
      return null;
    }
  }

  async updateNodeLocation(params: UpdateNodeLocationParams): Promise<Node | null> {
    try {
      const adminStatus = await this.isAdmin();
      if (!adminStatus) {
        throw new Error('Only admins can update node locations');
      }
      const { data, error } = await supabase.rpc('update_node_location', {
        p_node_number: params.node_number,
        p_location_name: params.location_name,
        p_latitude: params.latitude,
        p_longitude: params.longitude,
        p_description: params.description || null,
      });
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      console.error('Error updating node location:', error);
      throw new Error(error.message || 'Failed to update node location');
    }
  }

  async insertSimulatedFireEvent(params: SimulatedFireEventParams): Promise<FireEvent | null> {
    try {
      const superAdminStatus = await this.isSuperAdmin();
      if (!superAdminStatus) {
        throw new Error('Only the super admin can insert simulated fire events');
      }
      const { data, error } = await supabase.rpc('insert_simulated_fire_event', {
        p_node_number: params.node_number,
        p_risk: params.risk,
        p_temperature: params.temperature || null,
        p_humidity: params.humidity || null,
        p_smoke_gas: params.smoke_gas || null,
        p_description: params.description || null,
      });
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      console.error('Error inserting simulated fire event:', error);
      throw new Error(error.message || 'Failed to insert simulated fire event');
    }
  }

  async updateNode(
    nodeNumber: number,
    updates: { latitude: number; longitude: number; location_name: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('nodes')
      .update(updates)
      .eq('node_number', nodeNumber);
    if (error) throw new Error(error.message);
  }

  async addNode(node: {
    node_number: number;
    latitude: number | null;
    longitude: number | null;
    location_name: string | null;
  }): Promise<Node> {
    const { data, error } = await supabase
      .from('nodes')
      .insert(node)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteNode(nodeNumber: number): Promise<void> {
    const { error } = await supabase
      .from('nodes')
      .delete()
      .eq('node_number', nodeNumber);
    if (error) throw new Error(error.message);
  }

  subscribeToNodes(callback: () => void): () => void {
    const channel = supabase
      .channel('nodes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nodes' }, () => {
        callback();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }

  subscribeToNodeChanges(callback: (node: Node) => void) {
    const subscription = supabase
      .channel('nodes_channel')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'nodes',
      }, (payload) => {
        callback(payload.new as Node);
      })
      .subscribe();
    return subscription;
  }

  async getNodeName(nodeNumber: number): Promise<string> {
    try {
      const node = await this.getNodeByNumber(nodeNumber);
      return node?.location_name || `Node ${nodeNumber}`;
    } catch (error) {
      console.error('Error getting node name:', error);
      return `Node ${nodeNumber}`;
    }
  }
}

export default new NodeManagementService();