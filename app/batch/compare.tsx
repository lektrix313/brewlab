import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/stores/appStore';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, Scale } from 'lucide-react-native';
import { Batch } from '../../src/lib/beerjson/types';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayMedium: { fontFamily: 'Newsreader_500Medium' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

export default function CompareBatchesScreen() {
  const router = useRouter();
  const batches = useAppStore((s) => s.batches);
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState<'left' | 'right' | null>(null);

  const left = batches.find((b) => b.id === leftId);
  const right = batches.find((b) => b.id === rightId);

  function BatchPicker({
    selected,
    onSelect,
    label,
  }: {
    selected?: Batch;
    onSelect: (id: string) => void;
    label: string;
  }) {
    return (
      <View style={styles.picker}>
        <Text style={[F.bodySemiBold, styles.pickerLabel]}>{label}</Text>
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setShowPicker(label === 'Batch A' ? 'left' : 'right')}
        >
          <Text
            style={[
              F.bodySemiBold,
              styles.pickerBtnText,
              !selected && { color: '#9E9E9E' },
            ]}
            numberOfLines={1}
          >
            {selected ? selected.name || 'Unnamed' : 'Select batch'}
          </Text>
          <ChevronDown size={16} color="#6E6E6E" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  }

  if (showPicker) {
    const isLeft = showPicker === 'left';
    const otherId = isLeft ? rightId : leftId;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowPicker(null)} style={styles.backBtn}>
            <ArrowLeft size={22} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={[F.display, styles.headerTitle]}>
            Select {isLeft ? 'Batch A' : 'Batch B'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {batches
            .filter((b) => b.id !== otherId)
            .map((batch) => (
              <TouchableOpacity
                key={batch.id}
                style={styles.card}
                onPress={() => {
                  onSelect(batch.id);
                  setShowPicker(null);
                }}
              >
                <Text style={[F.bodySemiBold, { fontSize: 15, color: '#1A1A1A' }]}>
                  {batch.name || 'Unnamed Batch'}
                </Text>
                <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginTop: 4 }]}>
                  {batch.recipe_snapshot.name} · {batch.status.replace(/-/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  function onSelect(id: string) {
    if (showPicker === 'left') setLeftId(id);
    else setRightId(id);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1A1A1A" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[F.display, styles.headerTitle]}>Compare</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <BatchPicker selected={left} onSelect={setLeftId} label="Batch A" />
          </View>
          <View style={{ flex: 1 }}>
            <BatchPicker selected={right} onSelect={setRightId} label="Batch B" />
          </View>
        </View>

        {left && right && (
          <ComparisonView left={left} right={right} />
        )}

        {(!left || !right) && (
          <View style={styles.empty}>
            <Scale size={48} color="#C4B9A3" strokeWidth={1} />
            <Text style={[F.displayMedium, styles.emptyTitle]}>Pick two batches</Text>
            <Text style={[F.body, styles.emptyBody]}>
              Select any two batches to compare their stats, gravity curves, and tasting notes side by side.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ComparisonView({ left, right }: { left: Batch; right: Batch }) {
  const l = left.recipe_snapshot;
  const r = right.recipe_snapshot;

  const rows = [
    { label: 'Recipe', left: l.name, right: r.name },
    { label: 'Status', left: left.status.replace(/-/g, ' '), right: right.status.replace(/-/g, ' ') },
    { label: 'OG', left: l.estimated_og.toFixed(3), right: r.estimated_og.toFixed(3) },
    { label: 'FG', left: l.estimated_fg.toFixed(3), right: r.estimated_fg.toFixed(3) },
    { label: 'ABV', left: `${l.estimated_abv_pct.toFixed(1)}%`, right: `${r.estimated_abv_pct.toFixed(1)}%` },
    { label: 'IBU', left: String(l.estimated_ibu), right: String(r.estimated_ibu) },
    { label: 'SRM', left: String(l.estimated_srm), right: String(r.estimated_srm) },
    { label: 'Batch Size', left: `${l.batch_size_l}L`, right: `${r.batch_size_l}L` },
  ];

  const leftGravityReadings = left.measurements.filter((m) => m.type === 'gravity');
  const rightGravityReadings = right.measurements.filter((m) => m.type === 'gravity');

  return (
    <>
      <View style={styles.comparisonCard}>
        <View style={styles.comparisonHeader}>
          <Text style={[F.bodySemiBold, styles.comparisonHeaderText]}>Stat</Text>
          <Text style={[F.bodySemiBold, styles.comparisonHeaderText, { flex: 1 }]}>Batch A</Text>
          <Text style={[F.bodySemiBold, styles.comparisonHeaderText, { flex: 1 }]}>Batch B</Text>
        </View>
        {rows.map((row, i) => (
          <View key={i} style={[styles.comparisonRow, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={[F.body, styles.comparisonLabel]}>{row.label}</Text>
            <Text style={[F.mono, styles.comparisonValue, { flex: 1 }]}>{row.left}</Text>
            <Text style={[F.mono, styles.comparisonValue, { flex: 1 }]}>{row.right}</Text>
          </View>
        ))}
      </View>

      {/* Gravity readings comparison */}
      {(leftGravityReadings.length > 0 || rightGravityReadings.length > 0) && (
        <View style={[styles.comparisonCard, { marginTop: 16 }]}>
          <Text style={[F.display, { fontSize: 16, color: '#1A1A1A', marginBottom: 12 }]}>
            Gravity Readings
          </Text>
          {leftGravityReadings.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={[F.bodySemiBold, { fontSize: 13, color: '#6E6E6E', marginBottom: 6 }]}>Batch A</Text>
              {leftGravityReadings.map((m, i) => (
                <Text key={i} style={[F.mono, { fontSize: 13, color: '#1A1A1A', paddingVertical: 2 }]}>
                  {m.value.toFixed(3)} — {new Date(m.recorded_at).toLocaleDateString()}
                </Text>
              ))}
            </View>
          )}
          {rightGravityReadings.length > 0 && (
            <View>
              <Text style={[F.bodySemiBold, { fontSize: 13, color: '#6E6E6E', marginBottom: 6 }]}>Batch B</Text>
              {rightGravityReadings.map((m, i) => (
                <Text key={i} style={[F.mono, { fontSize: 13, color: '#1A1A1A', paddingVertical: 2 }]}>
                  {m.value.toFixed(3)} — {new Date(m.recorded_at).toLocaleDateString()}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Tasting notes comparison */}
      {(left.tasting || right.tasting) && (
        <View style={[styles.comparisonCard, { marginTop: 16 }]}>
          <Text style={[F.display, { fontSize: 16, color: '#1A1A1A', marginBottom: 12 }]}>
            Tasting Notes
          </Text>
          {left.tasting && (
            <View style={{ marginBottom: 12 }}>
              <Text style={[F.bodySemiBold, { fontSize: 13, color: '#6E6E6E', marginBottom: 4 }]}>Batch A</Text>
              <Text style={[F.mono, { fontSize: 18, color: '#1A1A1A' }]}>{left.tasting.rating}/10</Text>
              <Text style={[F.body, { fontSize: 13, color: '#3D3D3D', marginTop: 4 }]}>{left.tasting.overall}</Text>
            </View>
          )}
          {right.tasting && (
            <View>
              <Text style={[F.bodySemiBold, { fontSize: 13, color: '#6E6E6E', marginBottom: 4 }]}>Batch B</Text>
              <Text style={[F.mono, { fontSize: 18, color: '#1A1A1A' }]}>{right.tasting.rating}/10</Text>
              <Text style={[F.body, { fontSize: 13, color: '#3D3D3D', marginTop: 4 }]}>{right.tasting.overall}</Text>
            </View>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    color: '#1A1A1A',
  },
  picker: {
    marginBottom: 4,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#6E6E6E',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF6EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EBE3D2',
  },
  pickerBtnText: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  card: {
    backgroundColor: '#FAF6EE',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EBE3D2',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptyBody: {
    fontSize: 14,
    color: '#6E6E6E',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  comparisonCard: {
    backgroundColor: '#FAF6EE',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBE3D2',
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE3D2',
    marginBottom: 4,
  },
  comparisonHeaderText: {
    fontSize: 11,
    color: '#6E6E6E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 0.8,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE3D2',
  },
  comparisonLabel: {
    fontSize: 13,
    color: '#6E6E6E',
    flex: 0.8,
  },
  comparisonValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
});
