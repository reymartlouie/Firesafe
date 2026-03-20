import React, { useEffect, useState } from "react";
import {
  View,
  Switch,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabaseClient";
/**
 * NodeToggle
 *
 * Technical:     Fetches is_active from sensor_nodes WHERE id = nodeId.
 *                Renders a Switch that calls UPDATE sensor_nodes SET is_active
 *                on toggle. Optimistically updates local state immediately,
 *                rolls back on error.
 * Non-technical: Shows an ON/OFF toggle for the node. Tap it to remotely
 *                start or stop the sensor node from your phone.
 */

interface Props {
  nodeId: number;
}

export default function NodeToggle({ nodeId }: Props) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);

  // ─── Fetch current state on mount ─────────────────────────────────────────
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("nodes")
          .select("is_active")
          .eq("id", nodeId)
          .single();

        if (error) throw error;
        setIsActive(data?.is_active ?? false);
      } catch (err) {
        console.error("[NodeToggle] Failed to fetch is_active:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [nodeId]);

  // ─── Toggle handler ────────────────────────────────────────────────────────
  const handleToggle = async (value: boolean) => {
    // Optimistic update — feel instant to the user
    setIsActive(value);
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("nodes")
        .update({ is_active: value })
        .eq("id", nodeId);

      if (error) throw error;

      console.log(`[NodeToggle] Node ${nodeId} is_active set to ${value}`);
    } catch (err) {
      // Rollback on failure
      console.error("[NodeToggle] Failed to update is_active:", err);
      setIsActive(!value);
    } finally {
      setUpdating(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Node Status</Text>
          <Text
            style={[styles.status, isActive ? styles.active : styles.inactive]}
          >
            {isActive ? "Active" : "Inactive"}
          </Text>
        </View>

        <View style={styles.switchWrapper}>
          {updating && (
            <ActivityIndicator size="small" style={styles.spinner} />
          )}
          <Switch
            value={isActive}
            onValueChange={handleToggle}
            disabled={updating}
            trackColor={{ false: "#6B7280", true: "#16A34A" }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <Text style={styles.hint}>
        {isActive
          ? "Node is scanning. Toggle OFF to stop remotely."
          : "Toggle ON to activate this node remotely."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 2,
  },
  status: {
    fontSize: 16,
    fontWeight: "600",
  },
  active: {
    color: "#16A34A",
  },
  inactive: {
    color: "#6B7280",
  },
  switchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  spinner: {
    marginRight: 4,
  },
  hint: {
    color: "#6B7280",
    fontSize: 12,
  },
});