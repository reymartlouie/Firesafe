import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import nodeManagementService, { Node, SimulatedFireEventParams } from '../../services/nodesService';
import { useTheme } from '../../contexts/ThemeContext';
import CustomModalAlert from '../CustomModalAlert';

const light = { bg: '#FFFFFF', card: '#F9FAFB', border: '#E5E7EB', textPrimary: '#111827', textSecondary: '#6B7280', nodeLocation: '#1F2937', simulatorToggleBg: '#FFF7ED', simulatorToggleBorder: '#FDBA74', simulatorControlsBg: '#F9FAFB', nodeSelectorBg: '#FFFFFF', nodeSelectorActiveBg: '#FFF7ED' };
const dark  = { bg: '#191919', card: '#202020', border: '#2A2A2A', textPrimary: '#E6E6E5', textSecondary: '#9B9A97', nodeLocation: '#D1D5DB', simulatorToggleBg: '#2A1A0A', simulatorToggleBorder: '#92400E', simulatorControlsBg: '#202020', nodeSelectorBg: '#2A2A2A', nodeSelectorActiveBg: '#3D1F0A' };

export default function NodesScreen() {
  const { isDark } = useTheme();
  const c = isDark ? dark : light;

  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedNode, setSelectedNode] = useState<number>(1);
  const [simulatorLoading, setSimulatorLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  useEffect(() => {
    loadNodes();
    checkSuperAdmin();
  }, []);

  const loadNodes = async () => {
    setLoading(true);
    try {
      const allNodes = await nodeManagementService.getAllNodes();
      setNodes(allNodes);
    } catch (error) {
      console.error('Error loading nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSuperAdmin = async () => {
    try {
      const superAdminStatus = await nodeManagementService.isSuperAdmin();
      setIsSuperAdmin(superAdminStatus);
    } catch (error) {
      console.error('Error checking super admin status:', error);
    }
  };

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCreateFireEvent = async (riskLevel: 'HIGH' | 'CRITICAL' | 'FIRE_DETECTED') => {
    setSimulatorLoading(true);
    try {
      const params: SimulatedFireEventParams = {
        node_number: selectedNode,
        risk: riskLevel,
      };

      await nodeManagementService.insertSimulatedFireEvent(params);
      showModal('Fire Event Created', `${riskLevel} event created for Node ${selectedNode}!`);

      setTimeout(() => loadNodes(), 1000);
    } catch (error: any) {
      showModal('Error', error.message || 'Failed to create fire event.');
    } finally {
      setSimulatorLoading(false);
    }
  };

  const handleNodePress = (node: Node) => {
    console.log('Node pressed:', node);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <CustomModalAlert
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />

      <View style={[styles.header, { backgroundColor: c.bg }]}>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Nodes</Text>
        <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>Fire Detection Points</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#EA580C" />
              <Text style={[styles.loadingText, { color: c.textSecondary }]}>Loading nodes...</Text>
            </View>
          ) : (
            <>
              {nodes.map((node) => (
                <TouchableOpacity
                  key={node.id}
                  style={[styles.nodeCard, { backgroundColor: c.card, borderColor: c.border }]}
                  onPress={() => handleNodePress(node)}
                >
                  <View style={styles.nodeCardContent}>
                    <View style={styles.nodeInfo}>
                      <Text style={[styles.nodeNumber, { color: c.textPrimary }]}>Node {node.node_number}</Text>
                      <Text style={[styles.nodeLocation, { color: c.nodeLocation }]}>{node.location_name}</Text>
                      <Text style={[styles.nodeCoords, { color: c.textSecondary }]}>
                        {node.latitude.toFixed(4)}°N, {node.longitude.toFixed(4)}°E
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={c.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {isSuperAdmin && (
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
                          selectedNode === node.node_number && styles.nodeSelectorTextActive,
                        ]}
                      >
                        {node.node_number}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
                      <Text style={styles.fireEventText}>High Risk (36°C, 35% RH)</Text>
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
                      <Text style={styles.fireEventText}>Critical (39°C, 25% RH)</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.fireEventButton, styles.fireButton]}
                  onPress={() => handleCreateFireEvent('FIRE_DETECTED')}
                  disabled={simulatorLoading}
                >
                  {simulatorLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="fire-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.fireEventText}>Fire Detected (45°C, 20% RH)</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={[styles.infoText, { color: c.textSecondary }]}>
                  Creates real fire events for thesis defense demonstrations. Events trigger all notifications and appear in dashboard like actual sensor readings.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  nodeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  nodeCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeInfo: {
    flex: 1,
  },
  nodeNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  nodeLocation: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  nodeCoords: {
    fontSize: 13,
  },
  simulatorSection: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  nodeSelectorTextActive: {
    color: '#EA580C',
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
  fireButton: {
    backgroundColor: '#991B1B',
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
});
