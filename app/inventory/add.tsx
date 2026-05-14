import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/stores/appStore';
import { ArrowLeft, Wheat, Leaf, Beaker, Box } from 'lucide-react-native';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayMedium: { fontFamily: 'Newsreader_500Medium' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

type IngredientType = 'fermentable' | 'hop' | 'culture' | 'misc';

const types: { key: IngredientType; label: string; icon: React.ReactNode }[] = [
  {
    key: 'fermentable',
    label: 'Fermentable',
    icon: <Wheat size={18} color="#B8633A" strokeWidth={1.5} />,
  },
  {
    key: 'hop',
    label: 'Hop',
    icon: <Leaf size={18} color="#B8633A" strokeWidth={1.5} />,
  },
  {
    key: 'culture',
    label: 'Yeast',
    icon: <Beaker size={18} color="#B8633A" strokeWidth={1.5} />,
  },
  {
    key: 'misc',
    label: 'Misc',
    icon: <Box size={18} color="#B8633A" strokeWidth={1.5} />,
  },
];

export default function AddInventoryScreen() {
  const router = useRouter();
  const addInventoryItem = useAppStore((s) => s.addInventoryItem);

  const [type, setType] = useState<IngredientType>('fermentable');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('kg');
  const [cost, setCost] = useState('');
  const [supplier, setSupplier] = useState('');

  const canSave = name.trim() && amount.trim() && parseFloat(amount) > 0;

  const handleSave = () => {
    if (!canSave) return;

    addInventoryItem({
      id: `inv-${Date.now()}`,
      user_id: 'local',
      ingredient_type: type,
      ingredient_id: undefined,
      custom_name: name.trim(),
      amount: parseFloat(amount),
      unit: unit.trim() || 'kg',
      cost_per_unit: cost.trim() ? parseFloat(cost) : undefined,
      cost_currency: 'GBP',
      supplier: supplier.trim() || undefined,
      purchase_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={[F.display, styles.headerTitle]}>Add to Pantry</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[F.bodySemiBold, styles.label]}>Type</Text>
          <View style={styles.typeRow}>
            {types.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeChip, type === t.key && styles.typeChipActive]}
                onPress={() => setType(t.key)}
              >
                {t.icon}
                <Text
                  style={[
                    F.bodySemiBold,
                    styles.typeChipLabel,
                    type === t.key && { color: '#B8633A' },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[F.bodySemiBold, styles.label]}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Maris Otter Pale Malt"
            placeholderTextColor="#9E9E9E"
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[F.bodySemiBold, styles.label]}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="5"
                keyboardType="decimal-pad"
                placeholderTextColor="#9E9E9E"
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              <Text style={[F.bodySemiBold, styles.label]}>Unit</Text>
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="kg"
                placeholderTextColor="#9E9E9E"
              />
            </View>
          </View>

          <Text style={[F.bodySemiBold, styles.label]}>Cost per unit (£)</Text>
          <TextInput
            style={styles.input}
            value={cost}
            onChangeText={setCost}
            placeholder="2.50"
            keyboardType="decimal-pad"
            placeholderTextColor="#9E9E9E"
          />

          <Text style={[F.bodySemiBold, styles.label]}>Supplier (optional)</Text>
          <TextInput
            style={styles.input}
            value={supplier}
            onChangeText={setSupplier}
            placeholder="e.g. The Malt Miller"
            placeholderTextColor="#9E9E9E"
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Text style={[F.bodySemiBold, styles.saveBtnText]}>Add to Pantry</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  label: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EBE3D2',
    borderWidth: 1,
    borderColor: '#EBE3D2',
  },
  typeChipActive: {
    backgroundColor: '#FAF6EE',
    borderColor: '#B8633A',
  },
  typeChipLabel: {
    fontSize: 13,
    color: '#6E6E6E',
  },
  input: {
    backgroundColor: '#FAF6EE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#EBE3D2',
    fontFamily: 'Inter_400Regular',
  },
  row: {
    flexDirection: 'row',
  },
  footer: {
    padding: 16,
    paddingBottom: 28,
    backgroundColor: '#F5F0E6',
    borderTopWidth: 1,
    borderTopColor: '#EBE3D2',
  },
  saveBtn: {
    backgroundColor: '#B8633A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#C4B9A3',
  },
  saveBtnText: {
    fontSize: 15,
    color: '#FAF6EE',
  },
});
