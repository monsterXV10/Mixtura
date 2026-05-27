'use client';
import { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { Plus, Search, Package, FlaskConical } from 'lucide-react';

interface IngredientData {
  name?: string;
  type?: string;
  unit?: string;
  price?: number;
  stock?: number;
  format?: number;
  homemade?: boolean;
  brand?: string;
  family?: string;
  yield?: number;
  yieldUnit?: string;
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
  spirit: 'Spiritueux', liqueur: 'Liqueur', wine: 'Vin',
  syrup: 'Sirop', juice: 'Jus', fresh: 'Frais',
  dry: 'Sec', homemade: 'Fait maison', other: 'Autre',
};

const CATEGORY_COLORS: Record<string, string> = {
  spirit: 'text-amber-400 bg-amber-400/10',
  liqueur: 'text-purple-400 bg-purple-400/10',
  wine: 'text-rose-400 bg-rose-400/10',
  syrup: 'text-pink-400 bg-pink-400/10',
  juice: 'text-orange-400 bg-orange-400/10',
  fresh: 'text-emerald-400 bg-emerald-400/10',
  dry: 'text-yellow-400 bg-yellow-400/10',
  homemade: 'text-blue-400 bg-blue-400/10',
  other: 'text-[var(--text-dim)] bg-[var(--surface2)]',
};

const FILTER_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'spirit', label: 'Spiritueux' },
  { key: 'liqueur', label: 'Liqueurs' },
  { key: 'wine', label: 'Vins' },
  { key: 'syrup', label: 'Sirops' },
  { key: 'fresh', label: 'Frais' },
  { key: 'homemade', label: 'Maison' },
  { key: 'other', label: 'Autre' },
];

function getStockStatus(stock: number, format: number | undefined): 'full' | 'low' | 'empty' {
  if (stock <= 0) return 'empty';
  if (format && format > 0 && stock / format < 0.2) return 'low';
  return 'full';
}

const STOCK_DOT: Record<string, string> = {
  full: 'bg-emerald-400',
  low: 'bg-orange-400',
  empty: 'bg-red-400',
};

export default function IngredientsClient({ initialIngredients }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let result = initialIngredients;

    if (categoryFilter !== 'all') {
      result = result.filter((ing) => {
        if (categoryFilter === 'homemade') return ing.data.homemade === true;
        if (categoryFilter === 'other') {
          const t = ing.data.type?.toLowerCase();
          return !ing.data.homemade && !['spirit', 'liqueur', 'wine', 'syrup', 'juice', 'fresh', 'dry'].includes(t ?? '');
        }
        return ing.data.type?.toLowerCase() === categoryFilter && !ing.data.homemade;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((ing) => ing.data.name?.toLowerCase().includes(q));
    }

    return result;
  }, [initialIngredients, categoryFilter, search]);

  return (
    <>
      <TopBar
        title="Stocks"
        actions={
          <Link href="/ingredients/new" className="btn-primary h-9 px-3 text-sm gap-1">
            <Plus size={15} />
            Ajouter
          </Link>
        }
      />

      <main className="px-4 py-4 pb-safe space-y-4">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Rechercher un ingrédient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input pl-10"
          />
        </div>

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
              const isHomemade = d.homemade === true;
              const catKey = isHomemade ? 'homemade' : (d.type?.toLowerCase() ?? 'other');
              const catLabel = CATEGORY_LABELS[catKey] ?? CATEGORY_LABELS['other'];
              const catColor = CATEGORY_COLORS[catKey] ?? CATEGORY_COLORS['other'];
              const stock = d.stock ?? 0;
              const status = getStockStatus(stock, isHomemade ? undefined : d.format);
              const stockDisplay = isHomemade ? `${stock} ${d.yieldUnit ?? d.unit}` : `${stock} ${d.unit ?? ''}`;

              return (
                <Link key={ing.id} href={`/ingredients/${ing.id}`} className="card block hover:border-[var(--gold-dim)] transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isHomemade ? (
                        <FlaskConical size={14} className="text-blue-400 shrink-0" />
                      ) : null}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--text)] text-sm truncate">{d.name}</h3>
                        {(d.brand || d.family) && (
                          <p className="text-xs text-[var(--text-dim)] truncate">
                            {[d.brand, d.family].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>
                      {catLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${STOCK_DOT[status]}`} />
                      <span className="text-xs text-[var(--text-dim)]">
                        {stock > 0 ? stockDisplay : 'Épuisé'}
                      </span>
                    </div>
                    {!isHomemade && d.price && d.price > 0 && (
                      <span className="text-xs text-[var(--text-dim)]">{d.price.toFixed(2)} €</span>
                    )}
                    {isHomemade && d.yield && (
                      <span className="text-xs text-[var(--text-dim)]">Rdt {d.yield} {d.yieldUnit}</span>
                    )}
                  </div>

                  {!isHomemade && d.format && d.format > 0 && (
                    <div className="mt-2 h-1 bg-[var(--surface2)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${STOCK_DOT[status]}`}
                        style={{ width: `${Math.min(100, (stock / d.format) * 100)}%` }}
                      />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
