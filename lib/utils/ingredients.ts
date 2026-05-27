import type { createClient } from '@/lib/supabase/client';

type SupabaseClient = ReturnType<typeof createClient>;

export interface IngredientRef {
  ingredientId?: string;
  name: string;
  unit: string;
  qty?: number;
}

/** Autocomplete option shown when linking an ingredient in a recipe/composition. */
export interface UserIngredientOption {
  id: string;
  name: string;
  unit: string;
  homemade?: boolean;
  brand?: string;
  family?: string;
}

/** Build an autocomplete option from a raw ingredients row. */
export function toIngredientOption(row: { id: string; data: unknown }): UserIngredientOption {
  const d = (row.data ?? {}) as {
    name?: string;
    unit?: string;
    homemade?: boolean;
    brand?: string;
    family?: string;
  };
  return {
    id: row.id,
    name: d.name ?? '',
    unit: d.unit ?? 'cl',
    homemade: d.homemade ?? false,
    brand: d.brand ?? '',
    family: d.family ?? '',
  };
}

/** True when the query matches the option's name, brand, or family (case-insensitive). */
export function matchesIngredient(opt: UserIngredientOption, query: string): boolean {
  const q = query.toLowerCase();
  return (
    opt.name.toLowerCase().includes(q) ||
    (opt.brand ?? '').toLowerCase().includes(q) ||
    (opt.family ?? '').toLowerCase().includes(q)
  );
}

/**
 * Ensures every named ingredient row exists in the user's `ingredients` table.
 * - Rows already carrying an ingredientId are left as-is.
 * - Rows whose name matches an existing ingredient (case-insensitive) get linked.
 * - Remaining rows are created as type "other" (price/stock/format = 0).
 * Returns the same rows with ingredientId filled in wherever possible.
 */
export async function ensureIngredients(
  supabase: SupabaseClient,
  userId: string,
  rows: IngredientRef[]
): Promise<IngredientRef[]> {
  const named = rows.filter((r) => r.name.trim());
  if (named.length === 0) return rows;

  const { data: existing } = await supabase
    .from('ingredients')
    .select('id, data')
    .eq('user_id', userId);

  const byName = new Map<string, string>();
  for (const e of existing ?? []) {
    const n = ((e.data as { name?: string })?.name ?? '').toLowerCase();
    if (n) byName.set(n, e.id as string);
  }

  // Figure out which named rows still need an ingredient row created
  const toCreate = new Map<string, IngredientRef>();
  for (const r of named) {
    if (r.ingredientId) continue;
    const key = r.name.toLowerCase();
    if (byName.has(key)) continue;
    if (!toCreate.has(key)) toCreate.set(key, r);
  }

  if (toCreate.size > 0) {
    const { data: created } = await supabase
      .from('ingredients')
      .insert(
        [...toCreate.values()].map((r) => ({
          user_id: userId,
          data: {
            name: r.name.trim(),
            type: 'other',
            unit: r.unit || 'cl',
            price: 0,
            stock: 0,
            format: 0,
            homemade: false,
          },
          updated_at: new Date().toISOString(),
        }))
      )
      .select('id, data');

    for (const c of created ?? []) {
      const n = ((c.data as { name?: string })?.name ?? '').toLowerCase();
      if (n) byName.set(n, c.id as string);
    }
  }

  return named.map((r) => ({
    ...r,
    ingredientId: r.ingredientId ?? byName.get(r.name.toLowerCase()),
  }));
}
