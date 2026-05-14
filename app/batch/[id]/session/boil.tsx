import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../../../src/stores/appStore';
import { useEffect, useRef, useState } from 'react';
import { X, Bell, Check, Clock, ArrowRight } from 'lucide-react-native';
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

export default function BoilScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const batch = useAppStore((s) => s.batches.find((b) => b.id === id));
  const session = useAppStore((s) => s.sessions.find((s) => s.batch_id === id));
  const updateSession = useAppStore((s) => s.updateSession);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const recipe = batch?.recipe_snapshot;
  const boilMin = recipe?.process.boil.duration_min ?? 60;
  const boilHops = recipe?.hops.filter((h) => h.use === 'boil').sort((a, b) => b.time_min - a.time_min) ?? [];

  useEffect(() => {
    if (!session) return;
    if (timeLeft === 0) {
      setTimeLeft(session.boil_time_remaining_sec);
    }
  }, [session]);

  const alertedHopsRef = useRef<Set<string>>(new Set());

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
        const newT = t - 1;
        if (newT <= 0) {
          clearInterval(timerRef.current!);
          hapticImpact('success');
          return 0;
        }
        // Check for hop additions due now (within 5-second window)
        const elapsedSec = boilMin * 60 - newT;
        boilHops.forEach((h) => {
          const hopKey = `${h.hop_id}-${h.time_min}`;
          const targetElapsed = (boilMin - h.time_min) * 60;
          if (
            elapsedSec >= targetElapsed &&
            elapsedSec < targetElapsed + 5 &&
            !session.hop_additions_done.includes(hopKey) &&
            !alertedHopsRef.current.has(hopKey)
          ) {
            alertedHopsRef.current.add(hopKey);
            hapticImpact('heavy');
            // Could auto-navigate to hop alert here:
            // router.push(`/batch/${id}/session/hop-alert?hopId=${h.hop_id}&timeMin=${h.time_min}&amountG=${h.amount_g}&hopName=${encodeURIComponent(h.hop.name)}`);
          }
        });
        return newT;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, timeLeft, boilMin, boilHops, session.hop_additions_done]);

  if (!batch || !recipe || !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[F.body, { color: '#6E6E6E' }]}>Batch not found.</Text>
      </SafeAreaView>
    );
  }

  const progress = PHASES.indexOf('boil') / (PHASES.length - 1);
  const elapsed = boilMin * 60 - timeLeft;
  const nextHop = boilHops.find((h) => h.time_min * 60 > elapsed && !session.hop_additions_done.includes(`${h.hop_id}-${h.time_min}`));
  const remainingAdditions = boilHops.filter((h) => !session.hop_additions_done.includes(`${h.hop_id}-${h.time_min}`)).length;

  function markHopDone(hop_id: string, time_min: number) {
    updateSession({
      ...session,
      hop_additions_done: [...session.hop_additions_done, `${hop_id}-${time_min}`],
    });
  }

  function finishBoil() {
    updateSession({ ...session, phase: 'cool', boil_time_remaining_sec: timeLeft });
    router.push(`/batch/${id}/session/cool` as any);
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
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Boil</Text>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E' }]}>Stage 2 of 4</Text>
        </View>
        <View style={{ height: 4, backgroundColor: '#EBE3D2', borderRadius: 2 }}>
          <View style={{ height: 4, backgroundColor: '#B8633A', borderRadius: 2, width: `${progress * 100}%` }} />
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Timer */}
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <View style={{ backgroundColor: '#F1DCC9', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginBottom: 16 }}>
            <Text style={[F.bodyMedium, { fontSize: 13, color: '#8E4A2A', textTransform: 'uppercase', letterSpacing: 1.5 }]}>
              Rolling Boil
            </Text>
          </View>
          <Text style={[F.mono, { fontSize: 56, lineHeight: 64, color: '#1A1A1A' }]}>
            {formatTime(timeLeft)}
          </Text>
          <Text style={[F.body, { fontSize: 15, color: '#6E6E6E', marginTop: 8 }]}>
            Remaining in Stage 2 of 4
          </Text>
        </View>

        {/* Progress bar */}
        <View style={{ height: 6, backgroundColor: '#EBE3D2', borderRadius: 3, marginTop: 24 }}>
          <View style={{ height: 6, backgroundColor: '#B8633A', borderRadius: 3, width: `${Math.min(1, elapsed / (boilMin * 60)) * 100}%` }} />
        </View>

        {/* Hop Schedule */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 }}>
          <Text style={[F.displayItalic, { fontSize: 20, lineHeight: 28, color: '#1A1A1A' }]}>Hop Schedule</Text>
          <Text style={[F.bodyMedium, { fontSize: 15, color: '#B8633A' }]}>{remainingAdditions} Additions Left</Text>
        </View>

        {/* Hop cards */}
        {boilHops.map((h, i) => {
          const hopKey = `${h.hop_id}-${h.time_min}`;
          const isDone = session.hop_additions_done.includes(hopKey);
          const isNext = nextHop && h.hop_id === nextHop.hop_id && h.time_min === nextHop.time_min;
          const timeUntil = h.time_min * 60 - elapsed;
          const isPast = timeUntil <= 0;

          return (
            <View
              key={hopKey}
              style={[
                styles.hopCard,
                isDone && { opacity: 0.5 },
                isNext && { borderColor: '#B8633A', borderWidth: 2 },
                isPast && !isDone && { backgroundColor: '#F1DCC9' },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[F.bodyMedium, { fontSize: 15, color: isNext ? '#B8633A' : '#1A1A1A', marginRight: 8 }]}>
                    {h.time_min} MIN
                  </Text>
                  {isNext && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#B8633A' }} />}
                </View>
                {isDone ? (
                  <Check size={20} color="#7A8B6F" strokeWidth={2} />
                ) : isNext ? (
                  <Bell size={20} color="#B8633A" strokeWidth={1.5} />
                ) : (
                  <Clock size={20} color="#6E6E6E" strokeWidth={1.5} />
                )}
              </View>
              <Text style={[F.display, { fontSize: 18, lineHeight: 24, color: '#1A1A1A', marginTop: 6 }]}>
                {h.hop.name}
              </Text>
              <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginTop: 2 }]}>
                {h.amount_g}g · {h.hop.type}
              </Text>
              {isNext && timeUntil > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EBE3D2' }}>
                  <Text style={[F.displayItalic, { fontSize: 14, color: '#6E6E6E' }]}>
                    T-minus {formatTime(timeUntil)}
                  </Text>
                  <TouchableOpacity onPress={() => markHopDone(h.hop_id, h.time_min)} activeOpacity={0.8}>
                    <Text style={[F.bodyMedium, { fontSize: 13, color: '#B8633A', textTransform: 'uppercase', letterSpacing: 1 }]}>
                      Skip ▶▶
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {isPast && !isDone && (
                <TouchableOpacity
                  onPress={() => markHopDone(h.hop_id, h.time_min)}
                  style={{ backgroundColor: '#B8633A', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 10 }}
                  activeOpacity={0.8}
                >
                  <Text style={[F.bodySemiBold, { fontSize: 14, color: '#F5F0E6' }]}>Done. In they go.</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Bottom controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}>
        <TouchableOpacity
          onPress={() => setIsPaused(!isPaused)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          activeOpacity={0.8}
        >
          <Text style={[F.bodyMedium, { fontSize: 15, color: '#1A1A1A' }]}>{isPaused ? 'Resume' : 'Pause'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={finishBoil}
          style={{ backgroundColor: '#B8633A', height: 48, paddingHorizontal: 24, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          activeOpacity={0.8}
        >
          <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>Start Cooling</Text>
          <ArrowRight size={18} color="#F5F0E6" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hopCard: {
    backgroundColor: '#FAF6EE',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBE3D2',
    marginBottom: 12,
  },
});
