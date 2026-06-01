'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { Bug, Sparkles, CheckCircle2 } from 'lucide-react';

const LOCATIONS = [
  'Recettes',
  'Stock',
  'Batch Tool',
  'Catalogue IBA',
  'Équipe',
  'Paramètres',
  'Connexion / Inscription',
  'Autre',
];

export default function FeedbackPage() {
  const router = useRouter();
  const [type, setType] = useState<'bug' | 'feature'>('bug');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!location || !description.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, location, description }),
      });
      if (!res.ok) throw new Error('Erreur réseau');
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <>
        <TopBar title="Signalement" />
        <main className="px-4 py-10 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-400/10 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
          <h2 className="font-bold text-[var(--text)] text-lg">Message envoyé !</h2>
          <p className="text-[var(--text-dim)] text-sm max-w-xs">
            {type === 'bug'
              ? 'Merci pour le signalement. On va examiner ça rapidement.'
              : 'Merci pour la suggestion. On la prendra en compte pour les prochaines mises à jour.'}
          </p>
          <button
            onClick={() => router.push('/settings')}
            className="btn-ghost text-sm px-5 py-2 mt-2"
          >
            Retour aux paramètres
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Signalement" />
      <main className="px-4 py-5 pb-24 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Type toggle */}
          <div className="card p-1 flex gap-1">
            <button
              type="button"
              onClick={() => setType('bug')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                type === 'bug'
                  ? 'bg-[var(--gold)] text-[#0A0E1A]'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              <Bug size={15} />
              Signaler un bug
            </button>
            <button
              type="button"
              onClick={() => setType('feature')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                type === 'feature'
                  ? 'bg-[var(--gold)] text-[#0A0E1A]'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              <Sparkles size={15} />
              Proposer une idée
            </button>
          </div>

          {/* Location */}
          <div className="card space-y-2">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
              {type === 'bug' ? 'Où se passe le bug ?' : 'Où ajouter cette fonctionnalité ?'}
            </label>
            <select
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="field-input w-full"
              required
            >
              <option value="">Choisir une section…</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="card space-y-2">
            <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
              {type === 'bug' ? 'Décris le bug' : 'Décris ton idée'}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={
                type === 'bug'
                  ? 'Que s\'est-il passé ? Quelles étapes pour reproduire ?'
                  : 'Quelle fonctionnalité aimerais-tu voir ? Pourquoi ?'
              }
              rows={5}
              className="field-input w-full resize-none"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !location || !description.trim()}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Envoi…' : 'Envoyer'}
          </button>

        </form>
      </main>
    </>
  );
}
