'use client';
import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ensureIngredients } from '@/lib/utils/ingredients';
import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { Plus, Search, BookOpen, Package, Download, Check, Pencil, FlaskConical } from 'lucide-react';

interface RecipeRow {
  id: string;
  user_id: string;
  type: 'cocktail' | 'coffee' | 'cuisine';
  data: {
    id: string;
    name: string;
    steps: string;
    ingredients: Array<{ qty: number; name: string; unit: string }>;
  };
  metadata: {
    glass?: string;
    method?: string | string[];
    garnish?: string;
    type?: string;
    spiritFamily?: string;
  };
  updated_at: string;
}

interface CatalogCocktail {
  id: string;
  name: string;
  glass: string | null;
  family: string | null;
  alcohol: string | null;
  method: string | null;
  garnish: string | null;
  ice: string | null;
  ingredients: Array<{ qty: number; name: string; unit: string }>;
  steps: string | null;
  source: string;
}

const PREP_TYPE_LABELS: Record<string, string> = {
  sirop: 'Sirop', infusion: 'Infusion', clarification: 'Clarification',
  'fat-wash': 'Fat Wash', batch: 'Batch', teinture: 'Teinture',
  cordial: 'Cordial', puree: 'Purée', autre: 'Autre',
};

interface HomemadeIngredient {
  id: string;
  updated_at: string;
  data: {
    name?: string;
    unit?: string;
    stock?: number;
    yieldUnit?: string;
    yield?: number;
    steps?: string;
    preparationType?: string;
    composition?: Array<{ name: string; qty: number; unit: string }>;
    isPreparation?: boolean;
    isOutput?: boolean;
    sourcePreparationId?: string;
    outputs?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
  };
}

interface Props {
  initialRecipes: RecipeRow[];
  homemadeIngredients: HomemadeIngredient[];
  userId: string;
}

const TYPE_LABELS: Record<string, string> = {
  cocktail: 'Cocktail',
  coffee: 'Café',
  cuisine: 'Cuisine',
};

const TYPE_COLORS: Record<string, string> = {
  cocktail: 'text-blue-400 bg-blue-400/10',
  coffee: 'text-amber-400 bg-amber-400/10',
  cuisine: 'text-emerald-400 bg-emerald-400/10',
};

const SPIRIT_FILTER_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'whisky', label: 'Whisky' },
  { key: 'gin', label: 'Gin' },
  { key: 'vodka', label: 'Vodka' },
  { key: 'rhum', label: 'Rhum' },
  { key: 'tequila', label: 'Tequila' },
  { key: 'cognac', label: 'Cognac' },
  { key: 'champagne', label: 'Champagne' },
  { key: 'wine', label: 'Vin' },
  { key: 'liqueur', label: 'Liqueur' },
  { key: 'non-alc', label: 'Sans alcool' },
  { key: 'other', label: 'Autre' },
];

const SPIRIT_LABELS: Record<string, string> = Object.fromEntries(
  SPIRIT_FILTER_TABS.filter((t) => t.key !== 'all').map((t) => [t.key, t.label])
);

