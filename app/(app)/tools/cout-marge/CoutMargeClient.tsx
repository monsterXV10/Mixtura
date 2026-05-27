'use client';
import { useState, useMemo } from 'react';
import { Search, ChevronDown, TrendingUp } from 'lucide-react';

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
}

function formatEur(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €';
}

export default function CoutMargeClient({ recipes, stockMap }: Props) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [targetRatio, setTargetRatio] = useState(20);

  const selected = recipes.find((r) => r.id === selectedId) ?? null;

  const filteredRecipes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return recipes;
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, search]);

  function selectRecipe(r: Recipe) {
    setSelectedId(r.id);
    setOpen(false);
    setSearch('');
  }

  interface IngLine {
    name: string;
    qty: number;
    unit: string;
    pricePerUnit: number | null;
    lineCost: number | null;
    ingredientId?: string;
  }

  const analysis = useMemo((): { lines: IngLine[]; totalCost: number | null } | null => {
    if (!selected) return null;
    let totalCost = 0;
    let hasPrice = false;
    const lines: IngLine[] = selected.ingredients.map((ing) => {
      const stock = ing.ingredientId ? stockMap[ing.ingredientId] : undefined;
      let pricePerUnit: number | null = null;
      let lineCost: number | null = null;
      if (stock?.price != null && stock?.format != null && stock.format > 0) {
        pricePerUnit = stock.price / stock.format; // price per ml/g/unit
        lineCost = pricePerUnit * ing.qty;
        totalCost += lineCost;
        hasPrice = true;
      }
      return {
        name: stock?.name ?? ing.name,
        qty: ing.qty,
        unit: ing.unit,
        pricePerUnit,
        lineCost,
        ingredientId: ing.ingredientId,
      };
    });
    return { lines, totalCost: hasPrice ? totalCost : null };
  }, [selected, stockMap]);

  const ratio = targetRatio > 0 ? targetRatio : 20;
  const prixConseille = analysis?.totalCost != null ? analysis.totalCost / (ratio / 100) : null;
  const margeBrute = prixConseille != null && analysis?.totalCost != null ? prixConseille - analysis.totalCost : null;
  const margePct = prixConseille != null && analysis?.totalCost != null && prixConseille > 0
    ? ((prixConseille - analysis.totalCost) / prixConseille) * 100
    : null;
  const realRatioPct = analysis?.totalCost != null && prixConseille != null && prixConseille > 0
    ? (analysis.totalCost / prixConseille) * 100
    : null;

  function ratioBadge() {
    if (realRatioPct == null) return null;
    const diff = realRatioPct - ratio;
    if (diff <= 0) return <span className="text-xs rounded-full px-2.5 py-1 bg-emerald-400/10 text-emerald-400 border border-emerald-400/30">Bon ratio</span>;
    if (diff <= 5) return <span className="text-xs rounded-full px-2.5 py-1 bg-orange-400/10 text-orange-400 border border-orange-400/30">Ratio élevé</span>;
    return <span className="text-xs rounded-full px-2.5 py-1 bg-red-400/10 text-red-400 border border-red-400/30">Ratio trop élevé</span>;
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
                  <p className="text-xs text-[var(--text-dim)] text-center py-3">Aucun résultat</p>
                ) : (
                  filteredRecipes.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); selectRecipe(r); }}
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

      {/* Target ratio */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Ratio food cost cible (%)
        </label>
        <input
          type="number"
          min={1}
          max={100}
          value={targetRatio}
          onChange={(e) => setTargetRatio(Math.min(100, Math.max(1, parseInt(e.target.value) || 20)))}
          className="field-input w-32"
        />
      </div>

      {/* Results */}
      {!selected && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <TrendingUp size={36} className="text-[var(--text-dim)] opacity-30" />
          <p className="text-sm text-[var(--text-dim)]">Sélectionnez une recette pour calculer son coût</p>
        </div>
      )}

      {selected && analysis && (
        <div className="space-y-4">
          {/* Ingredient lines */}
          <div className="card divide-y divide-[var(--border)] p-0 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 text-xs text-[var(--text-dim)] uppercase tracking-wide font-medium">
              <span>Ingrédient</span>
              <span className="text-right">Qté</span>
              <span className="text-right w-20">Coût</span>
            </div>
            {analysis.lines.map((line, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 items-center">
                <div>
                  <p className="text-sm text-[var(--text)]">{line.name}</p>
                  {line.pricePerUnit != null && (
                    <p className="text-xs text-[var(--text-dim)] mt-0.5">
                      {(line.pricePerUnit * 100).toFixed(3)} €/100{line.unit}
                    </p>
                  )}
                  {line.pricePerUnit == null && (
                    <p className="text-xs text-orange-400/80 mt-0.5">Prix non renseigné</p>
                  )}
                </div>
                <span className="text-sm text-[var(--text-dim)] text-right whitespace-nowrap">
                  {line.qty} {line.unit}
                </span>
                <span className="text-sm font-mono text-right w-20 text-[var(--text)]">
                  {line.lineCost != null ? formatEur(line.lineCost) : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Summary */}
          {analysis.totalCost != null ? (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-dim)]">Coût matière</span>
                <span className="text-sm font-semibold font-mono text-[var(--text)]">
                  {formatEur(analysis.totalCost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-dim)]">Prix de vente conseillé</span>
                <span className="text-sm font-semibold font-mono text-[var(--gold)]">
                  {prixConseille != null ? formatEur(prixConseille) : '—'}
                </span>
              </div>
              <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
                <span className="text-sm text-[var(--text-dim)]">Marge brute</span>
                <span className="text-sm font-semibold font-mono text-emerald-400">
                  {margeBrute != null ? formatEur(margeBrute) : '—'}
                  {margePct != null && <span className="text-xs text-[var(--text-dim)] ml-2">({margePct.toFixed(1)}%)</span>}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-[var(--text-dim)]">Ratio food cost réel</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-[var(--text)]">
                    {realRatioPct != null ? `${realRatioPct.toFixed(1)}%` : '—'}
                  </span>
                  {ratioBadge()}
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-5">
              <p className="text-sm text-[var(--text-dim)]">
                Renseignez les prix et formats de vos ingrédients pour calculer les coûts.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
