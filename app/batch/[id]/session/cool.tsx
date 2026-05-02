import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../../../src/stores/appStore';
import { useEffect, useRef, useState } from 'react';
import { X, Thermometer, ArrowRight } from 'lucide-react-native';

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

export default function CoolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const batch = useAppStore((s) => s.batches.find((b) => b.id === id));
  const session = useAppStore((s) => s.sessions.find((s) => s.batch_id === id));
  const updateSession = useAppStore((s) => s.updateSession);

  const [timeLeft, setTimeLeft] = useState(0);
  const [wortTemp, setWortTemp] = useState(78);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const recipe = batch?.recipe_snapshot;
  const targetPitchTemp = recipe?.process.fermentation.pitch_temp_c ?? 18;

  useEffect(() => {
    if (!session) return;
    if (timeLeft === 0) {
      setTimeLeft(session.cool_time_remaining_sec);
    }
  }, [session]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft]);

  if (!batch || !recipe || !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[F.body, { color: '#6E6E6E' }]}>Batch not found.</Text>
      </SafeAreaView>
    );
  }

  const progress = PHASES.indexOf('cool') / (PHASES.length - 1);

  function goToPitch() {
    updateSession({ ...session, phase: 'pitch', cool_time_remaining_sec: timeLeft });
    router.push(`/batch/${id}/session/pitch` as any);
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
        <View style={{ height: 4, backgroundColor: '#EBE3D2', borderRadius: 2 }}>
          <View style={{ height: 4, backgroundColor: '#B8633A', borderRadius: 2, width: `${progress * 100}%` }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Boil</Text>
          <Text style={[F.body, { fontSize: 11, color: '#B8633A', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Cool</Text>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Pitch</Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
        {/* Phase label */}
        <View style={{ backgroundColor: '#F1DCC9', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start', marginBottom: 20 }}>
          <Text style={[F.bodyMedium, { fontSize: 13, color: '#8E4A2A', textTransform: 'uppercase', letterSpacing: 1.5 }]}>
            Whirlpool & Chill
          </Text>
        </View>

        {/* Stats grid */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.card, { flex: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Wort Temp</Text>
              <Thermometer size={18} color="#B8633A" strokeWidth={1.5} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={[F.mono, { fontSize: 48, lineHeight: 56, color: '#1A1A1A' }]}>{wortTemp}</Text>
              <Text style={[F.body, { fontSize: 18, color: '#6E6E6E', marginLeft: 2 }]}>°C</Text>
            </View>
          </View>
          <View style={[styles.card, { flex: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Whirlpool Time</Text>
              <Text style={[F.body, { fontSize: 18, color: '#B8633A' }]}>⟳</Text>
            </View>
            <Text style={[F.mono, { fontSize: 48, lineHeight: 56, color: '#1A1A1A' }]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>

        {/* Tip card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={[F.displayItalic, { fontSize: 15, lineHeight: 22, color: '#1A1A1A' }]}>
            "Keep the whirlpool spinning. Don't open the kettle till it's down to {targetPitchTemp}°C."
          </Text>
        </View>

        {/* Log temp */}
        <TouchableOpacity style={{ alignSelf: 'center', marginTop: 24 }} activeOpacity={0.8}>
          <Text style={[F.bodyMedium, { fontSize: 15, color: '#1A1A1A' }]}>Log current temp</Text>
        </TouchableOpacity>

        <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textAlign: 'center', marginTop: 16, paddingHorizontal: 20 }]}>
          Most chillers take 20 minutes from boil to pitch. Yours is on track.
        </Text>
      </View>

      {/* Bottom */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}>
        <TouchableOpacity
          onPress={goToPitch}
          style={{ backgroundColor: '#B8633A', height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
          activeOpacity={0.8}
        >
          <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>I'm ready to pitch</Text>
          <ArrowRight size={18} color="#F5F0E6" strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={[F.bodyMedium, { fontSize: 13, color: '#6E6E6E' }]}>⏸ Pause</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToPitch} activeOpacity={0.8}>
            <Text style={[F.bodyMedium, { fontSize: 13, color: '#6E6E6E' }]}>Skip ahead ▶▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF6EE',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBE3D2',
  },
});
