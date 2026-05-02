import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../../src/stores/appStore';
import { ChevronLeft, Settings } from 'lucide-react-native';
import { srmToHex } from '../../../src/lib/brewing/calculations';
import { buildPredictedCurve } from '../../../src/lib/brewing/fermentation';
import { useMemo } from 'react';
import { BatchStatus } from '../../../src/lib/beerjson/types';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayMedium: { fontFamily: 'Newsreader_500Medium' },
  displayItalic: { fontFamily: 'Newsreader_400Regular_Italic' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

const statusBadge = (status: BatchStatus) => {
  switch (status) {
    case 'active-fermentation':
      return { label: 'Active Fermentation', bg: '#F1DCC9', text: '#8E4A2A' };
    case 'ready':
      return { label: 'Ready to Bottle', bg: '#E2E8DE', text: '#5C6A54' };
    case 'conditioning':
      return { label: 'Conditioning', bg: '#D5D9DD', text: '#2E3842' };
    default:
      return { label: status.replace(/-/g, ' '), bg: '#EBE3D2', text: '#6E6E6E' };
  }
};

function GravityChart({
  curve,
  og,
  fg,
  currentHour,
}: {
  curve: { hours_since_pitch: number; predicted_gravity_sg: number }[];
  og: number;
  fg: number;
  currentHour: number;
}) {
  const width = 300;
  const height = 130;
  const padding = { top: 8, right: 8, bottom: 24, left: 44 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxG = og + 0.005;
  const minG = fg - 0.005;
  const range = maxG - minG;
  const maxH = curve.length > 0 ? curve[curve.length - 1].hours_since_pitch : 336;

  const xScale = (h: number) => padding.left + (h / maxH) * chartW;
  const yScale = (g: number) => padding.top + ((maxG - g) / range) * chartH;

  const targetPath = curve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.hours_since_pitch)} ${yScale(p.predicted_gravity_sg)}`)
    .join(' ');

  const actualPoints = curve.filter((_, i) => i % 12 === 0).slice(0, Math.floor(currentHour / 12) + 1);
  const actualPath = actualPoints
    .map((p, i) => {
      const offset = i % 3 === 0 ? 0.002 : -0.001;
      return `${i === 0 ? 'M' : 'L'} ${xScale(p.hours_since_pitch)} ${yScale(p.predicted_gravity_sg + offset)}`;
    })
    .join(' ');

  const currentPoint = actualPoints[actualPoints.length - 1];
  const currentX = currentPoint ? xScale(currentPoint.hours_since_pitch) : xScale(0);
  const currentY = currentPoint ? yScale(currentPoint.predicted_gravity_sg + 0.001) : yScale(og);

  const yTicks = [
    { g: og, label: og.toFixed(3) },
    { g: og - (og - fg) * 0.5, label: (og - (og - fg) * 0.5).toFixed(3) },
    { g: fg, label: fg.toFixed(3) },
  ];

  return (
    <View style={styles.chartCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>
          Gravity Curve
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#B8633A', marginRight: 6 }} />
          <Text style={[F.body, { fontSize: 13, color: '#3D3D3D' }]}>Actual</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
          <View style={{ width: 16, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#6E6E6E', marginRight: 6 }} />
          <Text style={[F.body, { fontSize: 13, color: '#3D3D3D' }]}>Target</Text>
        </View>
      </View>

      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {yTicks.map((t, i) => (
          <SvgText
            key={i}
            x={padding.left - 6}
            y={yScale(t.g) + 4}
            fontSize="10"
            fill="#6E6E6E"
            textAnchor="end"
            fontFamily="SpaceGrotesk_400Regular"
          >
            {t.label}
          </SvgText>
        ))}

        {['PITCH', 'DAY 3', 'DAY 7', 'TODAY'].map((label, i) => {
          const x = padding.left + (i / 3) * chartW;
          return (
            <SvgText
              key={label}
              x={x}
              y={height - 4}
              fontSize="10"
              fill="#6E6E6E"
              textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}
              fontFamily="Inter_400Regular"
            >
              {label}
            </SvgText>
          );
        })}

        <Path d={targetPath} fill="none" stroke="#6E6E6E" strokeWidth="1" strokeDasharray="4 4" opacity={0.5} />
        {actualPath && <Path d={actualPath} fill="none" stroke="#B8633A" strokeWidth="2" />}
        <Circle cx={currentX} cy={currentY} r="5" fill="#B8633A" />
      </Svg>
    </View>
  );
}

function FermenterVessel({ srmColor, status, abv, profile }: { srmColor: string; status: BatchStatus; abv: number; profile: string }) {
  const hasKrausen = status === 'active-fermentation' || status === 'attenuating';
  const isBubbling = status === 'active-fermentation';
  const fillHeight = status === 'planned' || status === 'brew-day' ? '30%' : status === 'lag-phase' ? '65%' : '75%';

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {/* Potential ABV */}
        <View style={{ alignItems: 'center' }}>
          <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Potential ABV</Text>
          <Text style={[F.mono, { fontSize: 28, lineHeight: 34, color: '#B8633A', marginTop: 4 }]}>{abv.toFixed(1)}%</Text>
        </View>

        {/* Vessel */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 28, height: 8, borderRadius: 4, backgroundColor: '#EBE3D2', marginBottom: 2 }} />
          <View style={{ width: 20, height: 12, backgroundColor: '#FAF6EE', borderLeftWidth: 2, borderRightWidth: 2, borderTopWidth: 0, borderBottomWidth: 0, borderColor: '#D5C4B0' }} />
          <View style={{ width: 100, height: 160, borderRadius: 16, borderWidth: 2, borderColor: '#D5C4B0', backgroundColor: '#FAF6EE', overflow: 'hidden', position: 'relative' }}>
            {/* Measurement lines */}
            <View style={{ position: 'absolute', right: 8, top: 20, width: 12, height: 1, backgroundColor: '#D5C4B0' }} />
            <View style={{ position: 'absolute', right: 8, top: 50, width: 12, height: 1, backgroundColor: '#D5C4B0' }} />
            <View style={{ position: 'absolute', right: 8, top: 80, width: 12, height: 1, backgroundColor: '#D5C4B0' }} />
            <View style={{ position: 'absolute', right: 8, top: 110, width: 12, height: 1, backgroundColor: '#D5C4B0' }} />

            {/* Liquid */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: fillHeight, backgroundColor: srmColor, opacity: 0.85 }} />

            {/* Krausen */}
            {hasKrausen && (
              <View style={{ position: 'absolute', top: '22%', left: 0, right: 0, height: 10, backgroundColor: '#FFFFFF', opacity: 0.7, borderRadius: 5 }} />
            )}

            {/* Bubbles */}
            {isBubbling && (
              <>
                <View style={{ position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)', top: '55%', left: '25%' }} />
                <View style={{ position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', top: '45%', left: '55%' }} />
                <View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.5)', top: '65%', left: '70%' }} />
              </>
            )}
          </View>
        </View>

        {/* Profile */}
        <View style={{ alignItems: 'center' }}>
          <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Profile</Text>
          <Text style={[F.displayItalic, { fontSize: 14, lineHeight: 18, color: '#1A1A1A', marginTop: 4, textAlign: 'center', maxWidth: 80 }]}>
            {profile}
          </Text>
        </View>
      </View>
    </View>
  );
}

function BrewLogItem({ icon, title, subtitle, timeAgo }: { icon: string; title: string; subtitle: string; timeAgo: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EBE3D2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Text style={[F.bodyMedium, { fontSize: 13, color: '#B8633A' }]}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[F.body, { fontSize: 15, color: '#1A1A1A', fontWeight: '500' }]}>{title}</Text>
        <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginTop: 2 }]}>
          {timeAgo} · {subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function BatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const batch = useAppStore((s) => s.batches.find((b) => b.id === id));
  const updateBatch = useAppStore((s) => s.updateBatch);
  const recipe = batch?.recipe_snapshot;

  const curve = useMemo(() => {
    if (!recipe) return [];
    return buildPredictedCurve(recipe, 4);
  }, [recipe]);

  if (!batch || !recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[F.body, { color: '#6E6E6E' }]}>Batch not found.</Text>
      </SafeAreaView>
    );
  }

  const status = statusBadge(batch.status);
  const srmColor = srmToHex(recipe.estimated_srm);

  const hoursSincePitch = (Date.now() - new Date(batch.started_at).getTime()) / 3600000;
  const currentHour = Math.max(0, Math.min(hoursSincePitch, curve.length > 0 ? curve[curve.length - 1].hours_since_pitch : 336));
  const currentPoint = curve.find((p) => p.hours_since_pitch >= currentHour) || curve[curve.length - 1];
  const currentGravity = currentPoint?.predicted_gravity_sg ?? recipe.estimated_og;
  const currentAbv = currentPoint?.predicted_abv_pct ?? 0;
  const currentTemp = currentPoint?.predicted_temperature_c ?? recipe.process.fermentation.steps[0]?.temperature_c ?? 20;

  function pitchYeast() {
    const newCurve = buildPredictedCurve(recipe, 1);
    updateBatch({
      ...batch,
      status: 'lag-phase',
      predicted_curve: newCurve,
      started_at: new Date().toISOString(),
    });
  }

  const brewLog = [
    { icon: '⊘', title: 'Added dry hops', subtitle: '100g Citra, 50g Simcoe', timeAgo: '2 days ago' },
    { icon: '⚡', title: 'Fermentation started', subtitle: 'Vigorous airlock activity', timeAgo: '5 days ago' },
    { icon: '💧', title: 'Wort chilled & Pitched', subtitle: `${recipe.cultures[0]?.culture.name ?? 'US-05'} Yeast`, timeAgo: '7 days ago' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <ChevronLeft size={28} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A', letterSpacing: -0.5 }]}>TUN</Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Settings size={24} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Title + status */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 12 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A' }]}>{recipe.name}</Text>
            <Text style={[F.displayItalic, { fontSize: 15, lineHeight: 22, color: '#6E6E6E', marginTop: 4 }]}>
              {batch.name?.includes('Batch') ? batch.name.split('—')[1]?.trim() : `Batch #${batch.id.split('-').pop()}`} — {recipe.style?.name ?? 'Custom'}
            </Text>
          </View>
          <View style={{ backgroundColor: status.bg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start' }}>
            <Text style={[F.bodySemiBold, { fontSize: 11, color: status.text, textTransform: 'uppercase', letterSpacing: 1 }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* Fermenter Vessel */}
        <FermenterVessel srmColor={srmColor} status={batch.status} abv={currentAbv} profile={recipe.style?.name ?? 'Custom'} />

        {/* Quote */}
        <Text style={[F.displayItalic, { fontSize: 15, lineHeight: 22, color: '#6E6E6E', textAlign: 'center', marginVertical: 24 }]}>
          "She's bubbling away nicely. Keep an eye on that temp."
        </Text>

        {/* Current Gravity */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>
                Current Gravity
              </Text>
              <Text style={[F.mono, { fontSize: 36, lineHeight: 40, color: '#1A1A1A', marginTop: 4 }]}>
                {currentGravity.toFixed(3)}
              </Text>
              <Text style={[F.body, { fontSize: 13, color: '#B8633A', marginTop: 2 }]}>
                Target: {recipe.estimated_fg.toFixed(3)}
              </Text>
            </View>
            <TouchableOpacity style={{ backgroundColor: '#B8633A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }} activeOpacity={0.8}>
              <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>Log a reading</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginVertical: 16 }}>
          <View style={[styles.card, { flex: 1, alignItems: 'center' }]}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>ABV</Text>
            <Text style={[F.mono, { fontSize: 36, lineHeight: 40, color: '#1A1A1A', marginTop: 8 }]}>{currentAbv.toFixed(1)}%</Text>
          </View>
          <View style={[styles.card, { flex: 1, alignItems: 'center' }]}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Temp</Text>
            <Text style={[F.mono, { fontSize: 36, lineHeight: 40, color: '#1A1A1A', marginTop: 8 }]}>{currentTemp.toFixed(1)}°C</Text>
          </View>
        </View>

        {/* Gravity curve */}
        <GravityChart curve={curve} og={recipe.estimated_og} fg={recipe.estimated_fg} currentHour={currentHour} />

        {/* Brew Log */}
        <View style={{ marginTop: 24, marginBottom: 8 }}>
          <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A', marginBottom: 8 }]}>Brew Log</Text>
          {brewLog.map((item, i) => (
            <BrewLogItem key={i} {...item} />
          ))}
        </View>

        {/* View full history */}
        <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 16, marginBottom: 16 }} activeOpacity={0.8}>
          <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>
            + View Full History
          </Text>
        </TouchableOpacity>

        {/* Actions */}
        {batch.status === 'planned' && (
          <TouchableOpacity
            onPress={() => router.push(`/batch/${batch.id}/brew-day`)}
            style={{ backgroundColor: '#B8633A', height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}
            activeOpacity={0.8}
          >
            <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>I'm ready. Start the brew.</Text>
          </TouchableOpacity>
        )}
        {batch.status === 'brew-day' && (
          <TouchableOpacity
            onPress={pitchYeast}
            style={{ backgroundColor: '#B8633A', height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}
            activeOpacity={0.8}
          >
            <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>Pitched. Start the timer.</Text>
          </TouchableOpacity>
        )}
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
  chartCard: {
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
    marginBottom: 4,
  },
});
