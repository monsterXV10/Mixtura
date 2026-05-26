'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Loader2, FlaskConical } from 'lucide-react';
import type { UserIngredientOption } from '@/app/(app)/recipes/RecipeForm';

interface CompositionRow {
  ingredientId?: string;
  name: string;
  qty: number;
  unit: string;
}

interface IngredientFormProps {
  userId: string;
  userIngredients: UserIngredientOption[];
  initialData?: {
    id: string;
    name: string;
    type: string;
    unit: string;
    price: number;
    stock: number;
    format: number;
    homemade: boolean;
    composition?: CompositionRow[];
    yield?: number;
    yieldUnit?: string;
    steps?: string;
  };
}

const INGREDIENT_TYPES = [
  { key: 'spirit', label: 'Spiritueux' },
  { key: 'liqueur', label: 'Liqueur' },
  { key: 'wine', label: 'Vin' },
  { key: 'syrup', label: 'Sirop' },
  { key: 'juice', label: 'Jus' },
  { key: 'fresh', label: 'Frais' },
  { key: 'dry', label: 'Sec' },
  { key: 'other', label: 'Autre' },
];

const UNITS = ['cl', 'ml', 'L', 'g', 'kg', 'pcs', 'dash', 'barspoon', '%'];

const EMPTY_COMP: CompositionRow = { name: '', qty: 0, unit: 'cl' };

