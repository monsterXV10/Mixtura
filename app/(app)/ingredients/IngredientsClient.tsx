'use client';
import { useState, useMemo, useEffect } from 'react';
import { PLANS, type PlanId } from '@/config/plans';
import { TopBar } from '@/components/layout/TopBar';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Plus, Search, Package, FlaskConical, Lock, BookOpen, Download, Check, Loader2 } from 'lucide-react';

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
  preparationType?: string;
}

const PREP_TYPE_LABELS: Record<string, string> = {
  sirop: 'Sirop', infusion: 'Infusion', clarification: 'Clarification',
  'fat-wash': 'Fat Wash', batch: 'Batch', teinture: 'Teinture',
  cordial: 'Cordial', puree: 'Purée',
};

interface IngredientRow {
  id: string;
  user_id: string;
  data: IngredientData;
  updated_at: string;
}

interface CatalogIngredient {
  id: string;
  name: string;
  category: string;
  type: string;
  default_unit: string;
}

interface Props {
  initialIngredients: IngredientRow[];
  userId: string;
  userPlan: PlanId;
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

// Catalog-specific category tabs (matching catalog_ingredients.category values)
const CATALOG_FILTER_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'spirit', label: 'Spiritueux' },
  { key: 'liqueur', label: 'Liqueurs' },
  { key: 'bitters', label: 'Bitters' },
  { key: 'eau de vie', label: 'Eaux-de-vie' },
  { key: 'vin', label: 'Vins' },
  { key: 'sirop', label: 'Sirops' },
  { key: 'fruit', label: 'Fruits' },
  { key: 'épicerie', label: 'Épicerie' },
  { key: 'légume', label: 'Légumes' },
];

// Map catalog category → personal ingredient type
const CATALOG_TO_TYPE: Record<string, string> = {
  spirit: 'spirit',
  liqueur: 'liqueur',
  bitters: 'liqueur',
  'eau de vie': 'spirit',
  vin: 'wine',
  sirop: 'syrup',
  fruit: 'fresh',
  légume: 'fresh',
  épicerie: 'other',
};

// Labels for catalog categories shown on ingredient cards
const CATALOG_CAT_LABELS: Record<string, string> = {
  spirit: 'Spiritueux',
  liqueur: 'Liqueur',
  bitters: 'Bitters',
  'eau de vie': 'Eau-de-vie',
  vin: 'Vin',
  sirop: 'Sirop',
  fruit: 'Fruit',
  légume: 'Légume',
  épicerie: 'Épicerie',
};

const CATALOG_CAT_COLORS: Record<string, string> = {
  spirit: 'text-amber-400 bg-amber-400/10',
  liqueur: 'text-purple-400 bg-purple-400/10',
  bitters: 'text-red-400 bg-red-400/10',
  'eau de vie': 'text-orange-400 bg-orange-400/10',
  vin: 'text-rose-400 bg-rose-400/10',
  sirop: 'text-pink-400 bg-pink-400/10',
  fruit: 'text-emerald-400 bg-emerald-400/10',
  légume: 'text-green-400 bg-green-400/10',
  épicerie: 'text-yellow-400 bg-yellow-400/10',
};

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

