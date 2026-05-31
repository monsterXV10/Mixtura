import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import FeatureCarousel from './FeatureCarousel';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--gold)] flex items-center justify-center">
            <span className="text-[#0A0E1A] font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-[var(--text)] text-lg">Mixtura</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/features" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Fonctionnalités</Link>
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">Connexion</Link>
          <Link href="/register" className="btn-primary text-sm px-4 py-2">Essai gratuit</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface2)] border border-[var(--border)] text-[var(--gold)] text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] inline-block" />
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

      {/* ── Feature Carousel ── */}
      <section className="px-6 pb-16">
        <FeatureCarousel />
      </section>

      {/* ── Wiki CTA ── */}
      <section className="px-6 pb-16 text-center">
        <div
          className="max-w-xl mx-auto rounded-2xl p-8 space-y-4"
          style={{
            background: 'rgba(200,169,110,0.05)',
            border: '1px solid rgba(200,169,110,0.18)',
          }}
        >
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--gold)]">Documentation</p>
          <h3 className="text-xl font-bold text-[var(--text)]">Découvrez chaque fonctionnalité en détail</h3>
          <p className="text-[var(--text-dim)] text-sm">
            Recettes avec alternatives, gestion de stock, batch tool, communication d&apos;équipe — tout est expliqué.
          </p>
          <Link
            href="/features"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)] hover:underline"
          >
            Explorer les fonctionnalités
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] px-6 py-6 text-center text-xs text-[var(--text-dim)]">
        © 2025 Mixtura — Tous droits réservés ·{' '}
        <Link href="/legal/mentions" className="hover:text-[var(--text)] transition-colors">Mentions légales</Link>
        {' · '}
        <Link href="/legal/confidentialite" className="hover:text-[var(--text)] transition-colors">Confidentialité</Link>
      </footer>
    </main>
  );
}
