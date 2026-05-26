import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import RecipeForm from '../../RecipeForm';

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: recipe }, { data: ingredientRows }] = await Promise.all([
    supabase.from('recipes').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('ingredients').select('id, data').eq('user_id', user.id),
  ]);

  if (!recipe) notFound();

  const userIngredients = (ingredientRows ?? []).map((i) => {
    const d = i.data as { name?: string; unit?: string; homemade?: boolean };
    return {
      id: i.id as string,
      name: d?.name ?? '',
      unit: d?.unit ?? 'cl',
      homemade: d?.homemade ?? false,
    };
  });

  // Build a lookup map by name for back-compat: existing rows without ingredientId
  const nameToId = new Map(userIngredients.map((i) => [i.name.toLowerCase(), i.id]));

  const rawMethod = (recipe.metadata as { method?: string | string[] } | null)?.method;
  const method = Array.isArray(rawMethod) ? rawMethod[0] ?? '' : rawMethod ?? '';

  const recipeData = recipe.data as {
    name?: string;
    steps?: string;
    ingredients?: Array<{ ingredientId?: string; qty: number; name: string; unit: string }>;
  } | null;

  const recipeMetadata = recipe.metadata as {
    glass?: string;
    method?: string | string[];
    garnish?: string;
  } | null;

  // Normalize legacy ingredients (no ingredientId) by matching name
  const normalizedIngredients = (recipeData?.ingredients ?? []).map((ing) => ({
    ingredientId: ing.ingredientId ?? nameToId.get(ing.name?.toLowerCase() ?? '') ?? undefined,
    qty: ing.qty,
    name: ing.name,
    unit: ing.unit,
  }));

  const initialData = {
    id: recipe.id as string,
    name: recipeData?.name ?? '',
    type: (recipe.type as 'cocktail' | 'coffee' | 'cuisine') ?? 'cocktail',
    ingredients: normalizedIngredients,
    steps: recipeData?.steps ?? '',
    glass: recipeMetadata?.glass ?? '',
    method,
    garnish: recipeMetadata?.garnish ?? '',
  };

  return (
    <>
      <TopBar title="Modifier la recette" backHref={`/recipes/${id}`} />
      <main className="px-4 py-5 pb-safe">
        <RecipeForm userId={user.id} userIngredients={userIngredients} initialData={initialData} />
      </main>
    </>
  );
}
