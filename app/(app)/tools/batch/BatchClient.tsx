'use client';
import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Search, ChevronDown, Minus, Plus, FlaskConical, Package,
  CheckCircle2, Loader2, X, ChevronRight,
} from 'lucide-react';

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

interface BatchItem {
  key: string; // unique per added item
  recipe: Recipe;
  portions: number;
}

interface ConsolidatedLine {
  key: string;
  name: string;
  unit: string;
  totalQty: number;
  sources: string[]; // recipe names
  ingredientId?: string;
  stockInfo?: IngredientStock;
  checked: boolean;
}

interface Props {
  recipes: Recipe[];
  stockMap: Record<string, IngredientStock>;
  userId: string;
}

function scaledDisplay(qty: number, unit: string): string {
  if (unit === 'ml' && qty >= 1000) {
    const l = qty / 1000;
    return `${l % 1 === 0 ? l : l.toFixed(2)} L`;
  }
  if (unit === 'cl' && qty >= 100) {
    const l = qty / 100;
    return `${l % 1 === 0 ? l : l.toFixed(2)} L`;
  }
  if (unit === 'g' && qty >= 1000) {
    const kg = qty / 1000;
    return `${kg % 1 === 0 ? kg : kg.toFixed(2)} kg`;
  }
  const rounded = Math.round(qty * 100) / 100;
  return `${rounded} ${unit}`;
}

function stockStatus(line: ConsolidatedLine): 'ok' | 'low' | 'insufficient' | 'unknown' {
  if (!line.ingredientId || line.stockInfo?.stock === undefined) return 'unknown';
  const available = line.stockInfo.stock;
  if (available >= line.totalQty) return 'ok';
  if (available >= line.totalQty * 0.8) return 'low';
  return 'insufficient';
}

let itemCounter = 0;

