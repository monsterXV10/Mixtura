'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { matchesIngredient, ensureIngredients } from '@/lib/utils/ingredients';
import { Plus, Trash2, Loader2, FlaskConical } from 'lucide-react';
import type { UserIngredientOption } from '@/lib/utils/ingredients';
import { getCategoryFieldConfig, type CategoryConfig } from '@/lib/config/categoryFields';

interface CompositionRow {
  ingredientId?: string;
  name: string;
  qty: number;
  unit: string;
}

interface OutputRow {
  tempId: string;
  name: string;
  qty: number;
  unit: string;
  ingredientId?: string;
}

interface IngredientFormProps {
  userId: string;
  userIngredients: UserIngredientOption[];
  visibleCategories?: string[] | null;
  categorySuggestions?: Record<string, string[]> | null;
  categoryConfig?: CategoryConfig | null;
  initialData?: {
    id: string;
    name: string;
    type: string;
    unit: string;
    price: number;
    stock: number;
    format: number;
    homemade: boolean;
    brand?: string;
    family?: string;
    supplier?: string;
    composition?: CompositionRow[];
    yield?: number;
    yieldUnit?: string;
    steps?: string;
    preparationType?: string;
    outputs?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
    temperature?: string;
    unlimitedStock?: boolean;
    expiryDate?: string;
    alcoholContent?: number;
    sugarRatio?: string;
    sugarRatioCustom?: string;
    quantityInBottle?: number;
    fruitLabel?: string;
    juicePerFruit?: number;
    yieldVariance?: number;
    weightConversion?: { referenceQty: number; grams: number };
  };
}

const PREP_TYPES = [
  { key: 'sirop', label: 'Sirop' },
  { key: 'infusion', label: 'Infusion' },
  { key: 'clarification', label: 'Clarification' },
  { key: 'fat-wash', label: 'Fat Wash' },
  { key: 'batch', label: 'Batch' },
  { key: 'teinture', label: 'Teinture' },
  { key: 'cordial', label: 'Cordial' },
  { key: 'puree', label: 'Purée' },
  { key: 'autre', label: 'Autre' },
];

const INGREDIENT_TYPES = [
  { key: 'spirit', label: 'Spiritueux' },
  { key: 'liqueur', label: 'Liqueur' },
  { key: 'wine', label: 'Vin' },
  { key: 'syrup', label: 'Sirop' },
  { key: 'juice', label: 'Jus' },
  { key: 'fresh', label: 'Frais' },
  { key: 'dry', label: 'Sec' },
  { key: 'water', label: 'Eau' },
  { key: 'other', label: 'Autre' },
];

const WATER_TEMP_SUGGESTIONS = ['Froide (0-4°C)', 'Ambiante (20°C)', 'Chaude (65°C)', 'Bouillante (95°C)'];

const UNITS = ['cl', 'ml', 'L', 'g', 'kg', 'pcs', 'dash', 'barspoon', '%'];

const DEFAULT_FAMILY_SUGGESTIONS: Record<string, string[]> = {
  spirit:  ['Whisky', 'Bourbon', 'Scotch', 'Gin', 'Vodka', 'Rhum', 'Tequila', 'Mezcal', 'Cognac', 'Armagnac', 'Calvados'],
  liqueur: ['Vermouth', 'Amaro', 'Triple Sec', 'Bitters', 'Campari', 'Cointreau', 'Chartreuse'],
  wine:    ['Champagne', 'Vin rouge', 'Vin blanc', 'Porto', 'Sherry', 'Prosecco'],
  syrup:   ['Sucre de canne', 'Orgeat', 'Grenadine', 'Fraise', 'Pêche', 'Citron', 'Menthe'],
  juice:   ['Citron', 'Citron vert', 'Orange', 'Pamplemousse', 'Ananas', 'Cranberry', 'Tomate'],
  fresh:   ['Citron', 'Citron vert', 'Orange', 'Menthe', 'Basilic', 'Concombre', 'Fraise'],
  dry:     ['Sel', 'Sucre', 'Poivre', 'Piment', 'Muscade', 'Cannelle'],
  other:   [],
};

