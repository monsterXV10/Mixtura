import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { type PlanId } from '@/config/plans';
import IngredientsClient from './IngredientsClient';

export default async function IngredientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: ingredients }, { data: profile }] = await Promise.all([
    supabase
      .from('ingredients')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single(),
  ]);

  return (
    <IngredientsClient
      initialIngredients={ingredients ?? []}
      userId={user.id}
      userPlan={(profile?.plan ?? 'free') as PlanId}
    />
  );
}
