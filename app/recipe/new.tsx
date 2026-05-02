import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/stores/appStore';
import { useState, useMemo } from 'react';
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import { calculateRecipeStats } from '../../src/lib/brewing/helpers';
import { FermentableAddition, HopAddition, CultureAddition, Fermentable, Hop, Culture } from '../../src/lib/beerjson/types';
import IngredientPicker from '../../src/components/IngredientPicker';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

export default function NewRecipeScreen() {
  const router = useRouter();
  const addRecipe = useAppStore((s) => s.addRecipe);
  const addBatch = useAppStore((s) => s.addBatch);
  const seedFermentables = useAppStore((s) => s.fermentables);
  const seedHops = useAppStore((s) => s.hops);
  const seedCultures = useAppStore((s) => s.cultures);

  const [name, setName] = useState('');
  const [batchSize, setBatchSize] = useState('20');
  const [efficiency, setEfficiency] = useState('75');
  const [fermentables, setFermentables] = useState<FermentableAddition[]>([]);
  const [hops, setHops] = useState<HopAddition[]>([]);
  const [cultures, setCultures] = useState<CultureAddition[]>([]);

  const [pickerMode, setPickerMode] = useState<'fermentable' | 'hop' | 'culture' | null>(null);
  const addCustomFermentable = useAppStore((s) => s.addCustomFermentable);
  const addCustomHop = useAppStore((s) => s.addCustomHop);
  const addCustomCulture = useAppStore((s) => s.addCustomCulture);

  const stats = useMemo(() => {
    if (fermentables.length === 0) return null;
    try {
      return calculateRecipeStats(fermentables, hops, cultures, parseFloat(batchSize) || 20, parseFloat(efficiency) || 75);
    } catch {
      return null;
    }
  }, [fermentables, hops, cultures, batchSize, efficiency]);

  function addFermentable() {
    setPickerMode('fermentable');
  }

  function addHop() {
    setPickerMode('hop');
  }

  function addCulture() {
    setPickerMode('culture');
  }

  function handleSelectFermentable(f: Fermentable) {
    setFermentables((prev) => [...prev, { fermentable_id: f.id, fermentable: f, amount_kg: 2, use: 'mash' }]);
  }

  function handleSelectHop(h: Hop) {
    setHops((prev) => [...prev, { hop_id: h.id, hop: h, amount_g: 30, use: 'boil', time_min: 60 }]);
  }

  function handleSelectCulture(c: Culture) {
    setCultures((prev) => [...prev, { culture_id: c.id, culture: c, amount_g_or_ml: 11.5 }]);
  }

  function saveRecipe() {
    if (!name || fermentables.length === 0) return;
    const recipe = {
      id: `recipe-${Date.now()}`,
      author_id: 'local-user',
      name,
      type: 'all grain' as const,
      batch_size_l: parseFloat(batchSize) || 20,
      efficiency_pct: parseFloat(efficiency) || 75,
      fermentables,
      hops,
      cultures,
      process: {
        water_profile: { calcium_ppm: 0, magnesium_ppm: 0, sodium_ppm: 0, sulfate_ppm: 0, chloride_ppm: 0, bicarbonate_ppm: 0 },
        mash: { steps: [{ name: 'Mash', temperature_c: 67, duration_min: 60, type: 'infusion' }], water_grain_ratio_l_per_kg: 3, sparge: 'batch', target_ph: 5.4 },
        boil: { duration_min: 60, vigour: 'rolling' },
        fermentation: { steps: [{ name: 'Primary', type: 'primary', start_condition: { type: 'time-after-pitch', value: 0 }, temperature_c: 18, end_condition: { type: 'duration-days', value: 14 } }], pitch_temp_c: 18, oxygenation: 'shake' },
        packaging: { method: 'bottle', carbonation_volumes_co2: 2.4, serving_temp_c: 6 },
      },
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...calculateRecipeStats(fermentables, hops, cultures, parseFloat(batchSize) || 20, parseFloat(efficiency) || 75),
    };
    addRecipe(recipe);
    const batch = {
      id: `batch-${Date.now()}`,
      user_id: 'local-user',
      recipe_id: recipe.id,
      recipe_snapshot: recipe,
      name: `${recipe.name} — Batch #1`,
      status: 'planned' as const,
      started_at: new Date().toISOString(),
      estimated_ready_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      measurements: [],
      predicted_curve: [],
      notes: [],
      photos: [],
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBatch(batch);
    router.push(`/batch/${batch.id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <ChevronLeft size={28} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={[F.display, { fontSize: 20, lineHeight: 28, color: '#1A1A1A' }]}>New Recipe</Text>
          <TouchableOpacity onPress={saveRecipe} activeOpacity={0.8} disabled={!name || fermentables.length === 0}>
            <Text style={[F.bodySemiBold, { fontSize: 15, color: name && fermentables.length > 0 ? '#B8633A' : '#6E6E6E' }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }]}>Recipe Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g., West Coast IPA"
          placeholderTextColor="#6E6E6E"
          style={[F.body, { fontSize: 17, color: '#1A1A1A', borderWidth: 1.5, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAF6EE' }]}
        />

        {/* Batch specs */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }]}>Batch Size (L)</Text>
            <TextInput
              value={batchSize}
              onChangeText={setBatchSize}
              keyboardType="decimal-pad"
              style={[F.mono, { fontSize: 17, color: '#1A1A1A', borderWidth: 1.5, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAF6EE' }]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }]}>Efficiency %</Text>
            <TextInput
              value={efficiency}
              onChangeText={setEfficiency}
              keyboardType="decimal-pad"
              style={[F.mono, { fontSize: 17, color: '#1A1A1A', borderWidth: 1.5, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAF6EE' }]}
            />
          </View>
        </View>

        {/* Live Stats */}
        {stats && (
          <View style={[styles.card, { marginTop: 20 }]}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }]}>Predicted Profile</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: 'OG', value: stats.estimated_og.toFixed(3) },
                { label: 'FG', value: stats.estimated_fg.toFixed(3) },
                { label: 'ABV', value: `${stats.estimated_abv_pct.toFixed(1)}%` },
                { label: 'IBU', value: `${stats.estimated_ibu}` },
                { label: 'SRM', value: `${stats.estimated_srm}` },
              ].map((s) => (
                <View key={s.label} style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F0E6', borderRadius: 8, paddingVertical: 10 }}>
                  <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1 }]}>{s.label}</Text>
                  <Text style={[F.mono, { fontSize: 16, color: '#1A1A1A', marginTop: 4 }]}>{s.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Fermentables */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[F.display, { fontSize: 18, lineHeight: 24, color: '#1A1A1A' }]}>Fermentables</Text>
            <TouchableOpacity onPress={addFermentable} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} activeOpacity={0.8}>
              <Plus size={16} color="#B8633A" strokeWidth={2} />
              <Text style={[F.bodyMedium, { fontSize: 13, color: '#B8633A' }]}>Add</Text>
            </TouchableOpacity>
          </View>
          {fermentables.map((f, i) => (
            <View key={i} style={[styles.ingredientRow, { marginBottom: 8 }]}>
              <Text style={[F.body, { fontSize: 14, color: '#1A1A1A', flex: 1 }]}>{f.fermentable.name}</Text>
              <TextInput
                value={f.amount_kg.toString()}
                onChangeText={(v) => {
                  const next = [...fermentables];
                  next[i] = { ...f, amount_kg: parseFloat(v) || 0 };
                  setFermentables(next);
                }}
                keyboardType="decimal-pad"
                style={[F.mono, { fontSize: 14, color: '#1A1A1A', width: 60, textAlign: 'right', borderWidth: 1, borderColor: '#EBE3D2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }]}
              />
              <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginLeft: 4, width: 20 }]}>kg</Text>
              <TouchableOpacity onPress={() => setFermentables((prev) => prev.filter((_, idx) => idx !== i))} style={{ marginLeft: 8 }}>
                <X size={16} color="#6E6E6E" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Hops */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[F.display, { fontSize: 18, lineHeight: 24, color: '#1A1A1A' }]}>Hops</Text>
            <TouchableOpacity onPress={addHop} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} activeOpacity={0.8}>
              <Plus size={16} color="#B8633A" strokeWidth={2} />
              <Text style={[F.bodyMedium, { fontSize: 13, color: '#B8633A' }]}>Add</Text>
            </TouchableOpacity>
          </View>
          {hops.map((h, i) => (
            <View key={i} style={[styles.ingredientRow, { marginBottom: 8 }]}>
              <Text style={[F.body, { fontSize: 14, color: '#1A1A1A', flex: 1 }]}>{h.hop.name}</Text>
              <TextInput
                value={h.amount_g.toString()}
                onChangeText={(v) => {
                  const next = [...hops];
                  next[i] = { ...h, amount_g: parseFloat(v) || 0 };
                  setHops(next);
                }}
                keyboardType="decimal-pad"
                style={[F.mono, { fontSize: 14, color: '#1A1A1A', width: 50, textAlign: 'right', borderWidth: 1, borderColor: '#EBE3D2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4 }]}
              />
              <Text style={[F.body, { fontSize: 12, color: '#6E6E6E', marginHorizontal: 4 }]}>g</Text>
              <Text style={[F.body, { fontSize: 12, color: '#6E6E6E' }]}>@</Text>
              <TextInput
                value={h.time_min.toString()}
                onChangeText={(v) => {
                  const next = [...hops];
                  next[i] = { ...h, time_min: parseFloat(v) || 0 };
                  setHops(next);
                }}
                keyboardType="decimal-pad"
                style={[F.mono, { fontSize: 14, color: '#1A1A1A', width: 44, textAlign: 'right', borderWidth: 1, borderColor: '#EBE3D2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4 }]}
              />
              <Text style={[F.body, { fontSize: 12, color: '#6E6E6E', marginLeft: 2 }]}>m</Text>
              <TouchableOpacity onPress={() => setHops((prev) => prev.filter((_, idx) => idx !== i))} style={{ marginLeft: 8 }}>
                <X size={16} color="#6E6E6E" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Yeast */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[F.display, { fontSize: 18, lineHeight: 24, color: '#1A1A1A' }]}>Yeast</Text>
            <TouchableOpacity onPress={addCulture} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} activeOpacity={0.8}>
              <Plus size={16} color="#B8633A" strokeWidth={2} />
              <Text style={[F.bodyMedium, { fontSize: 13, color: '#B8633A' }]}>Add</Text>
            </TouchableOpacity>
          </View>
          {cultures.map((c, i) => (
            <View key={i} style={[styles.ingredientRow, { marginBottom: 8 }]}>
              <Text style={[F.body, { fontSize: 14, color: '#1A1A1A', flex: 1 }]}>{c.culture.name}</Text>
              <TextInput
                value={c.amount_g_or_ml.toString()}
                onChangeText={(v) => {
                  const next = [...cultures];
                  next[i] = { ...c, amount_g_or_ml: parseFloat(v) || 0 };
                  setCultures(next);
                }}
                keyboardType="decimal-pad"
                style={[F.mono, { fontSize: 14, color: '#1A1A1A', width: 60, textAlign: 'right', borderWidth: 1, borderColor: '#EBE3D2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }]}
              />
              <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginLeft: 4, width: 20 }]}>g</Text>
              <TouchableOpacity onPress={() => setCultures((prev) => prev.filter((_, idx) => idx !== i))} style={{ marginLeft: 8 }}>
                <X size={16} color="#6E6E6E" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* AI Suggestion placeholder */}
        {stats && (
          <View style={[styles.card, { marginTop: 24, marginBottom: 32, backgroundColor: '#F1DCC9', borderColor: '#F1DCC9' }]}>
            <Text style={[F.bodySemiBold, { fontSize: 13, color: '#8E4A2A', marginBottom: 6 }]}>AI Suggestion</Text>
            <Text style={[F.body, { fontSize: 14, lineHeight: 20, color: '#5C3A1E' }]}>
              {stats.estimated_ibu > 60
                ? "That's a hefty bitterness. Consider backing off the early hops if you want more balance."
                : stats.estimated_abv_pct > 7
                ? 'High ABV — make sure your yeast can handle it. Consider a starter.'
                : stats.estimated_srm > 30
                ? 'Dark beer territory. Check your roasted malt amounts — a little goes a long way.'
                : "Looking balanced. Your OG and bitterness are in harmony. You're good to brew."}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Ingredient Pickers */}
      <IngredientPicker
        visible={pickerMode === 'fermentable'}
        mode="fermentable"
        items={seedFermentables}
        onSelect={handleSelectFermentable}
        onAddCustom={addCustomFermentable}
        onClose={() => setPickerMode(null)}
      />
      <IngredientPicker
        visible={pickerMode === 'hop'}
        mode="hop"
        items={seedHops}
        onSelect={handleSelectHop}
        onAddCustom={addCustomHop}
        onClose={() => setPickerMode(null)}
      />
      <IngredientPicker
        visible={pickerMode === 'culture'}
        mode="culture"
        items={seedCultures}
        onSelect={handleSelectCulture}
        onAddCustom={addCustomCulture}
        onClose={() => setPickerMode(null)}
      />
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
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6EE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EBE3D2',
  },
});
