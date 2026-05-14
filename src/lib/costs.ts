import { Recipe, InventoryItem, Batch } from './beerjson/types';

export interface CostBreakdown {
  ingredientName: string;
  amount: number;
  unit: string;
  costPerUnit: number;
  lineTotal: number;
}

export interface RecipeCost {
  totalCost: number;
  currency: string;
  breakdown: CostBreakdown[];
  missingIngredients: Array<{
    name: string;
    amount: number;
    unit: string;
    type: string;
  }>;
}

function findInventoryItem(
  inventory: InventoryItem[],
  ingredientId?: string,
  customName?: string,
  type?: string
): InventoryItem | undefined {
  if (ingredientId) {
    return inventory.find(
      (i) => i.ingredient_id === ingredientId && i.ingredient_type === type
    );
  }
  if (customName) {
    return inventory.find(
      (i) =>
        i.custom_name?.toLowerCase() === customName.toLowerCase() &&
        i.ingredient_type === type
    );
  }
  return undefined;
}

export function calculateRecipeCost(
  recipe: Recipe,
  inventory: InventoryItem[]
): RecipeCost {
  const breakdown: CostBreakdown[] = [];
  const missingIngredients: RecipeCost['missingIngredients'] = [];
  let totalCost = 0;

  for (const f of recipe.fermentables) {
    const name = f.fermentable?.name ?? 'Unknown grain';
    const amount = f.amount_kg ?? 0;
    const inv = findInventoryItem(inventory, f.fermentable_id, name, 'fermentable');
    const costPerUnit = inv?.cost_per_unit ?? 0;
    if (costPerUnit > 0) {
      const lineTotal = costPerUnit * amount;
      breakdown.push({ ingredientName: name, amount, unit: 'kg', costPerUnit, lineTotal });
      totalCost += lineTotal;
    } else {
      missingIngredients.push({ name, amount, unit: 'kg', type: 'fermentable' });
    }
  }

  for (const h of recipe.hops) {
    const name = h.hop?.name ?? 'Unknown hop';
    const amount = (h.amount_g ?? 0) / 1000; // g to kg for cost calc consistency, or keep as g
    const inv = findInventoryItem(inventory, h.hop_id, name, 'hop');
    const costPerUnit = inv?.cost_per_unit ?? 0;
    const unit = inv?.unit ?? 'g';
    const amountForCalc = unit === 'kg' ? amount : h.amount_g ?? 0;
    if (costPerUnit > 0) {
      const lineTotal = costPerUnit * amountForCalc;
      breakdown.push({ ingredientName: name, amount: amountForCalc, unit, costPerUnit, lineTotal });
      totalCost += lineTotal;
    } else {
      missingIngredients.push({ name, amount: h.amount_g ?? 0, unit: 'g', type: 'hop' });
    }
  }

  for (const c of recipe.cultures) {
    const name = c.culture?.name ?? 'Unknown yeast';
    const amount = c.amount_g_or_ml ?? 0;
    const inv = findInventoryItem(inventory, c.culture_id, name, 'culture');
    const costPerUnit = inv?.cost_per_unit ?? 0;
    const unit = inv?.unit ?? 'g/ml';
    if (costPerUnit > 0) {
      const lineTotal = costPerUnit * amount;
      breakdown.push({ ingredientName: name, amount, unit, costPerUnit, lineTotal });
      totalCost += lineTotal;
    } else {
      missingIngredients.push({ name, amount, unit: 'g/ml', type: 'culture' });
    }
  }

  return { totalCost, currency: 'GBP', breakdown, missingIngredients };
}

export function calculateBatchCost(batch: Batch, inventory: InventoryItem[]): RecipeCost {
  return calculateRecipeCost(batch.recipe_snapshot, inventory);
}

export function costPerPint(totalCost: number, batchSizeL: number): number {
  const ukPintMl = 568;
  const pints = (batchSizeL * 1000) / ukPintMl;
  return pints > 0 ? totalCost / pints : 0;
}

export function costPerBottle(totalCost: number, batchSizeL: number, bottleSizeMl = 330): number {
  const bottles = (batchSizeL * 1000) / bottleSizeMl;
  return bottles > 0 ? totalCost / bottles : 0;
}
