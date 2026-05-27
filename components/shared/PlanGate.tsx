'use client';
import { Lock } from 'lucide-react';
import { PLANS } from '@/config/plans';
import type { PlanId } from '@/config/plans';

interface PlanGateProps {
  requiredPlan: PlanId;
  currentPlan: PlanId;
  feature: string;
  children: React.ReactNode;
}

const PLAN_ORDER: PlanId[] = ['free', 'plus', 'team', 'team_plus'];

export function PlanGate({ requiredPlan, currentPlan, feature, children }: PlanGateProps) {
  const hasAccess = PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan);

  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-30 pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface)]/70 rounded-lg backdrop-blur-sm">
        <Lock size={24} className="text-[var(--gold)] mb-2" />
        <p className="text-sm text-[var(--text)] font-medium">Plan {PLANS[requiredPlan].name} requis</p>
        <p className="text-xs text-[var(--text-dim)] mt-1">{feature}</p>
      </div>
    </div>
  );
}
