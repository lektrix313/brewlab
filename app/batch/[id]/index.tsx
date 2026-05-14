import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../../src/stores/appStore';
import { ChevronLeft, Settings, PoundSterling, Calculator } from 'lucide-react-native';
import { srmToHex } from '../../../src/lib/brewing/calculations';
import { formatTemp, formatVolume } from '../../../src/lib/units';
import { useAppStore } from '../../../src/stores/appStore';
import { hapticImpact } from '../../../src/lib/haptics';
import FermenterCanvas from '../../../src/components/fermenter/FermenterCanvas';
import CelebrationBurst from '../../../src/components/fermenter/CelebrationBurst';
import { buildPredictedCurve, refitCurve, fermentationParamsForRecipe, predictGravityAt, predictABVAt, statusFromProgress } from '../../../src/lib/brewing/fermentation';
import { getRecipeWaterChemistry } from '../../../src/lib/brewing/helpers';
import { useMemo, useState, useEffect, useRef } from 'react';
import { calculateBatchCost, costPerPint } from '../../../src/lib/costs';
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
  measurements,
}: {
  curve: { hours_since_pitch: number; predicted_gravity_sg: number }[];
  og: number;
  fg: number;
  currentHour: number;
  measurements: { hours_since_pitch: number; gravity_sg: number }[];
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
        {isRefit && (
          <View style={{ backgroundColor: '#E2E8DE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginLeft: 8 }}>
            <Text style={[F.bodyMedium, { fontSize: 10, color: '#5C6A54', textTransform: 'uppercase', letterSpacing: 0.5 }]}>
              Refit from {gravityMeasurements.length} readings
            </Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}>
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

        {/* Real measurement points */}
        {measurements.map((m, i) => (
          <Circle
            key={`meas-${i}`}
            cx={xScale(m.hours_since_pitch)}
            cy={yScale(m.gravity_sg)}
            r="4"
            fill="#1A1A1A"
            stroke="#F5F0E6"
            strokeWidth="1.5"
          />
        ))}
      </Svg>
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

  const gravityMeasurements = useMemo(() => {
    if (!batch) return [];
    return batch.measurements
      .filter((m) => m.type === 'gravity')
      .map((m) => ({
        hours_since_pitch: (new Date(m.recorded_at).getTime() - new Date(batch.started_at).getTime()) / 3600000,
        gravity_sg: m.value,
      }))
      .filter((m) => m.hours_since_pitch >= 0)
      .sort((a, b) => a.hours_since_pitch - b.hours_since_pitch);
  }, [batch?.measurements, batch?.started_at]);

  const isRefit = gravityMeasurements.length >= 2;

  const curve = useMemo(() => {
    if (!recipe) return [];

    if (isRefit) {
      const initial = fermentationParamsForRecipe(recipe);
      const refined = refitCurve(gravityMeasurements, initial);
      // Build a refit curve using the refined params
      const refitPoints: { hours_since_pitch: number; predicted_gravity_sg: number; predicted_abv_pct: number; predicted_temperature_c: number; predicted_status: import('../../../src/lib/beerjson/types').BatchStatus; step_name: string }[] = [];
      const totalHrs = initial.total_hrs * 1.1;
      for (let t = 0; t <= totalHrs; t += 4) {
        const sg = predictGravityAt(t, refined);
        const abv = predictABVAt(t, refined);
        refitPoints.push({
          hours_since_pitch: t,
          predicted_gravity_sg: sg,
          predicted_abv_pct: abv,
          predicted_temperature_c: recipe.process?.fermentation?.steps?.[0]?.temperature_c ?? 20,
          predicted_status: statusFromProgress(t, refined.lag_hrs, refined.total_hrs),
          step_name: 'Refit',
        });
      }
      return refitPoints;
    }

    return buildPredictedCurve(recipe, 4);
  }, [recipe, gravityMeasurements, isRefit]);

  if (!batch || !recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[F.body, { color: '#6E6E6E' }]}>Batch not found.</Text>
      </SafeAreaView>
    );
  }

  const [showCelebration, setShowCelebration] = useState(false);
  const celebratedRef = useRef(false);

  useEffect(() => {
    if (batch.status === 'ready' && !celebratedRef.current) {
      celebratedRef.current = true;
      setShowCelebration(true);
    }
  }, [batch.status]);

  const status = statusBadge(batch.status);
  const srmColor = srmToHex(recipe.estimated_srm);
  const unitSystem = useAppStore((s) => s.unitSystem);

  const hoursSincePitch = (Date.now() - new Date(batch.started_at).getTime()) / 3600000;
  const currentHour = Math.max(0, Math.min(hoursSincePitch, curve.length > 0 ? curve[curve.length - 1].hours_since_pitch : 336));
  const currentPoint = curve.find((p) => p.hours_since_pitch >= currentHour) || curve[curve.length - 1];
  const currentGravity = currentPoint?.predicted_gravity_sg ?? recipe.estimated_og;
  const currentAbv = currentPoint?.predicted_abv_pct ?? 0;
  const currentTemp = currentPoint?.predicted_temperature_c ?? recipe.process.fermentation.steps[0]?.temperature_c ?? 20;
  const currentStepName = currentPoint?.step_name ?? 'Primary';

  function pitchYeast() {
    const newCurve = buildPredictedCurve(recipe, 1);
    updateBatch({
      ...batch,
      status: 'lag-phase',
      predicted_curve: newCurve,
      started_at: new Date().toISOString(),
    });
  }

  // Build brew log from real measurements + batch creation
  const buildBrewLog = () => {
    const items: { icon: string; title: string; subtitle: string; timeAgo: string }[] = [];

    // Sort measurements by date, newest first
    const sortedMeasurements = [...batch.measurements].sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
    );

    for (const m of sortedMeasurements) {
      const hoursAgo = (Date.now() - new Date(m.recorded_at).getTime()) / 3600000;
      const timeAgo = hoursAgo < 24 ? `${Math.round(hoursAgo)}h ago` : `${Math.round(hoursAgo / 24)}d ago`;

      if (m.type === 'gravity') {
        items.push({
          icon: '◎',
          title: `Gravity reading: ${m.value.toFixed(3)}`,
          subtitle: m.note || 'Manual reading',
          timeAgo,
        });
      } else if (m.type === 'temperature') {
        items.push({
          icon: '⌂',
          title: `Temp check: ${formatTemp(m.value, unitSystem)}`,
          subtitle: m.note || 'Manual reading',
          timeAgo,
        });
      } else if (m.type === 'ph') {
        items.push({
          icon: 'pH',
          title: `pH reading: ${m.value.toFixed(2)}`,
          subtitle: m.note || 'Manual reading',
          timeAgo,
        });
      } else if (m.type === 'volume') {
        items.push({
          icon: '≈',
          title: `Volume: ${m.value.toFixed(1)} L`,
          subtitle: m.note || 'Manual reading',
          timeAgo,
        });
      }
    }

    // Add batch creation event
    const batchAgeHours = (Date.now() - new Date(batch.created_at).getTime()) / 3600000;
    const batchAge = batchAgeHours < 24 ? `${Math.round(batchAgeHours)}h ago` : `${Math.round(batchAgeHours / 24)}d ago`;
    items.push({
      icon: '🌾',
      title: 'Batch created',
      subtitle: `${recipe.name} — ${formatVolume(recipe.batch_size_l, unitSystem)}`,
      timeAgo: batchAge,
    });

    return items;
  };

  const brewLog = buildBrewLog();

  const costInfo = calculateBatchCost(batch, useAppStore.getState().inventory);
  const hasCost = costInfo.totalCost > 0;

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

        {/* Fermenter Canvas */}
        <FermenterCanvas
          srmColor={srmColor}
          status={batch.status}
          abv={currentAbv}
          gravity={currentGravity}
          tempC={currentTemp}
          stepName={currentStepName}
          width={140}
          height={220}
        />

        {/* Step indicator */}
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>
            Current Stage
          </Text>
          <Text style={[F.display, { fontSize: 18, lineHeight: 24, color: '#1A1A1A', marginTop: 4 }]}>
            {currentStepName}
          </Text>
        </View>

        {/* Quote */}
        <Text style={[F.displayItalic, { fontSize: 15, lineHeight: 22, color: '#6E6E6E', textAlign: 'center', marginVertical: 24 }]}>
          {batch.status === 'lag-phase' && "Quiet for now. Yeast is waking up."}
          {batch.status === 'active-fermentation' && "She's bubbling away nicely. Keep an eye on that temp."}
          {batch.status === 'attenuating' && "Gravity's dropping. Nearly there."}
          {batch.status === 'conditioning' && "Let it settle. Patience now."}
          {batch.status === 'cold-crash' && "Clearing up. Almost ready."}
          {batch.status === 'ready' && "Done. Time to package."}
          {batch.status === 'planned' && "Ready when you are."}
          {batch.status === 'brew-day' && "Brew day. Let's get it done."}
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
            <TouchableOpacity
              onPress={() => { hapticImpact('medium'); router.push(`/batch/${batch.id}/log`); }}
              style={{ backgroundColor: '#B8633A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
              activeOpacity={0.8}
            >
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
            <Text style={[F.mono, { fontSize: 36, lineHeight: 40, color: '#1A1A1A', marginTop: 8 }]}>{formatTemp(currentTemp, unitSystem)}</Text>
          </View>
        </View>

        {/* Cost */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PoundSterling size={18} color="#5C6A54" strokeWidth={1.5} />
              <Text style={[F.bodySemiBold, { fontSize: 15, color: '#1A1A1A' }]}>Batch Cost</Text>
            </View>
            {hasCost ? (
              <Text style={[F.displayMedium, { fontSize: 22, color: '#5C6A54' }]}>
                £{costInfo.totalCost.toFixed(2)}
              </Text>
            ) : (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EBE3D2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
              >
                <Calculator size={14} color="#6E6E6E" strokeWidth={2} />
                <Text style={[F.bodySemiBold, { fontSize: 13, color: '#6E6E6E' }]}>Add prices to pantry</Text>
              </TouchableOpacity>
            )}
          </View>
          {hasCost && (
            <Text style={[F.mono, { fontSize: 12, color: '#6E6E6E', marginTop: 6 }]}>
              £{costPerPint(costInfo.totalCost, recipe.batch_size_l).toFixed(2)} per pint · {costInfo.breakdown.length} ingredient{costInfo.breakdown.length > 1 ? 's' : ''} priced
            </Text>
          )}
        </View>

        {/* Water Chemistry */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }]}>
            Water Profile
          </Text>
          {(() => {
            const wc = getRecipeWaterChemistry(recipe);
            return (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1, backgroundColor: '#F5F0E6', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#EBE3D2' }}>
                  <Text style={[F.mono, { fontSize: 14, color: '#1A1A1A' }]}>{wc.sulfate_chloride_ratio.toFixed(1)}</Text>
                  <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }]}>SO₄:Cl⁻</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#F5F0E6', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#EBE3D2' }}>
                  <Text style={[F.mono, { fontSize: 14, color: '#1A1A1A' }]}>{wc.estimated_mash_ph}</Text>
                  <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }]}>Est. pH</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#F5F0E6', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#EBE3D2' }}>
                  <Text style={[F.bodySemiBold, { fontSize: 11, color: '#1A1A1A', textTransform: 'capitalize' }]}>{wc.flavour_character.replace('-', ' ')}</Text>
                  <Text style={[F.body, { fontSize: 10, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }]}>Character</Text>
                </View>
              </View>
            );
          })()}
        </View>

        {/* Gravity curve */}
        <GravityChart
          curve={curve}
          og={recipe.estimated_og}
          fg={recipe.estimated_fg}
          currentHour={currentHour}
          measurements={batch.measurements
            .filter((m) => m.type === 'gravity')
            .map((m) => ({
              hours_since_pitch: Math.max(0, (new Date(m.recorded_at).getTime() - new Date(batch.started_at).getTime()) / 3600000),
              gravity_sg: m.value,
            }))}
        />

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

        {/* Celebration */}
        <CelebrationBurst visible={showCelebration} onComplete={() => setShowCelebration(false)} />

        {/* Actions */}
        {batch.status === 'planned' && (
          <TouchableOpacity
            onPress={() => { hapticImpact('heavy'); router.push(`/batch/${batch.id}/brew-day`); }}
            style={{ backgroundColor: '#B8633A', height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}
            activeOpacity={0.8}
          >
            <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>I'm ready. Start the brew.</Text>
          </TouchableOpacity>
        )}
        {batch.status === 'brew-day' && (
          <TouchableOpacity
            onPress={() => { hapticImpact('success'); pitchYeast(); }}
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
