'use client';
import { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { Plus, Search, Package } from 'lucide-react';

interface IngredientData {
  id: string;
  name: string;
  type: string;
  unit: string;
  price: number;
  stock: number;
  format: number;
  category: string;
  homemade?: boolean;
}

interface IngredientRow {
  id: string;
  user_id: string;
  data: IngredientData;
  updated_at: string;
}

interface Props {
  initialIngredients: IngredientRow[];
  userId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  spirit: 'Spiritueux',
  liqueur: 'Liqueur',
  wine: 'Vin',
  syrup: 'Sirop',
  juice: 'Jus',
  fresh: 'Frais',
  dry: 'Sec',
  other: 'Autre',
};

const CATEGORY_COLORS: Record<string, string> = {
  spirit: 'text-amber-400 bg-amber-400/10',
  liqueur: 'text-purple-400 bg-purple-400/10',
  wine: 'text-rose-400 bg-rose-400/10',
  syrup: 'text-pink-400 bg-pink-400/10',
  juice: 'text-orange-400 bg-orange-400/10',
  fresh: 'text-emerald-400 bg-emerald-400/10',
  dry: 'text-yellow-400 bg-yellow-400/10',
  other: 'text-[var(--text-dim)] bg-[var(--surface2)]',
};

const FILTER_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'spirit', label: 'Spiritueux' },
  { key: 'liqueur', label: 'Liqueurs' },
  { key: 'wine', label: 'Vins' },
  { key: 'syrup', label: 'Sirops' },
  { key: 'fresh', label: 'Frais' },
  { key: 'other', label: 'Autre' },
];

function getStockStatus(stock: number, format: number): 'full' | 'low' | 'empty' {
  if (stock <= 0) return 'empty';
  if (format > 0 && stock / format < 0.2) return 'low';
  return 'full';
}

const STOCK_INDICATOR: Record<string, { dot: string; label: string }> = {
  full: { dot: 'bg-emerald-400', label: 'En stock' },
  low: { dot: 'bg-orange-400', label: 'Stock bas' },
  empty: { dot: 'bg-red-400', label: 'Épuisé' },
};

export default function IngredientsClient({ initialIngredients }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let result = initialIngredients;

    if (categoryFilter !== 'all') {
      result = result.filter((ing) => {
        const type = ing.data.type?.toLowerCase();
        // "other" bucket catches everything not in a named category
        if (categoryFilter === 'other') {
          return !['spirit', 'liqueur', 'wine', 'syrup', 'juice', 'fresh', 'dry'].includes(type);
        }
        return type === categoryFilter;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((ing) => ing.data.name.toLowerCase().includes(q));
    }

    return result;
  }, [initialIngredients, categoryFilter, search]);

  return (
    <>
      <TopBar
        title="Stocks"
        actions={
          <Link href="/ingredients/new" className="btn-primary px-3 py-1.5 text-sm gap-1">
            <Plus size={15} />
            Ajouter
          </Link>
        }
      />

      <main className="px-4 py-4 pb-safe space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Rechercher un ingrédient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input pl-9"
          />
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategoryFilter(tab.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === tab.key
                  ? 'bg-[var(--gold)] text-[#0A0E1A]'
                  : 'bg-[var(--surface2)] text-[var(--text-dim)] border border-[var(--border)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ingredients grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <Package size={40} className="text-[var(--text-dim)] opacity-40" />
            <div>
              <p className="font-semibold text-[var(--text)]">Aucun ingrédient</p>
              <p className="text-sm text-[var(--text-dim)] mt-1">
                Ajoutez vos premiers ingrédients pour suivre vos stocks
              </p>
            </div>
            <Link href="/ingredients/new" className="btn-primary px-4 py-2 text-sm">
              <Plus size={14} />
              Ajouter un ingrédient
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((ing) => {
              const d = ing.data;
              const status = getStockStatus(d.stock, d.format);
              const indicator = STOCK_INDICATOR[status];
              const categoryLabel = CATEGORY_LABELS[d.type?.toLowerCase()] ?? CATEGORY_LABELS['other'];
              const categoryColor = CATEGORY_COLORS[d.type?.toLowerCase()] ?? CATEGORY_COLORS['other'];

              return (
                <div key={ing.id} className="card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--text)] text-sm truncate">
                        {d.name}
                      </h3>
                      {d.homemade && (
                        <span className="text-xs text-[var(--gold)]">Fait maison</span>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`}>
                      {categoryLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Stock indicator */}
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${indicator.dot}`} />
                      <span className="text-xs text-[var(--text-dim)]">
                        {d.stock > 0
                          ? `${d.stock} ${d.unit}`
                          : indicator.label}
                      </span>
                    </div>

                    {/* Price */}
                    {d.price > 0 && (
                      <span className="text-xs text-[var(--text-dim)]">
                        {d.price.toFixed(2)} €
                      </span>
                    )}
                  </div>

                  {/* Stock bar */}
                  {d.format > 0 && (
                    <div className="mt-2 h-1 bg-[var(--surface2)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          status === 'full'
                            ? 'bg-emerald-400'
                            : status === 'low'
                            ? 'bg-orange-400'
                            : 'bg-red-400'
                        }`}
                        style={{ width: `${Math.min(100, (d.stock / d.format) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
