'use client';
import { useState, useEffect } from 'react';
import { BookOpen, Package, Wrench, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const CSS = `
  @keyframes mx-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mx-in {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes mx-tap {
    0%   { transform: scale(0.2); opacity: 0.9; }
    65%  { transform: scale(2.4); opacity: 0; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes mx-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(200,169,110,0); }
    50%       { box-shadow: 0 0 0 5px rgba(200,169,110,0.28); }
  }
  @keyframes mx-pulse-red {
    0%, 100% { background: rgba(248,113,113,0.15); border-color: rgba(248,113,113,0.35); }
    50%       { background: rgba(248,113,113,0.30); border-color: rgba(248,113,113,0.7); }
  }
  @keyframes mx-badge {
    0%, 55% { transform: scale(0); opacity: 0; }
    75%     { transform: scale(1.25); opacity: 1; }
    100%    { transform: scale(1);   opacity: 1; }
  }
  @keyframes mx-bar {
    from { width: 0; }
  }
  @keyframes mx-slide-card {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mx-notif-dot {
    0%, 50% { transform: scale(0); }
    70%     { transform: scale(1.3); }
    100%    { transform: scale(1); }
  }
  @keyframes slide-text {
    from { opacity: 0; transform: translateX(18px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes count-in {
    0%  { opacity: 0; transform: translateY(8px); }
    20%, 80% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-8px); }
  }
`;

// ─── Phone frame ─────────────────────────────────────────────────────────────
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative rounded-[30px] overflow-hidden shrink-0"
      style={{
        width: 200,
        height: 396,
        background: '#0A0E1A',
        border: '2px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* status bar */}
      <div
        className="flex items-center justify-between px-4"
        style={{ height: 28, borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>9:41</span>
        <div style={{ width: 48, height: 14, borderRadius: 8, background: 'rgba(0,0,0,0.5)' }} />
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>●●●</span>
      </div>
      <div style={{ height: 368, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Tap ripple ───────────────────────────────────────────────────────────────
function Tap({ top, left, delay = '0s' }: { top: string; left: string; delay?: string }) {
  return (
    <div
      className="absolute pointer-events-none rounded-full border-2"
      style={{
        top, left,
        width: 24, height: 24,
        marginLeft: -12, marginTop: -12,
        borderColor: 'var(--gold)',
        animation: `mx-tap 1.8s ease-out ${delay} infinite`,
        zIndex: 20,
      }}
    />
  );
}

// ─── Mock screens ─────────────────────────────────────────────────────────────

function RecipesMock() {
  const ings = [
    { name: 'Gin', qty: '3 cl', dot: '#34d399', d: '1.0s' },
    { name: 'Campari', qty: '3 cl',   dot: '#34d399', d: '1.15s' },
    { name: 'Vermouth', qty: '3 cl',  dot: '#fb923c', d: '1.3s' },
  ];
  return (
    <div className="h-full flex flex-col" style={{ background: '#0A0E1A', color: 'white' }}>
      <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>Recettes</span>
      </div>
      <div className="px-3 py-2 space-y-1.5 flex-1">
        {[
          { n: 'Negroni', i: '3 ing.', active: true },
          { n: 'Margarita', i: '4 ing.', active: false },
          { n: 'Old Fashioned', i: '3 ing.', active: false },
        ].map((r, idx) => (
          <div
            key={r.n}
            style={{
              padding: '6px 8px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: r.active ? 'rgba(200,169,110,0.10)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${r.active ? 'rgba(200,169,110,0.35)' : 'rgba(255,255,255,0.05)'}`,
              animation: r.active
                ? `mx-up 0.3s ease-out ${idx * 0.08}s both, mx-glow 2s ease-in-out 0.6s infinite`
                : `mx-up 0.3s ease-out ${idx * 0.08}s both`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
              <span style={{ fontSize: 10.5, color: 'var(--text)' }}>{r.n}</span>
            </div>
            <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{r.i}</span>
          </div>
        ))}

        {/* detail card */}
        <div
          style={{
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.025)',
            overflow: 'hidden',
            animation: 'mx-up 0.4s ease-out 0.7s both',
          }}
        >
          <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--gold)' }}>Negroni</span>
          </div>
          {ings.map(ing => (
            <div
              key={ing.name}
              style={{
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                animation: `mx-in 0.3s ease-out ${ing.d} both`,
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: ing.dot, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 9.5, color: 'var(--text-dim)' }}>{ing.name}</span>
              <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--gold)' }}>{ing.qty}</span>
            </div>
          ))}
        </div>
      </div>
      <Tap top="33%" left="52%" delay="0.5s" />
    </div>
  );
}

function StocksMock() {
  const items = [
    { name: 'Gin',      pct: 78, color: '#34d399', w: '78%',  d: '0.1s', low: false },
    { name: 'Vodka',    pct: 42, color: '#fb923c', w: '42%',  d: '0.2s', low: false },
    { name: 'Campari',  pct: 9,  color: '#f87171', w: '9%',   d: '0.3s', low: true  },
    { name: 'Vermouth', pct: 55, color: '#34d399', w: '55%',  d: '0.4s', low: false },
  ];
  return (
    <div className="h-full flex flex-col" style={{ background: '#0A0E1A', color: 'white' }}>
      <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>Stock</span>
      </div>
      <div className="px-3 py-3 space-y-2 flex-1">
        {items.map(it => (
          <div
            key={it.name}
            style={{
              padding: '7px 8px',
              borderRadius: 8,
              background: it.low ? undefined : 'rgba(255,255,255,0.03)',
              border: `1px solid ${it.low ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.05)'}`,
              animation: it.low
                ? `mx-up 0.3s ease-out ${it.d} both, mx-pulse-red 1.8s ease-in-out 0.8s infinite`
                : `mx-up 0.3s ease-out ${it.d} both`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: it.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, color: 'var(--text)' }}>{it.name}</span>
              </div>
              <span style={{ fontSize: 9.5, color: it.low ? '#f87171' : 'var(--text-dim)' }}>{it.pct}%</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 2,
                  background: it.color,
                  width: it.w,
                  animation: `mx-bar 0.8s ease-out ${it.d} both`,
                }}
              />
            </div>
          </div>
        ))}

        {/* alert badge */}
        <div
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'mx-badge 3s ease-out 0.4s both',
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#f87171' }}>1 ingrédient en stock bas</span>
        </div>
      </div>
    </div>
  );
}

function BatchMock() {
  const quantities = [
    { name: 'Gin',            qty: '36 cl', d: '1.0s' },
    { name: 'Campari',        qty: '36 cl', d: '1.15s' },
    { name: 'Vermouth rosso', qty: '36 cl', d: '1.3s' },
  ];
  const counts = ['1', '4', '8', '12'];
  return (
    <div className="h-full flex flex-col" style={{ background: '#0A0E1A', color: 'white' }}>
      <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>Batch Tool</span>
      </div>
      <div className="px-3 py-3 space-y-3">
        {/* multiplier card */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(200,169,110,0.08)',
            border: '1px solid rgba(200,169,110,0.25)',
            animation: 'mx-up 0.35s ease-out 0.1s both',
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>Negroni</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text)' }}>Quantité</span>
            <div
              style={{
                width: 40, height: 24, borderRadius: 6,
                background: 'rgba(200,169,110,0.15)',
                border: '1px solid rgba(200,169,110,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {counts.map((n, i) => (
                <span
                  key={n}
                  style={{
                    position: 'absolute',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--gold)',
                    animation: `count-in 1.2s ease-in-out ${i * 0.45}s both`,
                  }}
                >
                  ×{n}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* quantities */}
        <div
          style={{
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.025)',
            overflow: 'hidden',
            animation: 'mx-up 0.35s ease-out 0.5s both',
          }}
        >
          <div style={{ padding: '5px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>Ingrédients calculés</span>
          </div>
          {quantities.map(q => (
            <div
              key={q.name}
              style={{
                padding: '5px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                animation: `mx-in 0.3s ease-out ${q.d} both`,
              }}
            >
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{q.name}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--gold)' }}>{q.qty}</span>
            </div>
          ))}
        </div>

        {/* timer */}
        <div
          style={{
            padding: '7px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'mx-up 0.35s ease-out 1.6s both',
          }}
        >
          <span style={{ fontSize: 14 }}>⏱</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Minuteur · Shake · 10 s</span>
        </div>
      </div>
      <Tap top="22%" left="76%" delay="0.2s" />
    </div>
  );
}

function TeamMock() {
  return (
    <div className="h-full flex flex-col" style={{ background: '#0A0E1A', color: 'white' }}>
      <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>Équipe</span>
          {/* notification dot */}
          <div
            style={{
              width: 8, height: 8, borderRadius: '50%', background: '#f87171',
              animation: 'mx-notif-dot 2.5s ease-out 1.5s both',
            }}
          />
        </div>
      </div>
      <div className="px-3 py-3 space-y-2 flex-1">
        {/* members row */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            animation: 'mx-up 0.3s ease-out 0.1s both',
          }}
        >
          {['A', 'S', 'M'].map((l, i) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `rgba(200,169,110,${0.15 + i * 0.05})`,
                  border: '1px solid rgba(200,169,110,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'var(--gold)',
                }}
              >
                {l}
              </div>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', margin: '3px auto 0' }} />
            </div>
          ))}
        </div>

        {/* shared recipe card (slides in) */}
        <div
          style={{
            padding: '10px 10px',
            borderRadius: 10,
            background: 'rgba(200,169,110,0.07)',
            border: '1px solid rgba(200,169,110,0.28)',
            animation: 'mx-slide-card 0.5s ease-out 0.9s both',
          }}
        >
          <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 6 }}>Alex a partagé une recette</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(200,169,110,0.15)',
                border: '1px solid rgba(200,169,110,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}
            >
              🍸
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>Negroni</div>
              <div style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>3 ingrédients · Stir</div>
            </div>
          </div>
          <div
            style={{
              marginTop: 8, padding: '5px 8px',
              borderRadius: 6,
              background: 'rgba(200,169,110,0.15)',
              textAlign: 'center',
              fontSize: 9.5,
              color: 'var(--gold)',
              fontWeight: 600,
              animation: 'mx-up 0.3s ease-out 1.4s both',
            }}
          >
            Voir la recette →
          </div>
        </div>

        {/* message */}
        <div
          style={{
            padding: '7px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            animation: 'mx-up 0.3s ease-out 1.8s both',
          }}
        >
          <span style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>Sarah : "On l'ajoute ce soir ?"</span>
        </div>
      </div>
    </div>
  );
}

