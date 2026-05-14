import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../../../src/stores/appStore';
import { useEffect, useRef, useState } from 'react';
import { X, Thermometer, ArrowRight } from 'lucide-react-native';
import { hapticImpact } from '../../../../src/lib/haptics';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayItalic: { fontFamily: 'Newsreader_400Regular_Italic' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

const PHASES = ['setup', 'mash', 'boil', 'cool', 'pitch', 'complete'];

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function MashScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const batch = useAppStore((s) => s.batches.find((b) => b.id === id));
  const session = useAppStore((s) => s.sessions.find((s) => s.batch_id === id));
  const updateSession = useAppStore((s) => s.updateSession);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const recipe = batch?.recipe_snapshot;
  const step = recipe?.process.mash.steps[session?.mash_step_index ?? 0];
  const totalSteps = recipe?.process.mash.steps.length ?? 1;
  const currentStepNum = (session?.mash_step_index ?? 0) + 1;

  useEffect(() => {
    if (!session) return;
    if (timeLeft === 0 && step) {
      setTimeLeft(step.duration_min * 60);
    }
  }, [session, step]);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeLeft === 0) {
        hapticImpact('success');
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          hapticImpact('success');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, timeLeft]);

  if (!batch || !recipe || !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[F.body, { color: '#6E6E6E' }]}>Batch not found.</Text>
      </SafeAreaView>
    );
  }

  const progress = PHASES.indexOf('mash') / (PHASES.length - 1);

  function nextStep() {
    if (currentStepNum < totalSteps) {
      updateSession({ ...session, mash_step_index: session.mash_step_index + 1 });
      setTimeLeft(recipe.process.mash.steps[session.mash_step_index + 1].duration_min * 60);
    } else {
      updateSession({ ...session, phase: 'boil' });
      router.push(`/batch/${id}/session/boil` as any);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <X size={24} color="#1A1A1A" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[F.displayItalic, { fontSize: 17, color: '#1A1A1A' }]}>Brew Session</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Phase progress */}
      <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Mash</Text>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E' }]}>Step {currentStepNum} of {totalSteps}</Text>
        </View>
        <View style={{ height: 4, backgroundColor: '#EBE3D2', borderRadius: 2 }}>
          <View style={{ height: 4, backgroundColor: '#B8633A', borderRadius: 2, width: `${progress * 100}%` }} />
        </View>
      </View>

      {/* Timer */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        <Text style={[F.bodyMedium, { fontSize: 13, color: '#B8633A', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }]}>
          {step?.name ?? 'Mash Rest'}
        </Text>
        <Text style={[F.mono, { fontSize: 80, lineHeight: 88, color: '#1A1A1A' }]}>
          {formatTime(timeLeft)}
        </Text>
        <Text style={[F.body, { fontSize: 15, color: '#6E6E6E', marginTop: 8 }]}>
          of {step?.duration_min ?? 60}:00
        </Text>

        {/* Target temp card */}
        <View style={[styles.card, { marginTop: 32, width: '100%' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1DCC9', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Thermometer size={20} color="#B8633A" strokeWidth={1.5} />
              </View>
              <View>
                <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Target Temp</Text>
                <Text style={[F.mono, { fontSize: 22, color: '#1A1A1A', marginTop: 2 }]}>{step?.temperature_c ?? 67}°C</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Hold For</Text>
              <Text style={[F.mono, { fontSize: 22, color: '#1A1A1A', marginTop: 2 }]}>{step?.duration_min ?? 60} min</Text>
            </View>
          </View>
          <TouchableOpacity style={{ alignSelf: 'center', marginTop: 16 }} activeOpacity={0.8}>
            <Text style={[F.bodyMedium, { fontSize: 15, color: '#B8633A' }]}>Log temp</Text>
          </TouchableOpacity>
        </View>

        {/* Next up */}
        {currentStepNum < totalSteps && (
          <View style={[styles.card, { marginTop: 16, width: '100%' }]}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }]}>Next Up</Text>
            <Text style={[F.bodySemiBold, { fontSize: 17, color: '#1A1A1A' }]}>
              {recipe.process.mash.steps[currentStepNum]?.name ?? 'Sparge & transfer to kettle'}
            </Text>
            <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginTop: 2 }]}>
              Begins when mash timer ends
            </Text>
          </View>
        )}

        {/* Tip */}
        <View style={{ flexDirection: 'row', marginTop: 20, paddingHorizontal: 8 }}>
          <Text style={[F.body, { fontSize: 20, color: '#B8633A', marginRight: 8 }]}>💡</Text>
          <Text style={[F.displayItalic, { fontSize: 15, lineHeight: 22, color: '#6E6E6E' }]}>
            While you wait — preheat the kettle. Saves you 10 minutes later.
          </Text>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}>
        <TouchableOpacity onPress={() => setIsPaused(!isPaused)} activeOpacity={0.8}>
          <Text style={[F.bodyMedium, { fontSize: 15, color: '#B8633A' }]}>{isPaused ? 'Resume' : 'Pause'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={nextStep}
          style={{ backgroundColor: '#B8633A', height: 48, paddingHorizontal: 24, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          activeOpacity={0.8}
        >
          <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>
            {currentStepNum < totalSteps ? 'Next Step' : 'Start Boil'}
          </Text>
          <ArrowRight size={18} color="#F5F0E6" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF6EE',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EBE3D2',
  },
});
