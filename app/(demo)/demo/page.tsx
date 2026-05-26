'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_CODES, PLANS } from '@/config/plans';
import type { DemoCode } from '@/config/plans';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Lock, Eye } from 'lucide-react';

const CODE_HINTS = [
  { code: 'OWNER', desc: 'Propriétaire — accès total Team+' },
  { code: 'ADMIN', desc: 'Manager — accès Team' },
  { code: 'PLUS', desc: 'Solo Plus — plan Plus' },
  { code: 'USER', desc: 'Barman — plan Free' },
];

export default function DemoPage() {
  const [code, setCode] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [entered, setEntered] = useState(false);
  const router = useRouter();

  const handleEnter = () => {
    const upper = code.toUpperCase() as DemoCode;
    const config = DEMO_CODES[upper] ?? DEMO_CODES[''];
    sessionStorage.setItem('demo_code', upper);
    sessionStorage.setItem('demo_plan', config.plan);
    sessionStorage.setItem('demo_role', config.role);
    setEntered(true);
    setTimeout(() => router.push('/dashboard'), 800);
  };

  const demoConfig = DEMO_CODES[(code.toUpperCase() as DemoCode)] ?? DEMO_CODES[''];

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--gold)] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#0A0E1A] font-bold text-xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Mode démo</h1>
          <p className="text-[var(--text-dim)] text-sm mt-1">
            Entrez un code ou laissez vide pour continuer en visiteur
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              className="field-input uppercase font-mono text-center text-lg tracking-widest"
              placeholder="CODE"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={10}
            />
            {code && (
              <div className="mt-2 text-center">
                <span className="text-xs text-[var(--gold)] font-medium">
                  {PLANS[demoConfig.plan].name} — {demoConfig.label}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleEnter}
            className="btn-primary w-full py-3"
            disabled={entered}
          >
            {entered ? '✓ Entrée…' : 'Accéder à la démo'}
          </button>

          <button
            onClick={() => setShowHints(!showHints)}
            className="w-full flex items-center justify-center gap-2 text-sm text-[var(--text-dim)] hover:text-[var(--gold)] transition-colors py-2"
          >
            <Eye size={14} />
            {showHints ? 'Masquer les codes' : 'Voir les codes disponibles'}
          </button>

          {showHints && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              {CODE_HINTS.map(({ code: c, desc }) => (
                <button
                  key={c}
                  onClick={() => setCode(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] hover:border-[var(--gold-dim)] transition-colors text-left"
                >
                  <Lock size={14} className="text-[var(--gold)] shrink-0" />
                  <div>
                    <span className="font-mono text-sm text-[var(--gold)] font-bold">{c}</span>
                    <p className="text-xs text-[var(--text-dim)]">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
