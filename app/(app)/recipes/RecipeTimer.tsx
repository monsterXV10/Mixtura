'use client';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

interface RecipeTimerProps {
  seconds: number;
  label?: string;
}

export function RecipeTimer({ seconds, label }: RecipeTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setDone(true);
          if (typeof navigator.vibrate === 'function') navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  function toggle() {
    if (done) return;
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setDone(false);
    setRemaining(seconds);
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr =
    mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;

  return (
    <div
      className={`card flex items-center gap-4 py-3 px-4 transition-colors ${
        done ? 'border-[var(--gold)]/40' : ''
      }`}
    >
      <Timer
        size={18}
        className={`shrink-0 ${done ? 'text-[var(--gold)]' : 'text-[var(--text-dim)]'}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-dim)] mb-0.5">{label ?? 'Minuteur'}</p>
        <p
          className={`font-mono text-2xl font-bold tabular-nums leading-none ${
            done ? 'text-[var(--gold)]' : 'text-[var(--text)]'
          }`}
        >
          {timeStr}
          {done && <span className="text-base ml-1.5">✓</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          disabled={done}
          aria-label={running ? 'Pause' : 'Démarrer'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            done
              ? 'opacity-30 cursor-not-allowed bg-[var(--surface2)]'
              : running
              ? 'bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--border)]'
              : 'bg-[var(--gold)] text-[#0A0E1A] hover:opacity-90'
          }`}
        >
          {running ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <button
          onClick={reset}
          aria-label="Réinitialiser"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}
