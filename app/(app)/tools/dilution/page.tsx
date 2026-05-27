'use client';
import { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Droplets } from 'lucide-react';

type Method = 'shake' | 'stir' | 'build';

const DEFAULT_DILUTIONS: Record<Method, number> = {
  shake: 25,
  stir: 20,
  build: 10,
};

const METHOD_LABELS: Record<Method, string> = {
  shake: 'Shake',
  stir: 'Stir',
  build: 'Build',
};

export default function DilutionPage() {
  const [volume, setVolume] = useState('');
  const [method, setMethod] = useState<Method>('shake');
  const [dilutionPct, setDilutionPct] = useState<Record<Method, number>>({ ...DEFAULT_DILUTIONS });
  const [portions, setPortions] = useState(1);

  function setMethodAndDilution(m: Method) {
    setMethod(m);
  }

  const result = useMemo(() => {
    const v = parseFloat(volume.replace(',', '.'));
    if (isNaN(v) || v <= 0) return null;
    const pct = dilutionPct[method] / 100;
    const water = v * pct;
    const total = v + water;
    return {
      water: water * portions,
      total: total * portions,
      waterSingle: water,
      totalSingle: total,
    };
  }, [volume, method, dilutionPct, portions]);

  function pretty(n: number): string {
    return (Math.round(n * 10) / 10).toFixed(1);
  }

  return (
    <>
      <TopBar title="Dilution" backHref="/tools" />
      <main className="px-4 py-5 pb-safe max-w-lg mx-auto space-y-5">

        {/* Result */}
        <div className="card flex flex-col items-center py-8 gap-3">
          {result != null ? (
            <>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-4xl font-bold font-mono text-blue-400">{pretty(result.water)}</p>
                  <p className="text-xs text-[var(--text-dim)] mt-1">cl eau</p>
                </div>
                <div className="w-px bg-[var(--border)]" />
                <div className="text-center">
                  <p className="text-4xl font-bold font-mono text-[var(--gold)]">{pretty(result.total)}</p>
                  <p className="text-xs text-[var(--text-dim)] mt-1">cl total</p>
                </div>
              </div>
              {portions > 1 && (
                <p className="text-sm text-[var(--text-dim)]">
                  × {portions} portions · {pretty(result.waterSingle)} cl eau par portion
                </p>
              )}
            </>
          ) : (
            <>
              <Droplets size={40} className="text-[var(--text-dim)] opacity-30" />
              <p className="text-sm text-[var(--text-dim)]">Renseignez le volume du cocktail</p>
            </>
          )}
        </div>

        {/* Inputs */}
        <div className="card space-y-4">
          {/* Volume */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
              Volume cocktail (cl)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="9"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="field-input w-full"
            />
          </div>

          {/* Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
              Méthode
            </label>
            <div className="flex gap-2">
              {(Object.keys(METHOD_LABELS) as Method[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethodAndDilution(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    method === m
                      ? 'bg-[var(--gold)]/15 border-[var(--gold)] text-[var(--gold)]'
                      : 'border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)]'
                  }`}
                >
                  {METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Dilution % — editable */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
              Dilution {METHOD_LABELS[method]} (%)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              value={dilutionPct[method]}
              onChange={(e) => {
                const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                setDilutionPct((prev) => ({ ...prev, [method]: v }));
              }}
              className="field-input w-32"
            />
          </div>

          {/* Portions */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
              Nombre de portions (batch)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPortions((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-md bg-[var(--surface2)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--border)] transition-colors font-bold text-lg leading-none"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={portions}
                onChange={(e) => setPortions(Math.max(1, parseInt(e.target.value) || 1))}
                className="field-input w-16 text-center font-semibold"
              />
              <button
                type="button"
                onClick={() => setPortions((p) => p + 1)}
                className="w-8 h-8 rounded-md bg-[var(--surface2)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--border)] transition-colors font-bold text-lg leading-none"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Info table */}
        <div className="card p-0 overflow-hidden divide-y divide-[var(--border)]">
          {(Object.entries(DEFAULT_DILUTIONS) as [Method, number][]).map(([m, d]) => (
            <div key={m} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-[var(--text)]">{METHOD_LABELS[m]}</span>
              <span className="text-sm font-mono text-[var(--text-dim)]">~{d}% dilution</span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
