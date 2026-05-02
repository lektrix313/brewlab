import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../../../src/stores/appStore';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Calendar } from 'lucide-react-native';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayItalic: { fontFamily: 'Newsreader_400Regular_Italic' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

export default function CompleteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const batch = useAppStore((s) => s.batches.find((b) => b.id === id));
  const endSession = useAppStore((s) => s.endSession);

  const [countdown, setCountdown] = useState(5);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const recipe = batch?.recipe_snapshot;
  const readyDate = batch?.estimated_ready_at ? new Date(batch.estimated_ready_at) : null;
  const daysUntilReady = readyDate
    ? Math.ceil((readyDate.getTime() - Date.now()) / 86400000)
    : 21;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      goToBatch();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function goToBatch() {
    if (batch) endSession(batch.id);
    router.replace(`/batch/${id}` as any);
  }

  if (!batch || !recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[F.body, { color: '#6E6E6E' }]}>Batch not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
      <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }], alignItems: 'center', paddingHorizontal: 32 }}>
        {/* Illustration placeholder */}
        <View style={{ width: 160, height: 160, borderRadius: 20, backgroundColor: '#D4A04A', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 80 }}>🍺</Text>
        </View>

        <Text style={[F.display, { fontSize: 40, lineHeight: 48, color: '#1A1A1A', textAlign: 'center' }]}>
          And we're off.
        </Text>

        <Text style={[F.body, { fontSize: 17, lineHeight: 26, color: '#6E6E6E', textAlign: 'center', marginTop: 16 }]}>
          Your <Text style={{ color: '#B8633A' }}>{recipe.name}</Text> is in. We'll let you know when something interesting happens.
        </Text>

        {/* Ready card */}
        <View style={[styles.card, { marginTop: 32, width: '100%' }]}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center' }]}>
            Estimated Ready
          </Text>
          <Text style={[F.display, { fontSize: 40, lineHeight: 48, color: '#1A1A1A', textAlign: 'center', marginTop: 8 }]}>
            {daysUntilReady} days
          </Text>
          {readyDate && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 6 }}>
              <Calendar size={16} color="#B8633A" strokeWidth={1.5} />
              <Text style={[F.bodyMedium, { fontSize: 15, color: '#B8633A' }]}>
                {readyDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })}
              </Text>
            </View>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={goToBatch}
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 32, gap: 8 }}
          activeOpacity={0.8}
        >
          <Text style={[F.bodyMedium, { fontSize: 17, color: '#B8633A' }]}>Take me to the fermenter</Text>
          <ArrowRight size={20} color="#B8633A" strokeWidth={2} />
        </TouchableOpacity>

        {/* Auto-advance */}
        <View style={{ marginTop: 24, width: 200 }}>
          <View style={{ height: 3, backgroundColor: '#EBE3D2', borderRadius: 2 }}>
            <View style={{ height: 3, backgroundColor: '#B8633A', borderRadius: 2, width: `${(5 - countdown) / 5 * 100}%` }} />
          </View>
          <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textAlign: 'center', marginTop: 8 }]}>
            Auto-advancing in {countdown}...
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF6EE',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EBE3D2',
  },
});
