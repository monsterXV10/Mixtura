import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { toIngredientOption } from '@/lib/utils/ingredients';
import RecipeForm from '../RecipeForm';

export default async function NewRecipePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: ingredients }, { data: recipeRows }, { data: profile }] = await Promise.all([
    supabase.from('ingredients').select('id, data').eq('user_id', user.id).limit(500),
    supabase.from('recipes').select('id, type, data').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(200),
    supabase.from('profiles').select('preferred_unit').eq('id', user.id).single(),
  ]);

  const userIngredients = (ingredients ?? []).map((i) =>
    toIngredientOption({ id: i.id as string, data: i.data })
  );
  const preferredUnit = (profile?.preferred_unit as string) ?? 'ml';

  const userRecipes = (recipeRows ?? []).map((r) => ({
    id: r.id as string,
    name: ((r.data as { name?: string })?.name) ?? 'Sans titre',
    recipeType: (r.type as string) ?? 'cocktail',
  }));

  return (
    <>
      <TopBar title="Nouvelle recette" backHref="/recipes" />
      <main className="px-4 py-5 pb-safe">
        <RecipeForm userId={user.id} userIngredients={userIngredients} userRecipes={userRecipes} preferredUnit={preferredUnit} />
      </main>
    </>
  );
}