// ─── Slide data ───────────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: BookOpen,
    tag: 'Recettes',
    title: 'Toutes vos recettes, toujours à portée',
    desc: 'Cocktails, cafés, cuisine — centralisez votre carte complète avec fiches ingrédients, alternatives et instructions de préparation.',
    bullets: [
      'Import depuis 200+ recettes IBA',
      'Ingrédients liés à votre stock',
      'Alternatives "ou…" par ingrédient',
    ],
    mock: <RecipesMock />,
  },
  {
    icon: Package,
    tag: 'Stocks',
    title: 'Contrôlez votre stock en temps réel',
    desc: 'Suivez chaque bouteille et consommable. Alertes automatiques quand le stock descend sous le seuil que vous définissez.',
    bullets: [
      'Alertes stock bas visuelles',
      'Coût et marge calculés automatiquement',
      'Ingrédients maison (préparations)',
    ],
    mock: <StocksMock />,
  },
  {
    icon: Wrench,
    tag: 'Batch Tool',
    title: 'Calculateur de batch en quelques secondes',
    desc: 'Multipliez n\'importe quelle recette pour un service, un événement ou une production. Timer synchronisé inclus.',
    bullets: [
      'Multiplication instantanée des quantités',
      'Minuteur interactif par méthode',
      'Calcul du coût de production',
    ],
    mock: <BatchMock />,
  },
  {
    icon: Users,
    tag: 'Équipe',
    title: 'Travaillez en équipe, synchronisés',
    desc: 'Partagez recettes et mises à jour avec votre équipe. Rôles, permissions et communication centralisés.',
    bullets: [
      'Partage de recettes en un tap',
      'Rôles Owner / Admin / User',
      'Messagerie intégrée par équipe',
    ],
    mock: <TeamMock />,
  },
];

