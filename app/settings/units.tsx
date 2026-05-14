import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore, type UnitSystem } from '../../src/stores/appStore';
import { ChevronLeft } from 'lucide-react-native';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
};

const OPTIONS: { value: UnitSystem; label: string; description: string }[] = [
  {
    value: 'metric',
    label: 'Metric',
    description: 'Litres, kilograms, Celsius',
  },
  {
    value: 'us',
    label: 'US Customary',
    description: 'Gallons, pounds, Fahrenheit',
  },
  {
    value: 'imperial',
    label: 'Imperial',
    description: 'Gallons (imp), pounds, Celsius',
  },
];

export default function UnitSettingsScreen() {
  const router = useRouter();
  const unitSystem = useAppStore((s) => s.unitSystem);
  const setUnitSystem = useAppStore((s) => s.setUnitSystem);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={{ marginRight: 12 }}>
            <ChevronLeft size={28} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A' }]}>Units</Text>
        </View>

        <Text style={[F.body, { fontSize: 15, lineHeight: 22, color: '#6E6E6E', marginBottom: 24 }]}>
          Pick the measurement system that matches your brewing setup.
        </Text>

        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setUnitSystem(opt.value)}
            style={[
              styles.card,
              unitSystem === opt.value && { borderColor: '#B8633A', backgroundColor: '#F1DCC9' },
            ]}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={[F.bodySemiBold, { fontSize: 16, color: '#1A1A1A' }]}>{opt.label}</Text>
                <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginTop: 2 }]}>{opt.description}</Text>
              </View>
              {unitSystem === opt.value && (
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#B8633A', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#F5F0E6', fontSize: 14, fontWeight: '700' }}>✓</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Preview */}
        <View style={{ marginTop: 24 }}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }]}>
            Preview
          </Text>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={[F.body, { fontSize: 14, color: '#6E6E6E' }]}>Batch size</Text>
              <Text style={[F.bodySemiBold, { fontSize: 14, color: '#1A1A1A' }]}>
                {unitSystem === 'metric' ? '20.0 L' : unitSystem === 'us' ? '5.28 gal' : '4.40 gal'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={[F.body, { fontSize: 14, color: '#6E6E6E' }]}>Grain bill</Text>
              <Text style={[F.bodySemiBold, { fontSize: 14, color: '#1A1A1A' }]}>
                {unitSystem === 'metric' ? '4.50 kg' : unitSystem === 'us' ? '9.92 lb' : '9.92 lb'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[F.body, { fontSize: 14, color: '#6E6E6E' }]}>Mash temp</Text>
              <Text style={[F.bodySemiBold, { fontSize: 14, color: '#1A1A1A' }]}>
                {unitSystem === 'metric' ? '67.0°C' : unitSystem === 'us' ? '152.6°F' : '152.6°F'}
              </Text>
            </View>
          </View>
        </View>
      </View>
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
});
