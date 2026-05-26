import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import LoginScreen from './LoginScreen';
import SettingsScreen from './SettingsScreen';
import PocketDetailScreen from './PocketDetailScreen';

export default function App() {
  const [pockets, setPockets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [totalBudget, setTotalBudget] = useState(15000);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPocketDetail, setSelectedPocketDetail] = useState(null);
  const [showAddPocket, setShowAddPocket] = useState(false);
  const [newPocketName, setNewPocketName] = useState('');
  const [newPocketBudget, setNewPocketBudget] = useState('');
  const [newPocketIcon, setNewPocketIcon] = useState('💰');

  const icons = ['💰', '⛽', '🛒', '🎮', '🏥', '📚', '✈️', '🍔', '👗', '💡', '🏠', '🎁'];

  const totalSpent = pockets.reduce((sum, p) => sum + p.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchPockets(session.user.id);
      else setLoading(false);
    });
  }, []);

  const fetchPockets = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pockets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');
    if (error) Alert.alert('Error', error.message);
    else setPockets(data);
    setLoading(false);
  };

  const addPocket = async () => {
    if (!newPocketName || !newPocketBudget) {
      Alert.alert('Missing info', 'Please enter a name and budget amount');
      return;
    }
    const { data, error } = await supabase.from('pockets').insert([{
      name: newPocketName,
      icon: newPocketIcon,
      budget: parseInt(newPocketBudget),
      spent: 0,
      user_id: user?.id || null,
    }]).select();
    if (error) Alert.alert('Error', error.message);
    else setPockets([...pockets, data[0]]);
    setNewPocketName('');
    setNewPocketBudget('');
    setNewPocketIcon('💰');
    setShowAddPocket(false);
  };

  const deletePocket = (id) => {
    Alert.alert('Delete Pocket', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('pockets').delete().eq('id', id);
        if (error) Alert.alert('Error', error.message);
        else setPockets(pockets.filter(p => p.id !== id));
      }},
    ]);
  };

   if (!user) {
    return <LoginScreen onLogin={() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchPockets(session.user.id);
      });
    }} />;
  } 

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Loading your pockets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {selectedPocketDetail ? (
        <PocketDetailScreen
          pocket={pockets.find(p => p.id === selectedPocketDetail.id)}
          user={user}
          onBack={() => setSelectedPocketDetail(null)}
          onPocketUpdate={(updatedPocket) => {
            setPockets(pockets.map(p => p.id === updatedPocket.id ? updatedPocket : p));
          }}
        />
      ) : activeTab === 'home' ? (
        <ScrollView showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <Text style={styles.headerText}>PocketPay 💰</Text>
            <Text style={styles.subText}>Your money, your pockets</Text>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Budget</Text>
            <Text style={styles.balanceAmount}>₹{totalBudget.toLocaleString('en-IN')}</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceRemaining}>₹{totalRemaining.toLocaleString('en-IN')} remaining</Text>
              <Text style={styles.balanceSpent}>₹{totalSpent.toLocaleString('en-IN')} spent</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }]} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Your Pockets</Text>

          {pockets.length === 0 && (
            <Text style={styles.emptyText}>No pockets yet! Add your first one below 👇</Text>
          )}

          {pockets.map(pocket => {
            const remaining = pocket.budget - pocket.spent;
            const percent = (pocket.spent / pocket.budget) * 100;
            const isLow = percent >= 80;
            return (
              <TouchableOpacity
                key={pocket.id}
                style={styles.pocket}
                onPress={() => setSelectedPocketDetail(pocket)}
                onLongPress={() => deletePocket(pocket.id)}
              >
                <Text style={styles.pocketIcon}>{pocket.icon}</Text>
                <View style={styles.pocketInfo}>
                  <Text style={styles.pocketName}>{pocket.name}</Text>
                  <Text style={styles.pocketSpent}>₹{pocket.spent.toLocaleString('en-IN')} spent of ₹{pocket.budget.toLocaleString('en-IN')}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: isLow ? '#f87171' : '#7c3aed' }]} />
                  </View>
                </View>
                <Text style={[styles.pocketRemaining, { color: isLow ? '#f87171' : '#4ade80' }]}>
                  ₹{remaining.toLocaleString('en-IN')} left
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddPocket(true)}>
            <Text style={styles.addButtonText}>+ Add New Pocket</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>Tap a pocket to view • Hold to delete</Text>

        </ScrollView>
      ) : (
        <SettingsScreen
          user={user}
          totalBudget={totalBudget}
          onBudgetUpdate={(newBudget) => setTotalBudget(newBudget)}
          onLogout={() => { setUser(null); setPockets([]); }}
        />
      )}

      {/* Bottom Tab Bar — hide when viewing pocket detail */}
      {!selectedPocketDetail && (
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('home')}>
            <Text style={styles.tabIcon}>🏠</Text>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('settings')}>
            <Text style={styles.tabIcon}>⚙️</Text>
            <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Pocket Modal */}
      <Modal visible={showAddPocket} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Pocket</Text>

            <Text style={styles.label}>Pick an icon</Text>
            <View style={styles.iconGrid}>
              {icons.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconButton, newPocketIcon === icon && styles.iconButtonSelected]}
                  onPress={() => setNewPocketIcon(icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Pocket Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Petrol, Rent, Fun..."
              placeholderTextColor="#555"
              value={newPocketName}
              onChangeText={setNewPocketName}
            />

            <Text style={styles.label}>Monthly Budget (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              placeholderTextColor="#555"
              keyboardType="numeric"
              value={newPocketBudget}
              onChangeText={setNewPocketBudget}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddPocket(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={addPocket}>
                <Text style={styles.confirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', paddingTop: 60, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#888', marginTop: 12, fontSize: 16 },
  header: { marginBottom: 24 },
  headerText: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
  subText: { fontSize: 14, color: '#888', marginTop: 4 },
  balanceCard: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#7c3aed' },
  balanceLabel: { color: '#888', fontSize: 13 },
  balanceAmount: { color: '#ffffff', fontSize: 36, fontWeight: 'bold', marginTop: 4 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  balanceRemaining: { color: '#7c3aed', fontSize: 14 },
  balanceSpent: { color: '#888', fontSize: 14 },
  progressBar: { height: 6, backgroundColor: '#2e2e3e', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#7c3aed', borderRadius: 3 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  pocket: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  pocketIcon: { fontSize: 28, marginRight: 12 },
  pocketInfo: { flex: 1 },
  pocketName: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  pocketSpent: { color: '#888', fontSize: 12, marginTop: 2 },
  pocketRemaining: { color: '#4ade80', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', marginVertical: 24 },
  addButton: { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  addButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  hint: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 12, marginBottom: 100 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1e1e2e', flexDirection: 'row', paddingBottom: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2e2e3e' },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 22 },
  tabLabel: { color: '#555', fontSize: 12, marginTop: 4 },
  tabLabelActive: { color: '#7c3aed' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1e1e2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  label: { color: '#888', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#2e2e3e', borderRadius: 10, padding: 14, color: '#ffffff', fontSize: 16 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  iconButton: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#2e2e3e', alignItems: 'center', justifyContent: 'center' },
  iconButtonSelected: { borderWidth: 2, borderColor: '#7c3aed' },
  iconText: { fontSize: 22 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelButton: { flex: 1, backgroundColor: '#2e2e3e', borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelText: { color: '#888', fontSize: 16, fontWeight: '600' },
  confirmButton: { flex: 1, backgroundColor: '#7c3aed', borderRadius: 10, padding: 14, alignItems: 'center' },
  confirmText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});