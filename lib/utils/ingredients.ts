import type { createClient } from '@/lib/supabase/client';

type SupabaseClient = ReturnType<typeof createClient>;

export interface IngredientRef {
  ingredientId?: string;
  name: string;
  unit: string;
  qty?: number;
  alternatives?: Array<{ ingredientId?: string; name: string }>;
}

/** Autocomplete option shown when linking an ingredient in a recipe/composition. */
export interface UserIngredientOption {
  id: string;
  name: string;
  unit: string;
  type?: string;
  homemade?: boolean;
  brand?: string;
  family?: string;
  isPreparation?: boolean;  // conteneur multi-sortie, exclu du picker
  isOutput?: boolean;       // sortie d'une prépa multi-sortie
  sourcePreparationId?: string; // lien vers la prépa source (si isOutput)
}

/** Build an autocomplete option from a raw ingredients row. */
export function toIngredientOption(row: { id: string; data: unknown }): UserIngredientOption {
  const d = (row.data ?? {}) as {
    name?: string;
    unit?: string;
    type?: string;
    homemade?: boolean;
    brand?: string;
    family?: string;
    isPreparation?: boolean;
    isOutput?: boolean;
    sourcePreparationId?: string;
  };
  return {
    id: row.id,
    name: d.name ?? '',
    unit: d.unit ?? 'cl',
    type: d.type,
    homemade: d.homemade ?? false,
    brand: d.brand ?? '',
    family: d.family ?? '',
    isPreparation: d.isPreparation ?? false,
    isOutput: d.isOutput ?? false,
    sourcePreparationId: d.sourcePreparationId,
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
 * Extract ordered alternatives from "A or B", "A (or B)", "A or B or C" names.
 * Returns [name] unchanged for ingredients without alternatives.
 */
function parseAlternatives(name: string): string[] {
  const cleaned = name.replace(/\(\s*or\s+/i, ' or ').replace(/[()]/g, '');
  const parts = cleaned.split(/\s+or\s+/i).map(s => s.replace(/\*/g, '').trim()).filter(Boolean);
  return parts.length > 1 ? parts : [name];
}

/**
 * Ensures every named ingredient row exists in the user's `ingredients` table.
 * - Rows already carrying an ingredientId are left as-is.
 * - Rows whose name matches an existing ingredient (case-insensitive) get linked.
 * - Rows with "A or B" alternatives try each option in order against the user's
 *   stock; the first match wins. If none match, the first alternative is created.
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

  // Figure out which rows need a new ingredient created
  const toCreate = new Map<string, IngredientRef>();
  for (const r of named) {
    // Primary ingredient
    if (!r.ingredientId) {
      const alts = parseAlternatives(r.name);
      const matched = alts.some(a => byName.has(a.toLowerCase()));
      if (!matched) {
        const primaryName = alts[0];
        const key = primaryName.toLowerCase();
        if (!toCreate.has(key)) toCreate.set(key, { ...r, name: primaryName });
      }
    }
    // Explicit alternatives
    for (const alt of r.alternatives ?? []) {
      if (!alt.ingredientId && alt.name.trim()) {
        const key = alt.name.toLowerCase();
        if (!byName.has(key) && !toCreate.has(key))
          toCreate.set(key, { name: alt.name, unit: r.unit, qty: r.qty });
      }
    }
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

  return named.map((r) => {
    let result = r;

    if (!r.ingredientId) {
      const alts = parseAlternatives(r.name);
      for (const alt of alts) {
        const id = byName.get(alt.toLowerCase());
        if (id) { result = { ...r, ingredientId: id }; break; }
      }
      if (!result.ingredientId) {
        const primaryName = parseAlternatives(r.name)[0];
        result = { ...r, ingredientId: byName.get(primaryName.toLowerCase()) };
      }
    }

    // Link explicit alternatives
    if (result.alternatives?.length) {
      const linkedAlts = result.alternatives.map(alt => {
        if (alt.ingredientId) return alt;
        const id = byName.get(alt.name.toLowerCase());
        return id ? { ...alt, ingredientId: id } : alt;
      });
      result = { ...result, alternatives: linkedAlts };
    }

    return result;
  });
}
