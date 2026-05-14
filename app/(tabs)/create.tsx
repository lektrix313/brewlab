import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/stores/appStore';
import { useRouter } from 'expo-router';
import { calculateRecipeStats, scaleRecipeToBatchSize } from '../../src/lib/brewing/helpers';
import { useFadeIn, useStagger } from '../../src/lib/animations';
import { hapticImpact } from '../../src/lib/haptics';
import { Plus, FlaskConical, Beaker, X, ChevronRight, Globe, GitFork } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { apiClient } from '../../src/lib/api';
import { getSyncToken } from '../../src/lib/sync/engine';
import { StyleTemplate } from '../../src/lib/beerjson/types';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayItalic: { fontFamily: 'Newsreader_400Regular_Italic' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

const BATCH_PRESETS = [10, 15, 20, 23, 25];

export default function CreateScreen() {
  const recipes = useAppStore((s) => s.recipes);
  const templates = useAppStore((s) => s.templates);
  const fermentables = useAppStore((s) => s.fermentables);
  const hops = useAppStore((s) => s.hops);
  const cultures = useAppStore((s) => s.cultures);
  const styles = useAppStore((s) => s.styles);
  const addRecipe = useAppStore((s) => s.addRecipe);
  const addBatch = useAppStore((s) => s.addBatch);
  const router = useRouter();
  const fade = useFadeIn(0);

  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null);
  const [batchSizeL, setBatchSizeL] = useState(20);
  const [publicRecipes, setPublicRecipes] = useState<any[]>([]);
  const [showCommunity, setShowCommunity] = useState(false);

  useEffect(() => {
    apiClient.get<{ data: any[] }>('/recipes/public', undefined)
      .then((res) => setPublicRecipes(res.data ?? []))
      .catch(() => {});
  }, []);

  function instantiateTemplate(template: StyleTemplate, sizeL: number) {
    hapticImpact('success');
    const resolvedFermentables = template.fermentables.map((fa) => ({
      ...fa,
      fermentable: fermentables.find((f) => f.id === fa.fermentable_id)!,
    }));
    const resolvedHops = template.hops.map((ha) => ({
      ...ha,
      hop: hops.find((h) => h.id === ha.hop_id)!,
    }));
    const resolvedCultures = template.cultures.map((ca) => ({
      ...ca,
      culture: cultures.find((c) => c.id === ca.culture_id)!,
    }));
    const style = styles.find((s) => s.bjcp_id === template.style_id);

    const baseRecipe = {
      id: `recipe-${Date.now()}`,
      author_id: 'local-user',
      name: template.name,
      description: template.description,
      style,
      type: 'all grain' as const,
      batch_size_l: template.base_batch_size_l,
      efficiency_pct: 75,
      fermentables: resolvedFermentables,
      hops: resolvedHops,
      cultures: resolvedCultures,
      process: template.process,
      instantiated_from_template_id: template.id,
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...calculateRecipeStats(resolvedFermentables, resolvedHops, resolvedCultures, template.base_batch_size_l, 75),
    };

    const recipe = sizeL === template.base_batch_size_l
      ? baseRecipe
      : scaleRecipeToBatchSize(baseRecipe, sizeL);

    addRecipe(recipe);
    const batch = {
      id: `batch-${Date.now()}`,
      user_id: 'local-user',
      recipe_id: recipe.id,
      recipe_snapshot: recipe,
      name: `${recipe.name} — Batch #1`,
      status: 'planned' as const,
      started_at: new Date().toISOString(),
      estimated_ready_at: new Date(Date.now() + template.estimated_brew_to_ready_days * 86400000).toISOString(),
      measurements: [],
      predicted_curve: [],
      notes: [],
      photos: [],
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBatch(batch);
    setSelectedTemplate(null);
    router.push(`/batch/${batch.id}`);
  }

  const templateAnims = useStagger(templates.length, 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <Animated.ScrollView style={{ flex: 1, opacity: fade.opacity, transform: [{ translateY: fade.translateY }] }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ paddingTop: 24, paddingBottom: 8 }}>
          <Text style={[F.display, { fontSize: 32, lineHeight: 40, color: '#1A1A1A', letterSpacing: -0.5 }]}>
            Recipe Lab
          </Text>
          <Text style={[F.body, { fontSize: 15, lineHeight: 22, color: '#6E6E6E', marginTop: 6 }]}>
            Design, tweak, and predict before you brew.
          </Text>
        </View>

        {/* New Recipe CTA */}
        <TouchableOpacity
          onPress={() => { hapticImpact('light'); router.push('/recipe/new' as any); }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#B8633A', height: 52, borderRadius: 10, gap: 8, marginTop: 8 }}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#F5F0E6" strokeWidth={2} />
          <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>Create new recipe</Text>
        </TouchableOpacity>

        {/* My Recipes */}
        {recipes.length > 0 && (
          <View style={{ marginTop: 32 }}>
            <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A', marginBottom: 12 }]}>
              My Recipes
            </Text>
            {recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
                activeOpacity={0.9}
                style={styles.card}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[F.display, { fontSize: 18, lineHeight: 24, color: '#1A1A1A' }]}>{recipe.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12 }}>
                      <Text style={[F.mono, { fontSize: 13, color: '#6E6E6E' }]}>{recipe.estimated_abv_pct.toFixed(1)}% ABV</Text>
                      <Text style={[F.mono, { fontSize: 13, color: '#6E6E6E' }]}>IBU {recipe.estimated_ibu}</Text>
                      <Text style={[F.mono, { fontSize: 13, color: '#6E6E6E' }]}>SRM {recipe.estimated_srm}</Text>
                    </View>
                  </View>
                  <FlaskConical size={20} color="#B8633A" strokeWidth={1.5} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Community */}
        <TouchableOpacity
          onPress={() => setShowCommunity(!showCommunity)}
          style={[styles.card, { marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Globe size={20} color="#B8633A" strokeWidth={1.5} />
            <View>
              <Text style={[F.display, { fontSize: 18, lineHeight: 24, color: '#1A1A1A' }]}>Community</Text>
              <Text style={[F.body, { fontSize: 13, color: '#6E6E6E' }]}>
                {publicRecipes.length} public recipe{publicRecipes.length !== 1 ? 's' : ''} shared
              </Text>
            </View>
          </View>
          <ChevronRight
            size={20}
            color="#6E6E6E"
            strokeWidth={2}
            style={{ transform: [{ rotate: showCommunity ? '90deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {showCommunity && publicRecipes.length > 0 && (
          <View style={{ marginTop: 8 }}>
            {publicRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
                activeOpacity={0.9}
                style={styles.card}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[F.display, { fontSize: 16, lineHeight: 22, color: '#1A1A1A' }]}>{recipe.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12 }}>
                      <Text style={[F.mono, { fontSize: 12, color: '#6E6E6E' }]}>{(recipe.estimatedAbvPct ?? 0).toFixed(1)}% ABV</Text>
                      <Text style={[F.mono, { fontSize: 12, color: '#6E6E6E' }]}>IBU {recipe.estimatedIbu ?? 0}</Text>
                    </View>
                  </View>
                  <GitFork size={18} color="#B8633A" strokeWidth={1.5} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Templates */}
        <View style={{ marginTop: 32, marginBottom: 24 }}>
          <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A', marginBottom: 12 }]}>
            Start from a template
          </Text>
          {templates.map((template, i) => {
            const stats = calculateRecipeStats(
              template.fermentables.map((fa) => ({ ...fa, fermentable: fermentables.find((f) => f.id === fa.fermentable_id)! })),
              template.hops.map((ha) => ({ ...ha, hop: hops.find((h) => h.id === ha.hop_id)! })),
              template.cultures.map((ca) => ({ ...ca, culture: cultures.find((c) => c.id === ca.culture_id)! })),
              template.base_batch_size_l, 75
            );
            const anim = templateAnims[i];
            return (
              <Animated.View key={template.id} style={{ opacity: anim?.opacity ?? 1, transform: [{ translateY: anim?.translateY ?? 0 }] }}>
                <TouchableOpacity
                  onPress={() => { hapticImpact('medium'); setSelectedTemplate(template); setBatchSizeL(template.base_batch_size_l); }}
                  activeOpacity={0.9}
                  style={styles.card}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[F.display, { fontSize: 18, lineHeight: 24, color: '#1A1A1A' }]}>{template.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                        <View style={{ backgroundColor: '#F1DCC9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                          <Text style={[F.bodyMedium, { fontSize: 11, color: '#8E4A2A', textTransform: 'capitalize' }]}>{template.difficulty}</Text>
                        </View>
                        <Text style={[F.body, { fontSize: 13, color: '#6E6E6E' }]}>
                          {template.estimated_brew_to_ready_days} days · IBU {stats.estimated_ibu} · {stats.estimated_abv_pct.toFixed(1)}% ABV
                        </Text>
                      </View>
                      <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginTop: 6, lineHeight: 18 }]} numberOfLines={2}>
                        {template.description}
                      </Text>
                    </View>
                    <Beaker size={20} color="#B8633A" strokeWidth={1.5} style={{ marginTop: 4 }} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </Animated.ScrollView>

      {/* Batch Size Modal */}
      <Modal
        visible={selectedTemplate !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTemplate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View>
                <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A' }]}>
                  {selectedTemplate?.name}
                </Text>
                <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginTop: 4 }]}>
                  Pick your batch size
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTemplate(null)} activeOpacity={0.8}>
                <X size={24} color="#6E6E6E" strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              {BATCH_PRESETS.map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setBatchSizeL(size)}
                  style={{
                    flex: 1,
                    minWidth: 70,
                    alignItems: 'center',
                    paddingVertical: 14,
                    borderRadius: 10,
                    backgroundColor: batchSizeL === size ? '#B8633A' : '#FAF6EE',
                    borderWidth: 1,
                    borderColor: batchSizeL === size ? '#B8633A' : '#EBE3D2',
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[F.bodySemiBold, { fontSize: 16, color: batchSizeL === size ? '#F5F0E6' : '#1A1A1A' }]}>
                    {size}L
                  </Text>
                  <Text style={[F.body, { fontSize: 11, color: batchSizeL === size ? '#F5F0E6' : '#6E6E6E', marginTop: 2, opacity: batchSizeL === size ? 0.8 : 1 }]}>
                    {size === selectedTemplate?.base_batch_size_l ? 'Template default' : 'Scaled'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => selectedTemplate && instantiateTemplate(selectedTemplate, batchSizeL)}
              style={{
                backgroundColor: '#B8633A',
                height: 56,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
              activeOpacity={0.8}
            >
              <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>
                Brew this — {batchSizeL}L
              </Text>
              <ChevronRight size={18} color="#F5F0E6" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F5F0E6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
});
