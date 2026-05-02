import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/stores/appStore';
import { useRouter } from 'expo-router';
import { useFadeIn } from '../../src/lib/animations';
import { Animated } from 'react-native';
import { FlaskConical, ArrowRight, Clock } from 'lucide-react-native';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayItalic: { fontFamily: 'Newsreader_400Regular_Italic' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

export default function BrewScreen() {
  const batches = useAppStore((s) => s.batches);
  const sessions = useAppStore((s) => s.sessions);
  const router = useRouter();
  const fade = useFadeIn(0);

  const activeBrews = batches.filter(
    (b) => b.status === 'brew-day' || b.status === 'active-fermentation' || b.status === 'lag-phase'
  );
  const plannedBrews = batches.filter((b) => b.status === 'planned');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <Animated.ScrollView style={{ flex: 1, opacity: fade.opacity, transform: [{ translateY: fade.translateY }] }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        <View style={{ paddingTop: 24, paddingBottom: 8 }}>
          <Text style={[F.display, { fontSize: 32, lineHeight: 40, color: '#1A1A1A', letterSpacing: -0.5 }]}>
            Brew Day
          </Text>
          <Text style={[F.body, { fontSize: 15, lineHeight: 22, color: '#6E6E6E', marginTop: 6 }]}>
            Active sessions and what's queued up.
          </Text>
        </View>

        {/* Active Sessions */}
        {activeBrews.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }]}>
              Active Sessions
            </Text>
            {activeBrews.map((batch) => {
              const session = sessions.find((s) => s.batch_id === batch.id);
              const phaseLabel = session?.phase === 'mash' ? 'Mash in progress' : session?.phase === 'boil' ? 'Boil in progress' : session?.phase === 'cool' ? 'Cooling' : session?.phase === 'pitch' ? 'Ready to pitch' : 'Brew day started';
              return (
                <TouchableOpacity
                  key={batch.id}
                  onPress={() => {
                    if (session) {
                      router.push(`/batch/${batch.id}/session/${session.phase}` as any);
                    } else {
                      router.push(`/batch/${batch.id}/brew-day`);
                    }
                  }}
                  activeOpacity={0.9}
                  style={[styles.card, { borderColor: '#B8633A', borderWidth: 2 }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[F.display, { fontSize: 20, lineHeight: 26, color: '#1A1A1A' }]}>{batch.recipe_snapshot.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                        <View style={{ backgroundColor: '#F1DCC9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                          <Text style={[F.bodyMedium, { fontSize: 11, color: '#8E4A2A' }]}>{phaseLabel}</Text>
                        </View>
                        {session?.phase === 'mash' || session?.phase === 'boil' ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Clock size={14} color="#B8633A" strokeWidth={1.5} />
                            <Text style={[F.mono, { fontSize: 13, color: '#B8633A' }]}>Timer running</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <ArrowRight size={20} color="#B8633A" strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Planned */}
        {plannedBrews.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }]}>
              Planned
            </Text>
            {plannedBrews.map((batch) => (
              <TouchableOpacity
                key={batch.id}
                onPress={() => router.push(`/batch/${batch.id}`)}
                activeOpacity={0.9}
                style={styles.card}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[F.display, { fontSize: 18, lineHeight: 24, color: '#1A1A1A' }]}>{batch.recipe_snapshot.name}</Text>
                    <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginTop: 4 }]}>
                      OG {batch.recipe_snapshot.estimated_og.toFixed(3)} · ABV {batch.recipe_snapshot.estimated_abv_pct.toFixed(1)}% · IBU {batch.recipe_snapshot.estimated_ibu}
                    </Text>
                  </View>
                  <FlaskConical size={20} color="#6E6E6E" strokeWidth={1.5} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeBrews.length === 0 && plannedBrews.length === 0 && (
          <View style={{ marginTop: 80, alignItems: 'center' }}>
            <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A', textAlign: 'center' }]}>
              Nothing on the boil.
            </Text>
            <Text style={[F.body, { fontSize: 15, color: '#6E6E6E', textAlign: 'center', marginTop: 8 }]}>
              Start a batch from the Recipe Lab to get brewing.
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
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
    marginBottom: 12,
  },
});
