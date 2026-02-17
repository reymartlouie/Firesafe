import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomModalAlert from '../CustomModalAlert';
import { useAdmin } from '../../contexts/AdminContext';
import nodesService, { Node } from '../../services/nodesService';

export default function NodesScreen() {
  const { isAdmin } = useAdmin();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editLocationName, setEditLocationName] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [saving, setSaving] = useState(false);

  // Alert modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const fetchNodes = useCallback(async () => {
    try {
      const data = await nodesService.getAllNodes();
      setNodes(data);
    } catch (err: any) {
      console.error('Failed to fetch nodes:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const openEditModal = (node: Node) => {
    setEditingNode(node);
    setEditLocationName(node.location_name ?? '');
    setEditLatitude(node.latitude?.toString() ?? '');
    setEditLongitude(node.longitude?.toString() ?? '');
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingNode) return;

    const lat = parseFloat(editLatitude);
    const lng = parseFloat(editLongitude);

    if (isNaN(lat) || isNaN(lng)) {
      setAlertTitle('Invalid Input');
      setAlertMessage('Latitude and longitude must be valid numbers.');
      setAlertVisible(true);
      return;
    }

    setSaving(true);
    try {
      await nodesService.updateNode(editingNode.node_number, {
        latitude: lat,
        longitude: lng,
        location_name: editLocationName.trim(),
      });

      // Update local state
      setNodes((prev) =>
        prev.map((n) =>
          n.node_number === editingNode.node_number
            ? { ...n, latitude: lat, longitude: lng, location_name: editLocationName.trim() }
            : n
        )
      );

      setEditModalVisible(false);
      setAlertTitle('Success');
      setAlertMessage('Node location updated successfully.');
      setAlertVisible(true);
    } catch (err: any) {
      setAlertTitle('Error');
      setAlertMessage(err.message || 'Failed to update node.');
      setAlertVisible(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Nodes</Text>
          <Text style={styles.headerSubtitle}>Early alerts. Safer communities.</Text>
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

      {/* Nodes List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#1F2937" style={{ marginTop: 40 }} />
        ) : (
          nodes.map((node) => (
            <TouchableOpacity
              key={node.node_number}
              style={styles.nodeCard}
              onPress={() => router.push(`/node/${node.node_number}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.nodeTitle}>Node {node.node_number}</Text>
                <Text style={styles.nodeSubtitle}>
                  {node.location_name || 'No location set'}
                </Text>
              </View>
              <View style={styles.cardActions}>
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      openEditModal(node);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="create-outline" size={22} color="#6B7280" />
                  </TouchableOpacity>
                )}
                <Ionicons name="arrow-forward" size={24} color="#1F2937" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Edit Node Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit Node {editingNode?.node_number}
            </Text>

            <Text style={styles.inputLabel}>Location Name</Text>
            <TextInput
              style={styles.input}
              value={editLocationName}
              onChangeText={setEditLocationName}
              placeholder="Enter location name"
              placeholderTextColor="#6B7280"
            />

            <Text style={styles.inputLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={editLatitude}
              onChangeText={setEditLatitude}
              placeholder="e.g. 14.5995"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={editLongitude}
              onChangeText={setEditLongitude}
              placeholder="e.g. 120.9842"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Alert Modal */}
      <CustomModalAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
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
    marginBottom: 20,
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  nodeCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 32,
    padding: 40,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nodeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  nodeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 6,
  },
  // Edit Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D1D1D6',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#D1D1D6',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: '#34C759',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
