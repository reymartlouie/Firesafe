import { supabase } from '../lib/supabaseClient';

export interface Node {
  node_number: number;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
}

const nodesService = {
  getAllNodes: async (): Promise<Node[]> => {
    const { data, error } = await supabase
      .from('nodes')
      .select('node_number, latitude, longitude, location_name')
      .order('node_number');

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getNodeByNumber: async (nodeNumber: number): Promise<Node | null> => {
    const { data, error } = await supabase
      .from('nodes')
      .select('node_number, latitude, longitude, location_name')
      .eq('node_number', nodeNumber)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  updateNode: async (
    nodeNumber: number,
    updates: { latitude: number; longitude: number; location_name: string }
  ) => {
    const { error } = await supabase
      .from('nodes')
      .update(updates)
      .eq('node_number', nodeNumber);

    if (error) throw new Error(error.message);
  },

  addNode: async (node: {
    node_number: number;
    latitude: number | null;
    longitude: number | null;
    location_name: string | null;
  }): Promise<Node> => {
    const { data, error } = await supabase
      .from('nodes')
      .insert(node)
      .select('node_number, latitude, longitude, location_name')
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  deleteNode: async (nodeNumber: number) => {
    const { error } = await supabase
      .from('nodes')
      .delete()
      .eq('node_number', nodeNumber);

    if (error) throw new Error(error.message);
  },
};

export default nodesService;
