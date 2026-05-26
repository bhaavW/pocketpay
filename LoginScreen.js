import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from './supabase';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) Alert.alert('Error', error.message);
      else {
        Alert.alert('Account Created! ✅', 'You are now logged in!');
        onLogin();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Error', error.message);
      else onLogin();
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>

      <View style={styles.top}>
        <Text style={styles.emoji}>💰</Text>
        <Text style={styles.title}>PocketPay</Text>
        <Text style={styles.subtitle}>Your money, your pockets</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@gmail.com"
          placeholderTextColor="#555"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Min 6 characters"
          placeholderTextColor="#555"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{isSignUp ? 'Create Account →' : 'Login →'}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', paddingHorizontal: 20, justifyContent: 'center' },
  top: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 6 },
  card: { backgroundColor: '#1e1e2e', borderRadius: 20, padding: 24 },
  cardTitle: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { color: '#888', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#2e2e3e', borderRadius: 10, padding: 14, color: '#ffffff', fontSize: 16 },
  button: { backgroundColor: '#7c3aed', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  switchText: { color: '#7c3aed', fontSize: 14, textAlign: 'center', marginTop: 16 },
});