export default function IngredientForm({ userId, userIngredients, initialData }: IngredientFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState(initialData?.type ?? 'spirit');
  const [unit, setUnit] = useState(initialData?.unit ?? 'cl');
  const [price, setPrice] = useState(initialData?.price ?? 0);
  const [stock, setStock] = useState(initialData?.stock ?? 0);
  const [format, setFormat] = useState(initialData?.format ?? 70);
  const [homemade, setHomemade] = useState(initialData?.homemade ?? false);
  const [composition, setComposition] = useState<CompositionRow[]>(
    initialData?.composition?.length ? initialData.composition : [{ ...EMPTY_COMP }]
  );
  const [yieldAmt, setYieldAmt] = useState(initialData?.yield ?? 0);
  const [yieldUnit, setYieldUnit] = useState(initialData?.yieldUnit ?? 'cl');
  const [steps, setSteps] = useState(initialData?.steps ?? '');
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

  function handleCompNameChange(index: number, value: string) {
    setComposition((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: value, ingredientId: undefined };
      return updated;
    });

    if (!value.trim()) { setSuggestions([]); setActiveIndex(null); return; }

    const q = value.toLowerCase();
    // Exclude self from suggestions to prevent direct self-reference
    const filtered = userIngredients
      .filter((i) => i.name.toLowerCase().includes(q) && i.name.toLowerCase() !== name.toLowerCase())
      .slice(0, 8);
    setSuggestions(filtered);
    setActiveIndex(index);
  }

  function pickSuggestion(rowIndex: number, opt: UserIngredientOption) {
    setComposition((prev) => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], ingredientId: opt.id, name: opt.name, unit: opt.unit };
      return updated;
    });
    setSuggestions([]);
    setActiveIndex(null);
  }

  function updateComp<K extends keyof CompositionRow>(index: number, key: K, value: CompositionRow[K]) {
    setComposition((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  function compDotColor(row: CompositionRow): string {
    if (!row.name.trim()) return '';
    if (row.ingredientId) {
      const opt = userIngredients.find((i) => i.id === row.ingredientId);
      return opt?.homemade ? 'bg-blue-400' : 'bg-emerald-400';
    }
    return 'bg-orange-400';
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Le nom est requis.'); return; }
    if (homemade && !composition.some((c) => c.name.trim())) {
      setError('Ajoutez au moins un ingrédient à la composition.');
      return;
    }
    setSaving(true);
    setError('');

    const supabase = createClient();

    const data = homemade
      ? {
          name: name.trim(),
          type: 'homemade',
          unit,
          price: 0,
          stock,
          format: 0,
          homemade: true,
          composition: composition.filter((c) => c.name.trim()),
          yield: yieldAmt,
          yieldUnit,
          steps: steps.trim() || undefined,
        }
      : {
          name: name.trim(),
          type,
          unit,
          price,
          stock,
          format,
          homemade: false,
        };

    const payload = {
      user_id: userId,
      data,
      updated_at: new Date().toISOString(),
    };

    const result = initialData
      ? await supabase.from('ingredients').update(payload).eq('id', initialData.id).eq('user_id', userId)
      : await supabase.from('ingredients').insert(payload);

    if (result.error) {
      setError('Erreur lors de la sauvegarde.');
      setSaving(false);
    } else {
      window.location.href = '/ingredients';
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
          placeholder="ex. Campari, Sirop d'épices…"
          className="field-input"
        />
      </div>

      {/* Homemade toggle */}
      <div
        className={`card flex items-center justify-between cursor-pointer transition-all ${
          homemade ? 'border-blue-400/40 bg-blue-400/5' : ''
        }`}
        onClick={() => setHomemade((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <FlaskConical size={18} className={homemade ? 'text-blue-400' : 'text-[var(--text-dim)]'} />
          <div>
            <p className="text-sm font-medium text-[var(--text)]">Préparation maison</p>
            <p className="text-xs text-[var(--text-dim)]">Sirop, infusion, batch, etc.</p>
          </div>
        </div>
        <div className={`w-10 h-6 rounded-full transition-colors relative ${homemade ? 'bg-blue-500' : 'bg-[var(--surface2)]'}`}>
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
              homemade ? 'left-5' : 'left-1'
            }`}
          />
        </div>
      </div>

      {!homemade && (
        <>
          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {INGREDIENT_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    type === t.key
                      ? 'bg-[var(--gold)] text-[#0A0E1A] border-[var(--gold)]'
                      : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--gold-dim)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Unit + Format */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Unité</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="field-input">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Format (bouteille)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={format === 0 ? '' : format}
                onChange={(e) => setFormat(parseFloat(e.target.value) || 0)}
                placeholder="ex. 70"
                className="field-input"
              />
            </div>
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Prix achat (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price === 0 ? '' : price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="field-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Stock actuel</label>
              <input
                type="number"
                min="0"
                step="any"
                value={stock === 0 ? '' : stock}
                onChange={(e) => setStock(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="field-input"
              />
            </div>
          </div>
        </>
      )}

      {homemade && (
        <>
          {/* Composition */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Composition</label>
            <div className="space-y-2">
              {composition.map((row, index) => {
                const dot = compDotColor(row);
                const showDrop = activeIndex === index && suggestions.length > 0;

                return (
                  <div key={index} className="relative">
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.qty === 0 ? '' : row.qty}
                        onChange={(e) => updateComp(index, 'qty', parseFloat(e.target.value) || 0)}
                        placeholder="Qté"
                        className="field-input w-20 shrink-0"
                      />
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleCompNameChange(index, e.target.value)}
                          onFocus={() => row.name.trim() && handleCompNameChange(index, row.name)}
                          placeholder="Ingrédient"
                          className="field-input pr-7 w-full"
                        />
                        {row.name.trim() && dot && (
                          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dot}`} />
                        )}
                      </div>
                      <select
                        value={row.unit}
                        onChange={(e) => updateComp(index, 'unit', e.target.value)}
                        className="field-input w-24 shrink-0"
                      >
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => setComposition((prev) => prev.filter((_, i) => i !== index))}
                        className="shrink-0 p-2 text-[var(--text-dim)] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {showDrop && (
                      <div
                        ref={dropdownRef}
                        className="absolute left-[88px] right-[120px] top-full mt-1 z-50 card p-1 shadow-lg"
                      >
                        {suggestions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); pickSuggestion(index, opt); }}
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
              onClick={() => setComposition((prev) => [...prev, { ...EMPTY_COMP }])}
              className="btn-ghost w-full py-2 text-sm flex items-center justify-center gap-1.5"
            >
              <Plus size={15} />
              Ajouter un ingrédient
            </button>
          </div>

          {/* Yield */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Rendement (produit)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={yieldAmt === 0 ? '' : yieldAmt}
                onChange={(e) => setYieldAmt(parseFloat(e.target.value) || 0)}
                placeholder="ex. 50"
                className="field-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Unité du rendement</label>
              <select value={yieldUnit} onChange={(e) => setYieldUnit(e.target.value)} className="field-input">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Stock actuel ({yieldUnit || 'cl'})</label>
            <input
              type="number"
              min="0"
              step="any"
              value={stock === 0 ? '' : stock}
              onChange={(e) => setStock(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="field-input"
            />
          </div>

          {/* Unit */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Unité d'utilisation</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="field-input">
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Steps */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Instructions (optionnel)</label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="Procédé de fabrication…"
              rows={4}
              className="field-input resize-none"
            />
          </div>
        </>
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
