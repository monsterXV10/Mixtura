'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Check, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';

export const ALL_CATEGORIES = [
  { key: 'spirit',  label: 'Spiritueux', dot: 'bg-amber-400' },
  { key: 'liqueur', label: 'Liqueur',    dot: 'bg-purple-400' },
  { key: 'wine',    label: 'Vin',        dot: 'bg-rose-400' },
  { key: 'syrup',   label: 'Sirop',      dot: 'bg-pink-400' },
  { key: 'juice',   label: 'Jus',        dot: 'bg-orange-400' },
  { key: 'fresh',   label: 'Frais',      dot: 'bg-emerald-400' },
  { key: 'dry',     label: 'Sec',        dot: 'bg-yellow-400' },
  { key: 'water',   label: 'Eau',        dot: 'bg-blue-300' },
  { key: 'other',   label: 'Autre',      dot: 'bg-[var(--border)]' },
];

export const DEFAULT_SUGGESTIONS: Record<string, string[]> = {
  spirit:  ['Whisky', 'Bourbon', 'Scotch', 'Gin', 'Vodka', 'Rhum', 'Tequila', 'Mezcal', 'Cognac', 'Armagnac', 'Calvados'],
  liqueur: ['Vermouth', 'Amaro', 'Triple Sec', 'Bitters', 'Campari', 'Cointreau', 'Chartreuse'],
  wine:    ['Champagne', 'Vin rouge', 'Vin blanc', 'Porto', 'Sherry', 'Prosecco'],
  syrup:   ['Sucre de canne', 'Orgeat', 'Grenadine', 'Fraise', 'Pêche', 'Citron', 'Menthe'],
  juice:   ['Citron', 'Citron vert', 'Orange', 'Pamplemousse', 'Ananas', 'Cranberry', 'Tomate'],
  fresh:   ['Citron', 'Citron vert', 'Orange', 'Menthe', 'Basilic', 'Concombre', 'Fraise'],
  dry:     ['Sel', 'Sucre', 'Poivre', 'Piment', 'Muscade', 'Cannelle'],
  water:   ['Plate', 'Gazeuse', 'Tonique', 'Soda', 'Ginger Beer', 'Ginger Ale'],
  other:   [],
};

export default function CategoriesClient({
  userId,
  visibleCategories,
  categorySuggestions,
}: {
  userId: string;
  visibleCategories: string[] | null;
  categorySuggestions: Record<string, string[]> | null;
}) {
  const allKeys = ALL_CATEGORIES.map((c) => c.key);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(visibleCategories ?? allKeys)
  );
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>(
    categorySuggestions ?? {}
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleVisible(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setSaved(false);
  }

  function toggleExpanded(key: string) {
    setExpanded((v) => (v === key ? null : key));
  }

  function getSuggestions(key: string): string[] {
    return suggestions[key] ?? DEFAULT_SUGGESTIONS[key] ?? [];
  }

  function addSuggestion(key: string) {
    const val = (inputs[key] ?? '').trim();
    if (!val) return;
    setSuggestions((prev) => {
      const current = prev[key] ?? DEFAULT_SUGGESTIONS[key] ?? [];
      if (current.includes(val)) return prev;
      return { ...prev, [key]: [...current, val] };
    });
    setInputs((prev) => ({ ...prev, [key]: '' }));
    setSaved(false);
  }

  function removeSuggestion(key: string, val: string) {
    setSuggestions((prev) => ({
      ...prev,
      [key]: (prev[key] ?? DEFAULT_SUGGESTIONS[key] ?? []).filter((s) => s !== val),
    }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ visible_categories: [...selected], category_suggestions: suggestions })
      .eq('id', userId);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--text-dim)]">
        Activez ou désactivez les catégories, et personnalisez les suggestions proposées dans le formulaire d&apos;ingrédient.
      </p>

      <div className="card divide-y divide-[var(--border)] p-0 overflow-hidden">
        {ALL_CATEGORIES.map(({ key, label, dot }) => {
          const isOn = selected.has(key);
          const isExpanded = expanded === key;
          const catSuggestions = getSuggestions(key);

          return (
            <div key={key}>
              {/* Row header */}
              <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Visibility toggle */}
                <button
                  type="button"
                  onClick={() => toggleVisible(key)}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dot} ${isOn ? '' : 'opacity-30'}`} />
                  <span className={`text-sm text-left transition-colors ${isOn ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}`}>
                    {label}
                  </span>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ml-auto ${
                    isOn ? 'bg-[var(--gold)] border-[var(--gold)]' : 'border-[var(--border)]'
                  }`}>
                    {isOn && <Check size={11} strokeWidth={3} color="#0A0E1A" />}
                  </div>
                </button>

                {/* Expand suggestions */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(key)}
                  className="shrink-0 p-1.5 rounded-md text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-colors ml-2"
                  aria-label="Configurer les suggestions"
                >
                  {isExpanded
                    ? <ChevronUp size={14} />
                    : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Suggestions panel */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 bg-[var(--surface2)]/40 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-dim)] pt-3">
                    Suggestions proposées dans le champ &quot;Type / famille&quot;
                  </p>

                  {/* Chips list */}
                  <div className="flex flex-wrap gap-1.5">
                    {catSuggestions.length === 0 && (
                      <span className="text-xs text-[var(--text-dim)] italic">Aucune suggestion</span>
                    )}
                    {catSuggestions.map((s) => (
                      <span
                        key={s}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSuggestion(key, s)}
                          className="text-[var(--text-dim)] hover:text-red-400 transition-colors ml-0.5"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputs[key] ?? ''}
                      onChange={(e) => setInputs((p) => ({ ...p, [key]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addSuggestion(key)}
                      placeholder="Ajouter une suggestion…"
                      className="field-input text-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => addSuggestion(key)}
                      className="btn-ghost px-3 shrink-0"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
      >
        {saving
          ? <Loader2 size={16} className="animate-spin" />
          : saved
          ? <Check size={16} />
          : null}
        {saved ? 'Enregistré !' : 'Enregistrer'}
      </button>
    </div>
  );
}
