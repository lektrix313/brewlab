/**
 * Map between local snake_case types and cloud camelCase types.
 */
import type { Recipe, Batch, BatchMeasurement, InventoryItem, ShoppingListItem } from '../beerjson/types';

// ─── Recipe ─────────────────────────────────────────────

export function recipeToCloud(r: Recipe, userId: string) {
  return {
    id: r.id,
    userId,
    name: r.name,
    description: r.description,
    styleId: r.style?.bjcp_id ?? null,
    styleName: r.style?.name ?? null,
    type: r.type,
    batchSizeL: r.batch_size_l,
    efficiencyPct: r.efficiency_pct,
    fermentables: r.fermentables,
    hops: r.hops,
    cultures: r.cultures,
    process: r.process,
    waterProfile: r.process?.water_profile ?? null,
    estimatedOg: r.estimated_og,
    estimatedFg: r.estimated_fg,
    estimatedAbvPct: r.estimated_abv_pct,
    estimatedIbu: r.estimated_ibu,
    estimatedSrm: r.estimated_srm,
    estimatedEbc: r.estimated_ebc ?? null,
    isPublic: r.is_public ?? false,
    isTemplate: false,
    templateId: r.instantiated_from_template_id ?? null,
    tags: [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function recipeFromCloud(data: Record<string, any>): Recipe {
  return {
    id: data.id,
    author_id: data.userId ?? 'unknown',
    name: data.name,
    description: data.description,
    style: data.styleId
      ? {
          bjcp_id: data.styleId,
          name: data.styleName ?? data.styleId,
          category: 'ale',
          og_min: 1.0,
          og_max: 1.2,
          fg_min: 1.0,
          fg_max: 1.03,
          abv_min_pct: 0,
          abv_max_pct: 20,
          ibu_min: 0,
          ibu_max: 200,
          srm_min: 0,
          srm_max: 50,
        }
      : undefined,
    type: data.type ?? 'all grain',
    batch_size_l: data.batchSizeL ?? 20,
    efficiency_pct: data.efficiencyPct ?? 75,
    fermentables: data.fermentables ?? [],
    hops: data.hops ?? [],
    cultures: data.cultures ?? [],
    process: data.process ?? {},
    estimated_og: data.estimatedOg ?? 1.05,
    estimated_fg: data.estimatedFg ?? 1.01,
    estimated_abv_pct: data.estimatedAbvPct ?? 5,
    estimated_ibu: data.estimatedIbu ?? 30,
    estimated_srm: data.estimatedSrm ?? 10,
    estimated_ebc: data.estimatedEbc ?? null,
    is_public: data.isPublic ?? false,
    instantiated_from_template_id: data.templateId ?? null,
    created_at: data.createdAt ?? new Date().toISOString(),
    updated_at: data.updatedAt ?? new Date().toISOString(),
  };
}

// ─── Batch ──────────────────────────────────────────────

export function batchToCloud(b: Batch, userId: string) {
  return {
    id: b.id,
    userId,
    recipeId: b.recipe_id ?? null,
    name: b.name,
    status: b.status,
    recipeSnapshot: b.recipe_snapshot,
    startedAt: b.started_at,
    estimatedReadyAt: b.estimated_ready_at,
    completedAt: b.completed_at ?? null,
    predictedCurve: b.predicted_curve ?? [],
    waterChemistry: b.water_chemistry ?? null,
    isPublic: b.is_public ?? false,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

export function batchFromCloud(data: Record<string, any>): Batch {
  return {
    id: data.id,
    user_id: data.userId ?? 'unknown',
    recipe_id: data.recipeId ?? null,
    recipe_snapshot: data.recipeSnapshot ?? {},
    name: data.name ?? 'Untitled Batch',
    status: data.status ?? 'planned',
    started_at: data.startedAt ?? new Date().toISOString(),
    estimated_ready_at: data.estimatedReadyAt ?? new Date().toISOString(),
    completed_at: data.completedAt ?? null,
    predicted_curve: data.predictedCurve ?? [],
    water_chemistry: data.waterChemistry ?? null,
    measurements: [],
    notes: [],
    photos: [],
    is_public: data.isPublic ?? false,
    created_at: data.createdAt ?? new Date().toISOString(),
    updated_at: data.updatedAt ?? new Date().toISOString(),
  };
}

// ─── Measurement ────────────────────────────────────────

export function measurementToCloud(m: BatchMeasurement, batchId: string) {
  return {
    id: m.id,
    batchId,
    type: m.type,
    value: m.value,
    unit: m.unit ?? null,
    note: m.note ?? null,
    recordedAt: m.recorded_at,
    createdAt: m.created_at ?? m.recorded_at,
  };
}

export function measurementFromCloud(data: Record<string, any>): BatchMeasurement {
  return {
    id: data.id,
    batch_id: data.batchId ?? '',
    type: data.type,
    value: data.value,
    unit: data.unit ?? undefined,
    note: data.note ?? undefined,
    recorded_at: data.recordedAt ?? new Date().toISOString(),
    created_at: data.createdAt ?? new Date().toISOString(),
  };
}

// ─── Inventory ──────────────────────────────────────────

export function inventoryToCloud(item: InventoryItem, userId: string) {
  return {
    id: item.id,
    userId,
    ingredientType: item.ingredient_type,
    ingredientId: item.ingredient_id ?? null,
    customName: item.custom_name ?? null,
    amount: item.amount,
    unit: item.unit,
    costPerUnit: item.cost_per_unit ?? null,
    costCurrency: item.cost_currency ?? 'GBP',
    supplier: item.supplier ?? null,
    purchaseDate: item.purchase_date ?? null,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

export function inventoryFromCloud(data: Record<string, any>): InventoryItem {
  return {
    id: data.id,
    user_id: data.userId ?? 'unknown',
    ingredient_type: data.ingredientType ?? 'misc',
    ingredient_id: data.ingredientId ?? undefined,
    custom_name: data.customName ?? undefined,
    amount: data.amount ?? 0,
    unit: data.unit ?? 'kg',
    cost_per_unit: data.costPerUnit ?? undefined,
    cost_currency: data.costCurrency ?? 'GBP',
    supplier: data.supplier ?? undefined,
    purchase_date: data.purchaseDate ?? undefined,
    created_at: data.createdAt ?? new Date().toISOString(),
    updated_at: data.updatedAt ?? new Date().toISOString(),
  };
}

// ─── Shopping List ──────────────────────────────────────

export function shoppingListToCloud(item: ShoppingListItem, userId: string) {
  return {
    id: item.id,
    userId,
    ingredientType: item.ingredient_type,
    ingredientId: item.ingredient_id ?? null,
    customName: item.custom_name ?? null,
    amountNeeded: item.amount_needed,
    unit: item.unit,
    purchased: item.purchased,
    linkedInventoryItemId: item.linked_inventory_item_id ?? null,
    createdAt: item.created_at,
  };
}

export function shoppingListFromCloud(data: Record<string, any>): ShoppingListItem {
  return {
    id: data.id,
    user_id: data.userId ?? 'unknown',
    ingredient_type: data.ingredientType ?? 'misc',
    ingredient_id: data.ingredientId ?? undefined,
    custom_name: data.customName ?? undefined,
    amount_needed: data.amountNeeded ?? 0,
    unit: data.unit ?? 'kg',
    purchased: data.purchased ?? false,
    linked_inventory_item_id: data.linkedInventoryItemId ?? undefined,
    created_at: data.createdAt ?? new Date().toISOString(),
  };
}