export default function BatchClient({ recipes, stockMap, userId }: Props) {
  // Phase 1 — Selection
  const [items, setItems] = useState<BatchItem[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  // Phase 2 — Consolidated
  const [phase, setPhase] = useState<'select' | 'consolidated' | 'done'>('select');
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());

  // Phase 3 — Validation
  const [producing, setProducing] = useState(false);
  const [error, setError] = useState('');

  const filteredRecipes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return recipes;
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, search]);

  function addItem(recipe: Recipe) {
    itemCounter++;
    setItems((prev) => [...prev, { key: `item-${itemCounter}`, recipe, portions: 1 }]);
    setOpen(false);
    setSearch('');
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function updatePortions(key: string, delta: number | null, value?: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key
          ? { ...i, portions: delta !== null ? Math.max(1, i.portions + delta) : Math.max(1, value ?? 1) }
          : i
      )
    );
  }

  const consolidatedLines = useMemo((): ConsolidatedLine[] => {
    // Aggregate all ingredients across all items
    const map = new Map<string, ConsolidatedLine>();

    for (const item of items) {
      for (const ing of item.recipe.ingredients) {
        const keyId = ing.ingredientId
          ? `id:${ing.ingredientId}`
          : `name:${ing.name.toLowerCase().trim()}`;

        const existing = map.get(keyId);
        if (existing) {
          existing.totalQty += ing.qty * item.portions;
          if (!existing.sources.includes(item.recipe.name)) {
            existing.sources.push(item.recipe.name);
          }
        } else {
          const stockInfo = ing.ingredientId ? stockMap[ing.ingredientId] : undefined;
          map.set(keyId, {
            key: keyId,
            name: stockInfo?.name ?? ing.name,
            unit: ing.unit,
            totalQty: ing.qty * item.portions,
            sources: [item.recipe.name],
            ingredientId: ing.ingredientId,
            stockInfo,
            checked: false,
          });
        }
      }
    }

    return Array.from(map.values());
  }, [items, stockMap]);

  function toggleCheck(key: string) {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function checkAll() {
    setCheckedKeys(new Set(consolidatedLines.map((l) => l.key)));
  }

  function uncheckAll() {
    setCheckedKeys(new Set());
  }

  async function handleProduce() {
    setProducing(true);
    setError('');
    const supabase = createClient();

    const updates = consolidatedLines
      .filter((l) => l.ingredientId && l.stockInfo?.stock !== undefined)
      .map((l) => ({
        id: l.ingredientId!,
        newStock: Math.max(0, (l.stockInfo!.stock ?? 0) - l.totalQty),
        data: { ...l.stockInfo, stock: Math.max(0, (l.stockInfo!.stock ?? 0) - l.totalQty) },
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
      setPhase('done');
    }
    setProducing(false);
  }

  // ── PHASE DONE ────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <CheckCircle2 size={48} className="text-emerald-400" />
        <p className="text-lg font-semibold text-[var(--text)]">Production validée</p>
        <p className="text-sm text-[var(--text-dim)]">Le stock a été mis à jour.</p>
        <button
          type="button"
          onClick={() => { setItems([]); setCheckedKeys(new Set()); setPhase('select'); setError(''); }}
          className="btn-primary mt-2"
        >
          Nouveau batch
        </button>
      </div>
    );
  }

  // ── PHASE CONSOLIDATED ────────────────────────────────────────────────────
  if (phase === 'consolidated') {
    const allChecked = consolidatedLines.length > 0 && checkedKeys.size === consolidatedLines.length;

    return (
      <div className="space-y-4 max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPhase('select')}
            className="flex items-center gap-1.5 text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          >
            <ChevronDown size={14} className="rotate-90" />
            Retour
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={allChecked ? uncheckAll : checkAll}
              className="btn-ghost py-1.5 px-3 text-xs"
            >
              {allChecked ? 'Tout décocher' : 'Tout cocher'}
            </button>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item.key} className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text-dim)]">
              {item.recipe.name} × {item.portions}
            </span>
          ))}
        </div>

        {/* Consolidated lines */}
        <div className="card divide-y divide-[var(--border)] p-0 overflow-hidden">
          {consolidatedLines.length === 0 ? (
            <p className="text-sm text-[var(--text-dim)] text-center py-6">Aucun ingrédient</p>
          ) : (
            consolidatedLines.map((line) => {
              const checked = checkedKeys.has(line.key);
              const status = stockStatus(line);
              const isHomemade = line.stockInfo?.homemade;
              return (
                <div
                  key={line.key}
                  className={`flex items-start gap-3 px-4 py-3 transition-opacity ${checked ? 'opacity-40' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCheck(line.key)}
                    className="mt-1 shrink-0 accent-[var(--gold)] w-4 h-4"
                  />
                  <div className="shrink-0 mt-0.5">
                    {isHomemade
                      ? <FlaskConical size={14} className="text-blue-400" />
                      : <Package size={14} className="text-[var(--gold)]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm text-[var(--text)] ${checked ? 'line-through' : ''}`}>{line.name}</p>
                    <p className="text-xs text-[var(--text-dim)] truncate mt-0.5">{line.sources.join(', ')}</p>
                    {line.stockInfo?.stock !== undefined && (
                      <p className={`text-xs mt-0.5 ${
                        status === 'ok' ? 'text-emerald-400'
                          : status === 'low' ? 'text-orange-400'
                          : status === 'insufficient' ? 'text-red-400'
                          : 'text-[var(--text-dim)]'
                      }`}>
                        Stock : {line.stockInfo.stock} {line.stockInfo.unit}
                        {status === 'insufficient' && ' — insuffisant'}
                        {status === 'low' && ' — juste'}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-semibold text-[var(--text)]">
                      {scaledDisplay(line.totalQty, line.unit)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

        <button
          type="button"
          onClick={handleProduce}
          disabled={producing || consolidatedLines.length === 0}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {producing
            ? <><Loader2 size={16} className="animate-spin" />Enregistrement…</>
            : 'Valider la production'
          }
        </button>
      </div>
    );
  }

  // ── PHASE SELECT ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-xl mx-auto">

      {/* Picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Ajouter une recette / préparation
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="field-input w-full flex items-center justify-between gap-2 text-left"
          >
            <span className="text-[var(--text-dim)]">Choisir…</span>
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
                  <p className="text-xs text-[var(--text-dim)] text-center py-3">Aucun résultat</p>
                ) : (
                  filteredRecipes.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); addItem(r); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--surface2)] rounded-md transition-colors"
                    >
                      <span className="flex-1 text-[var(--text)] truncate">{r.name}</span>
                      <span className={`text-xs rounded-full px-2 py-0.5 border ${
                        r.type === 'homemade'
                          ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
                          : 'text-[var(--gold)] border-[var(--gold)]/30 bg-[var(--gold)]/10'
                      }`}>
                        {r.type === 'homemade' ? 'Maison' : 'Recette'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Added items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Package size={36} className="text-[var(--text-dim)] opacity-30" />
          <p className="text-sm text-[var(--text-dim)]">Ajoutez des recettes pour calculer votre batch</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.key} className="card flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text)] truncate">{item.recipe.name}</p>
                  <p className="text-xs text-[var(--text-dim)] mt-0.5">{item.recipe.ingredients.length} ingrédient{item.recipe.ingredients.length > 1 ? 's' : ''}</p>
                </div>
                {/* Portions stepper */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updatePortions(item.key, -1)}
                    className="w-7 h-7 rounded-md bg-[var(--surface2)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--border)] transition-colors"
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={item.portions}
                    onChange={(e) => updatePortions(item.key, null, parseInt(e.target.value) || 1)}
                    className="field-input w-14 text-center font-semibold py-1 px-1"
                  />
                  <button
                    type="button"
                    onClick={() => updatePortions(item.key, 1)}
                    className="w-7 h-7 rounded-md bg-[var(--surface2)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--border)] transition-colors"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="shrink-0 p-1.5 text-[var(--text-dim)] hover:text-red-400 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { setCheckedKeys(new Set()); setPhase('consolidated'); }}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            Calculer
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}
