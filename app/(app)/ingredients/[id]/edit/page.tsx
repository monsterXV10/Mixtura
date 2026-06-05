import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { toIngredientOption } from '@/lib/utils/ingredients';
import IngredientForm from '../../IngredientForm';

export default async function EditIngredientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: ingredient }, { data: ingredientRows }, { data: profile }] = await Promise.all([
    supabase.from('ingredients').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('ingredients').select('id, data').eq('user_id', user.id).limit(500),
    supabase.from('profiles').select('visible_categories, category_suggestions').eq('id', user.id).single(),
  ]);
  const visibleCategories = (profile?.visible_categories as string[] | null) ?? null;
  const categorySuggestions = (profile?.category_suggestions as Record<string, string[]> | null) ?? null;

  if (!ingredient) notFound();

  const userIngredients = (ingredientRows ?? [])
    .filter((i) => i.id !== id) // exclude self from composition options
    .map((i) => toIngredientOption({ id: i.id as string, data: i.data }));

  const d = ingredient.data as {
    name?: string;
    type?: string;
    unit?: string;
    price?: number;
    stock?: number;
    format?: number;
    homemade?: boolean;
    brand?: string;
    family?: string;
    supplier?: string;
    composition?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
    yield?: number;
    yieldUnit?: string;
    steps?: string;
    preparationType?: string;
    outputs?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
  };

  const initialData = {
    id: ingredient.id as string,
    name: d?.name ?? '',
    type: d?.type ?? 'spirit',
    unit: d?.unit ?? 'cl',
    price: d?.price ?? 0,
    stock: d?.stock ?? 0,
    format: d?.format ?? 70,
    homemade: d?.homemade ?? false,
    brand: d?.brand,
    family: d?.family,
    supplier: d?.supplier,
    composition: d?.composition,
    yield: d?.yield,
    yieldUnit: d?.yieldUnit,
    steps: d?.steps,
    preparationType: d?.preparationType,
    outputs: d?.outputs,
  };

  return (
    <>
      <TopBar title="Modifier l'ingrédient" backHref={`/ingredients/${id}`} />
      <main className="px-4 py-5 pb-safe">
        <IngredientForm userId={user.id} userIngredients={userIngredients} initialData={initialData} visibleCategories={visibleCategories} categorySuggestions={categorySuggestions} />
      </main>
    </>
  );
}
