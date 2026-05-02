import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/stores/appStore';
import { useRouter } from 'expo-router';
import { Settings, Menu, Plus } from 'lucide-react-native';
import { Batch, BatchStatus } from '../../src/lib/beerjson/types';
import { srmToHex } from '../../src/lib/brewing/calculations';
import { buildPredictedCurve } from '../../src/lib/brewing/fermentation';
import { useFadeIn } from '../../src/lib/animations';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayMedium: { fontFamily: 'Newsreader_500Medium' },
  displayItalic: { fontFamily: 'Newsreader_400Regular_Italic' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, brewer.';
  if (h < 18) return 'Good afternoon, brewer.';
  return 'Good evening, brewer.';
}

const statusBadge = (status: BatchStatus) => {
  switch (status) {
    case 'active-fermentation':
      return { label: 'Active Fermentation', bg: '#F1DCC9', text: '#8E4A2A' };
    case 'ready':
      return { label: 'Ready to Bottle', bg: '#E2E8DE', text: '#5C6A54' };
    case 'conditioning':
      return { label: 'Conditioning', bg: '#D5D9DD', text: '#2E3842' };
    case 'lag-phase':
      return { label: 'Lag Phase', bg: '#F5E6C8', text: '#A67C3A' };
    case 'brew-day':
      return { label: 'Brew Day', bg: '#F1DCC9', text: '#8E4A2A' };
    case 'planned':
      return { label: 'Planned', bg: '#EBE3D2', text: '#6E6E6E' };
    default:
      return { label: status.replace(/-/g, ' '), bg: '#EBE3D2', text: '#6E6E6E' };
  }
};

const statusNote = (status: BatchStatus) => {
  switch (status) {
    case 'active-fermentation':
      return "She's bubbling away nicely. Keep an eye on that temp.";
    case 'ready':
      return 'Looking clear. Get bottling.';
    case 'conditioning':
      return "Don't rush the yeast. It knows what it's doing.";
    case 'lag-phase':
      return "Your beer's quiet. Check the airlock.";
    case 'brew-day':
      return "Today's the day. Don't forget to sanitise.";
    default:
      return 'Keep watching.';
  }
};

