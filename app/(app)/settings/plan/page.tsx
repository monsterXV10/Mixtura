import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { PLANS, type PlanId } from '@/config/plans';
import { Check, X, Crown, Zap, Users, Star } from 'lucide-react';
import Link from 'next/link';

const PLAN_ORDER: PlanId[] = ['free', 'plus', 'team', 'team_plus'];

const PLAN_ICONS = {
  free: Zap,
  plus: Star,
  team: Users,
  team_plus: Crown,
};

const PLAN_PRICES = {
  free: { monthly: 0, annual: 0 },
  plus: { monthly: 9.90, annual: 7.90 },
  team: { monthly: 24.90, annual: 19.90 },
  team_plus: { monthly: 49.90, annual: 39.90 },
};

const PLAN_DESC = {
  free: 'Pour découvrir Mixtura',
  plus: 'Pour le barman solo',
  team: 'Pour votre établissement',
  team_plus: 'Multi-établissements',
};

const FEATURES_LIST = [
  { key: 'recipes', label: 'Recettes', getValue: (p: PlanId) => PLANS[p].limits.recipes === Infinity ? 'Illimitées' : `${PLANS[p].limits.recipes}` },
  { key: 'ingredients', label: 'Ingrédients', getValue: (p: PlanId) => PLANS[p].limits.ingredients === Infinity ? 'Illimités' : `${PLANS[p].limits.ingredients}` },
  { key: 'batchTool', label: 'Outil Batch', getValue: (p: PlanId) => PLANS[p].features.batchTool },
  { key: 'exportPdf', label: 'Export PDF', getValue: (p: PlanId) => PLANS[p].features.exportPdf },
  { key: 'teamManagement', label: 'Gestion d\'équipe', getValue: (p: PlanId) => PLANS[p].features.teamManagement },
  { key: 'ocrScanner', label: 'Scanner OCR', getValue: (p: PlanId) => PLANS[p].features.ocrScanner },
  { key: 'advancedAnalytics', label: 'Analyses avancées', getValue: (p: PlanId) => PLANS[p].features.advancedAnalytics },
];

export default async function PlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const currentPlan = (profile?.plan ?? 'free') as PlanId;

  return (
    <>
      <TopBar title="Mon plan" />
      <main className="px-4 py-5 pb-24 max-w-xl mx-auto space-y-6">

        {/* Current plan badge */}
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--gold)/15' }}>
            <Crown size={18} style={{ color: 'var(--gold)' }} />
          </div>
          <div>
            <p className="text-xs text-[var(--text-dim)]">Plan actuel</p>
            <p className="font-semibold text-[var(--text)]">{PLANS[currentPlan].name}</p>
          </div>
        </div>

        {/* Plan cards */}
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const prices = PLAN_PRICES[planId];
          const Icon = PLAN_ICONS[planId];
          const isCurrent = planId === currentPlan;
          const isUpgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlan);

          return (
            <div
              key={planId}
              className="card space-y-4"
              style={isCurrent ? { borderColor: 'var(--gold)', borderWidth: '1.5px' } : {}}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface2)' }}>
                    <Icon size={16} style={{ color: 'var(--gold)' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[var(--text)]">{plan.name}</p>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--gold)/15', color: 'var(--gold)' }}>
                          Actuel
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-dim)]">{PLAN_DESC[planId]}</p>
                  </div>
                </div>
                <div className="text-right">
                  {prices.monthly === 0 ? (
                    <p className="text-lg font-bold text-[var(--text)]">Gratuit</p>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-[var(--text)]">{prices.monthly.toFixed(2).replace('.', ',')}€</p>
                      <p className="text-[10px] text-[var(--text-dim)]">/mois</p>
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
                          : <X size={14} className="text-[var(--text-dim)] opacity-40" />
                      ) : (
                        <span className="font-medium text-[var(--text)]">{value}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              {isCurrent ? (
                <div className="text-center text-sm text-[var(--text-dim)] py-2">Plan actif</div>
              ) : isUpgrade ? (
                <button
                  disabled
                  className="btn-primary w-full py-2.5 text-sm opacity-60 cursor-not-allowed"
                  title="Paiements bientôt disponibles"
                >
                  Passer à {plan.name} — Bientôt disponible
                </button>
              ) : (
                <div className="text-center text-xs text-[var(--text-dim)] py-1">Plan inférieur</div>
              )}
            </div>
          );
        })}

        <p className="text-xs text-center text-[var(--text-dim)] px-4">
          Les paiements seront disponibles prochainement. En attendant, contactez-nous à{' '}
          <a href="mailto:contact@mixtura.buzz" className="underline">contact@mixtura.buzz</a> pour un accès anticipé.
        </p>

        <div className="flex justify-center gap-4 text-xs text-[var(--text-dim)]">
          <Link href="/legal/cgu" className="underline hover:text-[var(--text)]">CGU</Link>
          <Link href="/legal/confidentialite" className="underline hover:text-[var(--text)]">Confidentialité</Link>
          <Link href="/legal/mentions" className="underline hover:text-[var(--text)]">Mentions légales</Link>
        </div>
      </main>
    </>
  );
}
