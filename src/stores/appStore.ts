import { create } from 'zustand';
import { Recipe, Batch, StyleTemplate, Fermentable, Hop, Culture, BeerStyle, BatchMeasurement, BatchNote, InventoryItem, ShoppingListItem } from '../lib/beerjson/types';
import { pushRecipe, pushBatch, pushMeasurement } from '../lib/sync/engine';
import { scheduleBatchNotifications } from '../lib/notifications';

export type BrewSessionPhase = 'setup' | 'mash' | 'boil' | 'cool' | 'pitch' | 'complete';

export interface BrewSession {
  batch_id: string;
  phase: BrewSessionPhase;
  mash_step_index: number;
  boil_time_remaining_sec: number;
  cool_time_remaining_sec: number;
  hop_additions_done: string[];
  is_paused: boolean;
  started_at: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'recipe' | 'batch' | 'measurement';
  action: 'create' | 'update';
  payload: Record<string, any>;
  retries: number;
  createdAt: number;
}

export type UnitSystem = 'metric' | 'us' | 'imperial';

export interface EquipmentProfile {
  kettleVolumeL: number;
  mashTunDeadSpaceL: number;
  boilOffRateLHr: number;
  evapRatePctHr: number;
  grainAbsorptionLPerKg: number;
  trubLossL: number;
  brewhouseEfficiencyPct: number;
}

interface AppState {
  // Seed data
  fermentables: Fermentable[];
  hops: Hop[];
  cultures: Culture[];
  styles: BeerStyle[];
  templates: StyleTemplate[];

  // User data
  recipes: Recipe[];
  batches: Batch[];
  sessions: BrewSession[];
  inventory: InventoryItem[];
  shoppingList: ShoppingListItem[];

  // Settings
  unitSystem: UnitSystem;
  equipmentProfile: EquipmentProfile;

  // Sync state
  isOnline: boolean;
  lastSyncedAt: string | null;
  syncQueue: SyncQueueItem[];

  // Actions
  setSeedData: (data: {
    fermentables: Fermentable[];
    hops: Hop[];
    cultures: Culture[];
    styles: BeerStyle[];
    templates: StyleTemplate[];
  }) => void;
  setRecipes: (recipes: Recipe[]) => void;
  setBatches: (batches: Batch[]) => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  addBatch: (batch: Batch) => void;
  updateBatch: (batch: Batch) => void;
  removeBatch: (id: string) => void;
  addBatchMeasurement: (batchId: string, measurement: BatchMeasurement) => void;
  addBatchNote: (batchId: string, note: BatchNote) => void;

  // Inventory
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  removeInventoryItem: (id: string) => void;

  // Shopping list
  addShoppingListItem: (item: ShoppingListItem) => void;
  updateShoppingListItem: (item: ShoppingListItem) => void;
  removeShoppingListItem: (id: string) => void;
  clearPurchasedShoppingListItems: () => void;

  // Custom ingredients
  addCustomFermentable: (f: Fermentable) => void;
  addCustomHop: (h: Hop) => void;
  addCustomCulture: (c: Culture) => void;

  // Brew session
  startSession: (batch_id: string) => void;
  updateSession: (session: BrewSession) => void;
  endSession: (batch_id: string) => void;

  // Settings actions
  setUnitSystem: (system: UnitSystem) => void;
  setEquipmentProfile: (profile: Partial<EquipmentProfile>) => void;

  // Sync actions
  setIsOnline: (online: boolean) => void;
  setLastSyncedAt: (at: string) => void;
  enqueueSync: (item: SyncQueueItem) => void;
  clearSyncQueue: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  fermentables: [],
  hops: [],
  cultures: [],
  styles: [],
  templates: [],
  recipes: [],
  batches: [],
  sessions: [],
  inventory: [],
  shoppingList: [],
  unitSystem: 'metric',
  equipmentProfile: {
    kettleVolumeL: 30,
    mashTunDeadSpaceL: 1.5,
    boilOffRateLHr: 3.5,
    evapRatePctHr: 10,
    grainAbsorptionLPerKg: 1.0,
    trubLossL: 1.0,
    brewhouseEfficiencyPct: 75,
  },
  isOnline: false,
  lastSyncedAt: null,
  syncQueue: [],
  setUnitSystem: (system) => set({ unitSystem: system }),
  setEquipmentProfile: (profile) =>
    set((state) => ({
      equipmentProfile: { ...state.equipmentProfile, ...profile },
    })),

