import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlipMascot } from '../components/BlipMascot';
import { useBackend } from '../services/backend';
import { BlipColors } from '../theme';

export function LoginScreen() {
  const backend = useBackend();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [obscure, setObscure] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const err = isSignUp
      ? await backend.signUp(email, password, name)
      : await backend.signIn(email, password);
    setLoading(false);
    if (err) Alert.alert('BLIP!', err);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <BlipMascot sleeping size={168} />
        <Text style={styles.title}>BLIP!</Text>

        {!backend.firebaseEnabled && (
          <View style={styles.demoPill}>
            <Text style={styles.demoText}>Demo mode (connect Firebase in .env)</Text>
          </View>
        )}

        <View style={styles.form}>
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.passWrap}>
            <TextInput
              style={[styles.input, styles.passInput]}
              placeholder="Password"
              placeholderTextColor="#666"
              secureTextEntry={obscure}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleSubmit}
            />
            <Pressable style={styles.eyeBtn} onPress={() => setObscure((v) => !v)}>
              <Ionicons
                name={obscure ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color="#1A1A1A"
              />
            </Pressable>
          </View>

          <Pressable
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>{isSignUp ? 'Sign Up' : 'Log In'}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => setIsSignUp((v) => !v)} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {isSignUp ? 'Back to Log In' : 'Sign Up'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BlipColors.sage },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: BlipColors.textDark,
    marginTop: 20,
  },
  demoPill: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(82,119,127,0.25)',
  },
  demoText: { fontSize: 12, color: BlipColors.textDark },
  form: { width: '100%', maxWidth: 340, marginTop: 28, gap: 14 },
  input: {
    backgroundColor: BlipColors.inputFill,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: BlipColors.textDark,
  },
  passWrap: { position: 'relative', justifyContent: 'center' },
  passInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 12, padding: 6 },
  primaryBtn: {
    alignSelf: 'center',
    width: 180,
    marginTop: 12,
    backgroundColor: BlipColors.accentBlue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  primaryText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  switchBtn: { alignSelf: 'center', paddingVertical: 8 },
  switchText: { fontSize: 16, fontStyle: 'italic', color: BlipColors.textDark },
});
