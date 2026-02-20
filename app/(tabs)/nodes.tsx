import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
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
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editLocationName, setEditLocationName] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingNode, setDeletingNode] = useState<Node | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add node modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addNodeNumber, setAddNodeNumber] = useState('');
  const [addLocationName, setAddLocationName] = useState('');
  const [addLatitude, setAddLatitude] = useState('');
  const [addLongitude, setAddLongitude] = useState('');
  const [adding, setAdding] = useState(false);

  // Alert modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const fetchNodes = useCallback(async () => {
    try {
      setError(null);
      const data = await nodesService.getAllNodes();
      setNodes(data);
    } catch (err: any) {
      console.error('Failed to fetch nodes:', err.message);
      setError(err.message || 'Failed to fetch nodes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNodes();

    const unsubscribe = nodesService.subscribeToNodes(() => {
      fetchNodes();
    });

    return () => {
      unsubscribe();
    };
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

  const openDeleteModal = (node: Node) => {
    setDeletingNode(node);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!deletingNode) return;

    setDeleting(true);
    try {
      await nodesService.deleteNode(deletingNode.node_number);
      setNodes((prev) => prev.filter((n) => n.node_number !== deletingNode.node_number));
      setDeleteModalVisible(false);
      setAlertTitle('Success');
      setAlertMessage(`Node ${deletingNode.node_number} has been removed.`);
      setAlertVisible(true);
    } catch (err: any) {
      setAlertTitle('Error');
      setAlertMessage(err.message || 'Failed to delete node.');
      setAlertVisible(true);
    } finally {
      setDeleting(false);
    }
  };

  const openAddModal = () => {
    const nextNumber = nodes.length > 0
      ? Math.max(...nodes.map((n) => n.node_number)) + 1
      : 1;
    setAddNodeNumber(nextNumber.toString());
    setAddLocationName('');
    setAddLatitude('');
    setAddLongitude('');
    setAddModalVisible(true);
  };

  const handleAdd = async () => {
    const nodeNum = parseInt(addNodeNumber, 10);
    if (isNaN(nodeNum) || nodeNum <= 0) {
      setAlertTitle('Invalid Input');
      setAlertMessage('Node number must be a valid positive number.');
      setAlertVisible(true);
      return;
    }

    if (nodes.some((n) => n.node_number === nodeNum)) {
      setAlertTitle('Duplicate');
      setAlertMessage(`Node ${nodeNum} already exists.`);
      setAlertVisible(true);
      return;
    }

    const lat = addLatitude.trim() ? parseFloat(addLatitude) : null;
    const lng = addLongitude.trim() ? parseFloat(addLongitude) : null;

    if ((addLatitude.trim() && lat === null) || (addLongitude.trim() && lng === null) ||
        (addLatitude.trim() && isNaN(lat!)) || (addLongitude.trim() && isNaN(lng!))) {
      setAlertTitle('Invalid Input');
      setAlertMessage('Latitude and longitude must be valid numbers.');
      setAlertVisible(true);
      return;
    }

    setAdding(true);
    try {
      const newNode = await nodesService.addNode({
        node_number: nodeNum,
        latitude: lat,
        longitude: lng,
        location_name: addLocationName.trim() || null,
      });
      setNodes((prev) => [...prev, newNode].sort((a, b) => a.node_number - b.node_number));
      setAddModalVisible(false);
      setAlertTitle('Success');
      setAlertMessage(`Node ${nodeNum} has been added.`);
      setAlertVisible(true);
    } catch (err: any) {
      setAlertTitle('Error');
      setAlertMessage(err.message || 'Failed to add node.');
      setAlertVisible(true);
    } finally {
      setAdding(false);
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
          <View style={styles.accountEmojiContainer}>
            <Text style={styles.accountEmoji}>👤</Text>
          </View>
          <Text style={styles.accountText}>Account</Text>
        </TouchableOpacity>
      </View>

      {/* Nodes List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchNodes();
            }}
            tintColor="#1F2937"
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#1F2937" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.emptyStateTitle}>Failed to load nodes</Text>
            <Text style={styles.emptyStateSubtitle}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                fetchNodes();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : nodes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="hardware-chip-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No nodes found</Text>
            <Text style={styles.emptyStateSubtitle}>Pull down to refresh</Text>
          </View>
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
                  <>
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
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        openDeleteModal(node);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </>
                )}
                <Ionicons name="arrow-forward" size={24} color="#1F2937" />
              </View>
            </TouchableOpacity>
          ))
        )}
        {/* Add Node Button - admin only, shown at the bottom */}
        {!loading && !error && isAdmin && (
          <TouchableOpacity style={styles.addNodeCard} onPress={openAddModal}>
            <Ionicons name="add-circle-outline" size={32} color="#6B7280" />
            <Text style={styles.addNodeText}>Add New Node</Text>
          </TouchableOpacity>
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

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Remove Node</Text>
            <Text style={styles.deleteMessage}>
              Are you sure you want to remove Node {deletingNode?.node_number}
              {deletingNode?.location_name ? ` (${deletingNode.location_name})` : ''}?
              This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmButton, deleting && { opacity: 0.6 }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                <Text style={styles.saveButtonText}>
                  {deleting ? 'Removing...' : 'Remove'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Node Modal */}
      <Modal visible={addModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Node</Text>

            <Text style={styles.inputLabel}>Node Number</Text>
            <TextInput
              style={styles.input}
              value={addNodeNumber}
              onChangeText={setAddNodeNumber}
              placeholder="e.g. 1"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Location Name</Text>
            <TextInput
              style={styles.input}
              value={addLocationName}
              onChangeText={setAddLocationName}
              placeholder="Enter location name (optional)"
              placeholderTextColor="#6B7280"
            />

            <Text style={styles.inputLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={addLatitude}
              onChangeText={setAddLatitude}
              placeholder="e.g. 14.5995 (optional)"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={addLongitude}
              onChangeText={setAddLongitude}
              placeholder="e.g. 120.9842 (optional)"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, adding && { opacity: 0.6 }]}
                onPress={handleAdd}
                disabled={adding}
              >
                <Text style={styles.saveButtonText}>
                  {adding ? 'Adding...' : 'Add'}
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
  accountEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountEmoji: {
    fontSize: 28,
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
    paddingBottom: 140,
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
  addNodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 40,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    gap: 10,
  },
  addNodeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  deleteMessage: {
    fontSize: 15,
    color: '#D1D1D6',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#1F2937',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
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
