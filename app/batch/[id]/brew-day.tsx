import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../../src/stores/appStore';
import { ChevronLeft, ChevronDown, Check } from 'lucide-react-native';
import { srmToHex } from '../../../src/lib/brewing/calculations';
import { useState } from 'react';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayMedium: { fontFamily: 'Newsreader_500Medium' },
  displayItalic: { fontFamily: 'Newsreader_400Regular_Italic' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
};

interface CheckItem {
  id: string;
  label: string;
  note?: string;
}

const prepItems: CheckItem[] = [
  { id: 'sanitised', label: 'Equipment is sanitised' },
  { id: 'water', label: 'Mash water heated to 72°C', note: 'Strike temp = mash target + 3°C' },
  { id: 'grain', label: 'Grain bill weighed and ready' },
  { id: 'hops', label: 'Hops measured into separate vessels' },
  { id: 'yeast', label: 'Yeast at room temperature' },
];

function CheckBox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#B8633A',
        backgroundColor: checked ? '#B8633A' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}
    >
      {checked && <Check size={16} color="#F5F0E6" strokeWidth={2.5} />}
    </TouchableOpacity>
  );
}

export default function BrewDayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const batch = useAppStore((s) => s.batches.find((b) => b.id === id));
  const updateBatch = useAppStore((s) => s.updateBatch);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [showPlan, setShowPlan] = useState(false);

  if (!batch) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[F.body, { color: '#6E6E6E' }]}>Batch not found.</Text>
      </SafeAreaView>
    );
  }

  const recipe = batch.recipe_snapshot;
  const srmColor = srmToHex(recipe.estimated_srm);
  const startSession = useAppStore((s) => s.startSession);
  const estimatedHours = Math.round(
    recipe.process.mash.steps.reduce((s, step) => s + step.duration_min, 0) / 60 +
      recipe.process.boil.duration_min / 60 + 1
  );

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startBrew() {
    startSession(batch.id);
    updateBatch({ ...batch, status: 'brew-day', started_at: new Date().toISOString() });
    router.push(`/batch/${batch.id}/session/mash` as any);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <ChevronLeft size={28} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={[F.displayItalic, { fontSize: 17, lineHeight: 26, color: '#1A1A1A' }]}>Brew day</Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={[F.bodyMedium, { fontSize: 15, color: '#B8633A' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Status label */}
        <Text style={[F.bodyMedium, { fontSize: 13, color: '#B8633A', textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 }]}>
          Ready to Brew
        </Text>

        {/* Recipe name */}
        <Text style={[F.display, { fontSize: 40, lineHeight: 48, color: '#1A1A1A', marginTop: 8, letterSpacing: -0.5 }]}>
          {recipe.name}
        </Text>

        {/* Meta */}
        <Text style={[F.body, { fontSize: 15, lineHeight: 22, color: '#6E6E6E', marginTop: 12 }]}>
          Estimated {estimatedHours} hours · {recipe.batch_size_l}L batch · OG {recipe.estimated_og.toFixed(3)} · IBU {recipe.estimated_ibu}
        </Text>

        {/* Hero */}
        <View style={[styles.heroImage, { backgroundColor: srmColor, marginTop: 20, marginBottom: 20 }]}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[F.displayItalic, { fontSize: 17, color: 'rgba(245,240,230,0.6)' }]}>
              {recipe.fermentables.map((f) => f.fermentable.name).join(', ')}
            </Text>
          </View>
        </View>

        {/* Before you begin */}
        <View style={styles.card}>
          <Text style={[F.body, { fontSize: 17, lineHeight: 26, color: '#1A1A1A', fontWeight: '500', marginBottom: 16 }]}>
            Before you begin
          </Text>
          {prepItems.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 }}>
              <CheckBox checked={checked.has(item.id)} onToggle={() => toggleCheck(item.id)} />
              <View style={{ flex: 1 }}>
                <Text style={[F.body, { fontSize: 15, lineHeight: 22, color: checked.has(item.id) ? '#6E6E6E' : '#1A1A1A', textDecorationLine: checked.has(item.id) ? 'line-through' : 'none' }]}>
                  {item.label}
                </Text>
                {item.note && (
                  <Text style={[F.displayItalic, { fontSize: 13, lineHeight: 18, color: '#6E6E6E', marginTop: 2 }]}>
                    {item.note}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* What we'll do today */}
        <TouchableOpacity
          onPress={() => setShowPlan(!showPlan)}
          activeOpacity={0.9}
          style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }]}
        >
          <Text style={[F.body, { fontSize: 17, lineHeight: 26, color: '#1A1A1A', fontWeight: '500' }]}>
            What we'll do today
          </Text>
          <ChevronDown
            size={20}
            color="#6E6E6E"
            strokeWidth={1.5}
            style={{ transform: [{ rotate: showPlan ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {showPlan && (
          <View style={[styles.card, { marginTop: -2, borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }]}>Mash</Text>
            {recipe.process.mash.steps.map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={[F.body, { fontSize: 15, color: '#3D3D3D' }]}>{step.name}</Text>
                <Text style={[F.body, { fontSize: 15, color: '#1A1A1A' }]}>{step.temperature_c}°C · {step.duration_min} min</Text>
              </View>
            ))}

            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 8 }]}>Boil</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={[F.body, { fontSize: 15, color: '#3D3D3D' }]}>Duration</Text>
              <Text style={[F.body, { fontSize: 15, color: '#1A1A1A' }]}>{recipe.process.boil.duration_min} min</Text>
            </View>
            {recipe.hops.filter((h) => h.use === 'boil').map((h, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={[F.body, { fontSize: 15, color: '#3D3D3D' }]}>{h.hop.name}</Text>
                <Text style={[F.body, { fontSize: 15, color: '#1A1A1A' }]}>{h.amount_g}g @ {h.time_min} min</Text>
              </View>
            ))}

            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 8 }]}>Fermentation</Text>
            {recipe.process.fermentation.steps.map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={[F.body, { fontSize: 15, color: '#3D3D3D' }]}>{step.name}</Text>
                <Text style={[F.body, { fontSize: 15, color: '#1A1A1A' }]}>{step.temperature_c}°C</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quote */}
        <Text style={[F.displayItalic, { fontSize: 15, lineHeight: 22, color: '#6E6E6E', textAlign: 'center', marginTop: 24, marginBottom: 24, paddingHorizontal: 16 }]}>
          "A clean brewery is a happy brewery. Don't skip the sanitiser."
        </Text>

        {/* Actions */}
        <View style={{ gap: 12, marginBottom: 32 }}>
          <TouchableOpacity
            onPress={startBrew}
            style={{ backgroundColor: '#B8633A', height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.8}
          >
            <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>I'm ready. Start the brew.</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={[F.body, { fontSize: 15, color: '#6E6E6E', textDecorationLine: 'underline' }]}>
              Save and come back later
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
