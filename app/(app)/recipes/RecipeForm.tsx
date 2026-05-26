'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface RecipeFormProps {
  initialData?: {
    id: string;
    name: string;
    type: 'cocktail' | 'coffee' | 'cuisine';
    ingredients: Array<{ qty: number; name: string; unit: string }>;
    steps: string;
    glass: string;
    method: string;
    garnish: string;
  };
  userIngredients: Array<{ name: string; unit: string }>;
  userId: string;
}

interface Ingredient {
  qty: number;
  name: string;
  unit: string;
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

const EMPTY_INGREDIENT: Ingredient = { qty: 0, name: '', unit: 'cl' };

export default function RecipeForm({ initialData, userIngredients, userId }: RecipeFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<'cocktail' | 'coffee' | 'cuisine'>(initialData?.type ?? 'cocktail');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients && initialData.ingredients.length > 0
      ? initialData.ingredients
      : [{ ...EMPTY_INGREDIENT }]
  );
  const [steps, setSteps] = useState(initialData?.steps ?? '');
  const [glass, setGlass] = useState(initialData?.glass ?? '');
  const [method, setMethod] = useState(initialData?.method ?? '');
  const [garnish, setGarnish] = useState(initialData?.garnish ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIngredientIndex, setActiveIngredientIndex] = useState<number | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setSuggestions([]);
        setActiveIngredientIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleIngredientNameChange(index: number, value: string) {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: value };
      return updated;
    });

    if (value.trim().length === 0) {
      setSuggestions([]);
      setActiveIngredientIndex(null);
      return;
    }

    const q = value.toLowerCase();
    const filtered = userIngredients
      .filter((ing) => ing.name.toLowerCase().includes(q))
      .slice(0, 6)
      .map((ing) => ing.name);

    setSuggestions(filtered);
    setActiveIngredientIndex(index);
  }

  function handleSuggestionClick(ingredientIndex: number, suggestedName: string) {
    const match = userIngredients.find(
      (ing) => ing.name.toLowerCase() === suggestedName.toLowerCase()
    );
    setIngredients((prev) => {
      const updated = [...prev];
      updated[ingredientIndex] = {
        ...updated[ingredientIndex],
        name: suggestedName,
        unit: match?.unit ?? updated[ingredientIndex].unit,
      };
      return updated;
    });
    setSuggestions([]);
    setActiveIngredientIndex(null);
  }

  function isExistingIngredient(ingredientName: string): boolean {
    return userIngredients.some(
      (ing) => ing.name.toLowerCase() === ingredientName.toLowerCase()
    );
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }]);
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateIngredient<K extends keyof Ingredient>(
    index: number,
    key: K,
    value: Ingredient[K]
  ) {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom est requis.');
      return;
    }
    setSaving(true);
    setError('');

    const supabase = createClient();

    const payload = {
      user_id: userId,
      type,
      data: {
        id: initialData?.id ?? crypto.randomUUID(),
        name: name.trim(),
        steps,
        ingredients: ingredients.filter((i) => i.name.trim()),
      },
      metadata: type === 'cocktail' ? { glass, method, garnish } : {},
      updated_at: new Date().toISOString(),
    };

    let err: { message: string } | null = null;

    if (initialData) {
      const result = await supabase
        .from('recipes')
        .update(payload)
        .eq('id', initialData.id)
        .eq('user_id', userId);
      err = result.error;
    } else {
      const result = await supabase.from('recipes').insert(payload);
      err = result.error;
    }

    if (err) {
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
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Nom
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la recette"
          className="field-input"
          required
        />
      </div>

      {/* Type selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Type
        </label>
        <div className="flex gap-2">
          {(
            [
              { value: 'cocktail', label: 'Cocktail' },
              { value: 'coffee', label: 'Café' },
              { value: 'cuisine', label: 'Cuisine' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                type === opt.value
                  ? 'bg-[var(--gold)] text-[#0A0E1A] border-[var(--gold)]'
                  : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--gold-dim)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Ingrédients
        </label>
        <div className="space-y-2">
          {ingredients.map((ing, index) => {
            const existing = ing.name.trim() ? isExistingIngredient(ing.name) : null;
            const showSuggestions =
              activeIngredientIndex === index && suggestions.length > 0;

            return (
              <div key={index} className="relative">
                <div className="flex gap-2 items-center">
                  {/* Qty */}
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={ing.qty === 0 ? '' : ing.qty}
                    onChange={(e) =>
                      updateIngredient(index, 'qty', parseFloat(e.target.value) || 0)
                    }
                    placeholder="Qté"
                    className="field-input w-20 shrink-0"
                  />

                  {/* Name with dot indicator */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => handleIngredientNameChange(index, e.target.value)}
                      onFocus={() => {
                        if (ing.name.trim()) {
                          handleIngredientNameChange(index, ing.name);
                        }
                      }}
                      placeholder="Ingrédient"
                      className="field-input pr-7 w-full"
                    />
                    {ing.name.trim() && (
                      <span
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                          existing ? 'bg-emerald-400' : 'bg-orange-400'
                        }`}
                      />
                    )}
                  </div>

                  {/* Unit */}
                  <select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    className="field-input w-24 shrink-0"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="shrink-0 p-2 text-[var(--text-dim)] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Autocomplete dropdown */}
                {showSuggestions && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-[88px] right-[120px] top-full mt-1 z-50 card p-1 shadow-lg"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    {suggestions.map((s) => {
                      const isEx = isExistingIngredient(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSuggestionClick(index, s);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface2)] rounded-md transition-colors text-left"
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isEx ? 'bg-emerald-400' : 'bg-orange-400'
                            }`}
                          />
                          {s}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addIngredient}
          className="btn-ghost w-full py-2 text-sm flex items-center justify-center gap-1.5"
        >
          <Plus size={15} />
          Ajouter un ingrédient
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Préparation
        </label>
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

          {/* Glass */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
              Verre
            </label>
            <select
              value={glass}
              onChange={(e) => setGlass(e.target.value)}
              className="field-input"
            >
              <option value="">— Choisir un verre —</option>
              {GLASSES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
              Méthode
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="field-input"
            >
              <option value="">— Choisir une méthode —</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Garnish */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
              Garniture
            </label>
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

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Enregistrement…
          </>
        ) : (
          'Enregistrer'
        )}
      </button>
    </div>
  );
}
