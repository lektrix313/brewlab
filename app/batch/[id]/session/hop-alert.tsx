import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../../../src/stores/appStore';
import { useEffect, useRef } from 'react';
import { X, Clock } from 'lucide-react-native';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayItalic: { fontFamily: 'Newsreader_400Regular_Italic' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

export default function HopAlertScreen() {
  const { id, hopId, timeMin, amountG, hopName } = useLocalSearchParams<{
    id: string;
    hopId: string;
    timeMin: string;
    amountG: string;
    hopName: string;
  }>();
  const router = useRouter();
  const batch = useAppStore((s) => s.batches.find((b) => b.id === id));
  const session = useAppStore((s) => s.sessions.find((s) => s.batch_id === id));
  const updateSession = useAppStore((s) => s.updateSession);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  if (!batch || !session) return null;

  function dismiss() {
    router.back();
  }

  function markDone() {
    updateSession({
      ...session,
      hop_additions_done: [...session.hop_additions_done, `${hopId}-${timeMin}`],
    });
    dismiss();
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      <View style={{ flex: 1, backgroundColor: 'rgba(26,26,26,0.5)', alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }], width: '85%' }}>
          <View style={{ backgroundColor: '#F5F0E6', borderRadius: 24, padding: 28, alignItems: 'center' }}>
            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: '#EBE3D2', borderRadius: 2, marginBottom: 24 }} />

            {/* Icon */}
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#F1DCC9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 36 }}>🌿</Text>
            </View>

            <Text style={[F.display, { fontSize: 28, lineHeight: 34, color: '#1A1A1A', textAlign: 'center' }]}>
              Hop time.
            </Text>
            <Text style={[F.body, { fontSize: 15, lineHeight: 22, color: '#6E6E6E', textAlign: 'center', marginTop: 8 }]}>
              {amountG}g {hopName} — {timeMin} minute boil
            </Text>

            <View style={{ backgroundColor: '#FAF6EE', borderRadius: 14, padding: 20, width: '100%', marginTop: 24, borderWidth: 1, borderColor: '#EBE3D2' }}>
              <Text style={[F.bodySemiBold, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center', marginBottom: 8 }]}>
                Add Into Boil
              </Text>
              <Text style={[F.body, { fontSize: 17, color: '#1A1A1A', textAlign: 'center' }]}>
                {amountG}g {hopName} pellets
              </Text>
              <Text style={[F.displayItalic, { fontSize: 14, lineHeight: 20, color: '#6E6E6E', textAlign: 'center', marginTop: 6 }]}>
                Stir gently after addition
              </Text>
            </View>

            <TouchableOpacity
              onPress={markDone}
              style={{ backgroundColor: '#B8633A', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 20 }}
              activeOpacity={0.8}
            >
              <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>Done. In they go.</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={dismiss} style={{ marginTop: 16 }} activeOpacity={0.8}>
              <Text style={[F.bodyMedium, { fontSize: 14, color: '#6E6E6E' }]}>Snooze 30 seconds</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
