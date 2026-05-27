import Link from 'next/link';
import { ArrowRight, BookOpen, Package, Wrench, Users, Star, Zap } from 'lucide-react';

const FEATURES = [
  { icon: BookOpen, title: 'Recettes', desc: 'Cocktails, batchs, cafés — tout en un endroit.' },
  { icon: Package, title: 'Stocks', desc: 'Gestion des ingrédients et alertes automatiques.' },
  { icon: Wrench, title: 'Batch Tool', desc: 'Calculateur de production avec timers synchronisés.' },
  { icon: Users, title: 'Équipe', desc: 'Rôles, permissions et communication en temps réel.' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--gold)] flex items-center justify-center">
            <span className="text-[#0A0E1A] font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-[var(--text)] text-lg">Mixtura</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">Connexion</Link>
          <Link href="/register" className="btn-primary text-sm px-4 py-2">Essai gratuit</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface2)] border border-[var(--border)] text-[var(--gold)] text-xs font-medium mb-6">
          <Star size={12} />
          <span>Gestion complète pour votre bar</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-[var(--text)] leading-tight mb-4 max-w-2xl">
          Votre bar,{' '}
          <span className="text-[var(--gold)]">parfaitement orchestré</span>
        </h1>
        <p className="text-[var(--text-dim)] text-lg max-w-xl mb-10">
          Recettes, stocks, batchs et communication d&apos;équipe dans une seule application pensée pour les professionnels du bar.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/register" className="btn-primary px-8 py-3 text-base gap-2">
            Commencer gratuitement
            <ArrowRight size={18} />
          </Link>
          <Link href="/demo" className="btn-ghost px-8 py-3 text-base gap-2">
            <Zap size={18} />
            Voir la démo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--surface2)] flex items-center justify-center shrink-0">
                <Icon size={20} className="text-[var(--gold)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text)] mb-1">{title}</h3>
                <p className="text-sm text-[var(--text-dim)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-6 text-center text-xs text-[var(--text-dim)]">
        © 2025 Mixtura — Tous droits réservés
      </footer>
    </main>
  );
}
