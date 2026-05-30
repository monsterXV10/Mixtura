'use client';
import { useState } from 'react';
import { PLANS, type PlanId } from '@/config/plans';
import { Check, X, Crown, Zap, Users, Star, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

const PLAN_ORDER: PlanId[] = ['free', 'plus', 'team', 'team_plus'];

const PLAN_ICONS = { free: Zap, plus: Star, team: Users, team_plus: Crown };

const PLAN_PRICES = {
  free:      { monthly: 0,     annualMonthly: 0,     annualTotal: 0 },
  plus:      { monthly: 9.90,  annualMonthly: 7.90,  annualTotal: 94.80 },
  team:      { monthly: 24.90, annualMonthly: 19.90, annualTotal: 238.80 },
  team_plus: { monthly: 49.90, annualMonthly: 39.90, annualTotal: 478.80 },
};

const PLAN_DESC = {
  free:      'Pour découvrir Mixtura',
  plus:      'Pour le barman solo',
  team:      'Pour votre établissement',
  team_plus: 'Multi-établissements',
};

const FEATURES_LIST = [
  { key: 'recipes',           label: 'Recettes',          getValue: (p: PlanId) => PLANS[p].limits.recipes === Infinity ? 'Illimitées' : `${PLANS[p].limits.recipes}` },
  { key: 'ingredients',       label: 'Ingrédients',       getValue: (p: PlanId) => PLANS[p].limits.ingredients === Infinity ? 'Illimités' : `${PLANS[p].limits.ingredients}` },
  { key: 'batchTool',         label: 'Outil Batch',       getValue: (p: PlanId) => PLANS[p].features.batchTool },
  { key: 'exportPdf',         label: 'Export PDF',        getValue: (p: PlanId) => PLANS[p].features.exportPdf },
  { key: 'teamManagement',    label: "Gestion d'équipe",  getValue: (p: PlanId) => PLANS[p].features.teamManagement },
  { key: 'ocrScanner',        label: 'Scanner OCR',       getValue: (p: PlanId) => PLANS[p].features.ocrScanner },
  { key: 'advancedAnalytics', label: 'Analyses avancées', getValue: (p: PlanId) => PLANS[p].features.advancedAnalytics },
];

function fmt(n: number) { return n.toFixed(2).replace('.', ','); }

export default function PlanClient({ currentPlan }: { currentPlan: PlanId }) {
  const [annual, setAnnual] = useState(false);
  const [cancellationOpen, setCancellationOpen] = useState(false);

  return (
    <div className="space-y-5">

      {/* Current plan */}
      <div className="card flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,164,92,0.12)' }}>
          <Crown size={18} style={{ color: 'var(--gold)' }} />
        </div>
        <div>
          <p className="text-xs text-[var(--text-dim)]">Plan actuel</p>
          <p className="font-semibold text-[var(--text)]">{PLANS[currentPlan].name}</p>
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={`text-sm font-medium transition-colors ${!annual ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}`}
        >
          Mensuel
        </button>
        <button
          type="button"
          onClick={() => setAnnual(v => !v)}
          className="relative w-11 h-6 rounded-full transition-colors"
          style={{ background: annual ? 'var(--gold)' : 'var(--surface2)' }}
          aria-label="Basculer annuel/mensuel"
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: annual ? 'translateX(22px)' : 'translateX(2px)' }}
          />
        </button>
        <button
          type="button"
          onClick={() => setAnnual(true)}
          className={`text-sm font-medium transition-colors ${annual ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}`}
        >
          Annuel
          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(200,164,92,0.15)', color: 'var(--gold)' }}>
            −20%
          </span>
        </button>
      </div>

      {/* Plan cards */}
      {PLAN_ORDER.map((planId) => {
        const plan = PLANS[planId];
        const prices = PLAN_PRICES[planId];
        const Icon = PLAN_ICONS[planId];
        const isCurrent = planId === currentPlan;
        const isUpgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlan);
        const displayPrice = annual ? prices.annualMonthly : prices.monthly;
        const saving = prices.monthly > 0 ? Math.round((prices.monthly * 12) - prices.annualTotal) : 0;

        return (
          <div
            key={planId}
            className="card space-y-4"
            style={isCurrent ? { borderColor: 'var(--gold)', borderWidth: '1.5px' } : {}}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface2)' }}>
                  <Icon size={16} style={{ color: 'var(--gold)' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[var(--text)]">{plan.name}</p>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(200,164,92,0.15)', color: 'var(--gold)' }}>
                        Actuel
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-dim)]">{PLAN_DESC[planId]}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                {displayPrice === 0 ? (
                  <p className="text-lg font-bold text-[var(--text)]">Gratuit</p>
                ) : (
                  <>
                    <p className="text-lg font-bold text-[var(--text)]">{fmt(displayPrice)}€</p>
                    <p className="text-[10px] text-[var(--text-dim)]">/mois</p>
                    {annual && saving > 0 && (
                      <p className="text-[10px] font-medium" style={{ color: 'var(--gold)' }}>
                        économisez {fmt(saving)}€/an
                      </p>
                    )}
                    {annual && prices.annualTotal > 0 && (
                      <p className="text-[10px] text-[var(--text-dim)]">facturé {fmt(prices.annualTotal)}€/an</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              {FEATURES_LIST.map(({ key, label, getValue }) => {
                const value = getValue(planId);
                const isBool = typeof value === 'boolean';
                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-dim)]">{label}</span>
                    {isBool ? (
                      value
                        ? <Check size={14} className="text-emerald-400" />
                        : <X size={14} className="text-[var(--text-dim)] opacity-30" />
                    ) : (
                      <span className="font-medium text-[var(--text)]">{value}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            {isCurrent ? (
              <div className="text-center text-sm text-[var(--text-dim)] py-1.5">Plan actif</div>
            ) : isUpgrade ? (
              <button
                disabled
                className="btn-primary w-full py-2.5 text-sm opacity-50 cursor-not-allowed"
              >
                Passer à {plan.name} — Bientôt disponible
              </button>
            ) : (
              <div className="text-center text-xs text-[var(--text-dim)] py-1">Plan inférieur</div>
            )}
          </div>
        );
      })}

      {/* Cancellation policy */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setCancellationOpen(v => !v)}
          className="w-full flex items-center justify-between text-sm font-medium text-[var(--text)] py-0.5"
        >
          <span>Que se passe-t-il si j&apos;arrête ?</span>
          {cancellationOpen ? <ChevronUp size={15} className="text-[var(--text-dim)]" /> : <ChevronDown size={15} className="text-[var(--text-dim)]" />}
        </button>

        {cancellationOpen && (
          <div className="mt-4 space-y-3 text-sm" style={{ color: 'var(--text-dim)' }}>
            <div className="space-y-2">
              <p className="font-medium text-[var(--text)]">Résiliation d&apos;un abonnement mensuel</p>
              <ul className="space-y-1.5 ml-3">
                <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span> Accès complet jusqu&apos;à la fin de la période payée</li>
                <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span> Aucun prélèvement supplémentaire</li>
                <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span> Vos données restent accessibles 30 jours après la fin</li>
                <li className="flex gap-2"><span style={{ color: 'var(--gold)' }} className="shrink-0">→</span> Passage automatique au plan Free après 30 jours</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-[var(--text)]">Résiliation d&apos;un abonnement annuel</p>
              <ul className="space-y-1.5 ml-3">
                <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span> Accès jusqu&apos;à la date anniversaire</li>
                <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span> Droit de rétractation 14 jours (1ère souscription uniquement)</li>
                <li className="flex gap-2"><span className="text-red-400 shrink-0">✗</span> Pas de remboursement proratisé après les 14 jours</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-[var(--text)]">Suppression du compte</p>
              <ul className="space-y-1.5 ml-3">
                <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span> Exportez vos données avant suppression</li>
                <li className="flex gap-2"><span className="text-red-400 shrink-0">✗</span> Suppression définitive après 30 jours — irréversible</li>
              </ul>
            </div>

            <p className="text-xs pt-1">
              Questions ? <a href="mailto:contact@mixtura.buzz" className="underline">contact@mixtura.buzz</a>
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-center px-4" style={{ color: 'var(--text-dim)' }}>
        Paiements disponibles prochainement —{' '}
        <a href="mailto:contact@mixtura.buzz" className="underline">accès anticipé</a>
      </p>

      <div className="flex justify-center gap-4 text-xs" style={{ color: 'var(--text-dim)' }}>
        <Link href="/legal/cgu" className="underline hover:text-[var(--text)]">CGU</Link>
        <Link href="/legal/confidentialite" className="underline hover:text-[var(--text)]">Confidentialité</Link>
        <Link href="/legal/mentions" className="underline hover:text-[var(--text)]">Mentions légales</Link>
      </div>
    </div>
  );
}
