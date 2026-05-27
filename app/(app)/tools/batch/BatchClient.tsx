'use client';
import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Search, ChevronDown, Minus, Plus, FlaskConical, Package,
  CheckCircle2, Loader2, X, List, BookOpen,
} from 'lucide-react';

type BatchQtyUnit = 'portions' | 'cl' | 'L' | 'btl70' | 'btl100';

interface IngredientStock {
  id: string;
  name: string;
  type?: string;
  unit: string;
  price?: number;
  format?: number;
  stock?: number;
  homemade?: boolean;
  composition?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
  yield?: number;
  yieldUnit?: string;
  steps?: string;
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
}

interface BatchItem {
  key: string;
  recipe: Recipe;
  qty: number;
  qtyUnit: BatchQtyUnit;
}

interface ConsolidatedLine {
  key: string;
  name: string;
  unit: string;
  totalQty: number;
  sources: string[];
  ingredientId?: string;
  stockInfo?: IngredientStock;
}

interface Props {
  recipes: Recipe[];
  stockMap: Record<string, IngredientStock>;
  userId: string;
}

const CATEGORY_GROUPS: Record<string, { label: string; bar: string; text: string }> = {
  spirit:   { label: 'Alcool',   bar: 'bg-purple-400',  text: 'text-purple-400' },
  liqueur:  { label: 'Liqueur',  bar: 'bg-violet-400',  text: 'text-violet-400' },
  wine:     { label: 'Vin',      bar: 'bg-rose-400',    text: 'text-rose-400' },
  syrup:    { label: 'Sirop',    bar: 'bg-pink-400',    text: 'text-pink-400' },
  juice:    { label: 'Jus',      bar: 'bg-orange-400',  text: 'text-orange-400' },
  fresh:    { label: 'Frais',    bar: 'bg-emerald-400', text: 'text-emerald-400' },
  dry:      { label: 'Sec',      bar: 'bg-yellow-400',  text: 'text-yellow-400' },
  homemade: { label: 'Maison',   bar: 'bg-blue-400',    text: 'text-blue-400' },
  other:    { label: 'Autre',    bar: 'bg-[var(--border)]', text: 'text-[var(--text-dim)]' },
};
const CATEGORY_ORDER = ['spirit', 'liqueur', 'wine', 'syrup', 'juice', 'fresh', 'dry', 'homemade', 'other'];

function toBase(qty: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === 'cl') return qty;
  if (u === 'ml') return qty / 10;
  if (u === 'l') return qty * 100;
  if (u === 'kg') return qty * 1000;
  return qty;
}

function recipeLiquidVol(recipe: Recipe): number {
  return recipe.ingredients.reduce((sum, ing) => sum + toBase(ing.qty, ing.unit), 0);
}

function effectivePortions(qty: number, unit: BatchQtyUnit, recipe: Recipe): number {
  if (unit === 'portions') return qty;
  const vol = recipeLiquidVol(recipe);
  if (vol <= 0) return qty;
  const target =
    unit === 'cl' ? qty :
    unit === 'L' ? qty * 100 :
    unit === 'btl70' ? qty * 70 : qty * 100;
  return target / vol;
}

function scaledDisplay(qty: number, unit: string): string {
  if (unit === 'ml' && qty >= 1000) { const l = qty / 1000; return `${l % 1 === 0 ? l : l.toFixed(2)} L`; }
  if (unit === 'cl' && qty >= 100) { const l = qty / 100; return `${l % 1 === 0 ? l : l.toFixed(2)} L`; }
  if (unit === 'g' && qty >= 1000) { const kg = qty / 1000; return `${kg % 1 === 0 ? kg : kg.toFixed(2)} kg`; }
  return `${Math.round(qty * 100) / 100} ${unit}`;
}

function stockStatus(line: ConsolidatedLine): 'ok' | 'low' | 'insufficient' | 'unknown' {
  if (!line.ingredientId || line.stockInfo?.stock === undefined) return 'unknown';
  const avail = line.stockInfo.stock;
  if (avail >= line.totalQty) return 'ok';
  if (avail >= line.totalQty * 0.8) return 'low';
  return 'insufficient';
}

