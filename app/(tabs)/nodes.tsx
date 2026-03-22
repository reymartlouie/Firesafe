import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { useTheme } from '../../contexts/ThemeContext';
import nodeManagementService, { Node/*, SimulatedFireEventParams*/ } from '../../services/nodesService';

const light = { bg: '#FFFFFF', card: '#F3F4F6', border: '#E5E7EB', chip: '#E5E7EB', textPrimary: '#111827', textSecondary: '#6B7280', simulatorToggleBg: '#FFF7ED', simulatorToggleBorder: '#FDBA74', simulatorControlsBg: '#F9FAFB', nodeSelectorBg: '#FFFFFF', nodeSelectorActiveBg: '#FFF7ED' };
const dark  = { bg: '#191919', card: '#202020', border: '#2A2A2A', chip: '#262626', textPrimary: '#E6E6E5', textSecondary: '#9B9A97', simulatorToggleBg: '#2A1A0A', simulatorToggleBorder: '#92400E', simulatorControlsBg: '#202020', nodeSelectorBg: '#2A2A2A', nodeSelectorActiveBg: '#3D1F0A' };

export default function NodesScreen() {
  const { isAdmin } = useAdmin();
  const { isDark } = useTheme();
  const c = isDark ? dark : light;

  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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

  // // Simulator state
  // const [showSimulator, setShowSimulator] = useState(false);
  // const [selectedNode, setSelectedNode] = useState<number>(1);
  // const [simulatorLoading, setSimulatorLoading] = useState(false);
  // const [simTemperature, setSimTemperature] = useState('');
  // const [simHumidity, setSimHumidity] = useState('');
  // const [simSmokeGas, setSimSmokeGas] = useState('');

  const fetchNodes = useCallback(async () => {
    try {
      setError(null);
      const data = await nodeManagementService.getAllNodes();
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
    // nodeManagementService.isSuperAdmin().then(setIsSuperAdmin).catch(() => {});

    const unsubscribe = nodeManagementService.subscribeToNodes(() => {
      fetchNodes();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchNodes]);

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

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
      showAlert('Invalid Input', 'Latitude and longitude must be valid numbers.');
      return;
    }

    setSaving(true);
    try {
      await nodeManagementService.updateNode(editingNode.node_number, {
        latitude: lat,
        longitude: lng,
        location_name: editLocationName.trim(),
      });

      setNodes((prev) =>
        prev.map((n) =>
          n.node_number === editingNode.node_number
            ? { ...n, latitude: lat, longitude: lng, location_name: editLocationName.trim() }
            : n
        )
      );

      setEditModalVisible(false);
      showAlert('Success', 'Node location updated successfully.');
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to update node.');
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
      await nodeManagementService.deleteNode(deletingNode.node_number);
      setNodes((prev) => prev.filter((n) => n.node_number !== deletingNode.node_number));
      setDeleteModalVisible(false);
      showAlert('Success', `Node ${deletingNode.node_number} has been removed.`);
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to delete node.');
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
      showAlert('Invalid Input', 'Node number must be a valid positive number.');
      return;
    }

    if (nodes.some((n) => n.node_number === nodeNum)) {
      showAlert('Duplicate', `Node ${nodeNum} already exists.`);
      return;
    }

    const lat = addLatitude.trim() ? parseFloat(addLatitude) : null;
    const lng = addLongitude.trim() ? parseFloat(addLongitude) : null;

    if ((addLatitude.trim() && isNaN(lat!)) || (addLongitude.trim() && isNaN(lng!))) {
      showAlert('Invalid Input', 'Latitude and longitude must be valid numbers.');
      return;
    }

    setAdding(true);
    try {
      const newNode = await nodeManagementService.addNode({
        node_number: nodeNum,
        latitude: lat,
        longitude: lng,
        location_name: addLocationName.trim() || null,
      });
      setNodes((prev) => [...prev, newNode].sort((a, b) => a.node_number - b.node_number));
      setAddModalVisible(false);
      showAlert('Success', `Node ${nodeNum} has been added.`);
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to add node.');
    } finally {
      setAdding(false);
    }
  };

  // const handleCreateFireEvent = async (riskLevel: 'HIGH' | 'CRITICAL') => {
  //   setSimulatorLoading(true);
  //   try {
  //     const temp = simTemperature.trim() ? parseFloat(simTemperature) : undefined;
  //     const hum = simHumidity.trim() ? parseFloat(simHumidity) : undefined;
  //     const smoke = simSmokeGas.trim() ? parseFloat(simSmokeGas) : undefined;

  //     if ((simTemperature.trim() && isNaN(temp!)) ||
  //         (simHumidity.trim() && isNaN(hum!)) ||
  //         (simSmokeGas.trim() && isNaN(smoke!))) {
  //       showAlert('Invalid Input', 'Sensor values must be valid numbers.');
  //       return;
  //     }

  //     const params: SimulatedFireEventParams = {
  //       node_number: selectedNode,
  //       risk: riskLevel,
  //       temperature: temp,
  //       humidity: hum,
  //       smoke_gas: smoke,
  //     };
  //     await nodeManagementService.insertSimulatedFireEvent(params);
  //     showAlert('Fire Event Created', `${riskLevel} event created for Node ${selectedNode}!`);
  //     setTimeout(() => fetchNodes(), 1000);
  //   } catch (err: any) {
  //     showAlert('Error', err.message || 'Failed to create fire event.');
  //   } finally {
  //     setSimulatorLoading(false);
  //   }
  // };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.bg }]}>
        <View>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Nodes</Text>
          <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>Early alerts. Safer communities.</Text>
        </View>
        <TouchableOpacity
          style={styles.accountButton}
          onPress={() => router.push('/account')}
        >
          <View style={[styles.accountEmojiContainer, { backgroundColor: c.chip }]}>
            <Ionicons name="person" size={22} color={c.textSecondary} />
          </View>
          <Text style={[styles.accountText, { color: c.textPrimary }]}>Account</Text>
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
            <Text style={[styles.emptyStateTitle, { color: c.textPrimary }]}>Failed to load nodes</Text>
            <Text style={[styles.emptyStateSubtitle, { color: c.textSecondary }]}>{error}</Text>
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
            <Text style={[styles.emptyStateTitle, { color: c.textPrimary }]}>No nodes found</Text>
            <Text style={[styles.emptyStateSubtitle, { color: c.textSecondary }]}>Pull down to refresh</Text>
          </View>
        ) : (
          nodes.map((node) => (
            <TouchableOpacity
              key={node.node_number}
              style={[styles.nodeCard, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={() => router.push(`/node/${node.node_number}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.nodeTitle, { color: c.textPrimary }]}>Node {node.node_number}</Text>
                <Text style={[styles.nodeSubtitle, { color: c.textSecondary }]}>
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
                      <Ionicons name="create-outline" size={22} color={c.textSecondary} />
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
                <Ionicons name="arrow-forward" size={24} color={c.textPrimary} />
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Add Node Button - admin only */}
        {!loading && !error && isAdmin && (
          <TouchableOpacity
            style={[styles.addNodeCard, { backgroundColor: c.bg, borderColor: c.border }]}
            onPress={openAddModal}
          >
            <Ionicons name="add-circle-outline" size={32} color={c.textSecondary} />
            <Text style={[styles.addNodeText, { color: c.textSecondary }]}>Add New Node</Text>
          </TouchableOpacity>
        )}

        {/* Fire Event Simulator - super admin only */}
        {/* {isSuperAdmin && !loading && !error && (
          <View style={styles.simulatorSection}>
            <TouchableOpacity
              style={[styles.simulatorToggle, { backgroundColor: c.simulatorToggleBg, borderColor: c.simulatorToggleBorder }]}
              onPress={() => setShowSimulator(!showSimulator)}
            >
              <View style={styles.simulatorToggleContent}>
                <MaterialCommunityIcons name="fire-alert" size={24} color="#EA580C" />
                <View style={styles.simulatorToggleTextContainer}>
                  <Text style={[styles.simulatorToggleTitle, { color: c.textPrimary }]}>Fire Event Simulator</Text>
                  <Text style={[styles.simulatorToggleSubtitle, { color: c.textSecondary }]}>
                    {showSimulator ? 'Tap to hide' : 'Tap to show demo controls'}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={showSimulator ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={c.textSecondary}
              />
            </TouchableOpacity>

            {showSimulator && (
              <View style={[styles.simulatorControls, { backgroundColor: c.simulatorControlsBg, borderColor: c.border }]}>
                <Text style={[styles.simulatorLabel, { color: c.textPrimary }]}>Select Node</Text>
                <View style={styles.nodeSelector}>
                  {nodes.map((node) => (
                    <TouchableOpacity
                      key={node.id}
                      style={[
                        styles.nodeSelectorButton,
                        { backgroundColor: c.nodeSelectorBg, borderColor: c.border },
                        selectedNode === node.node_number && { backgroundColor: c.nodeSelectorActiveBg, borderColor: '#EA580C' },
                      ]}
                      onPress={() => setSelectedNode(node.node_number)}
                      disabled={simulatorLoading}
                    >
                      <Text
                        style={[
                          styles.nodeSelectorText,
                          { color: c.textSecondary },
                          selectedNode === node.node_number && { color: '#EA580C' },
                        ]}
                      >
                        {node.node_number}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.simulatorLabel, { color: c.textPrimary }]}>Sensor Values (optional)</Text>
                <Text style={[styles.sensorHint, { color: c.textSecondary }]}>
                  Leave blank to use defaults for each risk level.
                </Text>

                <View style={styles.sensorRow}>
                  <View style={styles.sensorField}>
                    <Text style={[styles.sensorLabel, { color: c.textSecondary }]}>Temp (°C)</Text>
                    <TextInput
                      style={[styles.sensorInput, { backgroundColor: c.card, borderColor: c.border, color: c.textPrimary }]}
                      value={simTemperature}
                      onChangeText={setSimTemperature}
                      placeholder="e.g. 36"
                      placeholderTextColor={c.textSecondary}
                      keyboardType="numeric"
                      editable={!simulatorLoading}
                    />
                  </View>
                  <View style={styles.sensorField}>
                    <Text style={[styles.sensorLabel, { color: c.textSecondary }]}>Humidity (%)</Text>
                    <TextInput
                      style={[styles.sensorInput, { backgroundColor: c.card, borderColor: c.border, color: c.textPrimary }]}
                      value={simHumidity}
                      onChangeText={setSimHumidity}
                      placeholder="e.g. 35"
                      placeholderTextColor={c.textSecondary}
                      keyboardType="numeric"
                      editable={!simulatorLoading}
                    />
                  </View>
                  <View style={styles.sensorField}>
                    <Text style={[styles.sensorLabel, { color: c.textSecondary }]}>Smoke (PPM)</Text>
                    <TextInput
                      style={[styles.sensorInput, { backgroundColor: c.card, borderColor: c.border, color: c.textPrimary }]}
                      value={simSmokeGas}
                      onChangeText={setSimSmokeGas}
                      placeholder="e.g. 150"
                      placeholderTextColor={c.textSecondary}
                      keyboardType="numeric"
                      editable={!simulatorLoading}
                    />
                  </View>
                </View>

                <Text style={[styles.simulatorLabel, { color: c.textPrimary }]}>Create Fire Event</Text>

                <TouchableOpacity
                  style={[styles.fireEventButton, styles.highRiskButton]}
                  onPress={() => handleCreateFireEvent('HIGH')}
                  disabled={simulatorLoading}
                >
                  {simulatorLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="fire" size={20} color="#FFFFFF" />
                      <Text style={styles.fireEventText}>High Risk</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.fireEventButton, styles.criticalButton]}
                  onPress={() => handleCreateFireEvent('CRITICAL')}
                  disabled={simulatorLoading}
                >
                  {simulatorLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="fire-alert" size={20} color="#FFFFFF" />
                      <Text style={styles.fireEventText}>Critical</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={[styles.infoText, { color: c.textSecondary }]}>
                  Creates real fire events for thesis defense demonstrations. Events trigger all notifications and appear in dashboard like actual sensor readings.
                </Text>
              </View>
            )}
          </View>
        )} */}
      </ScrollView>

      {/* Edit Node Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Node {editingNode?.node_number}</Text>

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
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
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
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmButton, deleting && { opacity: 0.6 }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                <Text style={styles.saveButtonText}>{deleting ? 'Removing...' : 'Remove'}</Text>
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
              <TouchableOpacity style={styles.cancelButton} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, adding && { opacity: 0.6 }]}
                onPress={handleAdd}
                disabled={adding}
              >
                <Text style={styles.saveButtonText}>{adding ? 'Adding...' : 'Add'}</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 15,
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
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountText: {
    fontSize: 11,
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
    borderRadius: 32,
    padding: 40,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  nodeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  nodeSubtitle: {
    fontSize: 14,
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
    borderRadius: 32,
    padding: 40,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 10,
  },
  addNodeText: {
    fontSize: 18,
    fontWeight: '600',
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
    marginTop: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
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
  // Simulator
  simulatorSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  simulatorToggle: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simulatorToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  simulatorToggleTextContainer: {
    flex: 1,
  },
  simulatorToggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  simulatorToggleSubtitle: {
    fontSize: 13,
  },
  simulatorControls: {
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  simulatorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  nodeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  nodeSelectorButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  nodeSelectorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fireEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 8,
  },
  highRiskButton: {
    backgroundColor: '#EA580C',
  },
  criticalButton: {
    backgroundColor: '#DC2626',
  },
  fireEventText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  infoText: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
  },
  sensorHint: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  sensorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sensorField: {
    flex: 1,
  },
  sensorLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  sensorInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  // Modals
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
});
