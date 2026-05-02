import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../src/stores/appStore';
import { ChevronLeft, Beaker, Wheat, Hop, FlaskConical } from 'lucide-react-native';
import { srmToHex } from '../../src/lib/brewing/calculations';
import { useFadeIn } from '../../src/lib/animations';
import { Animated } from 'react-native';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayItalic: { fontFamily: 'Newsreader_400Regular_Italic' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recipe = useAppStore((s) => s.recipes.find((r) => r.id === id));
  const addBatch = useAppStore((s) => s.addBatch);
  const fade = useFadeIn(0);

  if (!recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[F.body, { color: '#6E6E6E' }]}>Recipe not found.</Text>
      </SafeAreaView>
    );
  }

  const srmColor = srmToHex(recipe.estimated_srm);

  function brewThis() {
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

  const stats = [
    { label: 'OG', value: recipe.estimated_og.toFixed(3) },
    { label: 'FG', value: recipe.estimated_fg.toFixed(3) },
    { label: 'ABV', value: `${recipe.estimated_abv_pct.toFixed(1)}%` },
    { label: 'IBU', value: `${recipe.estimated_ibu}` },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <Animated.ScrollView style={{ flex: 1, opacity: fade.opacity, transform: [{ translateY: fade.translateY }] }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={{ marginRight: 12 }}>
            <ChevronLeft size={28} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Recipe</Text>
            <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A' }]}>{recipe.name}</Text>
          </View>
        </View>

        {/* SRM preview */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: srmColor, borderWidth: 2, borderColor: '#EBE3D2', marginRight: 16 }} />
          <View>
            <Text style={[F.body, { fontSize: 13, color: '#6E6E6E' }]}>Colour</Text>
            <Text style={[F.mono, { fontSize: 15, color: '#1A1A1A', marginTop: 2 }]}>SRM {recipe.estimated_srm}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.card, { flex: 1, alignItems: 'center', paddingVertical: 14 }]}>
              <Text style={[F.mono, { fontSize: 18, lineHeight: 24, color: '#1A1A1A' }]}>{s.value}</Text>
              <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Ingredients */}
        <Text style={[F.display, { fontSize: 20, lineHeight: 26, color: '#1A1A1A', marginBottom: 12 }]}>Ingredients</Text>

        <View style={[styles.card, { marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Wheat size={18} color="#B8633A" strokeWidth={1.5} />
            <Text style={[F.bodySemiBold, { fontSize: 15, color: '#1A1A1A', marginLeft: 8 }]}>Fermentables</Text>
          </View>
          {recipe.fermentables.map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#EBE3D2' }}>
              <Text style={[F.body, { fontSize: 14, color: '#3D3D3D' }]}>{f.fermentable.name}</Text>
              <Text style={[F.mono, { fontSize: 14, color: '#1A1A1A' }]}>{f.amount_kg.toFixed(2)} kg</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Hop size={18} color="#B8633A" strokeWidth={1.5} />
            <Text style={[F.bodySemiBold, { fontSize: 15, color: '#1A1A1A', marginLeft: 8 }]}>Hops</Text>
          </View>
          {recipe.hops.map((h, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#EBE3D2' }}>
              <Text style={[F.body, { fontSize: 14, color: '#3D3D3D' }]}>{h.hop.name}</Text>
              <Text style={[F.mono, { fontSize: 14, color: '#1A1A1A' }]}>{h.amount_g}g @ {h.time_min}m</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { marginBottom: 24 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Beaker size={18} color="#B8633A" strokeWidth={1.5} />
            <Text style={[F.bodySemiBold, { fontSize: 15, color: '#1A1A1A', marginLeft: 8 }]}>Yeast</Text>
          </View>
          {recipe.cultures.map((c, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#EBE3D2' }}>
              <Text style={[F.body, { fontSize: 14, color: '#3D3D3D' }]}>{c.culture.name}</Text>
              <Text style={[F.mono, { fontSize: 14, color: '#1A1A1A' }]}>{c.amount_g_or_ml}g</Text>
            </View>
          ))}
        </View>

        {/* Process */}
        <Text style={[F.display, { fontSize: 20, lineHeight: 26, color: '#1A1A1A', marginBottom: 12 }]}>Process</Text>

        <View style={[styles.card, { marginBottom: 12 }]}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }]}>Mash</Text>
          {recipe.process.mash.steps.map((s, i) => (
            <Text key={i} style={[F.body, { fontSize: 14, color: '#3D3D3D', paddingVertical: 3 }]}>
              {s.name}: {s.temperature_c}°C for {s.duration_min} min
            </Text>
          ))}
        </View>

        <View style={[styles.card, { marginBottom: 12 }]}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }]}>Boil</Text>
          <Text style={[F.body, { fontSize: 14, color: '#3D3D3D' }]}>
            {recipe.process.boil.duration_min} minutes · {recipe.process.boil.vigour} vigour
          </Text>
        </View>

        <View style={[styles.card, { marginBottom: 12 }]}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }]}>Fermentation</Text>
          {recipe.process.fermentation.steps.map((s, i) => (
            <Text key={i} style={[F.body, { fontSize: 14, color: '#3D3D3D', paddingVertical: 3 }]}>
              {s.name}: {s.temperature_c}°C
            </Text>
          ))}
        </View>

        <View style={[styles.card, { marginBottom: 32 }]}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }]}>Packaging</Text>
          <Text style={[F.body, { fontSize: 14, color: '#3D3D3D', textTransform: 'capitalize' }]}>
            {recipe.process.packaging.method} · {recipe.process.packaging.carbonation_volumes_co2} vols CO₂
          </Text>
        </View>

        {/* Brew CTA */}
        <TouchableOpacity
          onPress={brewThis}
          style={{ backgroundColor: '#B8633A', height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 32 }}
          activeOpacity={0.8}
        >
          <FlaskConical size={18} color="#F5F0E6" strokeWidth={2} />
          <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>Brew this</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
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