  setSeedData: (data) => set((state) => ({ ...state, ...data })),
  setRecipes: (recipes) => set({ recipes }),
  setBatches: (batches) => set({ batches }),

  addRecipe: (recipe) => {
    set((state) => ({ recipes: [...state.recipes, recipe] }));
    // Attempt immediate cloud push; if it fails, it'll be queued by caller or ignored
    pushRecipe(recipe).catch(() => {
      // Silently fail — offline or not signed in is fine
    });
  },

  updateRecipe: (recipe) =>
    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === recipe.id ? recipe : r)),
    })),

  removeRecipe: (id) =>
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    })),

  addBatch: (batch) => {
    set((state) => ({ batches: [...state.batches, batch] }));
    pushBatch(batch).catch(() => {});
    scheduleBatchNotifications(batch, batch.recipe_snapshot).catch(() => {});
  },

  updateBatch: (batch) =>
    set((state) => ({
      batches: state.batches.map((b) => (b.id === batch.id ? batch : b)),
    })),

  removeBatch: (id) =>
    set((state) => ({
      batches: state.batches.filter((b) => b.id !== id),
    })),

  addBatchMeasurement: (batchId, measurement) => {
    set((state) => ({
      batches: state.batches.map((b) =>
        b.id === batchId
          ? { ...b, measurements: [...b.measurements, measurement], updated_at: new Date().toISOString() }
          : b,
      ),
    }));
    pushMeasurement(batchId, measurement).catch(() => {});
  },

  addBatchNote: (batchId, note) =>
    set((state) => ({
      batches: state.batches.map((b) =>
        b.id === batchId
          ? { ...b, notes: [...b.notes, note], updated_at: new Date().toISOString() }
          : b,
      ),
    })),

  addInventoryItem: (item) =>
    set((state) => ({ inventory: [...state.inventory, item] })),

  updateInventoryItem: (item) =>
    set((state) => ({
      inventory: state.inventory.map((i) => (i.id === item.id ? item : i)),
    })),

  removeInventoryItem: (id) =>
    set((state) => ({
      inventory: state.inventory.filter((i) => i.id !== id),
    })),

  addShoppingListItem: (item) =>
    set((state) => ({ shoppingList: [...state.shoppingList, item] })),

  updateShoppingListItem: (item) =>
    set((state) => ({
      shoppingList: state.shoppingList.map((i) => (i.id === item.id ? item : i)),
    })),

  removeShoppingListItem: (id) =>
    set((state) => ({
      shoppingList: state.shoppingList.filter((i) => i.id !== id),
    })),

  clearPurchasedShoppingListItems: () =>
    set((state) => ({
      shoppingList: state.shoppingList.filter((i) => !i.purchased),
    })),

  startSession: (batch_id) =>
    set((state) => {
      const existing = state.sessions.find((s) => s.batch_id === batch_id);
      if (existing) return state;
      const batch = state.batches.find((b) => b.id === batch_id);
      const boilMin = batch?.recipe_snapshot.process.boil.duration_min ?? 60;
      return {
        sessions: [
          ...state.sessions,
          {
            batch_id,
            phase: 'setup',
            mash_step_index: 0,
            boil_time_remaining_sec: boilMin * 60,
            cool_time_remaining_sec: 20 * 60,
            hop_additions_done: [],
            is_paused: false,
            started_at: new Date().toISOString(),
          },
        ],
      };
    }),

  updateSession: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.batch_id === session.batch_id ? session : s
      ),
    })),

  endSession: (batch_id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.batch_id !== batch_id),
    })),

  addCustomFermentable: (f) =>
    set((state) => ({
      fermentables: [...state.fermentables, f],
    })),
  addCustomHop: (h) =>
    set((state) => ({
      hops: [...state.hops, h],
    })),
  addCustomCulture: (c) =>
    set((state) => ({
      cultures: [...state.cultures, c],
    })),

  setIsOnline: (online) => set({ isOnline: online }),
  setLastSyncedAt: (at) => set({ lastSyncedAt: at }),
  enqueueSync: (item) => set((state) => ({ syncQueue: [...state.syncQueue, item] })),
  clearSyncQueue: () => set({ syncQueue: [] }),
}));
