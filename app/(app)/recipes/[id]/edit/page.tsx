import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { toIngredientOption } from '@/lib/utils/ingredients';
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

  const [{ data: recipe }, { data: ingredientRows }, { data: recipeRows }] = await Promise.all([
    supabase.from('recipes').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('ingredients').select('id, data').eq('user_id', user.id).limit(500),
    supabase.from('recipes').select('id, type, data').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(200),
  ]);

  if (!recipe) notFound();

  const userIngredients = (ingredientRows ?? []).map((i) =>
    toIngredientOption({ id: i.id as string, data: i.data })
  );

  const userRecipes = (recipeRows ?? [])
    .filter((r) => r.id !== id) // exclude current recipe to avoid self-reference
    .map((r) => ({
      id: r.id as string,
      name: ((r.data as { name?: string })?.name) ?? 'Sans titre',
      recipeType: (r.type as string) ?? 'cocktail',
    }));

  // Build a lookup map by name for back-compat: existing rows without ingredientId
  const nameToId = new Map(userIngredients.map((i) => [i.name.toLowerCase(), i.id]));

  const rawMethod = (recipe.metadata as { method?: string | string[] } | null)?.method;
  const method = Array.isArray(rawMethod) ? rawMethod[0] ?? '' : rawMethod ?? '';

  const recipeData = recipe.data as {
    name?: string;
    steps?: string;
    timerSeconds?: number;
    ingredients?: Array<{
      ingredientId?: string;
      recipeRef?: string;
      qty: number;
      name: string;
      unit: string;
      type?: string;
      alternatives?: Array<{ ingredientId?: string; name: string }>;
    }>;
  } | null;

  const recipeMetadata = recipe.metadata as {
    glass?: string;
    method?: string | string[];
    garnish?: string;
    spiritFamily?: string;
    clarifyingAgent?: string;
    clarifyingAgentId?: string;
    clarifyingPct?: number;
  } | null;

  // Normalize legacy ingredients (no ingredientId) by matching name; preserve recipe refs
  const normalizedIngredients = (recipeData?.ingredients ?? []).map((ing) => {
    if (ing.type === 'recipe') {
      return { recipeRef: ing.recipeRef, qty: ing.qty, name: ing.name, unit: ing.unit, type: 'recipe' as const };
    }
    return {
      ingredientId: ing.ingredientId ?? nameToId.get(ing.name?.toLowerCase() ?? '') ?? undefined,
      qty: ing.qty,
      name: ing.name,
      unit: ing.unit,
      alternatives: ing.alternatives,
    };
  });

  const initialData = {
    id: recipe.id as string,
    name: recipeData?.name ?? '',
    type: (recipe.type as 'cocktail' | 'coffee' | 'cuisine' | 'service' | 'milk_punch') ?? 'cocktail',
    ingredients: normalizedIngredients,
    steps: recipeData?.steps ?? '',
    glass: recipeMetadata?.glass ?? '',
    method,
    garnish: recipeMetadata?.garnish ?? '',
    spiritFamily: recipeMetadata?.spiritFamily ?? '',
    timerSeconds: recipeData?.timerSeconds ?? 0,
    clarifyingAgent: recipeMetadata?.clarifyingAgent,
    clarifyingAgentId: recipeMetadata?.clarifyingAgentId,
    clarifyingPct: recipeMetadata?.clarifyingPct,
  };

  return (
    <>
      <TopBar title="Modifier la recette" backHref={`/recipes/${id}`} />
      <main className="px-4 py-5 pb-safe">
        <RecipeForm userId={user.id} userIngredients={userIngredients} userRecipes={userRecipes} initialData={initialData} />
      </main>
    </>
  );
}
