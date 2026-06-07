'use client';
import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Check, Scale } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  weightConversion?: { referenceQty: number; grams: number };
}

interface Props {
  ingredients: Ingredient[];
  userId: string;
}

export default function ConversionsClient({ ingredients, userId: _userId }: Props) {
  const [search, setSearch] = useState('');
  const [conversions, setConversions] = useState<Record<string, { referenceQty: string; grams: string }>>(() => {
    const init: Record<string, { referenceQty: string; grams: string }> = {};
    for (const ing of ingredients) {
      if (ing.weightConversion) {
        init[ing.id] = {
          referenceQty: String(ing.weightConversion.referenceQty),
          grams: String(ing.weightConversion.grams),
        };
      }
    }
    return init;
  });
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = q ? ingredients.filter((i) => i.name.toLowerCase().includes(q)) : ingredients;
    return [...list].sort((a, b) => {
      const aC = !!conversions[a.id];
      const bC = !!conversions[b.id];
      if (aC && !bC) return -1;
      if (!aC && bC) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [ingredients, search, conversions]);

  async function saveConversion(id: string) {
    const entry = conversions[id];
    if (!entry) return;
    const grams = parseFloat(entry.grams);
    const referenceQty = parseFloat(entry.referenceQty) || 100;
    if (isNaN(grams) || grams <= 0) return;

    setSaving((p) => new Set([...p, id]));
    const supabase = createClient();
    const { data: row } = await supabase.from('ingredients').select('data').eq('id', id).single();
    if (row) {
      await supabase.from('ingredients').update({
        data: { ...(row.data as object), weightConversion: { referenceQty, grams } },
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    }
    setSaving((p) => { const n = new Set(p); n.delete(id); return n; });
    setSaved((p) => {
      const n = new Set([...p, id]);
      setTimeout(() => setSaved((pp) => { const nn = new Set(pp); nn.delete(id); return nn; }), 2000);
      return n;
    });
  }

  async function clearConversion(id: string) {
    const supabase = createClient();
    const { data: row } = await supabase.from('ingredients').select('data').eq('id', id).single();
    if (row) {
      const d = { ...(row.data as Record<string, unknown>) };
      delete d.weightConversion;
      await supabase.from('ingredients').update({ data: d, updated_at: new Date().toISOString() }).eq('id', id);
    }
    setConversions((p) => { const n = { ...p }; delete n[id]; return n; });
  }

  const withConversion = filtered.filter((i) => !!conversions[i.id]);
  const withoutConversion = filtered.filter((i) => !conversions[i.id]);

  function renderRow(ing: Ingredient) {
    const entry = conversions[ing.id];
    const isSaved = saved.has(ing.id);
    const isSaving = saving.has(ing.id);
    const hasValue = !!entry?.grams && parseFloat(entry.grams) > 0;

    return (
      <div key={ing.id} className="flex items-center gap-2 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text)] truncate">{ing.name}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            min={1}
            value={entry?.referenceQty ?? '100'}
            onChange={(e) => setConversions((p) => ({
              ...p,
              [ing.id]: { referenceQty: e.target.value, grams: p[ing.id]?.grams ?? '' },
            }))}
            className="field-input text-sm w-14 text-center px-1"
          />
          <span className="text-xs text-[var(--text-dim)] shrink-0 min-w-[2rem]">{ing.unit || '—'}</span>
          <span className="text-xs text-[var(--text-dim)]">=</span>
          <input
            type="number"
            min={0}
            step="any"
            placeholder="?"
            value={entry?.grams ?? ''}
            onChange={(e) => setConversions((p) => ({
              ...p,
              [ing.id]: { referenceQty: p[ing.id]?.referenceQty ?? '100', grams: e.target.value },
            }))}
            onKeyDown={(e) => e.key === 'Enter' && saveConversion(ing.id)}
            className="field-input text-sm w-16 text-center px-1"
          />
          <span className="text-xs text-[var(--text-dim)] shrink-0">g</span>
          <button
            type="button"
            onClick={() => hasValue ? saveConversion(ing.id) : clearConversion(ing.id)}
            disabled={!hasValue || isSaving}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              isSaved ? 'text-emerald-400 bg-emerald-400/10' : 'text-[var(--gold)] hover:bg-[var(--gold)]/10'
            } disabled:opacity-30`}
          >
            <Check size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <p className="text-sm text-[var(--text-dim)]">
        Définissez l'équivalent grammes pour chaque produit. Utilisé pour estimer les poids dans le batch.
      </p>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input !pl-10 w-full"
        />
      </div>

      {withConversion.length > 0 && (
        <div className="card p-0 divide-y divide-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface2)]">
            <Scale size={12} className="text-emerald-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Conversions définies</p>
          </div>
          {withConversion.map(renderRow)}
        </div>
      )}

      {withoutConversion.length > 0 && (
        <div className="card p-0 divide-y divide-[var(--border)] overflow-hidden">
          <div className="px-4 py-2 bg-[var(--surface2)]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
              Sans conversion ({withoutConversion.length})
            </p>
          </div>
          {withoutConversion.map(renderRow)}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-sm text-[var(--text-dim)] text-center py-8">Aucun résultat</p>
      )}
    </div>
  );
}
