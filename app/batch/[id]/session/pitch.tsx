import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../../../src/stores/appStore';
import { useState } from 'react';
import { X } from 'lucide-react-native';
import { formatTemp } from '../../../../src/lib/units';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayItalic: { fontFamily: 'Newsreader_400Regular_Italic' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

const PHASES = ['setup', 'mash', 'boil', 'cool', 'pitch', 'complete'];

export default function PitchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const batch = useAppStore((s) => s.batches.find((b) => b.id === id));
  const session = useAppStore((s) => s.sessions.find((s) => s.batch_id === id));
  const updateSession = useAppStore((s) => s.updateSession);
  const updateBatch = useAppStore((s) => s.updateBatch);

  const [og, setOg] = useState('');
  const [volume, setVolume] = useState('');
  const [temp, setTemp] = useState('');

  const recipe = batch?.recipe_snapshot;

  if (!batch || !recipe || !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[F.body, { color: '#6E6E6E' }]}>Batch not found.</Text>
      </SafeAreaView>
    );
  }

  const progress = PHASES.indexOf('pitch') / (PHASES.length - 1);
  const culture = recipe.cultures[0];
  const predictedOG = recipe.estimated_og.toFixed(3);
  const targetVol = recipe.batch_size_l;
  const pitchTemp = recipe.process.fermentation.pitch_temp_c;
  const unitSystem = useAppStore((s) => s.unitSystem);

  function complete() {
    updateSession({ ...session, phase: 'complete' });
    updateBatch({
      ...batch,
      status: 'lag-phase',
      started_at: new Date().toISOString(),
    });
    router.push(`/batch/${id}/session/complete` as any);
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
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={[F.bodyMedium, { fontSize: 13, color: '#B8633A', textTransform: 'uppercase', letterSpacing: 2 }]}>
          Time to Pitch
        </Text>
        <Text style={[F.display, { fontSize: 28, lineHeight: 36, color: '#1A1A1A', marginTop: 8 }]}>
          The yeast goes in.
        </Text>
        <Text style={[F.body, { fontSize: 15, lineHeight: 22, color: '#6E6E6E', marginTop: 4 }]}>
          Take your final readings, then pitch.
        </Text>

        {/* OG Input */}
        <View style={[styles.inputCard, { marginTop: 24 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[F.bodySemiBold, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>
              Original Gravity
            </Text>
            <TouchableOpacity
              onPress={() => setOg(predictedOG)}
              style={{ backgroundColor: '#F1DCC9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}
              activeOpacity={0.8}
            >
              <Text style={[F.bodyMedium, { fontSize: 12, color: '#8E4A2A' }]}>Use predicted</Text>
            </TouchableOpacity>
          </View>
          <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginBottom: 8 }]}>
            Predicted: {predictedOG}
          </Text>
          <TextInput
            value={og}
            onChangeText={setOg}
            placeholder="1.050"
            placeholderTextColor="#6E6E6E"
            keyboardType="decimal-pad"
            style={[F.mono, { fontSize: 18, color: '#1A1A1A', borderWidth: 1.5, borderColor: '#B8633A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAF6EE' }]}
          />
        </View>

        {/* Volume Input */}
        <View style={[styles.inputCard, { marginTop: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[F.bodySemiBold, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>
              Fermenter Volume
            </Text>
            <TouchableOpacity
              onPress={() => setVolume(targetVol.toString())}
              style={{ backgroundColor: '#F1DCC9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}
              activeOpacity={0.8}
            >
              <Text style={[F.bodyMedium, { fontSize: 12, color: '#8E4A2A' }]}>Use target</Text>
            </TouchableOpacity>
          </View>
          <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginBottom: 8 }]}>
            Target: {targetVol} L
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              value={volume}
              onChangeText={setVolume}
              placeholder="20"
              placeholderTextColor="#6E6E6E"
              keyboardType="decimal-pad"
              style={[F.mono, { flex: 1, fontSize: 18, color: '#1A1A1A', borderWidth: 1.5, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAF6EE' }]}
            />
            <Text style={[F.body, { fontSize: 15, color: '#6E6E6E', marginLeft: 8 }]}>L</Text>
          </View>
        </View>

        {/* Pitch Temp Input */}
        <View style={[styles.inputCard, { marginTop: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[F.bodySemiBold, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>
              Pitch Temp
            </Text>
            <TouchableOpacity
              onPress={() => setTemp(pitchTemp.toString())}
              style={{ backgroundColor: '#F1DCC9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}
              activeOpacity={0.8}
            >
              <Text style={[F.bodyMedium, { fontSize: 12, color: '#8E4A2A' }]}>Use target</Text>
            </TouchableOpacity>
          </View>
          <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginBottom: 8 }]}>
            Recipe target: {formatTemp(pitchTemp, unitSystem)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              value={temp}
              onChangeText={setTemp}
              placeholder="18"
              placeholderTextColor="#6E6E6E"
              keyboardType="decimal-pad"
              style={[F.mono, { flex: 1, fontSize: 18, color: '#1A1A1A', borderWidth: 1.5, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAF6EE' }]}
            />
            <Text style={[F.body, { fontSize: 15, color: '#6E6E6E', marginLeft: 8 }]}>{unitSystem === 'metric' ? '°C' : '°F'}</Text>
          </View>
        </View>

        {/* Yeast instruction */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={[F.bodySemiBold, { fontSize: 15, color: '#1A1A1A' }]}>
            Pitch the yeast
          </Text>
          <Text style={[F.body, { fontSize: 14, lineHeight: 20, color: '#3D3D3D', marginTop: 4 }]}>
            {culture?.culture.name ?? 'Safale US-05'} ({culture?.amount_g_or_ml ?? 11.5}g) — sprinkle on surface, leave 15 min, stir gently.
          </Text>
        </View>
      </View>

      {/* Bottom */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}>
        <TouchableOpacity
          onPress={complete}
          style={{ backgroundColor: '#B8633A', height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.8}
        >
          <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>Pitched. Start the timer.</Text>
        </TouchableOpacity>
        <Text style={[F.body, { fontSize: 12, color: '#6E6E6E', textAlign: 'center', marginTop: 10 }]}>
          This locks in the recipe details and transitions the session to fermentation monitoring.
        </Text>
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
  inputCard: {
    backgroundColor: '#FAF6EE',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBE3D2',
  },
});