function FeaturedBatch({ batch }: { batch: Batch }) {
  const router = useRouter();
  const recipe = batch.recipe_snapshot;
  const badge = statusBadge(batch.status);
  const srmColor = srmToHex(recipe.estimated_srm);
  const note = statusNote(batch.status);

  const curve = buildPredictedCurve(recipe, 4);
  const hoursSincePitch = (Date.now() - new Date(batch.started_at).getTime()) / 3600000;
  const currentHour = Math.max(0, Math.min(hoursSincePitch, curve.length > 0 ? curve[curve.length - 1].hours_since_pitch : 336));
  const currentPoint = curve.find((p) => p.hours_since_pitch >= currentHour) || curve[curve.length - 1];
  const currentGravity = currentPoint?.predicted_gravity_sg ?? recipe.estimated_og;
  const currentAbv = currentPoint?.predicted_abv_pct ?? 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/batch/${batch.id}`)}
      activeOpacity={0.92}
      style={[styles.card, { padding: 0, overflow: 'hidden' }]}
    >
      {/* Hero colour bar */}
      <View style={{ height: 8, backgroundColor: srmColor }} />

      <View style={{ padding: 20 }}>
        {/* Status */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ backgroundColor: badge.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={[F.bodyMedium, { fontSize: 11, color: badge.text, textTransform: 'uppercase', letterSpacing: 1.2 }]}>
              {badge.label}
            </Text>
          </View>
          <Text style={[F.body, { fontSize: 13, color: '#6E6E6E' }]}>
            Day {Math.floor(hoursSincePitch / 24) + 1}
          </Text>
        </View>

        {/* Name */}
        <Text style={[F.display, { fontSize: 28, lineHeight: 34, color: '#1A1A1A', marginBottom: 6 }]}>
          {recipe.name}
        </Text>
        <Text style={[F.displayItalic, { fontSize: 15, lineHeight: 22, color: '#6E6E6E', marginBottom: 16 }]}>
          {note}
        </Text>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#F5F0E6', borderRadius: 10, padding: 12 }}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.2 }]}>Gravity</Text>
            <Text style={[F.mono, { fontSize: 22, lineHeight: 28, color: '#1A1A1A', marginTop: 4 }]}>
              {currentGravity.toFixed(3)}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#F5F0E6', borderRadius: 10, padding: 12 }}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.2 }]}>ABV</Text>
            <Text style={[F.mono, { fontSize: 22, lineHeight: 28, color: '#1A1A1A', marginTop: 4 }]}>
              {currentAbv.toFixed(1)}%
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#F5F0E6', borderRadius: 10, padding: 12 }}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.2 }]}>Target FG</Text>
            <Text style={[F.mono, { fontSize: 22, lineHeight: 28, color: '#1A1A1A', marginTop: 4 }]}>
              {recipe.estimated_fg.toFixed(3)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function BatchCard({ batch }: { batch: Batch }) {
  const router = useRouter();
  const recipe = batch.recipe_snapshot;
  const badge = statusBadge(batch.status);
  const note = statusNote(batch.status);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/batch/${batch.id}`)}
      activeOpacity={0.9}
      style={styles.card}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={[F.display, { fontSize: 20, lineHeight: 26, color: '#1A1A1A' }]}>
            {recipe.name}
          </Text>
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: badge.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              <Text style={[F.bodyMedium, { fontSize: 10, color: badge.text, textTransform: 'uppercase', letterSpacing: 1.2 }]}>
                {badge.label}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: srmToHex(recipe.estimated_srm) }} />
      </View>

      <View style={{ height: 1, backgroundColor: '#EBE3D2', marginVertical: 14 }} />

      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>ABV</Text>
          <Text style={[F.mono, { fontSize: 16, lineHeight: 22, color: '#1A1A1A', marginTop: 3 }]}>
            {recipe.estimated_abv_pct.toFixed(1)}%
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>OG</Text>
          <Text style={[F.mono, { fontSize: 16, lineHeight: 22, color: '#1A1A1A', marginTop: 3 }]}>
            {recipe.estimated_og.toFixed(3)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>FG</Text>
          <Text style={[F.mono, { fontSize: 16, lineHeight: 22, color: '#1A1A1A', marginTop: 3 }]}>
            {recipe.estimated_fg.toFixed(3)}
          </Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: '#EBE3D2', marginVertical: 14 }} />

      <Text style={[F.displayItalic, { fontSize: 14, lineHeight: 20, color: '#6E6E6E' }]}>
        {note}
      </Text>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const batches = useAppStore((s) => s.batches);
  const router = useRouter();
  const fade = useFadeIn(0);

  const activeBatches = batches.filter(
    (b) => b.status === 'active-fermentation' || b.status === 'lag-phase' || b.status === 'brew-day'
  );
  const otherBatches = batches.filter(
    (b) => b.status !== 'active-fermentation' && b.status !== 'lag-phase' && b.status !== 'brew-day'
  );
  const featured = activeBatches[0];
  const listBatches = featured ? otherBatches : batches;

  const totalBrews = batches.length;
  const activeCount = activeBatches.length;
  const readyCount = batches.filter((b) => b.status === 'ready').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <Animated.ScrollView style={{ flex: 1, opacity: fade.opacity, transform: [{ translateY: fade.translateY }] }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, paddingBottom: 8 }}>
          <TouchableOpacity activeOpacity={0.8}>
            <Menu size={24} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A', letterSpacing: -0.5 }]}>
            TUN
          </Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Settings size={24} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <View style={{ paddingTop: 16, paddingBottom: 4 }}>
          <Text style={[F.displayItalic, { fontSize: 15, lineHeight: 22, color: '#6E6E6E' }]}>
            {greeting()}
          </Text>
          <Text style={[F.display, { fontSize: 32, lineHeight: 40, color: '#1A1A1A', marginTop: 4, letterSpacing: -0.5 }]}>
            Brewing Journal
          </Text>
        </View>

        {/* Quick stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 8 }}>
          <View style={[styles.statPill, { backgroundColor: '#F1DCC9' }]}>
            <Text style={[F.mono, { fontSize: 18, lineHeight: 24, color: '#8E4A2A' }]}>{activeCount}</Text>
            <Text style={[F.body, { fontSize: 11, color: '#8E4A2A', marginTop: 2 }]}>Brewing</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: '#E2E8DE' }]}>
            <Text style={[F.mono, { fontSize: 18, lineHeight: 24, color: '#5C6A54' }]}>{readyCount}</Text>
            <Text style={[F.body, { fontSize: 11, color: '#5C6A54', marginTop: 2 }]}>Ready</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: '#D5D9DD' }]}>
            <Text style={[F.mono, { fontSize: 18, lineHeight: 24, color: '#2E3842' }]}>{totalBrews}</Text>
            <Text style={[F.body, { fontSize: 11, color: '#2E3842', marginTop: 2 }]}>Total</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={() => router.push('/create' as any)}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#B8633A',
            height: 48,
            borderRadius: 10,
            marginTop: 16,
            marginBottom: 8,
            gap: 8,
          }}
        >
          <Plus size={18} color="#F5F0E6" strokeWidth={2} />
          <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>Start a new brew</Text>
        </TouchableOpacity>

        {/* Featured active batch */}
        {featured && (
          <View style={{ marginTop: 24, marginBottom: 8 }}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }]}>
              Currently Brewing
            </Text>
            <FeaturedBatch batch={featured} />
          </View>
        )}

        {/* Recent Batches */}
        <View style={{ marginTop: 24, marginBottom: 8 }}>
          <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A', marginBottom: 12 }]}>
            Recent Batches
          </Text>
          {listBatches.length === 0 ? (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A', textAlign: 'center' }]}>
                Nothing fermenting. Sort it out.
              </Text>
            </View>
          ) : (
            listBatches.map((batch) => <BatchCard key={batch.id} batch={batch} />)
          )}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 24 }} />
      </Animated.ScrollView>
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
    marginBottom: 16,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
});