export default function RecipesClient({ initialRecipes, homemadeIngredients, userId }: Props) {
  const [activeTab, setActiveTab] = useState<'mine' | 'homemade' | 'catalog'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p === 'homemade' || p === 'catalog') return p;
    }
    return 'mine';
  });
  const [recipes, setRecipes] = useState<RecipeRow[]>(initialRecipes);
  const [mySearch, setMySearch] = useState('');
  const [spiritFilter, setSpiritFilter] = useState('all');
  const [homemadeSearch, setHomemadeSearch] = useState('');

  // Catalog state
  const [catalog, setCatalog] = useState<CatalogCocktail[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogFetched, setCatalogFetched] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [importing, setImporting] = useState<Set<string>>(new Set());
  const [imported, setImported] = useState<Set<string>>(new Set());

  // Seed imported set from existing recipes by name
  useEffect(() => {
    const names = new Set(recipes.map((r) => r.data.name.toLowerCase()));
    setImported(names);
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    let result = recipes;
    if (spiritFilter !== 'all') {
      result = result.filter((r) => r.metadata?.spiritFamily === spiritFilter);
    }
    if (mySearch.trim()) {
      const q = mySearch.toLowerCase();
      result = result.filter((r) => r.data.name.toLowerCase().includes(q));
    }
    return result;
  }, [recipes, mySearch, spiritFilter]);

  const filteredCatalog = useMemo(() => {
    if (!catalogSearch.trim()) return catalog;
    const q = catalogSearch.toLowerCase();
    return catalog.filter((c) => c.name.toLowerCase().includes(q));
  }, [catalog, catalogSearch]);

  async function loadCatalog() {
    if (catalogFetched) return;
    setCatalogLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('catalog')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        setCatalog(data as CatalogCocktail[]);
      }
    } finally {
      setCatalogLoading(false);
      setCatalogFetched(true);
    }
  }

  const filteredHomemade = useMemo(() => {
    // Les sorties (isOutput) ne sont pas affichées comme cartes séparées — elles sont
    // sub-items de la carte de leur prépa-conteneur.
    const visible = homemadeIngredients.filter((i) => !i.data.isOutput);
    if (!homemadeSearch.trim()) return visible;
    const q = homemadeSearch.toLowerCase();
    return visible.filter((i) => i.data.name?.toLowerCase().includes(q));
  }, [homemadeIngredients, homemadeSearch]);

  function handleTabSwitch(tab: 'mine' | 'homemade' | 'catalog') {
    setActiveTab(tab);
    if (tab === 'catalog') {
      loadCatalog();
    }
  }

  async function handleImport(cocktail: CatalogCocktail) {
    if (imported.has(cocktail.name.toLowerCase())) return;
    setImporting((prev) => new Set(prev).add(cocktail.id));
    try {
      const supabase = createClient();

      // Auto-create the cocktail's ingredients in stocks, then link by id
      const linkedIngredients = await ensureIngredients(
        supabase,
        userId,
        (cocktail.ingredients ?? []).map((ing) => ({
          name: ing.name,
          unit: ing.unit,
          qty: ing.qty,
        }))
      );

      const { data, error } = await supabase
        .from('recipes')
        .insert({
          user_id: userId,
          type: 'cocktail' as const,
          data: {
            id: crypto.randomUUID(),
            name: cocktail.name,
            steps: cocktail.steps ?? '',
            ingredients: linkedIngredients,
          },
          metadata: {
            glass: cocktail.glass,
            method: cocktail.method,
            garnish: cocktail.garnish,
          },
        })
        .select()
        .single();

      if (!error && data) {
        setRecipes((prev) => [data as RecipeRow, ...prev]);
        setImported((prev) => new Set(prev).add(cocktail.name.toLowerCase()));
      }
    } finally {
      setImporting((prev) => {
        const next = new Set(prev);
        next.delete(cocktail.id);
        return next;
      });
    }
  }

  return (
    <>
      <TopBar
        title="Recettes"
        actions={
          <Link href="/recipes/new" className="btn-primary px-3 py-1.5 text-sm gap-1">
            <Plus size={15} />
            Ajouter
          </Link>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] bg-[var(--surface)] sticky top-14 z-20">
        <button
          onClick={() => handleTabSwitch('mine')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'mine'
              ? 'text-[var(--gold)] border-b-2 border-[var(--gold)]'
              : 'text-[var(--text-dim)]'
          }`}
        >
          <BookOpen size={15} />
          Recettes
        </button>
        <button
          onClick={() => handleTabSwitch('homemade')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'homemade'
              ? 'text-[var(--gold)] border-b-2 border-[var(--gold)]'
              : 'text-[var(--text-dim)]'
          }`}
        >
          <FlaskConical size={15} />
          Maison
        </button>
        <button
          onClick={() => handleTabSwitch('catalog')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'catalog'
              ? 'text-[var(--gold)] border-b-2 border-[var(--gold)]'
              : 'text-[var(--text-dim)]'
          }`}
        >
          <Package size={15} />
          Catalogue
        </button>
      </div>

      <main className="px-4 py-4 pb-safe">
        {activeTab === 'mine' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
              <input
                type="text"
                placeholder="Rechercher une recette…"
                value={mySearch}
                onChange={(e) => setMySearch(e.target.value)}
                className="field-input pl-9"
              />
            </div>

            {/* Spirit filter pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
              {SPIRIT_FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSpiritFilter(tab.key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    spiritFilter === tab.key
                      ? 'bg-[var(--gold)] text-[#0A0E1A]'
                      : 'bg-[var(--surface2)] text-[var(--text-dim)] border border-[var(--border)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Recipe grid */}
            {filteredRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <BookOpen size={40} className="text-[var(--text-dim)] opacity-40" />
                <div>
                  <p className="font-semibold text-[var(--text)]">Aucune recette</p>
                  <p className="text-sm text-[var(--text-dim)] mt-1">
                    Importez depuis le catalogue ou créez la vôtre
                  </p>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => handleTabSwitch('catalog')}
                    className="btn-ghost px-4 py-2 text-sm"
                  >
                    Voir le catalogue
                  </button>
                  <Link href="/recipes/new" className="btn-primary px-4 py-2 text-sm">
                    <Plus size={14} />
                    Nouvelle recette
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredRecipes.map((recipe) => {
                  const method = recipe.metadata?.method;
                  const methodStr = Array.isArray(method) ? method.join(', ') : method;
                  const typeLabel = TYPE_LABELS[recipe.type] ?? recipe.type;
                  const typeColor = TYPE_COLORS[recipe.type] ?? 'text-[var(--text-dim)] bg-[var(--surface2)]';
                  const spiritLabel = recipe.metadata?.spiritFamily
                    ? SPIRIT_LABELS[recipe.metadata.spiritFamily]
                    : null;
                  return (
                    <div
                      key={recipe.id}
                      className="card hover:border-[var(--gold-dim)] transition-colors relative"
                    >
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="block active:scale-[0.98] transition-transform"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2 pr-8">
                          <h3 className="font-semibold text-[var(--text)] text-sm leading-tight">
                            {recipe.data.name}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0">
                            {spiritLabel && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-[var(--gold)] bg-[var(--gold)]/10">
                                {spiritLabel}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor}`}>
                              {typeLabel}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--text-dim)]">
                          {methodStr && (
                            <span className="truncate max-w-[120px]">{methodStr}</span>
                          )}
                          <span>{recipe.data.ingredients.length} ingrédient{recipe.data.ingredients.length !== 1 ? 's' : ''}</span>
                        </div>
                      </Link>
                      <Link
                        href={`/recipes/${recipe.id}/edit`}
                        className="absolute top-3 right-3 p-1.5 text-[var(--text-dim)] hover:text-[var(--gold)] transition-colors"
                        aria-label="Modifier"
                      >
                        <Pencil size={14} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'homemade' && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
              <input
                type="text"
                placeholder="Rechercher une préparation…"
                value={homemadeSearch}
                onChange={(e) => setHomemadeSearch(e.target.value)}
                className="field-input pl-9"
              />
            </div>

            {filteredHomemade.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <FlaskConical size={40} className="text-[var(--text-dim)] opacity-40" />
                <div>
                  <p className="font-semibold text-[var(--text)]">Aucune préparation maison</p>
                  <p className="text-sm text-[var(--text-dim)] mt-1">
                    Créez un ingrédient de type "Préparation maison" dans vos stocks
                  </p>
                </div>
                <Link href="/ingredients/new" className="btn-primary px-4 py-2 text-sm">
                  <Plus size={14} />
                  Nouvelle préparation
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredHomemade.map((item) => {
                  const d = item.data;
                  const compCount = d.composition?.length ?? 0;
                  const stock = d.stock ?? 0;
                  const isMultiOutput = d.isPreparation && d.outputs && d.outputs.length > 0;
                  return (
                    <Link
                      key={item.id}
                      href={`/ingredients/${item.id}`}
                      className="card hover:border-[var(--gold-dim)] transition-colors block"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FlaskConical size={14} className="text-blue-400 shrink-0" />
                          <h3 className="font-semibold text-[var(--text)] text-sm truncate">{d.name}</h3>
                        </div>
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium text-blue-400 bg-blue-400/10">
                          {d.preparationType ? (PREP_TYPE_LABELS[d.preparationType] ?? d.preparationType) : 'Maison'}
                        </span>
                      </div>
                      {isMultiOutput ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {d.outputs!.map((o) => (
                            <span key={o.name} className="text-xs bg-blue-400/10 text-blue-300 px-2 py-0.5 rounded-full">
                              {o.name} · {o.qty} {o.unit}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
                            <span>{compCount} ingrédient{compCount !== 1 ? 's' : ''}</span>
                            <span>
                              Stock : <span className={stock > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {stock > 0 ? `${stock} ${d.yieldUnit ?? d.unit ?? ''}` : 'Épuisé'}
                              </span>
                            </span>
                          </div>
                          {d.yield && d.yield > 0 && (
                            <p className="text-xs text-[var(--text-dim)] mt-1">
                              Rendement : {d.yield} {d.yieldUnit}
                            </p>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
              <input
                type="text"
                placeholder="Rechercher dans le catalogue…"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="field-input pl-9"
              />
            </div>

            {catalogLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!catalogLoading && catalogFetched && filteredCatalog.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                <Package size={40} className="text-[var(--text-dim)] opacity-40" />
                <p className="text-sm text-[var(--text-dim)]">Aucun résultat</p>
              </div>
            )}

            {!catalogLoading && filteredCatalog.length > 0 && (
              <div className="space-y-2">
                {filteredCatalog.map((cocktail) => {
                  const isImported = imported.has(cocktail.name.toLowerCase());
                  const isImporting = importing.has(cocktail.id);
                  return (
                    <div key={cocktail.id} className="card flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--text)] text-sm truncate">
                          {cocktail.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-dim)]">
                          {cocktail.glass && <span className="truncate max-w-[80px]">{cocktail.glass}</span>}
                          {cocktail.method && <span className="truncate max-w-[80px]">{cocktail.method}</span>}
                          <span>{cocktail.ingredients.length} ing.</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleImport(cocktail)}
                        disabled={isImported || isImporting}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isImported
                            ? 'bg-emerald-400/10 text-emerald-400 cursor-default'
                            : 'btn-primary'
                        }`}
                      >
                        {isImporting ? (
                          <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : isImported ? (
                          <>
                            <Check size={12} />
                            Importée
                          </>
                        ) : (
                          <>
                            <Download size={12} />
                            Importer
                          </>
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
