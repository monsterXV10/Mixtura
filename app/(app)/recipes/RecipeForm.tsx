'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Loader2, FlaskConical } from 'lucide-react';

export interface UserIngredientOption {
  id: string;
  name: string;
  unit: string;
  homemade?: boolean;
}

interface RecipeIngredientRow {
  ingredientId?: string;
  qty: number;
  name: string;
  unit: string;
}

interface RecipeFormProps {
  initialData?: {
    id: string;
    name: string;
    type: 'cocktail' | 'coffee' | 'cuisine';
    ingredients: RecipeIngredientRow[];
    steps: string;
    glass: string;
    method: string;
    garnish: string;
  };
  userIngredients: UserIngredientOption[];
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

export default function RecipeForm({ initialData, userIngredients, userId }: RecipeFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<'cocktail' | 'coffee' | 'cuisine'>(initialData?.type ?? 'cocktail');
  const [ingredients, setIngredients] = useState<RecipeIngredientRow[]>(
    initialData?.ingredients?.length ? initialData.ingredients : [{ ...EMPTY_ROW }]
  );
  const [steps, setSteps] = useState(initialData?.steps ?? '');
  const [glass, setGlass] = useState(initialData?.glass ?? '');
  const [method, setMethod] = useState(initialData?.method ?? '');
  const [garnish, setGarnish] = useState(initialData?.garnish ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [suggestions, setSuggestions] = useState<UserIngredientOption[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSuggestions([]);
        setActiveIndex(null);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleNameChange(index: number, value: string) {
    setIngredients((prev) => {
      const updated = [...prev];
      // Clear the linked id if user is editing the name manually
      updated[index] = { ...updated[index], name: value, ingredientId: undefined };
      return updated;
    });

    if (!value.trim()) {
      setSuggestions([]);
      setActiveIndex(null);
      return;
    }

    const q = value.toLowerCase();
    const filtered = userIngredients
      .filter((ing) => ing.name.toLowerCase().includes(q))
      .slice(0, 8);

    setSuggestions(filtered);
    setActiveIndex(index);
  }

  function handleSuggestionPick(rowIndex: number, option: UserIngredientOption) {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        ingredientId: option.id,
        name: option.name,
        unit: option.unit,
      };
      return updated;
    });
    setSuggestions([]);
    setActiveIndex(null);
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
    if (row.ingredientId) {
      const opt = userIngredients.find((i) => i.id === row.ingredientId);
      if (opt?.homemade) return 'bg-blue-400';
      return 'bg-emerald-400';
    }
    return 'bg-orange-400';
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Le nom est requis.'); return; }
    setSaving(true);
    setError('');

    const supabase = createClient();

    const ingredientRows = ingredients.filter((i) => i.name.trim());

    const payload = {
      user_id: userId,
      type,
      data: {
        name: name.trim(),
        steps,
        ingredients: ingredientRows,
      },
      metadata: type === 'cocktail' ? { glass, method, garnish } : {},
      updated_at: new Date().toISOString(),
    };

    const result = initialData
      ? await supabase.from('recipes').update(payload).eq('id', initialData.id).eq('user_id', userId)
      : await supabase.from('recipes').insert(payload);

    if (result.error) {
      setError('Erreur lors de la sauvegarde.');
      setSaving(false);
    } else {
      window.location.href = '/recipes';
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
        <div className="flex gap-2">
          {(['cocktail', 'coffee', 'cuisine'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setType(v)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                type === v
                  ? 'bg-[var(--gold)] text-[#0A0E1A] border-[var(--gold)]'
                  : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--gold-dim)]'
              }`}
            >
              {v === 'cocktail' ? 'Cocktail' : v === 'coffee' ? 'Café' : 'Cuisine'}
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
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Nouveau</span>
          </div>
        </div>

        <div className="space-y-3">
          {ingredients.map((row, index) => {
            const dot = dotColor(row);
            const showDrop = activeIndex === index && suggestions.length > 0;

            return (
              <div key={index} className="card p-3 space-y-2 relative">
                {/* Row 1: Name + delete */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      onFocus={() => row.name.trim() && handleNameChange(index, row.name)}
                      placeholder="Nom de l'ingrédient"
                      className="field-input pr-7 w-full"
                    />
                    {row.name.trim() && dot && (
                      <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dot}`} />
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

                {/* Autocomplete dropdown */}
                {showDrop && (
                  <div ref={dropdownRef} className="absolute left-3 right-12 top-14 z-50 card p-1 shadow-lg">
                    {suggestions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleSuggestionPick(index, opt); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface2)] rounded-md transition-colors text-left"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${opt.homemade ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                        {opt.name}
                        {opt.homemade && <FlaskConical size={12} className="ml-auto text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
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
