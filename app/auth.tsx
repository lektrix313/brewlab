import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { hapticImpact } from '../src/lib/haptics';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayItalic: { fontFamily: 'Newsreader_400Regular_Italic' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
};

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit() {
    if (!isLoaded || !signIn) return;
    setError('');
    setPending(true);
    hapticImpact('medium');

    try {
      if (mode === 'signin') {
        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          hapticImpact('success');
          router.replace('/(tabs)');
        } else {
          setError('Unexpected sign-in state. Try again.');
        }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Something went wrong. Try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
          {/* Logo / Brand */}
          <View style={{ marginBottom: 48 }}>
            <Text style={[F.display, { fontSize: 40, lineHeight: 48, color: '#1A1A1A', letterSpacing: -1 }]}>
              TUN
            </Text>
            <Text style={[F.displayItalic, { fontSize: 18, lineHeight: 26, color: '#6E6E6E', marginTop: 8 }]}>
              {mode === 'signin' ? 'Welcome back, brewer.' : 'Join the brew crew.'}
            </Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={{ backgroundColor: '#F1DCC9', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <Text style={[F.body, { fontSize: 13, color: '#8E4A2A' }]}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[F.bodyMedium, { fontSize: 13, color: '#6E6E6E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }]}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#A0A0A0"
              style={styles.input}
            />
          </View>

          {/* Password */}
          <View style={{ marginBottom: 24 }}>
            <Text style={[F.bodyMedium, { fontSize: 13, color: '#6E6E6E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }]}>
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#A0A0A0"
              style={styles.input}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={onSubmit}
            disabled={pending || !email || !password}
            style={[styles.button, (pending || !email || !password) && { opacity: 0.6 }]}
            activeOpacity={0.8}
          >
            <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>
              {pending ? 'One moment...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Toggle mode */}
          <TouchableOpacity
            onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            style={{ alignItems: 'center', marginTop: 24 }}
            activeOpacity={0.8}
          >
            <Text style={[F.body, { fontSize: 14, color: '#6E6E6E' }]}>
              {mode === 'signin'
                ? "Don't have an account? "
                : "Already have an account? "}
              <Text style={{ color: '#B8633A', fontWeight: '600' }}>
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Skip for demo */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={{ alignItems: 'center', marginTop: 32 }}
            activeOpacity={0.8}
          >
            <Text style={[F.body, { fontSize: 13, color: '#A0A0A0' }]}>
              Continue without signing in
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FAF6EE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EBE3D2',
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Inter_400Regular',
  },
  button: {
    backgroundColor: '#B8633A',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
