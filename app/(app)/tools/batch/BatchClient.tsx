'use client';
import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, ChevronDown, Minus, Plus, FlaskConical, Package, CheckCircle2, Loader2 } from 'lucide-react';

interface IngredientStock {
  id: string;
  name: string;
  unit: string;
  price?: number;
  format?: number;
  stock?: number;
  homemade?: boolean;
}

interface RecipeIngredient {
  ingredientId?: string;
  qty: number;
  name: string;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  type: string;
  ingredients: RecipeIngredient[];
  glass?: string;
  method?: string;
}

interface Props {
  recipes: Recipe[];
  stockMap: Record<string, IngredientStock>;
  userId: string;
}

function scaledDisplay(qty: number, unit: string): string {
  if ((unit === 'ml' || unit === 'cl') && qty >= 1000) {
    const l = unit === 'cl' ? qty / 100 : qty / 1000;
    return `${l % 1 === 0 ? l : l.toFixed(2)} L`;
  }
  if (unit === 'g' && qty >= 1000) {
    const kg = qty / 1000;
    return `${kg % 1 === 0 ? kg : kg.toFixed(2)} kg`;
  }
  const rounded = Math.round(qty * 100) / 100;
  return `${rounded} ${unit}`;
}

export default function BatchClient({ recipes, stockMap, userId }: Props) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [portions, setPortions] = useState(10);
  const [producing, setProducing] = useState(false);
  const [produced, setProduced] = useState(false);
  const [error, setError] = useState('');

  const filteredRecipes = useMemo(() => {
    if (!search.trim()) return recipes;
    const q = search.toLowerCase();
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, search]);

  function pickRecipe(r: Recipe) {
    setSelected(r);
    setOpen(false);
    setSearch('');
    setProduced(false);
    setError('');
  }

  const scaledIngredients = useMemo(() => {
    if (!selected) return [];
    return selected.ingredients.map((ing) => {
      const stock = ing.ingredientId ? stockMap[ing.ingredientId] : null;
      const scaledQty = ing.qty * portions;
      const costPerUnit = stock?.price && stock?.format && stock.format > 0
        ? stock.price / stock.format
        : null;
      const totalCost = costPerUnit ? scaledQty * costPerUnit : null;
      const availableStock = stock?.stock ?? null;
      const stockUnit = stock?.unit ?? ing.unit;
      const sufficient = availableStock === null ? null : availableStock >= scaledQty;

      return {
        ...ing,
        scaledQty,
        costPerUnit,
        totalCost,
        availableStock,
        stockUnit,
        sufficient,
        stockInfo: stock,
      };
    });
  }, [selected, portions, stockMap]);

  const totalCost = useMemo(
    () => scaledIngredients.reduce((s, i) => s + (i.totalCost ?? 0), 0),
    [scaledIngredients]
  );

  const hasCost = scaledIngredients.some((i) => i.totalCost !== null);
  const allSufficient = scaledIngredients.every((i) => i.sufficient !== false);

  async function handleProduce() {
    if (!selected) return;
    setProducing(true);
    setError('');
    const supabase = createClient();

    const updates = scaledIngredients
      .filter((i) => i.ingredientId && i.stockInfo?.stock !== undefined)
      .map((i) => ({
        id: i.ingredientId!,
        newStock: Math.max(0, (i.stockInfo!.stock ?? 0) - i.scaledQty),
        data: { ...i.stockInfo, stock: Math.max(0, (i.stockInfo!.stock ?? 0) - i.scaledQty) },
      }));

    const results = await Promise.all(
      updates.map(({ id, data }) =>
        supabase
          .from('ingredients')
          .update({ data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId)
      )
    );

    const failed = results.find((r) => r.error);
    if (failed) {
      setError('Erreur lors de la mise à jour du stock.');
    } else {
      setProduced(true);
    }
    setProducing(false);
  }

  return (
    <div className="space-y-5 max-w-xl mx-auto">

      {/* Recipe picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Recette</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="field-input w-full flex items-center justify-between gap-2 text-left"
          >
            <span className={selected ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}>
              {selected ? selected.name : 'Choisir une recette…'}
            </span>
            <ChevronDown size={15} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute top-full mt-1 left-0 right-0 z-50 card p-1 shadow-xl">
              <div className="relative mb-1 px-1 pt-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="field-input pl-8 py-1.5 text-sm w-full"
                />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {filteredRecipes.length === 0 ? (
                  <p className="text-xs text-[var(--text-dim)] text-center py-3">Aucune recette</p>
                ) : (
                  filteredRecipes.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); pickRecipe(r); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--surface2)] rounded-md transition-colors"
                    >
                      <span className="flex-1 text-[var(--text)] truncate">{r.name}</span>
                      <span className="text-xs text-[var(--text-dim)] shrink-0">{r.ingredients.length} ing.</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portions */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Nombre de portions</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPortions((p) => Math.max(1, p - 1))}
            className="w-10 h-10 rounded-lg bg-[var(--surface2)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--border)] transition-colors"
          >
            <Minus size={16} />
          </button>
          <input
            type="number"
            min="1"
            max="9999"
            value={portions}
            onChange={(e) => setPortions(Math.max(1, parseInt(e.target.value) || 1))}
            className="field-input w-24 text-center font-semibold text-lg"
          />
          <button
            type="button"
            onClick={() => setPortions((p) => p + 1)}
            className="w-10 h-10 rounded-lg bg-[var(--surface2)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--border)] transition-colors"
          >
            <Plus size={16} />
          </button>
          <div className="flex gap-2 ml-1">
            {[10, 20, 50].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPortions(n)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
                  portions === n
                    ? 'bg-[var(--gold)] text-[#0A0E1A] border-[var(--gold)]'
                    : 'text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--gold-dim)]'
                }`}
              >
                ×{n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scaled ingredients */}
      {selected && (
        <>
          <div className="card space-y-1 divide-y divide-[var(--border)]">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-sm font-semibold text-[var(--text)]">Ingrédients × {portions}</h3>
              {hasCost && (
                <span className="text-xs text-[var(--text-dim)]">
                  Total : <span className="text-[var(--gold)] font-semibold">{totalCost.toFixed(2)} €</span>
                  {portions > 1 && (
                    <span className="ml-1">({(totalCost / portions).toFixed(2)} €/portion)</span>
                  )}
                </span>
              )}
            </div>

            {scaledIngredients.map((ing, i) => {
              const isHomemade = ing.stockInfo?.homemade;
              return (
                <div key={i} className="flex items-center gap-2 py-2.5">
                  <div className="shrink-0">
                    {isHomemade
                      ? <FlaskConical size={14} className="text-blue-400" />
                      : <Package size={14} className="text-[var(--gold)]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text)] truncate">{ing.name}</p>
                    {ing.availableStock !== null && (
                      <p className={`text-xs mt-0.5 ${ing.sufficient ? 'text-emerald-400' : 'text-red-400'}`}>
                        Stock : {ing.availableStock} {ing.stockUnit}
                        {!ing.sufficient && ' — insuffisant'}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-semibold text-[var(--text)]">
                      {scaledDisplay(ing.scaledQty, ing.unit)}
                    </p>
                    {ing.totalCost !== null && (
                      <p className="text-xs text-[var(--text-dim)]">{ing.totalCost.toFixed(2)} €</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {produced ? (
            <div className="flex items-center gap-2 justify-center py-3 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 size={18} />
              Stock mis à jour — batch enregistré
            </div>
          ) : (
            <div className="space-y-2">
              {!allSufficient && (
                <p className="text-xs text-orange-400 bg-orange-400/10 rounded-lg px-3 py-2">
                  Certains ingrédients sont en stock insuffisant. Le stock sera ramené à 0.
                </p>
              )}
              {error && <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
              <button
                type="button"
                onClick={handleProduce}
                disabled={producing}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {producing
                  ? <><Loader2 size={16} className="animate-spin" />Enregistrement…</>
                  : `Valider le batch — ${portions} portion${portions > 1 ? 's' : ''}`
                }
              </button>
            </div>
          )}
        </>
      )}

      {!selected && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Package size={36} className="text-[var(--text-dim)] opacity-30" />
          <p className="text-sm text-[var(--text-dim)]">Sélectionnez une recette pour calculer votre batch</p>
        </div>
      )}
    </div>
  );
}
