import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/stores/appStore';
import { useRouter } from 'expo-router';
import { Package, ShoppingCart, Plus, Check, Trash2, Wheat, Leaf, Beaker, Box } from 'lucide-react-native';
import { InventoryItem, ShoppingListItem } from '../../src/lib/beerjson/types';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  displayMedium: { fontFamily: 'Newsreader_500Medium' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

type Tab = 'stock' | 'shopping';

const typeIcon = (type: string, color: string, size: number) => {
  switch (type) {
    case 'fermentable':
      return <Wheat size={size} color={color} strokeWidth={1.5} />;
    case 'hop':
      return <Leaf size={size} color={color} strokeWidth={1.5} />;
    case 'culture':
      return <Beaker size={size} color={color} strokeWidth={1.5} />;
    default:
      return <Box size={size} color={color} strokeWidth={1.5} />;
  }
};

const typeLabel = (type: string) => {
  switch (type) {
    case 'fermentable':
      return 'Fermentable';
    case 'hop':
      return 'Hop';
    case 'culture':
      return 'Yeast';
    default:
      return 'Misc';
  }
};

export default function InventoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('stock');
  const inventory = useAppStore((s) => s.inventory);
  const shoppingList = useAppStore((s) => s.shoppingList);
  const removeInventoryItem = useAppStore((s) => s.removeInventoryItem);
  const updateShoppingListItem = useAppStore((s) => s.updateShoppingListItem);
  const removeShoppingListItem = useAppStore((s) => s.removeShoppingListItem);
  const clearPurchased = useAppStore((s) => s.clearPurchasedShoppingListItems);

  const groupedInventory = inventory.reduce((acc, item) => {
    const key = item.ingredient_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const unpurchased = shoppingList.filter((i) => !i.purchased);
  const purchased = shoppingList.filter((i) => i.purchased);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[F.display, styles.headerTitle]}>Inventory</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/inventory/add')}
        >
          <Plus size={20} color="#FAF6EE" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.segmented}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'stock' && styles.segmentActive]}
          onPress={() => setActiveTab('stock')}
        >
          <Package
            size={16}
            color={activeTab === 'stock' ? '#B8633A' : '#6E6E6E'}
            strokeWidth={1.5}
          />
          <Text
            style={[
              F.bodySemiBold,
              styles.segmentLabel,
              activeTab === 'stock' && { color: '#B8633A' },
            ]}
          >
            Stock
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'shopping' && styles.segmentActive]}
          onPress={() => setActiveTab('shopping')}
        >
          <ShoppingCart
            size={16}
            color={activeTab === 'shopping' ? '#B8633A' : '#6E6E6E'}
            strokeWidth={1.5}
          />
          <Text
            style={[
              F.bodySemiBold,
              styles.segmentLabel,
              activeTab === 'shopping' && { color: '#B8633A' },
            ]}
          >
            Shopping List
          </Text>
          {unpurchased.length > 0 && (
            <View style={styles.badge}>
              <Text style={[F.bodySemiBold, styles.badgeText]}>{unpurchased.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'stock' && (
          <>
            {inventory.length === 0 && (
              <View style={styles.empty}>
                <Package size={48} color="#C4B9A3" strokeWidth={1} />
                <Text style={[F.displayMedium, styles.emptyTitle]}>No stock yet</Text>
                <Text style={[F.body, styles.emptyBody]}>
                  Tap the + button to add ingredients you have on hand. We'll use these to estimate recipe costs and build your shopping list.
                </Text>
              </View>
            )}
            {Object.entries(groupedInventory).map(([type, items]) => (
              <View key={type} style={styles.group}>
                <View style={styles.groupHeader}>
                  {typeIcon(type, '#B8633A', 18)}
                  <Text style={[F.bodySemiBold, styles.groupTitle]}>{typeLabel(type)}s</Text>
                  <Text style={[F.mono, styles.groupCount]}>{items.length}</Text>
                </View>
                {items.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[F.bodySemiBold, styles.itemName]}>
                          {item.custom_name || item.ingredient_id || 'Unknown'}
                        </Text>
                        <Text style={[F.body, styles.itemMeta]}>
                          {item.amount.toFixed(2)} {item.unit}
                          {item.supplier ? ` · ${item.supplier}` : ''}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        {item.cost_per_unit !== undefined && item.cost_per_unit > 0 && (
                          <Text style={[F.mono, styles.itemCost]}>
                            £{item.cost_per_unit.toFixed(2)}/{item.unit}
                          </Text>
                        )}
                        <TouchableOpacity
                          onPress={() => removeInventoryItem(item.id)}
                          style={styles.deleteBtn}
                        >
                          <Trash2 size={14} color="#C44536" strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {activeTab === 'shopping' && (
          <>
            {shoppingList.length === 0 && (
              <View style={styles.empty}>
                <ShoppingCart size={48} color="#C4B9A3" strokeWidth={1} />
                <Text style={[F.displayMedium, styles.emptyTitle]}>Shopping list empty</Text>
                <Text style={[F.body, styles.emptyBody]}>
                  When you plan a brew, we'll check your stock and add missing ingredients here automatically.
                </Text>
              </View>
            )}

            {unpurchased.length > 0 && (
              <View style={styles.group}>
                <Text style={[F.bodySemiBold, styles.groupTitle]}>To Buy</Text>
                {unpurchased.map((item) => (
                  <ShoppingListRow
                    key={item.id}
                    item={item}
                    onToggle={() =>
                      updateShoppingListItem({ ...item, purchased: !item.purchased })
                    }
                    onDelete={() => removeShoppingListItem(item.id)}
                  />
                ))}
              </View>
            )}

            {purchased.length > 0 && (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={[F.bodySemiBold, styles.groupTitle]}>Purchased</Text>
                  <TouchableOpacity onPress={clearPurchased}>
                    <Text style={[F.bodySemiBold, styles.clearText]}>Clear</Text>
                  </TouchableOpacity>
                </View>
                {purchased.map((item) => (
                  <ShoppingListRow
                    key={item.id}
                    item={item}
                    onToggle={() =>
                      updateShoppingListItem({ ...item, purchased: !item.purchased })
                    }
                    onDelete={() => removeShoppingListItem(item.id)}
                    dimmed
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ShoppingListRow({
  item,
  onToggle,
  onDelete,
  dimmed,
}: {
  item: ShoppingListItem;
  onToggle: () => void;
  onDelete: () => void;
  dimmed?: boolean;
}) {
  return (
    <View style={[styles.itemCard, dimmed && styles.itemCardDimmed]}>
      <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
        {item.purchased ? (
          <View style={styles.checkboxChecked}>
            <Check size={14} color="#FAF6EE" strokeWidth={2.5} />
          </View>
        ) : (
          <View style={styles.checkboxUnchecked} />
        )}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            F.bodySemiBold,
            styles.itemName,
            dimmed && { textDecorationLine: 'line-through', color: '#9E9E9E' },
          ]}
        >
          {item.custom_name || item.ingredient_id || 'Unknown'}
        </Text>
        <Text style={[F.body, styles.itemMeta]}>
          {item.amount_needed.toFixed(2)} {item.unit} · {typeLabel(item.ingredient_type)}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Trash2 size={14} color="#C44536" strokeWidth={2} />
      </TouchableOpacity>
    </View>
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
  headerTitle: {
    fontSize: 28,
    color: '#1A1A1A',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#B8633A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#EBE3D2',
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: '#FAF6EE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentLabel: {
    fontSize: 13,
    color: '#6E6E6E',
  },
  badge: {
    backgroundColor: '#B8633A',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#FAF6EE',
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
  group: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 15,
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  groupCount: {
    fontSize: 13,
    color: '#9E9E9E',
    marginLeft: 'auto',
  },
  clearText: {
    fontSize: 13,
    color: '#C44536',
  },
  itemCard: {
    backgroundColor: '#FAF6EE',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EBE3D2',
  },
  itemCardDimmed: {
    backgroundColor: '#F5F0E6',
    borderColor: '#EBE3D2',
  },
  itemRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  itemMeta: {
    fontSize: 13,
    color: '#6E6E6E',
    marginTop: 2,
  },
  itemCost: {
    fontSize: 13,
    color: '#5C6A54',
    marginBottom: 4,
  },
  deleteBtn: {
    padding: 6,
  },
  checkbox: {
    padding: 2,
  },
  checkboxUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C4B9A3',
  },
  checkboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#B8633A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
