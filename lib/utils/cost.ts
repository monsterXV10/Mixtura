export interface CostIngredientData {
  price?: number;
  format?: number;
  unit?: string;
  homemade?: boolean;
  composition?: Array<{ ingredientId: string; qty: number; unit: string }>;
  yield?: number;
  yieldUnit?: string;
}

/**
 * Returns cost per unit of the ingredient's default unit.
 * For purchased: price / format (e.g. 18€/70cl = 0.257€/cl)
 * For homemade: sum(sub_costs * qty) / yield
 * Returns null if data is incomplete or a cycle is detected.
 */
export function calcCostPerUnit(
  ingredientId: string,
  map: Map<string, CostIngredientData>,
  visited = new Set<string>()
): number | null {
  if (visited.has(ingredientId)) return null;
  const ing = map.get(ingredientId);
  if (!ing) return null;

  if (!ing.homemade || !ing.composition?.length) {
    if (ing.price != null && ing.format && ing.format > 0) {
      return ing.price / ing.format;
    }
    return null;
  }

  visited.add(ingredientId);
  let total = 0;
  for (const comp of ing.composition) {
    const subCost = calcCostPerUnit(comp.ingredientId, map, new Set(visited));
    if (subCost === null) return null;
    total += subCost * comp.qty;
  }

  const yieldAmt = ing.yield && ing.yield > 0 ? ing.yield : 1;
  return total / yieldAmt;
}

export function calcRecipeCost(
  recipeIngredients: Array<{ ingredientId?: string; qty: number }>,
  map: Map<string, CostIngredientData>
): number | null {
  let total = 0;
  for (const ri of recipeIngredients) {
    if (!ri.ingredientId) return null;
    const cost = calcCostPerUnit(ri.ingredientId, map);
    if (cost === null) return null;
    total += cost * ri.qty;
  }
  return total;
}
