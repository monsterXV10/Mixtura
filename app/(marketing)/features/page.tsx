import Link from 'next/link';
import { ArrowRight, BookOpen, Package, Wrench, Users, ArrowLeft, CheckCircle2, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    tag: 'Recettes',
    title: 'Votre carte complète, toujours à jour',
    desc: 'Centralisez l\'ensemble de vos recettes de cocktails, cafés et plats dans une interface conçue pour la rapidité en service. Chaque fiche recette embarque les quantités précises, les instructions pas à pas et les ingrédients liés à votre stock — avec leur statut en temps réel.',
    points: [
      'Import direct depuis 250+ recettes du catalogue IBA',
      'Ingrédients avec alternatives "ou…" (ex. Gin ou Vodka)',
      'Liaison automatique à votre stock au moment de l\'import',
      'Méthode, verre, garniture et spiritueux principal',
      'Instructions de préparation numérotées',
      'Partage instantané avec votre équipe',
    ],
    color: 'rgba(99,179,237,0.1)',
    border: 'rgba(99,179,237,0.25)',
    iconColor: '#63b3ed',
    side: 'right',
  },
  {
    icon: Package,
    tag: 'Stock',
    title: 'Contrôle total de vos ingrédients',
    desc: 'Chaque bouteille, produit et préparation maison est suivi avec son stock actuel, son format, son prix d\'achat et la marge qu\'il génère. Les alertes automatiques vous signalent les ruptures avant qu\'elles impactent le service.',
    points: [
      'Stock, format et prix d\'achat par ingrédient',
      'Calcul automatique du coût de revient d\'une recette',
      'Alertes visuelles stock bas (seuil personnalisable)',
      'Ingrédients maison : préparez et liez à vos recettes',
      'Filtres par type, famille, marque',
      'Historique des mises à jour de stock',
    ],
    color: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.22)',
    iconColor: '#34d399',
    side: 'left',
  },
  {
    icon: Wrench,
    tag: 'Batch Tool',
    title: 'Calculateur de production en quelques secondes',
    desc: 'Entrez une recette et un multiplicateur — Mixtura calcule instantanément toutes les quantités pour votre production. Idéal pour les soirées, les pré-batchs ou la mise en bouteille. Le minuteur interactif suit la méthode de préparation.',
    points: [
      'Multiplication de n\'importe quelle recette (×1 à ×200)',
      'Résultat en cl, ml, L selon votre choix',
      'Minuteur synchronisé à la méthode (Shake, Stir…)',
      'Calcul du coût total de production',
      'Conversion d\'unités automatique',
      'Export des quantités (PDF à venir)',
    ],
    color: 'rgba(200,169,110,0.08)',
    border: 'rgba(200,169,110,0.22)',
    iconColor: 'var(--gold)',
    side: 'right',
  },
  {
    icon: Users,
    tag: 'Équipe',
    title: 'Travaillez ensemble, de n\'importe où',
    desc: 'Invitez vos barmen, chefs de rang et managers. Chacun a un rôle défini (Owner, Admin, User) qui détermine ce qu\'il peut voir et modifier. Les recettes partagées apparaissent instantanément dans la bibliothèque de chaque membre.',
    points: [
      'Invitation par QR code ou lien d\'équipe',
      'Rôles Owner / Admin / User / invité lecture',
      'Partage de recettes en un tap',
      'Messagerie interne par équipe',
      'Activité et notifications en temps réel',
      'Catalogue et stock partagés ou personnels selon les droits',
    ],
    color: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.22)',
    iconColor: '#a78bfa',
    side: 'left',
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 z-10"
        style={{ background: 'var(--bg)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--gold)] flex items-center justify-center">
            <span className="text-[#0A0E1A] font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-[var(--text)] text-lg">Mixtura</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">Connexion</Link>
          <Link href="/register" className="btn-primary text-sm px-4 py-2">Essai gratuit</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-6 py-16 text-center max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition-colors mb-8"
        >
          <ArrowLeft size={13} />
          Retour à l&apos;accueil
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface2)] border border-[var(--border)] text-[var(--gold)] text-xs font-medium mb-6">
          <Zap size={11} />
          <span>Documentation complète</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-[var(--text)] leading-tight mb-4">
          Tout ce que Mixtura{' '}
          <span className="text-[var(--gold)]">peut faire pour votre bar</span>
        </h1>
        <p className="text-[var(--text-dim)] text-base sm:text-lg max-w-xl mx-auto">
          Chaque fonctionnalité a été conçue pour les professionnels du bar — des cocktails à la gestion d&apos;équipe.
        </p>
      </section>

      {/* ── Quick nav ── */}
      <section className="px-6 pb-12">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <a
                key={f.tag}
                href={`#${f.tag.toLowerCase()}`}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                style={{ background: f.color, border: `1px solid ${f.border}`, color: f.iconColor }}
              >
                <Icon size={15} />
                {f.tag}
              </a>
            );
          })}
        </div>
      </section>

      {/* ── Feature sections ── */}
      <div className="px-6 pb-24 space-y-24 max-w-5xl mx-auto">
        {FEATURES.map((feat, fi) => {
          const Icon = feat.icon;
          const isLeft = feat.side === 'left';
          return (
            <section
              key={feat.tag}
              id={feat.tag.toLowerCase()}
              className={`flex flex-col gap-12 ${isLeft ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center`}
            >
              {/* Text */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: feat.color, border: `1px solid ${feat.border}` }}
                  >
                    <Icon size={18} style={{ color: feat.iconColor }} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: feat.iconColor }}>
                    {feat.tag}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] leading-snug">
                  {feat.title}
                </h2>

                <p className="text-[var(--text-dim)] leading-relaxed">
                  {feat.desc}
                </p>

                <ul className="space-y-2.5">
                  {feat.points.map(p => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-[var(--text-dim)]">
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: feat.iconColor }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual card */}
              <div className="lg:w-80 w-full shrink-0">
                <div
                  className="rounded-2xl p-6 space-y-4"
                  style={{ background: feat.color, border: `1px solid ${feat.border}` }}
                >
                  {/* Mock rows depending on feature */}
                  {fi === 0 && (
                    <>
                      <div className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wide">Recettes</div>
                      {[
                        { n: 'Negroni',       i: '3 ing.', green: true },
                        { n: 'Margarita',     i: '4 ing.', green: true },
                        { n: 'Old Fashioned', i: '3 ing.', green: false },
                      ].map(r => (
                        <div key={r.n} className="flex items-center justify-between px-3 py-2 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${r.green ? 'bg-emerald-400' : 'bg-orange-400'}`} />
                            <span className="text-xs text-[var(--text)]">{r.n}</span>
                          </div>
                          <span className="text-[10px] text-[var(--text-dim)]">{r.i}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {fi === 1 && (
                    <>
                      <div className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wide">Stock</div>
                      {[
                        { n: 'Gin',     pct: 78, c: '#34d399', w: '78%' },
                        { n: 'Vodka',   pct: 45, c: '#fb923c', w: '45%' },
                        { n: 'Campari', pct: 8,  c: '#f87171', w: '8%'  },
                      ].map(it => (
                        <div key={it.n} className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-xs text-[var(--text)]">{it.n}</span>
                            <span className="text-[10px]" style={{ color: it.c }}>{it.pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full" style={{ width: it.w, background: it.c }} />
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {fi === 2 && (
                    <>
                      <div className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wide">Batch Tool</div>
                      <div className="px-3 py-2.5 rounded-lg"
                        style={{ background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.25)' }}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[var(--text)]">Negroni</span>
                          <span className="text-sm font-bold" style={{ color: 'var(--gold)' }}>× 12</span>
                        </div>
                      </div>
                      {[['Gin', '54 cl'], ['Campari', '36 cl'], ['Vermouth', '36 cl']].map(([n, q]) => (
                        <div key={n} className="flex justify-between px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span className="text-xs text-[var(--text-dim)]">{n}</span>
                          <span className="text-xs font-medium" style={{ color: 'var(--gold)' }}>{q}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {fi === 3 && (
                    <>
                      <div className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wide">Équipe</div>
                      <div className="flex gap-3">
                        {['A', 'S', 'M'].map(l => (
                          <div key={l} className="flex flex-col items-center gap-1">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>
                              {l}
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </div>
                        ))}
                      </div>
                      <div className="px-3 py-2.5 rounded-xl"
                        style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)' }}>
                        <div className="text-[10px] text-[var(--text-dim)] mb-1.5">Alex a partagé une recette</div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🍸</span>
                          <div>
                            <div className="text-xs font-semibold text-[var(--text)]">Negroni</div>
                            <div className="text-[9px] text-[var(--text-dim)]">3 ingrédients · Stir</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── CTA ── */}
      <section className="px-6 py-20 text-center border-t border-[var(--border)]">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
            Prêt à l&apos;essayer ?
          </h2>
          <p className="text-[var(--text-dim)]">
            Créez votre bar en quelques minutes. Gratuit, sans carte bancaire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary px-8 py-3 gap-2">
              Commencer gratuitement
              <ArrowRight size={16} />
            </Link>
            <Link href="/demo" className="btn-ghost px-8 py-3 gap-2">
              <Zap size={16} />
              Voir la démo
            </Link>
          </div>
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
