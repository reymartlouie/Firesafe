import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NodesScreen() {
  const nodes = [1, 2, 3];
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
        {nodes.map((node) => (
          <TouchableOpacity
            key={node}
            style={styles.nodeCard}
            onPress={() => router.push(`/node/${node}`)}
          >
            <View>
              <Text style={styles.nodeTitle}>Node {node}</Text>
              <Text style={styles.nodeSubtitle}>Tap to view details</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#1F2937" />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
});