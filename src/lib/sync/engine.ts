/**
 * Sync engine — handles push/pull between local Zustand store and Cloudflare backend.
 */
import { apiClient, getApiBaseUrl } from '../api';
import { recipeToCloud, recipeFromCloud, batchToCloud, batchFromCloud, measurementToCloud, measurementFromCloud, inventoryToCloud, inventoryFromCloud, shoppingListToCloud, shoppingListFromCloud } from './mappers';
import type { Recipe, Batch, BatchMeasurement, InventoryItem, ShoppingListItem } from '../beerjson/types';

export interface SyncQueueItem {
  id: string;
  type: 'recipe' | 'batch' | 'measurement' | 'inventory' | 'shoppingList';
  action: 'create' | 'update';
  payload: Record<string, any>;
  retries: number;
  createdAt: number;
}

let _token: string | null = null;

export function setSyncToken(token: string | null) {
  _token = token;
}

export function getSyncToken(): string | null {
  return _token;
}

/**
 * Pull all user data from cloud since a given timestamp.
 * If `since` is omitted, pulls everything.
 */
export async function syncPull(since?: string) {
  if (!_token) throw new Error('Not authenticated');

  const url = since ? `/sync?since=${encodeURIComponent(since)}` : '/sync';
  const res = await apiClient.get<{
    recipes: Record<string, any>[];
    batches: Record<string, any>[];
    measurements: Record<string, any>[];
    notes: Record<string, any>[];
    photos: Record<string, any>[];
    inventory: Record<string, any>[];
    shoppingList: Record<string, any>[];
    syncedAt: string;
  }>(url, _token);

  return {
    recipes: res.data.recipes.map(recipeFromCloud),
    batches: res.data.batches.map(batchFromCloud),
    measurements: res.data.measurements.map(measurementFromCloud),
    inventory: res.data.inventory.map(inventoryFromCloud),
    shoppingList: res.data.shoppingList.map(shoppingListFromCloud),
    syncedAt: res.data.syncedAt,
  };
}

/**
 * Push local changes to cloud.
 */
export async function syncPush(options: {
  recipes?: Recipe[];
  batches?: Batch[];
  measurements?: Array<{ measurement: BatchMeasurement; batchId: string }>;
  inventory?: InventoryItem[];
  shoppingList?: ShoppingListItem[];
}) {
  if (!_token) throw new Error('Not authenticated');

  const { recipes = [], batches = [], measurements = [], inventory = [], shoppingList = [] } = options;

  const userId = 'jwt-user';

  const payload = {
    recipes: recipes.map((r) => recipeToCloud(r, userId)),
    batches: batches.map((b) => batchToCloud(b, userId)),
    measurements: measurements.map((m) => measurementToCloud(m.measurement, m.batchId)),
    inventory: inventory.map((i) => inventoryToCloud(i, userId)),
    shoppingList: shoppingList.map((s) => shoppingListToCloud(s, userId)),
  };

  return apiClient.post('/sync/push', payload, _token);
}

/**
 * Push a single recipe.
 */
export async function pushRecipe(recipe: Recipe) {
  if (!_token) return null;
  return syncPush({ recipes: [recipe] });
}

/**
 * Push a single batch.
 */
export async function pushBatch(batch: Batch) {
  if (!_token) return null;
  return syncPush({ batches: [batch] });
}

/**
 * Push a single measurement.
 */
export async function pushMeasurement(batchId: string, measurement: BatchMeasurement) {
  if (!_token) return null;
  return syncPush({ measurements: [{ batchId, measurement }] });
}

/**
 * Check if the API is reachable.
 */
export async function isApiReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