// ─── Carousel ─────────────────────────────────────────────────────────────────

export default function FeatureCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 5500);
    return () => clearInterval(id);
  }, []);

  const go = (n: number) => setCurrent((current + n + SLIDES.length) % SLIDES.length);

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <div className="max-w-4xl mx-auto">
      <style>{CSS}</style>

      <div className="relative flex flex-col sm:flex-row items-center gap-10 min-h-[480px]">
        {/* ── Text ── */}
        <div
          key={`t-${current}`}
          className="flex-1 space-y-5"
          style={{ animation: 'slide-text 0.4s ease-out both' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(200,169,110,0.12)', border: '1px solid rgba(200,169,110,0.25)' }}
            >
              <Icon size={17} style={{ color: 'var(--gold)' }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
              {slide.tag}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold leading-snug" style={{ color: 'var(--text)' }}>
            {slide.title}
          </h2>

          <p className="text-base leading-relaxed" style={{ color: 'var(--text-dim)', maxWidth: 380 }}>
            {slide.desc}
          </p>

          <ul className="space-y-2">
            {slide.bullets.map((b, i) => (
              <li
                key={b}
                className="flex items-center gap-2.5 text-sm"
                style={{
                  color: 'var(--text-dim)',
                  animation: `mx-up 0.35s ease-out ${0.1 + i * 0.08}s both`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--gold)' }}
                />
                {b}
              </li>
            ))}
          </ul>

          {/* arrows desktop */}
          <div className="hidden sm:flex items-center gap-3 pt-2">
            <button
              onClick={() => go(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-dim)' }}
              aria-label="Précédent"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => go(1)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-dim)' }}
              aria-label="Suivant"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ── Phone ── */}
        <div
          key={`p-${current}`}
          style={{ animation: 'mx-up 0.45s ease-out both' }}
        >
          <PhoneFrame>
            {slide.mock}
          </PhoneFrame>
        </div>
      </div>

      {/* dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 24 : 6,
              height: 6,
              background: i === current ? 'var(--gold)' : 'rgba(255,255,255,0.15)',
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
