import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../src/stores/appStore';
import { ChevronLeft, Beaker, Wheat, Hop, FlaskConical, Share2, ShoppingCart, PoundSterling, AlertCircle, GitFork, Eye, EyeOff } from 'lucide-react-native';
import { srmToHex } from '../../src/lib/brewing/calculations';
import { getRecipeWaterChemistry } from '../../src/lib/brewing/helpers';
import { recipeToBeerXML } from '../../src/lib/beerxml';
import { formatVolume, formatMass, formatTemp, formatSmallMass } from '../../src/lib/units';
import * as Sharing from 'expo-sharing';
import { useFadeIn } from '../../src/lib/animations';
import { calculateRecipeCost, costPerPint } from '../../src/lib/costs';
import { apiClient } from '../../src/lib/api';
import { getSyncToken } from '../../src/lib/sync/engine';
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
  const addShoppingListItem = useAppStore((s) => s.addShoppingListItem);
  const updateRecipe = useAppStore((s) => s.updateRecipe);
  const inventory = useAppStore((s) => s.inventory);
  const fade = useFadeIn(0);

  const costInfo = recipe ? calculateRecipeCost(recipe, inventory) : null;
  const isOwnRecipe = recipe?.author_id === 'local-user' || recipe?.author_id?.startsWith('user_');
  const [isPublic, setIsPublic] = useState(recipe?.is_public ?? false);

  useEffect(() => {
    if (recipe) setIsPublic(recipe.is_public);
  }, [recipe?.is_public]);

  async function togglePublic() {
    if (!recipe) return;
    const next = !isPublic;
    setIsPublic(next);
    updateRecipe({ ...recipe, is_public: next });
    try {
      const token = getSyncToken();
      await apiClient.put(`/recipes/${recipe.id}`, { isPublic: next }, token);
    } catch {
      // revert on failure
      setIsPublic(!next);
    }
  }

  async function forkRecipe() {
    if (!recipe) return;
    try {
      const token = getSyncToken();
      const res = await apiClient.post<{ data: any }>(`/recipes/${recipe.id}/fork`, {}, token);
      const forked = res.data;
      if (forked) {
        router.push(`/recipe/${forked.id}`);
      }
    } catch {
      // silently fail
    }
  }

  if (!recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[F.body, { color: '#6E6E6E' }]}>Recipe not found.</Text>
      </SafeAreaView>
    );
  }

  const srmColor = srmToHex(recipe.estimated_srm);
  const unitSystem = useAppStore((s) => s.unitSystem);

  async function shareRecipe() {
    const xml = recipeToBeerXML(recipe);
    const fileUri = `data:text/xml;base64,${btoa(xml)}`;
    try {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/xml',
        dialogTitle: `${recipe.name}.xml`,
        UTI: 'public.xml',
      });
    } catch {
      // User cancelled share
    }
  }

  function amazonLink(query: string) {
    // Replace with your actual Amazon affiliate tag
    const affiliateTag = 'maximsullivan-21';
    return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${affiliateTag}`;
  }

  function brewThis() {
    // Add missing ingredients to shopping list
    if (costInfo?.missingIngredients.length) {
      for (const missing of costInfo.missingIngredients) {
        addShoppingListItem({
          id: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          user_id: 'local',
          ingredient_type: missing.type as any,
          custom_name: missing.name,
          amount_needed: missing.amount,
          unit: missing.unit,
          purchased: false,
          created_at: new Date().toISOString(),
        });
      }
    }

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

  const waterChem = getRecipeWaterChemistry(recipe);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <Animated.ScrollView style={{ flex: 1, opacity: fade.opacity, transform: [{ translateY: fade.translateY }] }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={{ marginRight: 12 }}>
            <ChevronLeft size={28} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity onPress={shareRecipe} activeOpacity={0.8} style={{ marginRight: 12 }}>
            <Share2 size={22} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Recipe</Text>
            <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A' }]}>{recipe.name}</Text>
          </View>
          {isOwnRecipe && (
            <TouchableOpacity onPress={togglePublic} activeOpacity={0.8} style={{ marginRight: 8 }}>
              {isPublic ? (
                <Eye size={22} color="#5C6A54" strokeWidth={1.5} />
              ) : (
                <EyeOff size={22} color="#9E9E9E" strokeWidth={1.5} />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={forkRecipe} activeOpacity={0.8}>
            <GitFork size={22} color="#B8633A" strokeWidth={1.5} />
          </TouchableOpacity>
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

        {/* Cost estimate */}
        {costInfo && costInfo.totalCost > 0 && (
          <View style={[styles.card, { marginBottom: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <PoundSterling size={18} color="#5C6A54" strokeWidth={1.5} />
              <Text style={[F.bodySemiBold, { fontSize: 15, color: '#1A1A1A', marginLeft: 8 }]}>Estimated Cost</Text>
              <Text style={[F.displayMedium, { fontSize: 18, color: '#5C6A54', marginLeft: 'auto' }]}>
                £{costInfo.totalCost.toFixed(2)}
              </Text>
            </View>
            <Text style={[F.mono, { fontSize: 12, color: '#6E6E6E' }]}>
              £{costPerPint(costInfo.totalCost, recipe.batch_size_l).toFixed(2)} per pint
            </Text>
            {costInfo.missingIngredients.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                <AlertCircle size={14} color="#A67C3A" strokeWidth={2} />
                <Text style={[F.body, { fontSize: 12, color: '#A67C3A' }]}>
                  {costInfo.missingIngredients.length} ingredient{costInfo.missingIngredients.length > 1 ? 's' : ''} not in pantry — will add to shopping list
                </Text>
              </View>
            )}
          </View>
        )}

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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[F.mono, { fontSize: 14, color: '#1A1A1A' }]}>{formatMass(f.amount_kg, unitSystem)}</Text>
                <TouchableOpacity onPress={() => window.open?.(amazonLink(f.fermentable.name), '_blank')}>
                  <ShoppingCart size={14} color="#B8633A" />
                </TouchableOpacity>
              </View>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[F.mono, { fontSize: 14, color: '#1A1A1A' }]}>{formatSmallMass(h.amount_g / 1000, unitSystem)} @ {h.time_min}m</Text>
                <TouchableOpacity onPress={() => window.open?.(amazonLink(h.hop.name + ' hops'), '_blank')}>
                  <ShoppingCart size={14} color="#B8633A" />
                </TouchableOpacity>
              </View>
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
              <TouchableOpacity onPress={() => window.open?.(amazonLink(c.culture.name + ' yeast'), '_blank')}>
                <ShoppingCart size={14} color="#B8633A" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Process */}
        <Text style={[F.display, { fontSize: 20, lineHeight: 26, color: '#1A1A1A', marginBottom: 12 }]}>Process</Text>

        <View style={[styles.card, { marginBottom: 12 }]}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }]}>Mash</Text>
          {recipe.process.mash.steps.map((s, i) => (
            <Text key={i} style={[F.body, { fontSize: 14, color: '#3D3D3D', paddingVertical: 3 }]}>
              {s.name}: {formatTemp(s.temperature_c, unitSystem)} for {s.duration_min} min
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
              {s.name}: {formatTemp(s.temperature_c, unitSystem)}
            </Text>
          ))}
        </View>

        <View style={[styles.card, { marginBottom: 12 }]}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }]}>Packaging</Text>
          <Text style={[F.body, { fontSize: 14, color: '#3D3D3D', textTransform: 'capitalize' }]}>
            {recipe.process.packaging.method} · {recipe.process.packaging.carbonation_volumes_co2} vols CO₂
          </Text>
        </View>

        {/* Water Chemistry */}
        <View style={[styles.card, { marginBottom: 32 }]}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }]}>Water Chemistry</Text>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: '#F5F0E6', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#EBE3D2' }}>
              <Text style={[F.mono, { fontSize: 16, color: '#1A1A1A' }]}>{waterChem.sulfate_chloride_ratio.toFixed(2)}</Text>
              <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }]}>SO₄:Cl⁻</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#F5F0E6', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#EBE3D2' }}>
              <Text style={[F.mono, { fontSize: 16, color: '#1A1A1A' }]}>{waterChem.estimated_mash_ph}</Text>
              <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }]}>Est. Mash pH</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#F5F0E6', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#EBE3D2' }}>
              <Text style={[F.mono, { fontSize: 16, color: '#1A1A1A' }]}>{waterChem.residual_alkalinity_ppm}</Text>
              <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }]}>RA (ppm)</Text>
            </View>
          </View>

          <View style={{ backgroundColor: '#F5F0E6', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#EBE3D2' }}>
            <Text style={[F.bodySemiBold, { fontSize: 13, color: '#1A1A1A', textTransform: 'capitalize' }]}>
              {waterChem.flavour_character.replace('-', ' ')}
            </Text>
            <Text style={[F.body, { fontSize: 12, color: '#6E6E6E', marginTop: 2 }]}>
              {waterChem.flavour_character === 'very hoppy' && 'High sulfate drives bitterness perception forward'}
              {waterChem.flavour_character === 'hoppy' && 'Elevated sulfate accentuates hop crispness'}
              {waterChem.flavour_character === 'balanced' && 'Sulfate and chloride in equilibrium'}
              {waterChem.flavour_character === 'malty' && 'Higher chloride rounds out malt sweetness'}
              {waterChem.flavour_character === 'very malty' && 'Chloride-forward profile emphasises malt'}
            </Text>
          </View>
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
