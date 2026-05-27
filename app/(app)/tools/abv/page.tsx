'use client';
import { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Plus, X, Percent } from 'lucide-react';

interface AbvLine {
  id: number;
  vol: string; // cl
  abv: string; // %
}

let counter = 0;

function newLine(): AbvLine {
  counter++;
  return { id: counter, vol: '', abv: '' };
}

export default function AbvPage() {
  const [lines, setLines] = useState<AbvLine[]>([newLine(), newLine()]);

  function addLine() {
    setLines((prev) => [...prev, newLine()]);
  }

  function removeLine(id: number) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function updateLine(id: number, field: 'vol' | 'abv', value: string) {
    setLines((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
  }

  const result = useMemo(() => {
    let totalVolAlc = 0;
    let totalVol = 0;
    for (const l of lines) {
      const vol = parseFloat(l.vol.replace(',', '.'));
      const abv = parseFloat(l.abv.replace(',', '.'));
      if (!isNaN(vol) && vol > 0 && !isNaN(abv) && abv >= 0) {
        totalVol += vol;
        totalVolAlc += vol * (abv / 100);
      }
    }
    if (totalVol <= 0) return null;
    return { abv: (totalVolAlc / totalVol) * 100, totalVol };
  }, [lines]);

  function abvColor(v: number) {
    if (v < 10) return 'text-emerald-400';
    if (v < 20) return 'text-yellow-400';
    if (v < 30) return 'text-orange-400';
    return 'text-red-400';
  }

  return (
    <>
      <TopBar title="Calculateur ABV" backHref="/tools" />
      <main className="px-4 py-5 pb-safe max-w-lg mx-auto space-y-5">

        {/* Result display */}
        <div className="card flex flex-col items-center py-8 gap-2">
          {result != null ? (
            <>
              <p className={`text-6xl font-bold font-mono ${abvColor(result.abv)}`}>
                {result.abv.toFixed(1)}
                <span className="text-3xl">%</span>
              </p>
              <p className="text-sm text-[var(--text-dim)] mt-1">
                ABV final · {result.totalVol.toFixed(1)} cl au total
              </p>
            </>
          ) : (
            <>
              <Percent size={40} className="text-[var(--text-dim)] opacity-30" />
              <p className="text-sm text-[var(--text-dim)]">Renseignez les ingrédients</p>
            </>
          )}
        </div>

        {/* Lines */}
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-[var(--text-dim)] uppercase tracking-wide font-medium px-1">
            <span>Volume (cl)</span>
            <span>ABV (%)</span>
            <span className="w-8" />
          </div>
          {lines.map((line) => (
            <div key={line.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="4.5"
                value={line.vol}
                onChange={(e) => updateLine(line.id, 'vol', e.target.value)}
                className="field-input w-full"
              />
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                placeholder="40"
                value={line.abv}
                onChange={(e) => updateLine(line.id, 'abv', e.target.value)}
                className="field-input w-full"
              />
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                disabled={lines.length <= 1}
                className="w-8 h-8 flex items-center justify-center text-[var(--text-dim)] hover:text-red-400 transition-colors disabled:opacity-30"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLine}
          className="btn-ghost w-full py-2.5 flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={15} />
          Ajouter un ingrédient
        </button>
      </main>
    </>
  );
}
