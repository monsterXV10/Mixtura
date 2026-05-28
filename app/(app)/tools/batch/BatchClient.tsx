'use client';
import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Search, ChevronDown, Minus, Plus, FlaskConical, Package,
  CheckCircle2, Loader2, X, List, BookOpen,
} from 'lucide-react';

type BatchQtyUnit = 'portions' | 'cl' | 'L' | 'btl70' | 'btl100';

interface IngredientStock {
  id: string; name: string; type?: string; unit: string;
  price?: number; format?: number; stock?: number; homemade?: boolean;
  composition?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
  yield?: number; yieldUnit?: string; steps?: string;
}

interface RecipeIngredient {
  ingredientId?: string; qty: number; name: string; unit: string;
  type?: string; homemade?: boolean;
}

interface Recipe {
  id: string; name: string; type: string; ingredients: RecipeIngredient[];
}

interface BatchItem {
  key: string; recipe: Recipe; qty: number; qtyUnit: BatchQtyUnit;
}

interface ConsolidatedLine {
  key: string; name: string; unit: string; totalQty: number;
  sources: string[]; ingredientId?: string; stockInfo?: IngredientStock;
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

const QTY_UNIT_OPTIONS: { value: BatchQtyUnit; label: string }[] = [
  { value: 'portions', label: 'portions' },
  { value: 'cl',       label: 'cl' },
  { value: 'L',        label: 'L' },
  { value: 'btl70',    label: 'btl 70cl' },
  { value: 'btl100',   label: 'btl 100cl' },
];

function toBase(qty: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === 'cl') return qty;
  if (u === 'ml') return qty / 10;
  if (u === 'l') return qty * 100;
  if (u === 'kg') return qty * 1000;
  return qty;
}

function effectivePortions(qty: number, unit: BatchQtyUnit, recipe: Recipe): number {
  if (unit === 'portions') return qty;
  const vol = recipe.ingredients.reduce((s, i) => s + toBase(i.qty, i.unit), 0);
  if (vol <= 0) return qty;
  const target = unit === 'cl' ? qty : unit === 'L' ? qty * 100 : unit === 'btl70' ? qty * 70 : qty * 100;
  return target / vol;
}

function fmt(qty: number, unit: string): string {
  if (unit === 'ml' && qty >= 1000) { const l = qty / 1000; return `${l % 1 === 0 ? l : l.toFixed(1)} L`; }
  if (unit === 'cl' && qty >= 100)  { const l = qty / 100;  return `${l % 1 === 0 ? l : l.toFixed(1)} L`; }
  if (unit === 'g'  && qty >= 1000) { const k = qty / 1000; return `${k % 1 === 0 ? k : k.toFixed(1)} kg`; }
  return `${Math.round(qty * 100) / 100} ${unit}`;
}

function stockStatus(line: ConsolidatedLine): 'ok' | 'low' | 'insufficient' | 'unknown' {
  if (!line.ingredientId || line.stockInfo?.stock === undefined) return 'unknown';
  const a = line.stockInfo.stock;
  if (a >= line.totalQty) return 'ok';
  if (a >= line.totalQty * 0.8) return 'low';
  return 'insufficient';
}

function groupByCategory(ings: RecipeIngredient[], stockMap: Record<string, IngredientStock>) {
  const byName: Record<string, IngredientStock> = {};
  for (const s of Object.values(stockMap)) {
    if (s.name) byName[s.name.toLowerCase()] = s;
  }
  const g: Record<string, RecipeIngredient[]> = {};
  for (const ing of ings) {
    const info = ing.ingredientId
      ? stockMap[ing.ingredientId]
      : byName[ing.name.toLowerCase()];
    const isHomemade = info?.homemade ?? ing.homemade ?? false;
    const rawType = info?.type ?? ing.type;
    const cat = isHomemade ? 'homemade' : (rawType?.toLowerCase() ?? 'other');
    (g[cat] ??= []).push(ing);
  }
  return g;
}

let counter = 0;

