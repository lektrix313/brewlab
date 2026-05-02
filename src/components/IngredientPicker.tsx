import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Plus, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Fermentable, Hop, Culture } from '../lib/beerjson/types';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

type PickerMode = 'fermentable' | 'hop' | 'culture';

interface IngredientPickerProps {
  visible: boolean;
  mode: PickerMode;
  items: Fermentable[] | Hop[] | Culture[];
  onSelect: (item: Fermentable | Hop | Culture) => void;
  onAddCustom: (item: Fermentable | Hop | Culture) => void;
  onClose: () => void;
}

export default function IngredientPicker({
  visible,
  mode,
  items,
  onSelect,
  onAddCustom,
  onClose,
}: IngredientPickerProps) {
  const [query, setQuery] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Custom form state
  const [customName, setCustomName] = useState('');
  const [customOrigin, setCustomOrigin] = useState('');
  const [customYield, setCustomYield] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [customAlpha, setCustomAlpha] = useState('');
  const [customType, setCustomType] = useState('');
  const [customAtten, setCustomAtten] = useState('');
  const [customFlocc, setCustomFlocc] = useState('');

  useEffect(() => {
    if (visible) {
      setQuery('');
      setShowCustom(false);
      setCustomName('');
      setCustomOrigin('');
      setCustomYield('');
      setCustomColor('');
      setCustomAlpha('');
      setCustomType('');
      setCustomAtten('');
      setCustomFlocc('');
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter((item) => {
      const name = 'name' in item ? item.name.toLowerCase() : '';
      const origin = 'origin' in item ? (item.origin || '').toLowerCase() : '';
      const manuf = 'manufacturer' in item ? (item.manufacturer || '').toLowerCase() : '';
      return name.includes(q) || origin.includes(q) || manuf.includes(q);
    });
  }, [items, query]);

  const title = mode === 'fermentable' ? 'Fermentable' : mode === 'hop' ? 'Hop' : 'Yeast';

  function handleSelect(item: Fermentable | Hop | Culture) {
    onSelect(item);
    onClose();
  }

  function handleAddCustom() {
    if (!customName.trim()) return;
    if (mode === 'fermentable') {
      const f: Fermentable = {
        id: `custom-f-${Date.now()}`,
        name: customName.trim(),
        type: 'grain',
        origin: customOrigin.trim() || undefined,
        yield_pct: parseFloat(customYield) || 75,
        color_lovibond: parseFloat(customColor) || 2,
        color_ebc: (parseFloat(customColor) || 2) * 2,
        flavour_descriptors: [],
      };
      onAddCustom(f);
      onSelect(f);
    } else if (mode === 'hop') {
      const h: Hop = {
        id: `custom-h-${Date.now()}`,
        name: customName.trim(),
        origin: customOrigin.trim() || 'Unknown',
        type: (customType as any) || 'dual',
        alpha_pct: parseFloat(customAlpha) || 10,
        flavour_descriptors: [],
      };
      onAddCustom(h);
      onSelect(h);
    } else {
      const c: Culture = {
        id: `custom-c-${Date.now()}`,
        name: customName.trim(),
        manufacturer: customOrigin.trim() || 'Custom',
        type: (customType as any) || 'ale',
        attenuation_pct: parseFloat(customAtten) || 75,
        flocculation: (customFlocc as any) || 'medium',
        temperature_min_c: 18,
        temperature_max_c: 22,
        flavour_descriptors: [],
      };
      onAddCustom(c);
      onSelect(c);
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(26,26,26,0.4)', opacity: fadeAnim }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '85%',
          backgroundColor: '#F5F0E6',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#EBE3D2', borderRadius: 2 }} />
        </View>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 }}>
          <Text style={[F.display, { fontSize: 20, color: '#1A1A1A' }]}>Add {title}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
            <X size={24} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: '#FAF6EE', borderRadius: 12, borderWidth: 1, borderColor: '#EBE3D2', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 }}>
          <Search size={18} color="#6E6E6E" strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${title.toLowerCase()}s...`}
            placeholderTextColor="#6E6E6E"
            style={[F.body, { flex: 1, fontSize: 15, color: '#1A1A1A', marginLeft: 8 }]}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={16} color="#6E6E6E" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
          {filtered.length === 0 && (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={[F.body, { fontSize: 14, color: '#6E6E6E' }]}>No matches. Add a custom {title.toLowerCase()} below.</Text>
            </View>
          )}
          {filtered.map((item) => {
            const isF = mode === 'fermentable';
            const isH = mode === 'hop';
            const name = 'name' in item ? item.name : '';
            const subtitle = isF
              ? `${(item as Fermentable).origin || 'Unknown'} · ${(item as Fermentable).yield_pct}% yield`
              : isH
              ? `${(item as Hop).origin} · ${(item as Hop).alpha_pct}% AA`
              : `${(item as Culture).manufacturer} · ${(item as Culture).attenuation_pct}% att`;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
                style={{ paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EBE3D2' }}
              >
                <Text style={[F.bodySemiBold, { fontSize: 15, color: '#1A1A1A' }]}>{name}</Text>
                <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginTop: 2 }]}>{subtitle}</Text>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Custom toggle */}
        <TouchableOpacity
          onPress={() => setShowCustom((s) => !s)}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#EBE3D2' }}
        >
          <Plus size={16} color="#B8633A" strokeWidth={2} />
          <Text style={[F.bodySemiBold, { fontSize: 14, color: '#B8633A', marginLeft: 6 }]}>Add Custom {title}</Text>
          {showCustom ? <ChevronUp size={16} color="#B8633A" style={{ marginLeft: 4 }} /> : <ChevronDown size={16} color="#B8633A" style={{ marginLeft: 4 }} />}
        </TouchableOpacity>

        {/* Custom form */}
        {showCustom && (
          <ScrollView style={{ maxHeight: 280, paddingHorizontal: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
            <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 4 }]}>Name *</Text>
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder={`e.g., My Custom ${title}`}
              placeholderTextColor="#6E6E6E"
              style={[F.body, { fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAF6EE' }]}
            />

            <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 12 }]}>Origin / Supplier</Text>
            <TextInput
              value={customOrigin}
              onChangeText={setCustomOrigin}
              placeholder="e.g., UK, Weyermann"
              placeholderTextColor="#6E6E6E"
              style={[F.body, { fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAF6EE' }]}
            />

            {mode === 'fermentable' && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }]}>Yield %</Text>
                  <TextInput
                    value={customYield}
                    onChangeText={setCustomYield}
                    keyboardType="decimal-pad"
                    placeholder="75"
                    placeholderTextColor="#6E6E6E"
                    style={[F.mono, { fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAF6EE' }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }]}>Color °L</Text>
                  <TextInput
                    value={customColor}
                    onChangeText={setCustomColor}
                    keyboardType="decimal-pad"
                    placeholder="2"
                    placeholderTextColor="#6E6E6E"
                    style={[F.mono, { fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAF6EE' }]}
                  />
                </View>
              </View>
            )}

            {mode === 'hop' && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }]}>Alpha %</Text>
                  <TextInput
                    value={customAlpha}
                    onChangeText={setCustomAlpha}
                    keyboardType="decimal-pad"
                    placeholder="10"
                    placeholderTextColor="#6E6E6E"
                    style={[F.mono, { fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAF6EE' }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }]}>Type</Text>
                  <TextInput
                    value={customType}
                    onChangeText={setCustomType}
                    placeholder="dual"
                    placeholderTextColor="#6E6E6E"
                    style={[F.body, { fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAF6EE' }]}
                  />
                </View>
              </View>
            )}

            {mode === 'culture' && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }]}>Attenuation %</Text>
                  <TextInput
                    value={customAtten}
                    onChangeText={setCustomAtten}
                    keyboardType="decimal-pad"
                    placeholder="75"
                    placeholderTextColor="#6E6E6E"
                    style={[F.mono, { fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAF6EE' }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }]}>Flocculation</Text>
                  <TextInput
                    value={customFlocc}
                    onChangeText={setCustomFlocc}
                    placeholder="medium"
                    placeholderTextColor="#6E6E6E"
                    style={[F.body, { fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBE3D2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAF6EE' }]}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleAddCustom}
              disabled={!customName.trim()}
              activeOpacity={0.8}
              style={{
                backgroundColor: customName.trim() ? '#B8633A' : '#EBE3D2',
                height: 48,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 16,
              }}
            >
              <Text style={[F.bodySemiBold, { fontSize: 15, color: customName.trim() ? '#F5F0E6' : '#6E6E6E' }]}>Add Custom {title}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
}
