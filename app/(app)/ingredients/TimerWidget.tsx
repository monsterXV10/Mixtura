'use client';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

const PRESETS = [
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '1h', seconds: 3600 },
  { label: '2h', seconds: 7200 },
  { label: '24h', seconds: 86400 },
];

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function TimerWidget() {
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          setDone(true);
          playBeep();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function playBeep() {
    try {
      const ctx = new AudioContext();
      audioRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // audio not available
    }
  }

  function selectPreset(seconds: number) {
    setTotal(seconds);
    setRemaining(seconds);
    setRunning(false);
    setDone(false);
  }

  function toggle() {
    if (remaining === 0 && total > 0) {
      setRemaining(total);
      setDone(false);
    }
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setRemaining(total);
    setDone(false);
  }

  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const dash = circ - (pct / 100) * circ;

  return (
    <div className="card space-y-4">
      <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
        <Timer size={15} className="text-[var(--gold)]" />
        Minuteur
      </h2>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => selectPreset(p.seconds)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              total === p.seconds
                ? 'bg-[var(--gold)] text-[#0A0E1A] border-[var(--gold)]'
                : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--gold-dim)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Display */}
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface2)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke={done ? 'var(--gold)' : running ? '#34d399' : 'var(--gold)'}
              strokeWidth="6"
              strokeDasharray={circ}
              strokeDashoffset={dash}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-mono font-bold text-xl ${done ? 'text-[var(--gold)]' : 'text-[var(--text)]'}`}>
              {total === 0 ? '--:--' : fmt(remaining)}
            </span>
            {done && <span className="text-xs text-[var(--gold)] mt-0.5">Terminé !</span>}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            disabled={total === 0}
            className="p-2.5 rounded-full bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-30 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={total === 0}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-30 ${
              running
                ? 'bg-orange-400/20 text-orange-400 border border-orange-400/40'
                : 'btn-primary'
            }`}
          >
            {running ? <><Pause size={15} />Pause</> : <><Play size={15} />{done ? 'Relancer' : 'Démarrer'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
