import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from './supabase';

export default function SettingsScreen({ user, totalBudget, onBudgetUpdate, onLogout }) {
  const [budget, setBudget] = useState(totalBudget.toString());
  const [saving, setSaving] = useState(false);

  const saveBudget = async () => {
    if (!budget || isNaN(budget) || parseInt(budget) <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid budget amount');
      return;
    }
    setSaving(true);
    onBudgetUpdate(parseInt(budget));
    setSaving(false);
    Alert.alert('Saved! ✅', 'Your monthly budget has been updated');
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        onLogout();
      }},
    ]);
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Settings ⚙️</Text>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue}>{user?.email}</Text>
        </View>
      </View>

      {/* Budget Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Budget</Text>
        <Text style={styles.hint}>This is your total money for the month</Text>
        <View style={styles.budgetRow}>
          <Text style={styles.rupee}>₹</Text>
          <TextInput
            style={styles.budgetInput}
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            placeholder="15000"
            placeholderTextColor="#555"
          />
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={saveBudget} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveButtonText}>Save Budget</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginBottom: 32 },
  section: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 20, marginBottom: 16 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  hint: { color: '#555', fontSize: 13, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { color: '#888', fontSize: 15 },
  rowValue: { color: '#ffffff', fontSize: 15, fontWeight: '500' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2e2e3e', borderRadius: 10, paddingHorizontal: 14, marginBottom: 12 },
  rupee: { color: '#7c3aed', fontSize: 20, fontWeight: 'bold', marginRight: 8 },
  budgetInput: { flex: 1, padding: 14, color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#7c3aed', borderRadius: 10, padding: 14, alignItems: 'center' },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  logoutButton: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#f87171' },
  logoutText: { color: '#f87171', fontSize: 16, fontWeight: '600' },
});