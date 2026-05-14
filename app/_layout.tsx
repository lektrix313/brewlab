import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '../src/lib/auth';
import '../src/global.compiled.css';
import { useAppStore } from '../src/stores/appStore';
import { getSeedData } from '../src/hooks/useSeedData';
import { calculateRecipeStats } from '../src/lib/brewing/helpers';
import { useEffect, useState } from 'react';
import { useSync } from '../src/hooks/useSync';
import { configureNotifications, requestNotificationPermissions } from '../src/lib/notifications';
import { Batch, Recipe } from '../src/lib/beerjson/types';
import {
  useFonts,
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from '@expo-google-fonts/newsreader';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
} from '@expo-google-fonts/space-grotesk';

function buildRecipeFromTemplate(
  templateId: string,
  data: ReturnType<typeof getSeedData>
): Recipe | null {
  const template = data.templates.find((t) => t.id === templateId);
  if (!template) return null;

  const resolvedFermentables = template.fermentables.map((fa) => ({
    ...fa,
    fermentable: data.fermentables.find((f) => f.id === fa.fermentable_id)!,
  }));
  const resolvedHops = template.hops.map((ha) => ({
    ...ha,
    hop: data.hops.find((h) => h.id === ha.hop_id)!,
  }));
  const resolvedCultures = template.cultures.map((ca) => ({
    ...ca,
    culture: data.cultures.find((c) => c.id === ca.culture_id)!,
  }));
  const stats = calculateRecipeStats(
    resolvedFermentables,
    resolvedHops,
    resolvedCultures,
    template.base_batch_size_l,
    75
  );

  return {
    id: `demo-recipe-${templateId}`,
    author_id: 'demo-user',
    name: template.name,
    description: template.description,
    style: data.styles.find((s) => s.bjcp_id === template.style_id),
    type: 'all grain' as const,
    batch_size_l: template.base_batch_size_l,
    efficiency_pct: 75,
    fermentables: resolvedFermentables,
    hops: resolvedHops,
    cultures: resolvedCultures,
    process: template.process,
    instantiated_from_template_id: template.id,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...stats,
  };
}

function createBatch(
  id: string,
  recipe: Recipe,
  status: Batch['status'],
  daysAgo: number,
  daysToReady: number
): Batch {
  return {
    id,
    user_id: 'demo-user',
    recipe_id: recipe.id,
    recipe_snapshot: recipe,
    name: `${recipe.name} — Batch #${id.split('-').pop()}`,
    status,
    started_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    estimated_ready_at: new Date(
      Date.now() + daysToReady * 86400000
    ).toISOString(),
    measurements: [],
    predicted_curve: [],
    notes: [],
    photos: [],
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export default function RootLayout() {
  useSync();

  useEffect(() => {
    configureNotifications();
    requestNotificationPermissions();
  }, []);

  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
  });

  const setSeedData = useAppStore((s) => s.setSeedData);
  const addRecipe = useAppStore((s) => s.addRecipe);
  const addBatch = useAppStore((s) => s.addBatch);

  useEffect(() => {
    const data = getSeedData();
    setSeedData(data);

    if (useAppStore.getState().batches.length > 0) return;

    const wci = buildRecipeFromTemplate('tpl-west-coast-ipa-classic', data);
    const stout = buildRecipeFromTemplate('tpl-irish-stout', data);
    const helles = buildRecipeFromTemplate('tpl-german-helles', data);

    if (wci) {
      addRecipe(wci);
      addBatch(createBatch('demo-batch-1', wci, 'active-fermentation', 3, 11));
    }
    if (stout) {
      const stoutRecipe = { ...stout, name: 'Midnight Oatmeal Stout' };
      addRecipe(stoutRecipe);
      addBatch(createBatch('demo-batch-2', stoutRecipe, 'ready', 21, 0));
    }
    if (helles) {
      const saisonRecipe = { ...helles, name: 'Summer Saison' };
      addRecipe(saisonRecipe);
      addBatch(createBatch('demo-batch-3', saisonRecipe, 'conditioning', 14, 7));
    }
  }, [setSeedData, addRecipe, addBatch]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F0E6' }} />
    );
  }

  return (
    <ClerkProvider
      publishableKey="pk_test_ZW5oYW5jZWQtdG91Y2FuLTI4LmNsZXJrLmFjY291bnRzLmRldiQ"
      tokenCache={tokenCache}
    >
      <SafeAreaProvider>
        <View className="flex-1 bg-cream">
          <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F5F0E6' },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="recipe" options={{ presentation: 'modal' }} />
          <Stack.Screen name="batch" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth" />
        </Stack>
        <StatusBar style="dark" />
      </View>
    </SafeAreaProvider>
    </ClerkProvider>
  );
}
