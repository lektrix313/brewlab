import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/stores/appStore';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

export default function EquipmentProfileScreen() {
  const router = useRouter();
  const profile = useAppStore((s) => s.equipmentProfile);
  const setEquipmentProfile = useAppStore((s) => s.setEquipmentProfile);

  const [values, setValues] = useState({
    kettleVolumeL: profile.kettleVolumeL.toString(),
    mashTunDeadSpaceL: profile.mashTunDeadSpaceL.toString(),
    boilOffRateLHr: profile.boilOffRateLHr.toString(),
    grainAbsorptionLPerKg: profile.grainAbsorptionLPerKg.toString(),
    trubLossL: profile.trubLossL.toString(),
    brewhouseEfficiencyPct: profile.brewhouseEfficiencyPct.toString(),
  });

  function update(field: keyof typeof values, text: string) {
    setValues((v) => ({ ...v, [field]: text }));
    const num = parseFloat(text);
    if (!isNaN(num) && num >= 0) {
      setEquipmentProfile({ [field]: num });
    }
  }

  const fields: { key: keyof typeof values; label: string; unit: string; hint: string }[] = [
    { key: 'kettleVolumeL', label: 'Kettle Volume', unit: 'L', hint: 'Total kettle capacity' },
    { key: 'mashTunDeadSpaceL', label: 'Mash Tun Dead Space', unit: 'L', hint: 'Liquid left below false bottom' },
    { key: 'boilOffRateLHr', label: 'Boil-off Rate', unit: 'L/hr', hint: 'How much you lose per hour of boil' },
    { key: 'grainAbsorptionLPerKg', label: 'Grain Absorption', unit: 'L/kg', hint: 'Water soaked up by grain' },
    { key: 'trubLossL', label: 'Trub Loss', unit: 'L', hint: 'Wort left with hop sludge' },
    { key: 'brewhouseEfficiencyPct', label: 'Brewhouse Efficiency', unit: '%', hint: 'Your typical mash efficiency' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={{ marginRight: 12 }}>
            <ChevronLeft size={28} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A' }]}>Equipment</Text>
        </View>

        <Text style={[F.body, { fontSize: 15, lineHeight: 22, color: '#6E6E6E', marginBottom: 24 }]}>
          Tell us about your setup and we'll dial in the calculations.
        </Text>

        {fields.map((f) => (
          <View key={f.key} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={[F.bodyMedium, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1 }]}>
                {f.label}
              </Text>
              <Text style={[F.body, { fontSize: 12, color: '#A0A0A0' }]}>{f.unit}</Text>
            </View>
            <TextInput
              value={values[f.key]}
              onChangeText={(text) => update(f.key, text)}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={[F.body, { fontSize: 12, color: '#A0A0A0', marginTop: 4 }]}>{f.hint}</Text>
          </View>
        ))}

        {/* Presets */}
        <View style={{ marginTop: 8 }}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }]}>
            Quick Presets
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {['BIAB', '3-Vessel', 'Grainfather'].map((preset) => (
              <TouchableOpacity
                key={preset}
                onPress={() => {
                  if (preset === 'BIAB') {
                    setEquipmentProfile({
                      kettleVolumeL: 30,
                      mashTunDeadSpaceL: 0,
                      boilOffRateLHr: 4,
                      grainAbsorptionLPerKg: 0.8,
                      trubLossL: 1.5,
                      brewhouseEfficiencyPct: 72,
                    });
                    setValues({
                      kettleVolumeL: '30',
                      mashTunDeadSpaceL: '0',
                      boilOffRateLHr: '4',
                      grainAbsorptionLPerKg: '0.8',
                      trubLossL: '1.5',
                      brewhouseEfficiencyPct: '72',
                    });
                  } else if (preset === '3-Vessel') {
                    setEquipmentProfile({
                      kettleVolumeL: 50,
                      mashTunDeadSpaceL: 2,
                      boilOffRateLHr: 5,
                      grainAbsorptionLPerKg: 1.0,
                      trubLossL: 2,
                      brewhouseEfficiencyPct: 78,
                    });
                    setValues({
                      kettleVolumeL: '50',
                      mashTunDeadSpaceL: '2',
                      boilOffRateLHr: '5',
                      grainAbsorptionLPerKg: '1.0',
                      trubLossL: '2',
                      brewhouseEfficiencyPct: '78',
                    });
                  } else if (preset === 'Grainfather') {
                    setEquipmentProfile({
                      kettleVolumeL: 30,
                      mashTunDeadSpaceL: 1.2,
                      boilOffRateLHr: 3.5,
                      grainAbsorptionLPerKg: 0.9,
                      trubLossL: 1.0,
                      brewhouseEfficiencyPct: 75,
                    });
                    setValues({
                      kettleVolumeL: '30',
                      mashTunDeadSpaceL: '1.2',
                      boilOffRateLHr: '3.5',
                      grainAbsorptionLPerKg: '0.9',
                      trubLossL: '1.0',
                      brewhouseEfficiencyPct: '75',
                    });
                  }
                }}
                style={{ flex: 1, backgroundColor: '#EBE3D2', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                activeOpacity={0.8}
              >
                <Text style={[F.bodySemiBold, { fontSize: 13, color: '#6E6E6E' }]}>{preset}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FAF6EE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EBE3D2',
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Inter_400Regular',
  },
});
