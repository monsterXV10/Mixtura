'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Check } from 'lucide-react';

const ALL_CATEGORIES = [
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

export default function CategoriesClient({
  userId,
  visibleCategories,
}: {
  userId: string;
  visibleCategories: string[] | null;
}) {
  const allKeys = ALL_CATEGORIES.map((c) => c.key);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(visibleCategories ?? allKeys)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      setSaved(false);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ visible_categories: [...selected] })
      .eq('id', userId);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--text-dim)]">
        Choisissez les catégories proposées dans le formulaire d&apos;ingrédient.
        Les catégories désactivées n&apos;apparaîtront plus lors de la création ou modification.
      </p>

      <div className="card divide-y divide-[var(--border)] p-0 overflow-hidden">
        {ALL_CATEGORIES.map(({ key, label, dot }) => {
          const isOn = selected.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface2)] transition-colors"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${dot} ${isOn ? '' : 'opacity-30'}`} />
              <span className={`flex-1 text-sm text-left transition-colors ${isOn ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}`}>
                {label}
              </span>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                isOn ? 'bg-[var(--gold)] border-[var(--gold)]' : 'border-[var(--border)]'
              }`}>
                {isOn && <Check size={11} strokeWidth={3} color="#0A0E1A" />}
              </div>
            </button>
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