export default function IngredientsClient({ initialIngredients, userId, userPlan }: Props) {
  const ingredientLimit = PLANS[userPlan].limits.ingredients;
  const isReadOnly = ingredientLimit !== Infinity && initialIngredients.length > ingredientLimit;

  // Personal stock tab
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Tab state
  const [activeTab, setActiveTab] = useState<'mine' | 'catalog'>('mine');

  // Catalog tab state
  const [ingCatalog, setIngCatalog] = useState<CatalogIngredient[]>([]);
  const [ingCatalogLoading, setIngCatalogLoading] = useState(false);
  const [ingCatalogFetched, setIngCatalogFetched] = useState(false);
  const [ingCatalogSearch, setIngCatalogSearch] = useState('');
  const [ingCatalogCat, setIngCatalogCat] = useState('all');
  const [importingIng, setImportingIng] = useState<Set<string>>(new Set());
  const [importedIng, setImportedIng] = useState<Set<string>>(new Set());

  const PAGE_SIZE = 30;
  const [visibleIngCount, setVisibleIngCount] = useState(PAGE_SIZE);

  // Seed imported set from existing ingredients
  useEffect(() => {
    const names = new Set(initialIngredients.map(i => (i.data.name ?? '').toLowerCase()));
    setImportedIng(names);
  }, [initialIngredients]);

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

  const filteredCatalog = useMemo(() => {
    let result = ingCatalog;
    if (ingCatalogCat !== 'all') {
      result = result.filter(i => i.category === ingCatalogCat);
    }
    if (ingCatalogSearch.trim()) {
      const q = ingCatalogSearch.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q));
    }
    return result;
  }, [ingCatalog, ingCatalogCat, ingCatalogSearch]);

  useEffect(() => { setVisibleIngCount(PAGE_SIZE); }, [search, categoryFilter]);

  async function loadIngCatalog() {
    if (ingCatalogFetched) return;
    setIngCatalogLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('catalog_ingredients')
        .select('id, name, category, type, default_unit')
        .order('name', { ascending: true });
      if (data) setIngCatalog(data as CatalogIngredient[]);
    } finally {
      setIngCatalogLoading(false);
      setIngCatalogFetched(true);
    }
  }

  async function handleImportIngredient(ing: CatalogIngredient) {
    if (importedIng.has(ing.name.toLowerCase())) return;
    setImportingIng(prev => new Set(prev).add(ing.id));
    try {
      const supabase = createClient();
      const { error } = await supabase.from('ingredients').insert({
        user_id: userId,
        data: {
          name: ing.name,
          type: CATALOG_TO_TYPE[ing.category] ?? 'other',
          unit: ing.default_unit ?? 'cl',
          price: 0,
          stock: 0,
          format: 0,
          homemade: false,
        },
        updated_at: new Date().toISOString(),
      });
      if (!error) setImportedIng(prev => new Set(prev).add(ing.name.toLowerCase()));
    } finally {
      setImportingIng(prev => { const n = new Set(prev); n.delete(ing.id); return n; });
    }
  }

  return (
    <>
      <TopBar
        title="Stocks"
        actions={
          activeTab === 'mine' && !isReadOnly ? (
            <Link href="/ingredients/new" className="btn-primary h-9 px-3 text-sm gap-1">
              <Plus size={15} />
              Ajouter
            </Link>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] bg-[var(--surface)] sticky top-14 z-20">
        <button
          onClick={() => setActiveTab('mine')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'mine'
              ? 'text-[var(--gold)] border-b-2 border-[var(--gold)]'
              : 'text-[var(--text-dim)]'
          }`}
        >
          <Package size={15} />
          Mes stocks
        </button>
        <button
          onClick={() => { setActiveTab('catalog'); loadIngCatalog(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'catalog'
              ? 'text-[var(--gold)] border-b-2 border-[var(--gold)]'
              : 'text-[var(--text-dim)]'
          }`}
        >
          <BookOpen size={15} />
          Catalogue
        </button>
      </div>

      <main className="px-4 py-4 pb-safe space-y-4">
        {activeTab === 'mine' && (
          <>
            {isReadOnly && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-xs" style={{ background: 'rgba(200,164,92,0.10)', border: '1px solid rgba(200,164,92,0.25)' }}>
                <Lock size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                <p style={{ color: 'var(--text-dim)' }}>
                  Votre plan Free inclut {ingredientLimit} ingrédients. Vos données sont en lecture seule —{' '}
                  <Link href="/settings/plan" className="underline" style={{ color: 'var(--gold)' }}>passez à un plan supérieur</Link> pour modifier.
                </p>
              </div>
            )}

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
                {!isReadOnly && (
                  <Link href="/ingredients/new" className="btn-primary px-4 py-2 text-sm">
                    <Plus size={14} />
                    Ajouter un ingrédient
                  </Link>
                )}
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filtered.slice(0, visibleIngCount).map((ing) => {
                  const d = ing.data;
                  const isHomemade = d.homemade === true;
                  const catKey = isHomemade ? 'homemade' : (d.type?.toLowerCase() ?? 'other');
                  const catColor = CATEGORY_COLORS[catKey] ?? CATEGORY_COLORS['other'];
                  const catLabel = isHomemade
                    ? (d.preparationType ? (PREP_TYPE_LABELS[d.preparationType] ?? 'Maison') : 'Fait maison')
                    : (CATEGORY_LABELS[catKey] ?? CATEGORY_LABELS['other']);
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
              {visibleIngCount < filtered.length && (
                <button
                  onClick={() => setVisibleIngCount(v => v + PAGE_SIZE)}
                  className="w-full py-3 text-sm btn-ghost mt-2"
                >
                  Charger plus ({filtered.length - visibleIngCount} restants)
                </button>
              )}
              </>
            )}
          </>
        )}

        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Note */}
            <p className="text-xs text-[var(--text-dim)]">
              Importez un ingrédient dans vos stocks — le prix et le stock se configurent de votre côté.
            </p>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
              <input
                type="text"
                placeholder="Rechercher dans le catalogue…"
                value={ingCatalogSearch}
                onChange={(e) => setIngCatalogSearch(e.target.value)}
                className="field-input pl-10"
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
              {CATALOG_FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setIngCatalogCat(tab.key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    ingCatalogCat === tab.key
                      ? 'bg-[var(--gold)] text-[#0A0E1A]'
                      : 'bg-[var(--surface2)] text-[var(--text-dim)] border border-[var(--border)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Loading */}
            {ingCatalogLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Empty */}
            {!ingCatalogLoading && ingCatalogFetched && filteredCatalog.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                <Package size={40} className="text-[var(--text-dim)] opacity-40" />
                <p className="text-sm text-[var(--text-dim)]">Aucun résultat</p>
              </div>
            )}

            {/* List */}
            {!ingCatalogLoading && filteredCatalog.length > 0 && (
              <div className="space-y-2">
                {filteredCatalog.map((ing) => {
                  const isImported = importedIng.has(ing.name.toLowerCase());
                  const isImporting = importingIng.has(ing.id);
                  const catColor = CATALOG_CAT_COLORS[ing.category] ?? CATALOG_CAT_COLORS['épicerie'];
                  const catLabel = CATALOG_CAT_LABELS[ing.category] ?? ing.category;
                  return (
                    <div key={ing.id} className="card flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--text)] text-sm truncate">
                          {ing.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${catColor}`}>
                            {catLabel}
                          </span>
                          <span className="text-xs text-[var(--text-dim)]">{ing.default_unit}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleImportIngredient(ing)}
                        disabled={isImported || isImporting}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isImported
                            ? 'bg-emerald-400/10 text-emerald-400 cursor-default'
                            : 'btn-primary'
                        }`}
                      >
                        {isImporting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : isImported ? (
                          <><Check size={12} />Importé</>
                        ) : (
                          <><Download size={12} />Importer</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
