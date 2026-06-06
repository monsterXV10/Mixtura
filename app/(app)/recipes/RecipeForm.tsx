'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ensureIngredients, matchesIngredient } from '@/lib/utils/ingredients';
import type { UserIngredientOption } from '@/lib/utils/ingredients';
import { Plus, Trash2, Loader2, FlaskConical, Timer, X, BookOpen, Milk, GlassWater } from 'lucide-react';

const METHOD_TIMER_DEFAULTS: Record<string, number> = {
  'Shake': 10,
  'Shake + Double Strain': 12,
  'Stir': 30,
  'Throw': 20,
  'Blend': 30,
};

export type { UserIngredientOption };

export interface UserRecipeOption {
  id: string;
  name: string;
  recipeType: string;
}

interface RecipeIngredientRow {
  ingredientId?: string;
  recipeRef?: string;
  qty: number;
  name: string;
  unit: string;
  type?: string;
  homemade?: boolean;
  alternatives?: Array<{ ingredientId?: string; name: string }>;
}

const SPIRIT_CATEGORIES = [
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

interface RecipeFormProps {
  initialData?: {
    id: string;
    name: string;
    type: 'cocktail' | 'coffee' | 'cuisine' | 'service' | 'milk_punch';
    ingredients: RecipeIngredientRow[];
    steps: string;
    glass: string;
    method: string;
    garnish: string;
    spiritFamily: string;
    timerSeconds: number;
    clarifyingAgent?: string;
    clarifyingAgentId?: string;
    clarifyingPct?: number;
  };
  userIngredients: UserIngredientOption[];
  userRecipes?: UserRecipeOption[];
  userId: string;
}

const UNITS = [
  'ml', 'cl', 'L', 'g', 'kg', 'dash', 'barspoon',
  'pcs', '%', 'trait', 'goutte', 'feuille',
];

const GLASSES = [
  'Coupe', 'Highball', 'Old Fashioned', 'Martini', 'Collins',
  'Wine Glass', 'Champagne Flute', 'Mule Cup', 'Nick & Nora',
  'Hurricane', 'Tiki', 'Sling', 'Shot',
];

const METHODS = [
  'Shake', 'Stir', 'Build', 'Blend', 'Throw',
  'Muddle', 'Direct', 'Shake + Double Strain',
];

const EMPTY_ROW: RecipeIngredientRow = { qty: 0, name: '', unit: 'cl' };

export default function RecipeForm({ initialData, userIngredients, userRecipes = [], userId }: RecipeFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<'cocktail' | 'coffee' | 'cuisine' | 'service' | 'milk_punch'>(initialData?.type ?? 'cocktail');
  const [ingredients, setIngredients] = useState<RecipeIngredientRow[]>(
    initialData?.ingredients?.length ? initialData.ingredients : [{ ...EMPTY_ROW }]
  );
  const [steps, setSteps] = useState(initialData?.steps ?? '');
  const [glass, setGlass] = useState(initialData?.glass ?? '');
  const [method, setMethod] = useState(initialData?.method ?? '');
  const [garnish, setGarnish] = useState(initialData?.garnish ?? '');
  const [spiritFamily, setSpiritFamily] = useState(initialData?.spiritFamily ?? '');
  const [timerSeconds, setTimerSeconds] = useState(initialData?.timerSeconds ?? 0);
  const [clarifyingAgent, setClarifyingAgent] = useState(initialData?.clarifyingAgent ?? '');
  const [clarifyingAgentId, setClarifyingAgentId] = useState<string | undefined>(initialData?.clarifyingAgentId);
  const [clarifyingPct, setClarifyingPct] = useState(initialData?.clarifyingPct ?? 15);
  const [clarSuggestions, setClarSuggestions] = useState<UserIngredientOption[]>([]);
  const [clarActive, setClarActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [suggestions, setSuggestions] = useState<UserIngredientOption[]>([]);
  const [recipeSuggestions, setRecipeSuggestions] = useState<UserRecipeOption[]>([]);
  const [activeTarget, setActiveTarget] = useState<{ row: number; alt: number | null } | null>(null);

  function handleBlur() {
    setTimeout(() => { setSuggestions([]); setRecipeSuggestions([]); setActiveTarget(null); }, 150);
  }

  function filterSuggestions(value: string) {
    return userIngredients
      .filter((ing) => matchesIngredient(ing, value))
      .filter((ing) => !ing.isPreparation)
      .slice(0, 6);
  }

  function filterRecipeSuggestions(value: string): UserRecipeOption[] {
    const q = value.toLowerCase();
    return userRecipes.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 4);
  }

  function handleNameChange(index: number, value: string) {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: value, ingredientId: undefined };
      return updated;
    });
    if (!value.trim()) { setSuggestions([]); setRecipeSuggestions([]); setActiveTarget(null); return; }
    setSuggestions(filterSuggestions(value));
    setRecipeSuggestions(filterRecipeSuggestions(value));
    setActiveTarget({ row: index, alt: null });
  }

  function handleAlternativeNameChange(rowIndex: number, altIndex: number, value: string) {
    setIngredients((prev) => {
      const updated = [...prev];
      const alts = [...(updated[rowIndex].alternatives ?? [])];
      alts[altIndex] = { ...alts[altIndex], name: value, ingredientId: undefined };
      updated[rowIndex] = { ...updated[rowIndex], alternatives: alts };
      return updated;
    });
    if (!value.trim()) { setSuggestions([]); setRecipeSuggestions([]); setActiveTarget(null); return; }
    setSuggestions(filterSuggestions(value));
    setActiveTarget({ row: rowIndex, alt: altIndex });
  }

  function handleSuggestionPick(rowIndex: number, altIndex: number | null, option: UserIngredientOption) {
    setIngredients((prev) => {
      const updated = [...prev];
      if (altIndex === null) {
        updated[rowIndex] = {
          ...updated[rowIndex],
          ingredientId: option.id,
          name: option.name,
          unit: option.unit,
          type: option.type,
          homemade: option.homemade,
        };
      } else {
        const alts = [...(updated[rowIndex].alternatives ?? [])];
        alts[altIndex] = { ingredientId: option.id, name: option.name };
        updated[rowIndex] = { ...updated[rowIndex], alternatives: alts };
      }
      return updated;
    });
    setSuggestions([]);
    setActiveTarget(null);
  }

  function handleRecipePick(rowIndex: number, option: UserRecipeOption) {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        recipeRef: option.id,
        ingredientId: undefined,
        name: option.name,
        unit: 'ml',
        type: 'recipe',
        homemade: false,
      };
      return updated;
    });
    setSuggestions([]);
    setRecipeSuggestions([]);
    setActiveTarget(null);
  }

  function addAlternative(rowIndex: number) {
    setIngredients((prev) => {
      const updated = [...prev];
      const alts = [...(updated[rowIndex].alternatives ?? []), { name: '' }];
      updated[rowIndex] = { ...updated[rowIndex], alternatives: alts };
      return updated;
    });
  }

  function removeAlternative(rowIndex: number, altIndex: number) {
    setIngredients((prev) => {
      const updated = [...prev];
      const alts = (updated[rowIndex].alternatives ?? []).filter((_, i) => i !== altIndex);
      updated[rowIndex] = { ...updated[rowIndex], alternatives: alts.length ? alts : undefined };
      return updated;
    });
  }

  function updateRow<K extends keyof RecipeIngredientRow>(
    index: number, key: K, value: RecipeIngredientRow[K]
  ) {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  function dotColor(row: RecipeIngredientRow): string {
    if (!row.name.trim()) return '';
    if (row.type === 'recipe') return 'bg-purple-400';
    if (row.ingredientId) {
      const opt = userIngredients.find((i) => i.id === row.ingredientId);
      return opt?.homemade ? 'bg-blue-400' : 'bg-emerald-400';
    }
    const linkedAlt = row.alternatives?.find(a => a.ingredientId);
    if (linkedAlt) {
      const opt = userIngredients.find((i) => i.id === linkedAlt.ingredientId);
      return opt?.homemade ? 'bg-blue-400' : 'bg-emerald-400';
    }
    return 'bg-orange-400';
  }

  function altDotColor(alt: { ingredientId?: string; name: string }): string {
    if (!alt.name.trim()) return '';
    if (alt.ingredientId) {
      const opt = userIngredients.find((i) => i.id === alt.ingredientId);
      return opt?.homemade ? 'bg-blue-400' : 'bg-emerald-400';
    }
    return 'bg-orange-400';
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Le nom est requis.'); return; }
    setSaving(true);
    setError('');

    const supabase = createClient();

    const ingredientRows = await ensureIngredients(
      supabase,
      userId,
      ingredients.filter((i) => i.name.trim())
    );

    const payload = {
      user_id: userId,
      type,
      data: {
        name: name.trim(),
        steps,
        ingredients: ingredientRows,
        timerSeconds: timerSeconds > 0 ? timerSeconds : undefined,
      },
      metadata: type === 'cocktail'
        ? { glass, method, garnish, spiritFamily: spiritFamily || undefined }
        : type === 'service'
        ? { glass: glass || undefined, garnish: garnish || undefined }
        : type === 'milk_punch'
        ? { glass: glass || undefined, garnish: garnish || undefined, clarifyingAgent: clarifyingAgent || undefined, clarifyingAgentId: clarifyingAgentId || undefined, clarifyingPct: clarifyingPct > 0 ? clarifyingPct : 15 }
        : {},
      updated_at: new Date().toISOString(),
    };

    const result = initialData
      ? await supabase.from('recipes').update(payload).eq('id', initialData.id).eq('user_id', userId)
      : await supabase.from('recipes').insert(payload);

    if (result.error) {
      setError('Erreur lors de la sauvegarde.');
      setSaving(false);
    } else {
      router.push('/recipes');
      router.refresh();
    }
  };

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Nom</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la recette"
          className="field-input"
        />
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Type</label>
        <div className="flex flex-wrap gap-2">
          {([
            ['cocktail', 'Cocktail'],
            ['coffee', 'Café'],
            ['cuisine', 'Cuisine'],
            ['service', 'Service'],
            ['milk_punch', 'Milk Punch'],
          ] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setType(v)}
              className={`flex-1 min-w-[calc(33%-4px)] py-2 text-sm font-medium rounded-lg border transition-all ${
                type === v
                  ? 'bg-[var(--gold)] text-[#0A0E1A] border-[var(--gold)]'
                  : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--gold-dim)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Ingrédients</label>
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Stock</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Maison</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Recette</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Nouveau</span>
          </div>
        </div>

        <div className="space-y-3">
          {ingredients.map((row, index) => {
            const dot = dotColor(row);
            const isMainActive = activeTarget?.row === index && activeTarget.alt === null;

            return (
              <div key={index} className="card p-3 space-y-2">
                {/* Row 1: Name + delete */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      onFocus={() => row.name.trim() && handleNameChange(index, row.name)}
                      onBlur={handleBlur}
                      placeholder="Nom de l'ingrédient"
                      className="field-input pr-7 w-full"
                    />
                    {row.name.trim() && dot && (
                      <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dot}`} />
                    )}
                    {isMainActive && (suggestions.length > 0 || recipeSuggestions.length > 0) && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 card p-1 shadow-lg max-h-64 overflow-y-auto">
                        {suggestions.map((opt) => {
                          const subtitle = [opt.brand, opt.family].filter(Boolean).join(' · ');
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); handleSuggestionPick(index, null, opt); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface2)] rounded-md transition-colors text-left"
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${opt.homemade ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                              <span className="flex-1 min-w-0">
                                <span className="block truncate">{opt.name}</span>
                                {subtitle && (
                                  <span className="block text-xs text-[var(--text-dim)] truncate">{subtitle}</span>
                                )}
                              </span>
                              {opt.homemade && <FlaskConical size={12} className="text-blue-400 shrink-0" />}
                            </button>
                          );
                        })}
                        {recipeSuggestions.length > 0 && (
                          <>
                            {suggestions.length > 0 && <div className="my-1 border-t border-[var(--border)]" />}
                            <p className="px-3 py-1 text-[10px] font-medium text-[var(--text-dim)] uppercase tracking-wide">Recettes</p>
                            {recipeSuggestions.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); handleRecipePick(index, r); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface2)] rounded-md transition-colors text-left"
                              >
                                <span className="w-2 h-2 rounded-full shrink-0 bg-purple-400" />
                                <span className="flex-1 truncate">{r.name}</span>
                                <BookOpen size={12} className="text-purple-400 shrink-0" />
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== index))}
                    className="shrink-0 p-2 text-[var(--text-dim)] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Alternatives */}
                {(row.alternatives ?? []).map((alt, altIdx) => {
                  const aDot = altDotColor(alt);
                  const isAltActive = activeTarget?.row === index && activeTarget.alt === altIdx;
                  return (
                    <div key={altIdx} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--text-dim)] shrink-0 pl-1 w-5 text-center">ou</span>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={alt.name}
                          onChange={(e) => handleAlternativeNameChange(index, altIdx, e.target.value)}
                          onFocus={() => alt.name.trim() && handleAlternativeNameChange(index, altIdx, alt.name)}
                          onBlur={handleBlur}
                          placeholder="Ingrédient alternatif…"
                          className="field-input pr-7 w-full text-sm"
                        />
                        {alt.name.trim() && aDot && (
                          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${aDot}`} />
                        )}
                        {isAltActive && suggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-50 card p-1 shadow-lg">
                            {suggestions.map((opt) => {
                              const subtitle = [opt.brand, opt.family].filter(Boolean).join(' · ');
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); handleSuggestionPick(index, altIdx, opt); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface2)] rounded-md transition-colors text-left"
                                >
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${opt.homemade ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                                  <span className="flex-1 min-w-0">
                                    <span className="block truncate">{opt.name}</span>
                                    {subtitle && (
                                      <span className="block text-xs text-[var(--text-dim)] truncate">{subtitle}</span>
                                    )}
                                  </span>
                                  {opt.homemade && <FlaskConical size={12} className="text-blue-400 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAlternative(index, altIdx)}
                        className="shrink-0 p-1.5 text-[var(--text-dim)] hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}

                {/* Add alternative */}
                <button
                  type="button"
                  onClick={() => addAlternative(index)}
                  className="text-xs text-[var(--text-dim)] hover:text-[var(--gold)] transition-colors flex items-center gap-1 pl-1"
                >
                  <Plus size={11} />
                  ou…
                </button>

                {/* Row 2: Qty + Unit */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-[var(--text-dim)] mb-1 block">Quantité</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={row.qty === 0 ? '' : row.qty}
                      onChange={(e) => updateRow(index, 'qty', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="field-input w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-[var(--text-dim)] mb-1 block">Unité</label>
                    <select
                      value={row.unit}
                      onChange={(e) => updateRow(index, 'unit', e.target.value)}
                      className="field-input w-full"
                    >
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIngredients((prev) => [...prev, { ...EMPTY_ROW }])}
          className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-1.5"
        >
          <Plus size={15} />
          Ajouter un ingrédient
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Préparation</label>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="Instructions pas à pas…"
          rows={5}
          className="field-input resize-none"
        />
      </div>

      {/* Timer */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide flex items-center gap-1.5">
          <Timer size={12} />
          Minuteur (optionnel)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="1"
            value={timerSeconds || ''}
            onChange={(e) => setTimerSeconds(parseInt(e.target.value) || 0)}
            placeholder="0"
            className="field-input w-24"
          />
          <span className="text-sm text-[var(--text-dim)]">secondes</span>
          {type === 'cocktail' && method && METHOD_TIMER_DEFAULTS[method] && (
            <button
              type="button"
              onClick={() => setTimerSeconds(METHOD_TIMER_DEFAULTS[method])}
              className="text-xs text-[var(--gold)] hover:underline ml-1"
            >
              ← {method} : {METHOD_TIMER_DEFAULTS[method]}s
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--text-dim)]">Affiché comme minuteur interactif dans la recette</p>
      </div>

      {/* Milk Punch — casse section */}
      {type === 'milk_punch' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <Milk size={14} className="text-purple-400" />
            Casse (clarification)
          </h3>

          {/* Clarifying agent picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Ingrédient de casse</label>
            <div className="relative">
              <input
                type="text"
                value={clarifyingAgent}
                onChange={(e) => {
                  const v = e.target.value;
                  setClarifyingAgent(v);
                  setClarifyingAgentId(undefined);
                  setClarSuggestions(v.trim() ? userIngredients.filter((i) => matchesIngredient(i, v) && !i.isPreparation).slice(0, 6) : []);
                  setClarActive(true);
                }}
                onFocus={() => clarifyingAgent.trim() && setClarActive(true)}
                onBlur={() => setTimeout(() => { setClarSuggestions([]); setClarActive(false); }, 150)}
                placeholder="ex. Lait entier, Lait de coco…"
                className="field-input w-full"
              />
              {clarActive && clarSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 card p-1 shadow-lg">
                  {clarSuggestions.map((opt) => (
                    <button key={opt.id} type="button"
                      onMouseDown={(e) => { e.preventDefault(); setClarifyingAgent(opt.name); setClarifyingAgentId(opt.id); setClarSuggestions([]); setClarActive(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface2)] rounded-md transition-colors text-left">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${opt.homemade ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                      <span className="truncate">{opt.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* % input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">% du volume total de la préparation</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={clarifyingPct}
                onChange={(e) => setClarifyingPct(parseFloat(e.target.value) || 0)}
                className="field-input w-24"
              />
              <span className="text-sm text-[var(--text-dim)]">%</span>
            </div>
          </div>

          {/* Calculated quantity */}
          {(() => {
            const totalMl = ingredients.reduce((s, i) => {
              const q = i.qty;
              if (i.unit === 'ml') return s + q;
              if (i.unit === 'cl') return s + q * 10;
              if (i.unit === 'L') return s + q * 1000;
              return s;
            }, 0);
            if (totalMl <= 0) return null;
            const qty = Math.round(totalMl * clarifyingPct / 100 * 10) / 10;
            return (
              <div className="bg-purple-400/10 border border-purple-400/20 rounded-lg px-3 py-2.5 space-y-1">
                <p className="text-xs text-[var(--text-dim)]">Volume liquide estimé : {totalMl} ml</p>
                <p className="text-sm font-semibold text-purple-400">
                  {clarifyingAgent || 'Ingrédient de casse'} : <span className="font-mono">{qty} ml</span>
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Service & Milk Punch — verre + garniture */}
      {(type === 'service' || type === 'milk_punch') && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <GlassWater size={14} className="text-[var(--gold)]" />
            {type === 'service' ? 'Détails service' : 'Service'}
          </h3>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Verre</label>
            <select value={glass} onChange={(e) => setGlass(e.target.value)} className="field-input">
              <option value="">— Choisir un verre —</option>
              {GLASSES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Garniture</label>
            <input type="text" value={garnish} onChange={(e) => setGarnish(e.target.value)} placeholder="ex. Zeste de citron" className="field-input" />
          </div>
        </div>
      )}

      {/* Cocktail details */}
      {type === 'cocktail' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text)]">Détails cocktail</h3>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Verre</label>
            <select value={glass} onChange={(e) => setGlass(e.target.value)} className="field-input">
              <option value="">— Choisir un verre —</option>
              {GLASSES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Méthode</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="field-input">
              <option value="">— Choisir une méthode —</option>
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Garniture</label>
            <input
              type="text"
              value={garnish}
              onChange={(e) => setGarnish(e.target.value)}
              placeholder="ex. Zeste de citron"
              className="field-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Spiritueux principal</label>
            <div className="flex flex-wrap gap-2">
              {SPIRIT_CATEGORIES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSpiritFamily(spiritFamily === s.key ? '' : s.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    spiritFamily === s.key
                      ? 'bg-[var(--gold)] text-[#0A0E1A] border-[var(--gold)]'
                      : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--gold-dim)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
      >
        {saving ? <><Loader2 size={16} className="animate-spin" />Enregistrement…</> : 'Enregistrer'}
      </button>
    </div>
  );
}
