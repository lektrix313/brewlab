import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../../src/stores/appStore';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { hapticImpact } from '../../../src/lib/haptics';
import { BatchMeasurement } from '../../../src/lib/beerjson/types';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

type MeasurementType = 'gravity' | 'temperature' | 'ph' | 'volume';

const TYPE_CONFIG: Record<MeasurementType, { label: string; unit: string; placeholder: string; keyboard: 'decimal-pad' | 'numeric' | 'default' }> = {
  gravity: { label: 'Specific Gravity', unit: 'SG', placeholder: '1.020', keyboard: 'decimal-pad' },
  temperature: { label: 'Temperature', unit: '°C', placeholder: '20.0', keyboard: 'decimal-pad' },
  ph: { label: 'pH', unit: 'pH', placeholder: '5.2', keyboard: 'decimal-pad' },
  volume: { label: 'Volume', unit: 'L', placeholder: '20.0', keyboard: 'decimal-pad' },
};

export default function LogMeasurementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const batch = useAppStore((s) => s.batches.find((b) => b.id === id));
  const addMeasurement = useAppStore((s) => s.addBatchMeasurement);

  const [type, setType] = useState<MeasurementType>('gravity');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  if (!batch) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[F.body, { color: '#6E6E6E' }]}>Batch not found.</Text>
      </SafeAreaView>
    );
  }

  function save() {
    const numValue = parseFloat(value);
    if (Number.isNaN(numValue)) return;

    const measurement: BatchMeasurement = {
      id: `meas-${Date.now()}`,
      recorded_at: new Date().toISOString(),
      type,
      value: numValue,
      unit: TYPE_CONFIG[type].unit as any,
      source: 'manual',
      note: note.trim() || undefined,
    };

    addMeasurement(batch.id, measurement);
    hapticImpact('success');
    setSaved(true);
    setTimeout(() => router.back(), 600);
  }

  const config = TYPE_CONFIG[type];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 16 }}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
              <ChevronLeft size={28} color="#1A1A1A" strokeWidth={1.5} />
            </TouchableOpacity>
            <Text style={[F.display, { fontSize: 22, lineHeight: 28, color: '#1A1A1A', marginLeft: 12 }]}>
              Log a Reading
            </Text>
          </View>

          <Text style={[F.body, { fontSize: 15, color: '#6E6E6E', marginBottom: 24 }]}>
            {batch.recipe_snapshot.name} — {batch.name?.includes('Batch') ? batch.name.split('—')[1]?.trim() : `Batch #${batch.id.split('-').pop()}`}
          </Text>

          {/* Type selector */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {(Object.keys(TYPE_CONFIG) as MeasurementType[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => { setType(t); setValue(''); }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: type === t ? '#B8633A' : '#FAF6EE',
                  borderWidth: 1,
                  borderColor: type === t ? '#B8633A' : '#EBE3D2',
                }}
                activeOpacity={0.8}
              >
                <Text style={[F.bodySemiBold, { fontSize: 14, color: type === t ? '#F5F0E6' : '#3D3D3D' }]}>
                  {TYPE_CONFIG[t].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Value input */}
          <View style={{ backgroundColor: '#FAF6EE', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#EBE3D2', marginBottom: 16 }}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }]}>
              {config.label}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={value}
                onChangeText={setValue}
                placeholder={config.placeholder}
                keyboardType={config.keyboard}
                style={{
                  flex: 1,
                  fontFamily: 'SpaceGrotesk_500Medium',
                  fontSize: 36,
                  color: '#1A1A1A',
                  padding: 0,
                }}
                autoFocus
              />
              <Text style={[F.body, { fontSize: 18, color: '#6E6E6E', marginLeft: 8 }]}>{config.unit}</Text>
            </View>
          </View>

          {/* Note */}
          <View style={{ backgroundColor: '#FAF6EE', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#EBE3D2', marginBottom: 24 }}>
            <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }]}>
              Note (optional)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Anything to remember..."
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 16,
                color: '#1A1A1A',
                padding: 0,
                minHeight: 60,
              }}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={save}
            disabled={!value || saved}
            style={{
              backgroundColor: saved ? '#5C6A54' : '#B8633A',
              height: 56,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !value ? 0.6 : 1,
            }}
            activeOpacity={0.8}
          >
            <Text style={[F.bodySemiBold, { fontSize: 15, color: '#F5F0E6' }]}>
              {saved ? 'Saved. Nice one.' : 'Save reading'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
