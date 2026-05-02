import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/stores/appStore';
import { useFadeIn } from '../../src/lib/animations';
import { Animated } from 'react-native';
import { Settings, Award, Beaker, FlaskConical, TrendingUp } from 'lucide-react-native';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

export default function ProfileScreen() {
  const batches = useAppStore((s) => s.batches);
  const recipes = useAppStore((s) => s.recipes);
  const fade = useFadeIn(0);

  const totalBrews = batches.length;
  const completedBrews = batches.filter((b) => b.status === 'ready' || b.status === 'archived').length;
  const activeBrews = batches.filter((b) => b.status === 'active-fermentation' || b.status === 'lag-phase' || b.status === 'brew-day').length;
  const totalRecipes = recipes.length;

  const avgAbv = batches.length > 0
    ? batches.reduce((s, b) => s + b.recipe_snapshot.estimated_abv_pct, 0) / batches.length
    : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <Animated.ScrollView style={{ flex: 1, opacity: fade.opacity, transform: [{ translateY: fade.translateY }] }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, paddingBottom: 8 }}>
          <Text style={[F.display, { fontSize: 32, lineHeight: 40, color: '#1A1A1A', letterSpacing: -0.5 }]}>
            Profile
          </Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Settings size={24} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Avatar + name */}
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#B8633A', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 36 }}>🍺</Text>
          </View>
          <Text style={[F.display, { fontSize: 24, lineHeight: 30, color: '#1A1A1A', marginTop: 12 }]}>
            Brewer
          </Text>
          <Text style={[F.body, { fontSize: 15, color: '#6E6E6E', marginTop: 4 }]}>
            Master of Malt
          </Text>
        </View>

        {/* Stats grid */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          <View style={[styles.statCard, { backgroundColor: '#F1DCC9' }]}>
            <FlaskConical size={20} color="#8E4A2A" strokeWidth={1.5} />
            <Text style={[F.mono, { fontSize: 24, lineHeight: 30, color: '#8E4A2A', marginTop: 8 }]}>{totalBrews}</Text>
            <Text style={[F.body, { fontSize: 11, color: '#8E4A2A' }]}>Total Brews</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#E2E8DE' }]}>
            <Award size={20} color="#5C6A54" strokeWidth={1.5} />
            <Text style={[F.mono, { fontSize: 24, lineHeight: 30, color: '#5C6A54', marginTop: 8 }]}>{completedBrews}</Text>
            <Text style={[F.body, { fontSize: 11, color: '#5C6A54' }]}>Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D5D9DD' }]}>
            <Beaker size={20} color="#2E3842" strokeWidth={1.5} />
            <Text style={[F.mono, { fontSize: 24, lineHeight: 30, color: '#2E3842', marginTop: 8 }]}>{totalRecipes}</Text>
            <Text style={[F.body, { fontSize: 11, color: '#2E3842' }]}>Recipes</Text>
          </View>
        </View>

        {/* Active brews mini list */}
        {activeBrews > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[F.display, { fontSize: 20, lineHeight: 26, color: '#1A1A1A', marginBottom: 12 }]}>
              Currently Brewing
            </Text>
            {batches
              .filter((b) => b.status === 'active-fermentation' || b.status === 'lag-phase' || b.status === 'brew-day')
              .map((batch) => (
                <View key={batch.id} style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                  <View>
                    <Text style={[F.bodySemiBold, { fontSize: 15, color: '#1A1A1A' }]}>{batch.recipe_snapshot.name}</Text>
                    <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginTop: 2 }]}>
                      Day {Math.floor((Date.now() - new Date(batch.started_at).getTime()) / 86400000) + 1} · {batch.status.replace(/-/g, ' ')}
                    </Text>
                  </View>
                  <TrendingUp size={18} color="#B8633A" strokeWidth={1.5} />
                </View>
              ))}
          </View>
        )}

        {/* Avg ABV */}
        <View style={[styles.card, { alignItems: 'center', marginBottom: 24 }]}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Average ABV</Text>
          <Text style={[F.mono, { fontSize: 36, lineHeight: 44, color: '#1A1A1A', marginTop: 4 }]}>{avgAbv.toFixed(1)}%</Text>
        </View>

        {/* Settings */}
        <View style={{ marginBottom: 32 }}>
          <Text style={[F.display, { fontSize: 20, lineHeight: 26, color: '#1A1A1A', marginBottom: 12 }]}>
            Settings
          </Text>
          {['Units', 'Notifications', 'Data Export', 'About TUN'].map((item) => (
            <TouchableOpacity key={item} style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} activeOpacity={0.8}>
              <Text style={[F.body, { fontSize: 15, color: '#1A1A1A' }]}>{item}</Text>
              <Text style={{ fontSize: 18, color: '#6E6E6E' }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
});
