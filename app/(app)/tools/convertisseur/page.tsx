'use client';
import { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ArrowLeftRight } from 'lucide-react';

// ── Conversion tables ─────────────────────────────────────────────────────────
// All volumes normalized to ml
const VOLUMES: Record<string, { label: string; toMl: number }> = {
  ml:       { label: 'ml',        toMl: 1 },
  cl:       { label: 'cl',        toMl: 10 },
  l:        { label: 'L',         toMl: 1000 },
  oz:       { label: 'oz (liq)', toMl: 29.5735 },
  tsp:      { label: 'tsp',       toMl: 4.92892 },
  tbsp:     { label: 'tbsp',      toMl: 14.7868 },
  barspoon: { label: 'barspoon',  toMl: 5 },
  dash:     { label: 'dash',      toMl: 0.6 },
};

// All masses normalized to g
const MASSES: Record<string, { label: string; toG: number }> = {
  g:    { label: 'g',       toG: 1 },
  kg:   { label: 'kg',      toG: 1000 },
  ozm:  { label: 'oz (m)',  toG: 28.3495 },
  lb:   { label: 'lb',      toG: 453.592 },
};

const QUICK_REF = [
  { label: '1 oz',       value: 29.5735, unit: 'ml' },
  { label: '1 barspoon', value: 5,       unit: 'ml' },
  { label: '1 dash',     value: 0.6,     unit: 'ml' },
  { label: '1 tsp',      value: 4.93,    unit: 'ml' },
  { label: '1 tbsp',     value: 14.79,   unit: 'ml' },
  { label: '1 cl',       value: 10,      unit: 'ml' },
];

function pretty(n: number): string {
  if (n === 0) return '0';
  if (Math.abs(n) >= 1000) return n.toFixed(0);
  if (Math.abs(n) >= 100)  return n.toFixed(1);
  if (Math.abs(n) >= 10)   return n.toFixed(2);
  if (Math.abs(n) >= 1)    return n.toFixed(3);
  return n.toFixed(4);
}

export default function ConvertisseurPage() {
  const [mode, setMode] = useState<'volume' | 'masse'>('volume');
  const [input, setInput] = useState('');
  const [from, setFrom] = useState('cl');
  const [to, setTo] = useState('ml');

  const units = mode === 'volume' ? VOLUMES : MASSES;

  function handleModeChange(m: 'volume' | 'masse') {
    setMode(m);
    if (m === 'volume') { setFrom('cl'); setTo('ml'); }
    else { setFrom('g'); setTo('kg'); }
    setInput('');
  }

  const result = useMemo(() => {
    const v = parseFloat(input.replace(',', '.'));
    if (isNaN(v)) return null;
    if (mode === 'volume') {
      const fromDef = VOLUMES[from];
      const toDef = VOLUMES[to];
      if (!fromDef || !toDef) return null;
      return (v * fromDef.toMl) / toDef.toMl;
    } else {
      const fromDef = MASSES[from];
      const toDef = MASSES[to];
      if (!fromDef || !toDef) return null;
      return (v * fromDef.toG) / toDef.toG;
    }
  }, [input, from, to, mode]);

  return (
    <>
      <TopBar title="Convertisseur" backHref="/tools" />
      <main className="px-4 py-5 pb-safe max-w-lg mx-auto space-y-5">
        {/* Mode toggle */}
        <div className="flex gap-2">
          {(['volume', 'masse'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mode === m
                  ? 'bg-[var(--gold)]/15 border-[var(--gold)] text-[var(--gold)]'
                  : 'border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              {m === 'volume' ? 'Volume' : 'Masse'}
            </button>
          ))}
        </div>

        {/* Converter */}
        <div className="card space-y-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            {/* From */}
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--text-dim)] font-medium">Valeur</label>
              <input
                type="number"
                inputMode="decimal"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="0"
                className="field-input w-full"
              />
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="field-input w-full text-sm"
              >
                {Object.entries(units).map(([k, u]) => (
                  <option key={k} value={k}>{u.label}</option>
                ))}
              </select>
            </div>

            <div className="pb-2">
              <ArrowLeftRight size={18} className="text-[var(--text-dim)]" />
            </div>

            {/* To */}
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--text-dim)] font-medium">Résultat</label>
              <div className="field-input w-full font-mono font-semibold text-[var(--gold)] select-all">
                {result != null ? pretty(result) : '—'}
              </div>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="field-input w-full text-sm"
              >
                {Object.entries(units).map(([k, u]) => (
                  <option key={k} value={k}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick reference — volumes only */}
        {mode === 'volume' && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Référence rapide</p>
            <div className="card p-0 overflow-hidden divide-y divide-[var(--border)]">
              {QUICK_REF.map((ref) => (
                <div key={ref.label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-[var(--text)]">{ref.label}</span>
                  <span className="text-sm font-mono text-[var(--gold)]">{pretty(ref.value)} {ref.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
