import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { supabase } from './supabase';

export default function PocketDetailScreen({ pocket, user, onBack, onPocketUpdate }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendNote, setSpendNote] = useState('');

  const remaining = pocket.budget - pocket.spent;
  const percent = Math.min((pocket.spent / pocket.budget) * 100, 100);
  const isLow = percent >= 80;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('pocket_id', pocket.id)
      .order('created_at', { ascending: false });
    if (error) Alert.alert('Error', error.message);
    else setTransactions(data);
    setLoading(false);
  };

  const logSpend = async () => {
    if (!spendAmount) {
      Alert.alert('Missing info', 'Please enter an amount');
      return;
    }
    const amount = parseInt(spendAmount);
    if (amount > remaining) {
      Alert.alert('Not enough balance', `This pocket only has ₹${remaining} left!`);
      return;
    }

    // Add transaction
    const { error: txError } = await supabase.from('transactions').insert([{
      pocket_id: pocket.id,
      user_id: user?.id || null,
      amount,
      note: spendNote || null,
    }]);

    if (txError) { Alert.alert('Error', txError.message); return; }

    // Update pocket spent
    const newSpent = pocket.spent + amount;
    const { error: pocketError } = await supabase
      .from('pockets')
      .update({ spent: newSpent })
      .eq('id', pocket.id);

    if (pocketError) { Alert.alert('Error', pocketError.message); return; }

    onPocketUpdate({ ...pocket, spent: newSpent });
    setSpendAmount('');
    setSpendNote('');
    setShowSpendModal(false);
    fetchTransactions();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{pocket.icon} {pocket.name}</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Remaining</Text>
            <Text style={[styles.balanceAmount, { color: isLow ? '#f87171' : '#4ade80' }]}>
              ₹{remaining.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.balanceLabel}>Budget</Text>
            <Text style={styles.budgetAmount}>₹{pocket.budget.toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: isLow ? '#f87171' : '#7c3aed' }]} />
        </View>
        <Text style={styles.percentText}>{Math.round(percent)}% spent</Text>
      </View>

      {/* Spend Button */}
      <TouchableOpacity style={styles.spendButton} onPress={() => setShowSpendModal(true)}>
        <Text style={styles.spendButtonText}>+ Log a Spend</Text>
      </TouchableOpacity>

      {/* Transactions */}
      <Text style={styles.sectionTitle}>Transaction History</Text>

      {loading ? (
        <ActivityIndicator color="#7c3aed" style={{ marginTop: 24 }} />
      ) : transactions.length === 0 ? (
        <Text style={styles.emptyText}>No transactions yet. Log your first spend! 👆</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {transactions.map(tx => (
            <View key={tx.id} style={styles.transaction}>
              <View style={styles.txLeft}>
                <Text style={styles.txAmount}>₹{tx.amount.toLocaleString('en-IN')}</Text>
                <Text style={styles.txNote}>{tx.note || 'No note'}</Text>
              </View>
              <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Spend Modal */}
      <Modal visible={showSpendModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{pocket.icon} Spend from {pocket.name}</Text>
            <Text style={styles.modalBalance}>₹{remaining.toLocaleString('en-IN')} available</Text>

            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="How much did you spend?"
              placeholderTextColor="#555"
              keyboardType="numeric"
              value={spendAmount}
              onChangeText={setSpendAmount}
            />

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Filled tank at HP Petrol"
              placeholderTextColor="#555"
              value={spendNote}
              onChangeText={setSpendNote}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowSpendModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={logSpend}>
                <Text style={styles.confirmText}>Log Spend</Text>
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
  header: { marginBottom: 24 },
  backButton: { marginBottom: 8 },
  backText: { color: '#7c3aed', fontSize: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#ffffff' },
  balanceCard: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2e2e3e' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  balanceLabel: { color: '#888', fontSize: 13 },
  balanceAmount: { fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  budgetAmount: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  progressBar: { height: 8, backgroundColor: '#2e2e3e', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  percentText: { color: '#888', fontSize: 12, marginTop: 8 },
  spendButton: { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24 },
  spendButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 24 },
  transaction: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txLeft: { flex: 1 },
  txAmount: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  txNote: { color: '#888', fontSize: 13, marginTop: 2 },
  txDate: { color: '#555', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1e1e2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  modalBalance: { color: '#4ade80', fontSize: 14, marginBottom: 16 },
  label: { color: '#888', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#2e2e3e', borderRadius: 10, padding: 14, color: '#ffffff', fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelButton: { flex: 1, backgroundColor: '#2e2e3e', borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelText: { color: '#888', fontSize: 16, fontWeight: '600' },
  confirmButton: { flex: 1, backgroundColor: '#7c3aed', borderRadius: 10, padding: 14, alignItems: 'center' },
  confirmText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});