const EMPTY_COMP: CompositionRow = { name: '', qty: 0, unit: 'cl' };

export default function IngredientForm({ userId, userIngredients, visibleCategories, categorySuggestions, categoryConfig, initialData }: IngredientFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState(initialData?.type ?? 'spirit');
  const [unit, setUnit] = useState(initialData?.unit ?? 'cl');
  const [price, setPrice] = useState(initialData?.price ?? 0);
  const [stock, setStock] = useState(initialData?.stock ?? 0);
  const [format, setFormat] = useState(initialData?.format ?? 70);
  const [homemade, setHomemade] = useState(initialData?.homemade ?? false);
  const [brand, setBrand] = useState(initialData?.brand ?? '');
  const [family, setFamily] = useState(initialData?.family ?? '');
  const [supplier, setSupplier] = useState(initialData?.supplier ?? '');
  const [composition, setComposition] = useState<CompositionRow[]>(
    initialData?.composition?.length ? initialData.composition : [{ ...EMPTY_COMP }]
  );
  const [yieldAmt, setYieldAmt] = useState(initialData?.yield ?? 0);
  const [yieldUnit, setYieldUnit] = useState(initialData?.yieldUnit ?? 'cl');
  const [steps, setSteps] = useState(initialData?.steps ?? '');
  const [preparationType, setPreparationType] = useState(initialData?.preparationType ?? '');

  // Sorties de la préparation (multi-output support)
  const [outputs, setOutputs] = useState<OutputRow[]>(() => {
    if (initialData?.outputs && initialData.outputs.length > 0) {
      return initialData.outputs.map((o, i) => ({
        tempId: `out-${i}`,
        name: o.name,
        qty: o.qty,
        unit: o.unit,
        ingredientId: o.ingredientId,
      }));
    }
    // Ancienne prépa ou nouvelle : 1 sortie vide par défaut
    return [{ tempId: 'out-0', name: '', qty: initialData?.yield ?? 50, unit: initialData?.yieldUnit ?? 'cl' }];
  });
  const [temperature, setTemperature] = useState(initialData?.temperature ?? '');
  // New configurable fields
  const [expiryDate,       setExpiryDate]       = useState(initialData?.expiryDate ?? '');
  const [alcoholContent,   setAlcoholContent]   = useState(initialData?.alcoholContent ?? 0);
  const [sugarRatio,       setSugarRatio]       = useState(initialData?.sugarRatio ?? '1:1');
  const [sugarRatioCustom, setSugarRatioCustom] = useState(initialData?.sugarRatioCustom ?? '');
  const [quantityInBottle, setQuantityInBottle] = useState(initialData?.quantityInBottle ?? 0);
  const [fruitLabel,       setFruitLabel]       = useState(initialData?.fruitLabel ?? '');
  const [juicePerFruit,    setJuicePerFruit]    = useState(initialData?.juicePerFruit ?? 0);
  const [yieldVariance,    setYieldVariance]    = useState(initialData?.yieldVariance ?? 10);
  const [weightConvRef,    setWeightConvRef]    = useState(initialData?.weightConversion?.referenceQty ?? 100);
  const [weightConvGrams,  setWeightConvGrams]  = useState(initialData?.weightConversion?.grams ?? 0);
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
    const filtered = userIngredients
      .filter((i) => matchesIngredient(i, value) && i.name.toLowerCase() !== name.toLowerCase())
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

    // Auto-create any missing stock entries for composition items
    const linkedComposition = homemade
      ? await ensureIngredients(supabase, userId, composition.filter((c) => c.name.trim()))
      : [];

    if (!homemade) {
      const cfg = getCategoryFieldConfig(type, categoryConfig);
      const data = isWater
        ? {
            name: name.trim(), type: 'water', unit, price, stock: 0, format: 0, homemade: false,
            temperature, unlimitedStock: true,
          }
        : {
            name: name.trim(), type, unit, homemade: false,
            ...(cfg.price    && { price }),
            ...(cfg.stock    && { stock }),
            ...(cfg.format   && { format }),
            ...(cfg.brand    && brand.trim()    && { brand:    brand.trim() }),
            ...(cfg.supplier && supplier.trim() && { supplier: supplier.trim() }),
            ...(family.trim() && { family: family.trim() }),
            ...(cfg.expiryDate       && expiryDate       && { expiryDate }),
            ...(cfg.alcoholContent   && alcoholContent > 0 && { alcoholContent }),
            ...(cfg.sugarRatio       && { sugarRatio, ...(sugarRatio === 'Sur mesure' && sugarRatioCustom && { sugarRatioCustom }) }),
            ...(cfg.quantityInBottle && quantityInBottle > 0 && { quantityInBottle }),
            ...(cfg.yieldCalc        && { fruitLabel, juicePerFruit, yieldVariance }),
            ...(weightConvGrams > 0  && { weightConversion: { referenceQty: weightConvRef, grams: weightConvGrams } }),
          };
      const payload = { user_id: userId, data, updated_at: new Date().toISOString() };
      const result = initialData
        ? await supabase.from('ingredients').update(payload).eq('id', initialData.id).eq('user_id', userId)
        : await supabase.from('ingredients').insert(payload);
      if (result.error) { setError('Erreur lors de la sauvegarde.'); setSaving(false); }
      else { router.push('/ingredients'); router.refresh(); }
      return;
    }

    // Préparation maison
    const validOutputs = outputs.filter((o) => o.qty > 0);
    const isMultiOutput = validOutputs.length >= 2;

    if (isMultiOutput) {
      // === Multi-sortie ===
      const ingredientId = initialData?.id; // défini si modification, undefined si création

      // 1. Créer/update chaque sortie comme ingrédient indépendant
      const outputIds: Array<{ tempId: string; ingredientId: string; data: Record<string, unknown> }> = [];
      for (const out of validOutputs) {
        const outName = out.name.trim() || name.trim();
        const outData = {
          name: outName,
          homemade: true,
          isOutput: true,
          sourcePreparationId: ingredientId ?? 'pending',
          unit: out.unit,
          stock: 0,
          price: 0,
          format: 0,
        };
        if (out.ingredientId) {
          // Mise à jour d'une sortie existante
          await supabase
            .from('ingredients')
            .update({ data: { ...outData, sourcePreparationId: ingredientId }, updated_at: new Date().toISOString() })
            .eq('id', out.ingredientId)
            .eq('user_id', userId);
          outputIds.push({ tempId: out.tempId, ingredientId: out.ingredientId, data: { ...outData, sourcePreparationId: ingredientId } });
        } else {
          // Insertion d'une nouvelle sortie
          const { data: inserted } = await supabase
            .from('ingredients')
            .insert({ user_id: userId, data: outData, updated_at: new Date().toISOString() })
            .select('id')
            .single();
          if (inserted) outputIds.push({ tempId: out.tempId, ingredientId: inserted.id as string, data: outData });
        }
      }

      // 2. Construire le data de la prépa-conteneur
      const prepData = {
        name: name.trim(),
        type: 'homemade',
        unit: validOutputs[0]?.unit ?? 'cl',
        price: 0,
        stock: 0,
        format: 0,
        homemade: true,
        isPreparation: true,
        preparationType: preparationType || undefined,
        composition: linkedComposition,
        outputs: validOutputs.map((o) => {
          const matched = outputIds.find((x) => x.tempId === o.tempId);
          return {
            ingredientId: matched?.ingredientId,
            name: o.name.trim() || name.trim(),
            qty: o.qty,
            unit: o.unit,
          };
        }),
        steps: steps.trim() || undefined,
      };

      const prepPayload = { user_id: userId, data: prepData, updated_at: new Date().toISOString() };

      if (ingredientId) {
        // Modification d'une prépa existante
        const result = await supabase
          .from('ingredients')
          .update(prepPayload)
          .eq('id', ingredientId)
          .eq('user_id', userId);
        if (result.error) { setError('Erreur lors de la sauvegarde.'); setSaving(false); return; }
      } else {
        // Création d'une nouvelle prépa → récupérer son ID pour lier les sorties
        const { data: inserted, error } = await supabase
          .from('ingredients')
          .insert(prepPayload)
          .select('id')
          .single();
        if (error || !inserted) { setError('Erreur lors de la sauvegarde.'); setSaving(false); return; }
        const newPrepId = inserted.id as string;

        // 3. Mettre à jour le sourcePreparationId de chaque sortie avec le vrai ID
        for (const out of outputIds) {
          await supabase
            .from('ingredients')
            .update({ data: { ...out.data, sourcePreparationId: newPrepId }, updated_at: new Date().toISOString() })
            .eq('id', out.ingredientId)
            .eq('user_id', userId);
        }
        // Mettre à jour aussi les sorties référencées dans le prepData
        const updatedOutputs = prepData.outputs.map((o) => ({
          ...o,
          ingredientId: outputIds.find((x) => o.ingredientId === x.ingredientId)?.ingredientId ?? o.ingredientId,
        }));
        await supabase
          .from('ingredients')
          .update({ data: { ...prepData, outputs: updatedOutputs }, updated_at: new Date().toISOString() })
          .eq('id', newPrepId)
          .eq('user_id', userId);
      }

      router.push('/recipes?tab=homemade'); router.refresh();
    } else {
      // === Sortie unique — comportement actuel ===
      const out = validOutputs[0];
      const data = {
        name: name.trim(), type: 'homemade', unit: out?.unit ?? unit, price: 0,
        stock, format: 0, homemade: true,
        preparationType: preparationType || undefined,
        composition: linkedComposition,
        yield: out?.qty ?? yieldAmt,
        yieldUnit: out?.unit ?? yieldUnit,
        steps: steps.trim() || undefined,
      };
      const payload = { user_id: userId, data, updated_at: new Date().toISOString() };
      const result = initialData
        ? await supabase.from('ingredients').update(payload).eq('id', initialData.id).eq('user_id', userId)
        : await supabase.from('ingredients').insert(payload);
      if (result.error) { setError('Erreur lors de la sauvegarde.'); setSaving(false); }
      else { router.push('/recipes?tab=homemade'); router.refresh(); }
    }
  };

  const visibleTypes = visibleCategories
    ? INGREDIENT_TYPES.filter((t) => visibleCategories.includes(t.key))
    : INGREDIENT_TYPES;

  const familySuggestions: string[] =
    (categorySuggestions && categorySuggestions[type] !== undefined)
      ? categorySuggestions[type]
      : (DEFAULT_FAMILY_SUGGESTIONS[type] ?? []);

  const cfg     = getCategoryFieldConfig(type, categoryConfig);
  const isAlcohol = ['spirit', 'liqueur', 'wine'].includes(type);
  const isLiquid  = isAlcohol || ['syrup', 'juice'].includes(type);
  const isWater   = type === 'water';

  function selectCategory(key: string) {
    setType(key);
    const liquid = ['spirit', 'liqueur', 'wine', 'syrup', 'juice', 'water'].includes(key);
    setUnit(liquid ? 'cl' : key === 'other' ? 'pcs' : 'g');
    setFormat(liquid && key !== 'water' ? 70 : 0);
  }

  return (
    <div className="space-y-5 max-w-xl mx-auto">

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Nom de l'ingrédient
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex. Campari, Sirop d'épices…"
          className="field-input"
        />
      </div>

      {/* Homemade toggle */}
      <button
        type="button"
        onClick={() => setHomemade((v) => !v)}
        className={`w-full card flex items-center justify-between transition-all ${
          homemade ? 'border-blue-400/40 bg-blue-400/5' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <FlaskConical size={18} className={homemade ? 'text-blue-400' : 'text-[var(--text-dim)]'} />
          <div className="text-left">
            <p className="text-sm font-medium text-[var(--text)]">Préparation maison</p>
            <p className="text-xs text-[var(--text-dim)]">Sirop, infusion, batch, liqueur…</p>
          </div>
        </div>
        <div className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${homemade ? 'bg-blue-500' : 'bg-[var(--surface2)]'}`}>
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${homemade ? 'left-5' : 'left-1'}`} />
        </div>
      </button>

      {/* ── PURCHASED ── */}
      {!homemade && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {visibleTypes.map((t) => (
                <button key={t.key} type="button" onClick={() => selectCategory(t.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    type === t.key
                      ? 'bg-[var(--gold)] text-[#0A0E1A] border-[var(--gold)]'
                      : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--gold-dim)]'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── EAU : température + stock illimité ── */}
          {isWater && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Température</label>
                <input
                  type="text"
                  list="water-temp-suggestions"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="ex. Froide (0-4°C), 65°C…"
                  className="field-input"
                />
                <datalist id="water-temp-suggestions">
                  {WATER_TEMP_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Unité</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} className="field-input">
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <p className="text-xs text-[var(--text-dim)]">1 g = 1 cl pour l'eau</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Prix achat (€)</label>
                  <input type="number" min="0" step="0.01"
                    value={price === 0 ? '' : price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.00" className="field-input" />
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)' }}>
                <span className="text-base">♾️</span>
                <p className="text-sm text-blue-300 font-medium">Stock illimité — l'eau ne se décompte pas</p>
              </div>
            </>
          )}

          {/* Champs standards (masqués pour l'eau) */}
          {!isWater && (
            <>
              {/* Famille / variété */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
                  {isAlcohol ? "Type / famille d'alcool" : 'Type / variété (optionnel)'}
                </label>
                {familySuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {familySuggestions.map((s) => (
                      <button key={s} type="button" onClick={() => setFamily(family === s ? '' : s)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                          family === s
                            ? 'bg-[var(--gold)] text-[#0A0E1A] border-[var(--gold)]'
                            : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--gold-dim)]'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <input type="text" value={family} onChange={(e) => setFamily(e.target.value)}
                  placeholder="Autre (saisie libre)…" className="field-input" />
              </div>

              {/* Marque + Fournisseur */}
              {(cfg.brand || cfg.supplier) && (
                <div className={`gap-3 ${cfg.brand && cfg.supplier ? 'grid grid-cols-2' : ''}`}>
                  {cfg.brand && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Marque</label>
                      <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
                        placeholder="ex. Jack Daniel's" className="field-input" />
                    </div>
                  )}
                  {cfg.supplier && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Fournisseur</label>
                      <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)}
                        placeholder="ex. Metro" className="field-input" />
                    </div>
                  )}
                </div>
              )}

              {/* Taux d'alcool */}
              {cfg.alcoholContent && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Taux d'alcool (%)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="100" step="0.1"
                      value={alcoholContent === 0 ? '' : alcoholContent}
                      onChange={(e) => setAlcoholContent(parseFloat(e.target.value) || 0)}
                      placeholder="ex. 40" className="field-input w-32" />
                    <span className="text-sm text-[var(--text-dim)]">% vol.</span>
                  </div>
                </div>
              )}

              {/* Ratio de sucre */}
              {cfg.sugarRatio && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Ratio de sucre</label>
                  <div className="flex flex-wrap gap-2">
                    {['1:1', '2:1', 'Sur mesure'].map((r) => (
                      <button key={r} type="button" onClick={() => setSugarRatio(r)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                          sugarRatio === r
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-pink-400'
                        }`}>
                        {r}
                      </button>
                    ))}
                  </div>
                  {sugarRatio === 'Sur mesure' && (
                    <input type="text" value={sugarRatioCustom} onChange={(e) => setSugarRatioCustom(e.target.value)}
                      placeholder="ex. 1.5:1 ou 3 parts sucre / 2 parts eau"
                      className="field-input" />
                  )}
                </div>
              )}

              {/* Format / conditionnement */}
              {cfg.format && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Unité</label>
                    <select value={unit} onChange={(e) => setUnit(e.target.value)} className="field-input">
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
                      {isLiquid ? 'Format bouteille' : 'Conditionnement'} ({unit})
                    </label>
                    <input type="number" min="0" step="any"
                      value={format === 0 ? '' : format}
                      onChange={(e) => setFormat(parseFloat(e.target.value) || 0)}
                      placeholder={isLiquid ? 'ex. 70' : 'ex. 1000'} className="field-input" />
                  </div>
                </div>
              )}
              {!cfg.format && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Unité</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} className="field-input w-32">
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              )}

              {/* Quantité restante dans la bouteille ouverte */}
              {cfg.quantityInBottle && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
                    Quantité restante ({unit}) — bouteille ouverte
                  </label>
                  <input type="number" min="0" step="any"
                    value={quantityInBottle === 0 ? '' : quantityInBottle}
                    onChange={(e) => setQuantityInBottle(parseFloat(e.target.value) || 0)}
                    placeholder="0" className="field-input w-40" />
                </div>
              )}

              {/* Prix + Stock */}
              <div className={`gap-3 ${cfg.price && cfg.stock ? 'grid grid-cols-2' : ''}`}>
                {cfg.price && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Prix achat (€)</label>
                    <input type="number" min="0" step="0.01"
                      value={price === 0 ? '' : price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00" className="field-input" />
                  </div>
                )}
                {cfg.stock && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Stock actuel</label>
                    <input type="number" min="0" step="any"
                      value={stock === 0 ? '' : stock}
                      onChange={(e) => setStock(parseFloat(e.target.value) || 0)}
                      placeholder="0" className="field-input" />
                  </div>
                )}
              </div>

              {/* Conversion poids */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
                  Conversion poids (optionnel)
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" min="1" step="any"
                    value={weightConvRef}
                    onChange={(e) => setWeightConvRef(parseFloat(e.target.value) || 100)}
                    className="field-input w-20 text-center" />
                  <span className="text-sm text-[var(--text-dim)] shrink-0">{unit}</span>
                  <span className="text-sm text-[var(--text-dim)]">=</span>
                  <input type="number" min="0" step="any"
                    value={weightConvGrams === 0 ? '' : weightConvGrams}
                    onChange={(e) => setWeightConvGrams(parseFloat(e.target.value) || 0)}
                    placeholder="?" className="field-input w-24" />
                  <span className="text-sm text-[var(--text-dim)] shrink-0">g</span>
                </div>
              </div>

              {/* Date de péremption */}
              {cfg.expiryDate && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
                    Date de péremption
                  </label>
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                    className="field-input" />
                </div>
              )}

              {/* Calcul de rendement */}
              {cfg.yieldCalc && (
                <div className="space-y-3 card">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dim)]">
                    Calcul de rendement (fruits → jus)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-[var(--text-dim)]">Fruit / unité</label>
                      <input type="text" value={fruitLabel} onChange={(e) => setFruitLabel(e.target.value)}
                        placeholder="ex. citron" className="field-input" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-[var(--text-dim)]">Jus par fruit (ml)</label>
                      <input type="number" min="0" step="1"
                        value={juicePerFruit === 0 ? '' : juicePerFruit}
                        onChange={(e) => setJuicePerFruit(parseFloat(e.target.value) || 0)}
                        placeholder="ex. 30" className="field-input" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-[var(--text-dim)]">Variance saisonnière (%)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="50" step="1"
                        value={yieldVariance}
                        onChange={(e) => setYieldVariance(parseFloat(e.target.value) || 0)}
                        className="field-input w-24" />
                      <span className="text-xs text-[var(--text-dim)]">%</span>
                    </div>
                  </div>
                  {fruitLabel && juicePerFruit > 0 && (
                    <div className="px-3 py-2 rounded-lg text-xs"
                      style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                      <span className="text-emerald-400 font-medium">
                        1 {fruitLabel} → {Math.round(juicePerFruit * (1 - yieldVariance / 100))}–{juicePerFruit} ml
                      </span>
                      <span className="text-[var(--text-dim)] ml-2">selon la saison</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── HOMEMADE ── */}
      {homemade && (
        <>
          {/* Preparation type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
              Type de préparation
            </label>
            <div className="flex flex-wrap gap-2">
              {PREP_TYPES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPreparationType(preparationType === p.key ? '' : p.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    preparationType === p.key
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-blue-400/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Composition rows — stacked layout for mobile */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
              Composition
            </label>

            <div className="space-y-3">
              {composition.map((row, index) => {
                const dot = compDotColor(row);
                const showDrop = activeIndex === index && suggestions.length > 0;

                return (
                  <div key={index} className="card p-3 space-y-2 relative">
                    {/* Row 1: Name + delete */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleCompNameChange(index, e.target.value)}
                          onFocus={() => row.name.trim() && handleCompNameChange(index, row.name)}
                          placeholder="Nom de l'ingrédient"
                          className="field-input pr-7 w-full"
                        />
                        {row.name.trim() && dot && (
                          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dot}`} />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setComposition((prev) => prev.filter((_, i) => i !== index))}
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
                          type="number" min="0" step="any"
                          value={row.qty === 0 ? '' : row.qty}
                          onChange={(e) => updateComp(index, 'qty', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="field-input w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-[var(--text-dim)] mb-1 block">Unité</label>
                        <select
                          value={row.unit}
                          onChange={(e) => updateComp(index, 'unit', e.target.value)}
                          className="field-input w-full"
                        >
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Autocomplete dropdown */}
                    {showDrop && (
                      <div ref={dropdownRef} className="absolute left-3 right-12 top-14 z-50 card p-1 shadow-lg">
                        {suggestions.map((opt) => {
                          const subtitle = [opt.brand, opt.family].filter(Boolean).join(' · ');
                          return (
                            <button key={opt.id} type="button"
                              onMouseDown={(e) => { e.preventDefault(); pickSuggestion(index, opt); }}
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
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setComposition((prev) => [...prev, { ...EMPTY_COMP }])}
              className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-1.5"
            >
              <Plus size={15} />
              Ajouter un ingrédient
            </button>
          </div>

          {/* Sorties de la préparation */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
              Sorties de la préparation
            </label>
            <div className="space-y-2">
              {outputs.map((out, idx) => (
                <div key={out.tempId} className="card p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={out.name}
                      onChange={(e) => setOutputs((prev) => prev.map((o) => o.tempId === out.tempId ? { ...o, name: e.target.value } : o))}
                      placeholder={outputs.length === 1 ? 'Nom de la sortie (optionnel)' : 'Nom de la sortie'}
                      className="field-input flex-1"
                    />
                    <button
                      type="button"
                      disabled={outputs.length <= 1}
                      onClick={() => setOutputs((prev) => prev.filter((o) => o.tempId !== out.tempId))}
                      className="shrink-0 p-2 text-[var(--text-dim)] hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-[var(--text-dim)] mb-1 block">Quantité</label>
                      <input
                        type="number" min="0" step="any"
                        value={out.qty === 0 ? '' : out.qty}
                        onChange={(e) => setOutputs((prev) => prev.map((o) => o.tempId === out.tempId ? { ...o, qty: parseFloat(e.target.value) || 0 } : o))}
                        placeholder="0"
                        className="field-input w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-[var(--text-dim)] mb-1 block">Unité</label>
                      <select
                        value={out.unit}
                        onChange={(e) => setOutputs((prev) => prev.map((o) => o.tempId === out.tempId ? { ...o, unit: e.target.value } : o))}
                        className="field-input w-full"
                      >
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOutputs((prev) => [...prev, { tempId: `out-${Date.now()}`, name: '', qty: 0, unit: 'cl' }])}
              className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-1.5"
            >
              <Plus size={15} />
              Ajouter une sortie
            </button>
          </div>

          {/* Stock — affiché seulement si 1 seule sortie (multi-output gère le stock via chaque sortie) */}
          {outputs.length <= 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
                Stock ({outputs[0]?.unit || yieldUnit || 'cl'})
              </label>
              <input type="number" min="0" step="any"
                value={stock === 0 ? '' : stock}
                onChange={(e) => setStock(parseFloat(e.target.value) || 0)}
                placeholder="0" className="field-input" />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Instructions (optionnel)</label>
            <textarea value={steps} onChange={(e) => setSteps(e.target.value)}
              placeholder="Procédé de fabrication…" rows={4} className="field-input resize-none" />
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

      <button type="button" onClick={handleSubmit} disabled={saving}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2">
        {saving ? <><Loader2 size={16} className="animate-spin" />Enregistrement…</> : 'Enregistrer'}
      </button>
    </div>
  );
}