export default function BatchClient({ recipes, stockMap, userId }: Props) {
  const [batchName, setBatchName]   = useState('');
  const [items, setItems]           = useState<BatchItem[]>([]);
  const [search, setSearch]         = useState('');
  const [open, setOpen]             = useState(false);
  const [view, setView]             = useState<'recipes' | 'total'>('recipes');
  const [checked, setChecked]       = useState<Set<string>>(new Set());
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [producing, setProducing]   = useState(false);
  const [error, setError]           = useState('');
  const [done, setDone]             = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? recipes.filter((r) => r.name.toLowerCase().includes(q)) : recipes;
  }, [recipes, search]);

  function addItem(recipe: Recipe) {
    counter++;
    setItems((p) => [...p, { key: `i${counter}`, recipe, qty: 1, qtyUnit: 'portions' }]);
    setSearch(''); setOpen(false);
  }

  function removeItem(key: string) { setItems((p) => p.filter((i) => i.key !== key)); }

  function updateQty(key: string, delta: number | null, val?: number) {
    setItems((p) => p.map((i) => i.key !== key ? i : {
      ...i, qty: delta !== null ? Math.max(1, i.qty + delta) : Math.max(1, val ?? 1),
    }));
  }

  function updateUnit(key: string, unit: BatchQtyUnit) {
    setItems((p) => p.map((i) => i.key === key ? { ...i, qtyUnit: unit } : i));
  }

  const lines = useMemo((): ConsolidatedLine[] => {
    const map = new Map<string, ConsolidatedLine>();
    for (const item of items) {
      const portions = effectivePortions(item.qty, item.qtyUnit, item.recipe);
      for (const ing of item.recipe.ingredients) {
        const info = ing.ingredientId ? stockMap[ing.ingredientId] : undefined;
        const k = ing.ingredientId ? `id:${ing.ingredientId}` : `n:${ing.name.toLowerCase()}`;
        const ex = map.get(k);
        if (ex) {
          ex.totalQty += ing.qty * portions;
          if (!ex.sources.includes(item.recipe.name)) ex.sources.push(item.recipe.name);
        } else {
          map.set(k, { key: k, name: info?.name ?? ing.name, unit: ing.unit, totalQty: ing.qty * portions, sources: [item.recipe.name], ingredientId: ing.ingredientId, stockInfo: info });
        }
      }
    }
    return [...map.values()];
  }, [items, stockMap]);

  function toggleChecked(key: string) {
    setChecked((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }
  function toggleExpanded(key: string) {
    setExpanded((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  async function handleProduce() {
    setProducing(true); setError('');
    const supabase = createClient();
    const results = await Promise.all(
      lines.filter((l) => l.ingredientId && l.stockInfo?.stock !== undefined)
        .map((l) => supabase.from('ingredients').update({
          data: { ...l.stockInfo, stock: Math.max(0, (l.stockInfo!.stock ?? 0) - l.totalQty) },
          updated_at: new Date().toISOString(),
        }).eq('id', l.ingredientId!).eq('user_id', userId))
    );
    if (results.find((r) => r.error)) setError('Erreur lors de la mise à jour du stock.');
    else setDone(true);
    setProducing(false);
  }

  // ── done ────────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <CheckCircle2 size={48} className="text-emerald-400" />
        <p className="text-lg font-semibold text-[var(--text)]">Production validée</p>
        <p className="text-sm text-[var(--text-dim)]">Le stock a été mis à jour.</p>
        <button type="button" onClick={() => { setItems([]); setChecked(new Set()); setBatchName(''); setDone(false); }} className="btn-primary mt-2">
          Nouveau batch
        </button>
      </div>
    );
  }

  const allChecked = lines.length > 0 && checked.size === lines.length;

  return (
    <div className="space-y-3 max-w-xl mx-auto">

      {/* ── Batch name ── */}
      <input
        type="text"
        placeholder="Nom du batch (ex. Soirée vendredi…)"
        value={batchName}
        onChange={(e) => setBatchName(e.target.value)}
        className="field-input font-semibold text-base"
      />

      {/* ── Search / add ── */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] pointer-events-none" />
        <input
          type="text"
          placeholder="Ajouter une recette…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="field-input pl-10 w-full"
        />
        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 card p-1 shadow-xl max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-[var(--text-dim)] text-center py-4">Aucun résultat</p>
            ) : filtered.map((r) => (
              <button key={r.id} type="button" onMouseDown={(e) => { e.preventDefault(); addItem(r); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-[var(--surface2)] rounded-md transition-colors">
                <span className="flex-1 text-[var(--text)] truncate">{r.name}</span>
                <span className={`shrink-0 text-xs rounded-full px-2 py-0.5 border ${r.type === 'homemade' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10' : 'text-[var(--gold)] border-[var(--gold)]/30 bg-[var(--gold)]/10'}`}>
                  {r.type === 'homemade' ? 'Maison' : 'Recette'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Package size={40} className="text-[var(--text-dim)] opacity-25" />
          <p className="text-sm text-[var(--text-dim)]">Ajoutez des recettes pour calculer votre batch</p>
        </div>
      ) : (
        <>
          {/* ── Tabs ── */}
          <div className="flex rounded-lg bg-[var(--surface2)] p-0.5 gap-0.5">
            {([
              { key: 'recipes', icon: BookOpen, label: 'Recettes', count: items.length },
              { key: 'total',   icon: List,     label: 'Liste totale', count: lines.length },
            ] as const).map(({ key, icon: Icon, label, count }) => (
              <button key={key} type="button" onClick={() => setView(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${view === key ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-dim)]'}`}>
                <Icon size={14} />
                {label}
                <span className={`text-[10px] rounded-full px-1.5 py-px leading-none ${view === key ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'bg-[var(--surface)] text-[var(--text-dim)]'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* ── RECETTES TAB ── */}
          {view === 'recipes' && (
            <div className="space-y-3">
              {items.map((item) => {
                const portions = effectivePortions(item.qty, item.qtyUnit, item.recipe);
                const groups   = groupByCategory(item.recipe.ingredients, stockMap);
                const cats     = CATEGORY_ORDER.filter((c) => groups[c]);

                return (
                  <div key={item.key} className="card p-0 overflow-hidden">
                    {/* Recipe header */}
                    <div className="px-4 pt-3 pb-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2 mb-2.5">
                        <p className="flex-1 font-semibold text-[var(--text)] truncate">{item.recipe.name}</p>
                        <button type="button" onClick={() => removeItem(item.key)}
                          className="shrink-0 p-1.5 rounded-md text-[var(--text-dim)] hover:text-red-400 hover:bg-red-400/10 transition-colors">
                          <X size={15} />
                        </button>
                      </div>
                      {/* Stepper row */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-[var(--surface2)] rounded-lg p-1">
                          <button type="button" onClick={() => updateQty(item.key, -1)}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-colors">
                            <Minus size={14} />
                          </button>
                          <input type="number" min="1" max="9999" value={item.qty}
                            onChange={(e) => updateQty(item.key, null, parseInt(e.target.value) || 1)}
                            className="w-14 text-center bg-transparent text-[var(--text)] font-semibold text-sm focus:outline-none" />
                          <button type="button" onClick={() => updateQty(item.key, 1)}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-colors">
                            <Plus size={14} />
                          </button>
                        </div>
                        <select value={item.qtyUnit} onChange={(e) => updateUnit(item.key, e.target.value as BatchQtyUnit)}
                          className="field-input text-sm flex-1">
                          {QTY_UNIT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Ingredient groups */}
                    <div className="px-4 py-3 space-y-4">
                      {cats.length === 0 ? (
                        <p className="text-xs text-[var(--text-dim)] text-center">Aucun ingrédient</p>
                      ) : cats.map((catKey) => {
                        const cat = CATEGORY_GROUPS[catKey] ?? CATEGORY_GROUPS.other;
                        return (
                          <div key={catKey} className="flex gap-3">
                            <div className={`w-0.5 rounded-full ${cat.bar} shrink-0 mt-1`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${cat.text}`}>{cat.label}</p>
                              <div className="space-y-1.5">
                                {groups[catKey].map((ing) => {
                                  const info      = ing.ingredientId ? stockMap[ing.ingredientId] : undefined;
                                  const scaledQty = ing.qty * portions;
                                  const ingKey    = `${item.key}:${ing.ingredientId ?? ing.name}`;
                                  const isHomemade  = info?.homemade;
                                  const hasDetails  = isHomemade && ((info?.composition?.length ?? 0) > 0 || !!info?.steps);
                                  const isExpanded  = expanded.has(ingKey);
                                  const yB = toBase(info?.yield ?? 1, info?.yieldUnit ?? ing.unit);
                                  const nB = toBase(scaledQty, ing.unit);
                                  const scale = yB > 0 ? nB / yB : 0;

                                  return (
                                    <div key={ingKey}>
                                      <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => hasDetails && toggleExpanded(ingKey)}
                                          className={`shrink-0 w-5 flex items-center justify-center ${hasDetails ? 'text-[var(--text-dim)] hover:text-[var(--text)]' : 'cursor-default'}`}>
                                          {hasDetails
                                            ? <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            : isHomemade ? <FlaskConical size={11} className="text-blue-400" /> : null
                                          }
                                        </button>
                                        <span className="flex-1 text-sm text-[var(--text)] truncate">{info?.name ?? ing.name}</span>
                                        <span className="text-sm font-mono font-medium text-[var(--text)] shrink-0 tabular-nums">
                                          {fmt(scaledQty, ing.unit)}
                                        </span>
                                      </div>
                                      {isExpanded && (
                                        <div className="ml-5 mt-1.5 mb-2 pl-3 border-l-2 border-[var(--border)] space-y-1">
                                          {info?.composition?.map((c, ci) => (
                                            <div key={ci} className="flex justify-between gap-2 text-xs">
                                              <span className="text-[var(--text-dim)] truncate">{c.name}</span>
                                              <span className="font-mono text-[var(--text-dim)] shrink-0 tabular-nums">{fmt(c.qty * scale, c.unit)}</span>
                                            </div>
                                          ))}
                                          {info?.steps && (
                                            <p className="text-xs text-[var(--text-dim)] italic leading-relaxed pt-1">
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

          {/* ── LISTE TOTALE TAB ── */}
          {view === 'total' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-dim)]">{lines.length} ingrédient{lines.length > 1 ? 's' : ''}</p>
                <button type="button" onClick={() => allChecked ? setChecked(new Set()) : setChecked(new Set(lines.map((l) => l.key)))}
                  className="btn-ghost py-1 px-3 text-xs">
                  {allChecked ? 'Tout décocher' : 'Tout cocher'}
                </button>
              </div>
              <div className="card divide-y divide-[var(--border)] p-0 overflow-hidden">
                {lines.map((line) => {
                  const isChecked = checked.has(line.key);
                  const status = stockStatus(line);
                  return (
                    <button key={line.key} type="button" onClick={() => toggleChecked(line.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface2)] transition-colors ${isChecked ? 'opacity-40' : ''}`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-[var(--gold)] border-[var(--gold)]' : 'border-[var(--border)]'}`}>
                        {isChecked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#0A0E1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      {line.stockInfo?.homemade
                        ? <FlaskConical size={14} className="text-blue-400 shrink-0" />
                        : <Package size={14} className="text-[var(--gold)] shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm text-[var(--text)] ${isChecked ? 'line-through' : ''}`}>{line.name}</p>
                        <p className="text-xs text-[var(--text-dim)] truncate mt-0.5">{line.sources.join(' · ')}</p>
                        {line.stockInfo?.stock !== undefined && (
                          <p className={`text-xs mt-0.5 ${status === 'ok' ? 'text-emerald-400' : status === 'low' ? 'text-orange-400' : status === 'insufficient' ? 'text-red-400' : 'text-[var(--text-dim)]'}`}>
                            Stock {line.stockInfo.stock} {line.stockInfo.unit}
                            {status === 'insufficient' && ' · insuffisant'}
                            {status === 'low' && ' · juste'}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-mono font-semibold text-[var(--text)] shrink-0 tabular-nums">
                        {fmt(line.totalQty, line.unit)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

          <button type="button" onClick={handleProduce} disabled={producing || lines.length === 0}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {producing ? <><Loader2 size={16} className="animate-spin" />Enregistrement…</> : 'Valider la production'}
          </button>
        </>
      )}
    </div>
  );
}