function groupByCategory(ings: RecipeIngredient[], stockMap: Record<string, IngredientStock>): Record<string, RecipeIngredient[]> {
  const groups: Record<string, RecipeIngredient[]> = {};
  for (const ing of ings) {
    const info = ing.ingredientId ? stockMap[ing.ingredientId] : undefined;
    const cat = info?.homemade ? 'homemade' : (info?.type?.toLowerCase() ?? 'other');
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(ing);
  }
  return groups;
}

let itemCounter = 0;

export default function BatchClient({ recipes, stockMap, userId }: Props) {
  const [batchName, setBatchName] = useState('');
  const [items, setItems] = useState<BatchItem[]>([]);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [addQty, setAddQty] = useState(1);
  const [addUnit, setAddUnit] = useState<BatchQtyUnit>('portions');
  const [view, setView] = useState<'recipes' | 'total'>('recipes');
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [expandedIng, setExpandedIng] = useState<Set<string>>(new Set());
  const [producing, setProducing] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const filteredRecipes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return recipes;
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, search]);

  function addItem(recipe: Recipe) {
    itemCounter++;
    setItems((prev) => [...prev, { key: `item-${itemCounter}`, recipe, qty: addQty, qtyUnit: addUnit }]);
    setSearch('');
    setSearchOpen(false);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function updateItemQty(key: string, delta: number | null, value?: number) {
    setItems((prev) => prev.map((i) => i.key !== key ? i : {
      ...i, qty: delta !== null ? Math.max(1, i.qty + delta) : Math.max(1, value ?? 1),
    }));
  }

  function setItemUnit(key: string, unit: BatchQtyUnit) {
    setItems((prev) => prev.map((i) => i.key === key ? { ...i, qtyUnit: unit } : i));
  }

  const consolidatedLines = useMemo((): ConsolidatedLine[] => {
    const map = new Map<string, ConsolidatedLine>();
    for (const item of items) {
      const portions = effectivePortions(item.qty, item.qtyUnit, item.recipe);
      for (const ing of item.recipe.ingredients) {
        const info = ing.ingredientId ? stockMap[ing.ingredientId] : undefined;
        const keyId = ing.ingredientId ? `id:${ing.ingredientId}` : `name:${ing.name.toLowerCase().trim()}`;
        const existing = map.get(keyId);
        if (existing) {
          existing.totalQty += ing.qty * portions;
          if (!existing.sources.includes(item.recipe.name)) existing.sources.push(item.recipe.name);
        } else {
          map.set(keyId, {
            key: keyId,
            name: info?.name ?? ing.name,
            unit: ing.unit,
            totalQty: ing.qty * portions,
            sources: [item.recipe.name],
            ingredientId: ing.ingredientId,
            stockInfo: info,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [items, stockMap]);

  function toggleChecked(key: string) {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleExpanded(key: string) {
    setExpandedIng((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  async function handleProduce() {
    setProducing(true);
    setError('');
    const supabase = createClient();
    const results = await Promise.all(
      consolidatedLines
        .filter((l) => l.ingredientId && l.stockInfo?.stock !== undefined)
        .map((l) => supabase
          .from('ingredients')
          .update({
            data: { ...l.stockInfo, stock: Math.max(0, (l.stockInfo!.stock ?? 0) - l.totalQty) },
            updated_at: new Date().toISOString(),
          })
          .eq('id', l.ingredientId!)
          .eq('user_id', userId)
        )
    );
    if (results.find((r) => r.error)) {
      setError('Erreur lors de la mise à jour du stock.');
    } else {
      setDone(true);
    }
    setProducing(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <CheckCircle2 size={48} className="text-emerald-400" />
        <p className="text-lg font-semibold text-[var(--text)]">Production validée</p>
        <p className="text-sm text-[var(--text-dim)]">Le stock a été mis à jour.</p>
        <button
          type="button"
          onClick={() => { setItems([]); setCheckedKeys(new Set()); setBatchName(''); setDone(false); setError(''); }}
          className="btn-primary mt-2"
        >
          Nouveau batch
        </button>
      </div>
    );
  }

  const allChecked = consolidatedLines.length > 0 && checkedKeys.size === consolidatedLines.length;

  return (
    <div className="space-y-4 max-w-xl mx-auto">

      {/* Batch name */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Nom du batch
        </label>
        <input
          type="text"
          placeholder="ex. Soirée vendredi…"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          className="field-input font-medium"
        />
      </div>

      {/* Add recipe row */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Ajouter une recette
        </label>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            className="field-input pl-8 text-sm w-full"
          />
          {searchOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 z-50 card p-1 shadow-xl max-h-56 overflow-y-auto">
              {filteredRecipes.length === 0 ? (
                <p className="text-xs text-[var(--text-dim)] text-center py-3">Aucun résultat</p>
              ) : filteredRecipes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); addItem(r); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--surface2)] rounded-md transition-colors"
                >
                  <span className="flex-1 text-[var(--text)] truncate">{r.name}</span>
                  <span className={`shrink-0 text-xs rounded-full px-2 py-0.5 border ${
                    r.type === 'homemade'
                      ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
                      : 'text-[var(--gold)] border-[var(--gold)]/30 bg-[var(--gold)]/10'
                  }`}>
                    {r.type === 'homemade' ? 'Maison' : 'Recette'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <input
            type="number"
            min="1"
            value={addQty}
            onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="field-input w-14 text-center"
          />
          <select
            value={addUnit}
            onChange={(e) => setAddUnit(e.target.value as BatchQtyUnit)}
            className="field-input text-sm"
          >
            <option value="portions">por.</option>
            <option value="cl">cl</option>
            <option value="L">L</option>
            <option value="btl70">btl 70cl</option>
            <option value="btl100">btl 100cl</option>
          </select>
        </div>
      </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Package size={36} className="text-[var(--text-dim)] opacity-30" />
          <p className="text-sm text-[var(--text-dim)]">Recherchez et ajoutez des recettes pour calculer votre batch</p>
        </div>
      ) : (
        <>
          {/* View tabs */}
          <div className="flex rounded-lg bg-[var(--surface2)] p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setView('recipes')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'recipes' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-dim)]'
              }`}
            >
              <BookOpen size={14} />
              Recettes
            </button>
            <button
              type="button"
              onClick={() => setView('total')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'total' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-dim)]'
              }`}
            >
              <List size={14} />
              Liste totale
              <span className="text-xs bg-[var(--gold)]/20 text-[var(--gold)] rounded-full px-1.5 py-px leading-none">
                {consolidatedLines.length}
              </span>
            </button>
          </div>

          {/* ── RECETTES VIEW ── */}
          {view === 'recipes' && (
            <div className="space-y-4">
              {items.map((item) => {
                const portions = effectivePortions(item.qty, item.qtyUnit, item.recipe);
                const groups = groupByCategory(item.recipe.ingredients, stockMap);
                const sortedCats = CATEGORY_ORDER.filter((cat) => groups[cat]);

                return (
                  <div key={item.key} className="card p-0 overflow-hidden">
                    {/* Recipe header */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
                      <p className="flex-1 text-sm font-semibold text-[var(--text)] truncate min-w-0">
                        {item.recipe.name}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.key, -1)}
                          className="w-7 h-7 rounded-md bg-[var(--surface2)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number" min="1" max="9999"
                          value={item.qty}
                          onChange={(e) => updateItemQty(item.key, null, parseInt(e.target.value) || 1)}
                          className="field-input w-12 text-center py-1 px-1 text-sm font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.key, 1)}
                          className="w-7 h-7 rounded-md bg-[var(--surface2)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                        <select
                          value={item.qtyUnit}
                          onChange={(e) => setItemUnit(item.key, e.target.value as BatchQtyUnit)}
                          className="field-input text-xs py-1 pr-6 pl-2"
                        >
                          <option value="portions">por.</option>
                          <option value="cl">cl</option>
                          <option value="L">L</option>
                          <option value="btl70">btl 70</option>
                          <option value="btl100">btl 100</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="p-1.5 text-[var(--text-dim)] hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Ingredient groups */}
                    <div className="px-4 py-3 space-y-4">
                      {sortedCats.length === 0 ? (
                        <p className="text-xs text-[var(--text-dim)] text-center py-2">Aucun ingrédient</p>
                      ) : sortedCats.map((catKey) => {
                        const cat = CATEGORY_GROUPS[catKey] ?? CATEGORY_GROUPS.other;
                        return (
                          <div key={catKey} className="flex gap-3">
                            <div className={`w-0.5 rounded-full ${cat.bar} shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${cat.text}`}>
                                {cat.label}
                              </p>
                              <div className="space-y-2">
                                {groups[catKey].map((ing) => {
                                  const info = ing.ingredientId ? stockMap[ing.ingredientId] : undefined;
                                  const scaledQty = ing.qty * portions;
                                  const ingKey = `${item.key}:${ing.ingredientId ?? ing.name}`;
                                  const isHomemade = info?.homemade;
                                  const hasDetails = isHomemade && ((info?.composition?.length ?? 0) > 0 || !!info?.steps);
                                  const expanded = expandedIng.has(ingKey);
                                  const yieldBase = toBase(info?.yield ?? 1, info?.yieldUnit ?? ing.unit);
                                  const neededBase = toBase(scaledQty, ing.unit);
                                  const compScale = yieldBase > 0 ? neededBase / yieldBase : 0;

                                  return (
                                    <div key={ingKey}>
                                      <div className="flex items-center gap-2 py-0.5">
                                        {hasDetails ? (
                                          <button
                                            type="button"
                                            onClick={() => toggleExpanded(ingKey)}
                                            className="shrink-0 p-0.5 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
                                          >
                                            <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                          </button>
                                        ) : (
                                          <div className="w-5 shrink-0" />
                                        )}
                                        {isHomemade && <FlaskConical size={12} className="text-blue-400 shrink-0" />}
                                        <span className="flex-1 text-sm text-[var(--text)] truncate min-w-0">
                                          {info?.name ?? ing.name}
                                        </span>
                                        <span className="text-sm font-mono text-[var(--text)] shrink-0">
                                          {scaledDisplay(scaledQty, ing.unit)}
                                        </span>
                                      </div>

                                      {expanded && (
                                        <div className="ml-7 mt-1 mb-2 pl-3 border-l border-[var(--border)] space-y-1.5">
                                          {info?.composition?.map((comp, ci) => (
                                            <div key={ci} className="flex items-center justify-between gap-2">
                                              <span className="text-xs text-[var(--text-dim)] truncate">{comp.name}</span>
                                              <span className="text-xs font-mono text-[var(--text-dim)] shrink-0">
                                                {scaledDisplay(comp.qty * compScale, comp.unit)}
                                              </span>
                                            </div>
                                          ))}
                                          {info?.steps && (
                                            <p className="text-xs text-[var(--text-dim)] italic leading-relaxed pt-0.5">
                                              → {info.steps}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── LISTE TOTALE VIEW ── */}
          {view === 'total' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-dim)]">{consolidatedLines.length} ingrédient{consolidatedLines.length > 1 ? 's' : ''}</p>
                <button
                  type="button"
                  onClick={() => allChecked
                    ? setCheckedKeys(new Set())
                    : setCheckedKeys(new Set(consolidatedLines.map((l) => l.key)))
                  }
                  className="btn-ghost py-1 px-3 text-xs"
                >
                  {allChecked ? 'Tout décocher' : 'Tout cocher'}
                </button>
              </div>

              <div className="card divide-y divide-[var(--border)] p-0 overflow-hidden">
                {consolidatedLines.map((line) => {
                  const checked = checkedKeys.has(line.key);
                  const status = stockStatus(line);
                  return (
                    <button
                      key={line.key}
                      type="button"
                      onClick={() => toggleChecked(line.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-opacity hover:bg-[var(--surface2)] ${checked ? 'opacity-40' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChecked(line.key)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 accent-[var(--gold)] w-4 h-4"
                      />
                      {line.stockInfo?.homemade
                        ? <FlaskConical size={13} className="text-blue-400 shrink-0" />
                        : <Package size={13} className="text-[var(--gold)] shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm text-[var(--text)] ${checked ? 'line-through' : ''}`}>{line.name}</p>
                        {line.stockInfo?.stock !== undefined && (
                          <p className={`text-xs mt-0.5 ${
                            status === 'ok' ? 'text-emerald-400' :
                            status === 'low' ? 'text-orange-400' :
                            status === 'insufficient' ? 'text-red-400' :
                            'text-[var(--text-dim)]'
                          }`}>
                            Stock : {line.stockInfo.stock} {line.stockInfo.unit}
                            {status === 'insufficient' && ' — insuffisant'}
                            {status === 'low' && ' — juste'}
                          </p>
                        )}
                        <p className="text-xs text-[var(--text-dim)]/60 truncate">{line.sources.join(', ')}</p>
                      </div>
                      <span className="text-sm font-mono font-semibold text-[var(--text)] shrink-0">
                        {scaledDisplay(line.totalQty, line.unit)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
        </>
      )}
    </div>
  );
}
