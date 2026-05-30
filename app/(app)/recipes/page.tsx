import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { type PlanId } from '@/config/plans';
import RecipesClient from './RecipesClient';

export default async function RecipesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: recipes }, { data: homemadeRows }, { data: profile }] = await Promise.all([
    supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('ingredients')
      .select('id, data, updated_at')
      .eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single(),
  ]);

  const homemadeIngredients = (homemadeRows ?? []).filter(
    (r) => (r.data as { homemade?: boolean })?.homemade === true
  );

  return (
    <RecipesClient
      initialRecipes={recipes ?? []}
      homemadeIngredients={homemadeIngredients}
      userId={user.id}
      userPlan={(profile?.plan ?? 'free') as PlanId}
    />
  );
}
