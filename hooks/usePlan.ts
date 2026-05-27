'use client';
import { getPlan, hasFeature, canAddRecipe, canAddIngredient } from '@/config/plans';
import type { PlanId } from '@/config/plans';

export function usePlan(planId: PlanId = 'free') {
  const plan = getPlan(planId);

  return {
    plan,
    planId,
    canAddRecipe: (currentCount: number) => canAddRecipe(planId, currentCount),
    canAddIngredient: (currentCount: number) => canAddIngredient(planId, currentCount),
    hasFeature: (feature: Parameters<typeof hasFeature>[1]) => hasFeature(planId, feature),
    limits: plan.limits,
    features: plan.features,
  };
}
