import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
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

  const [{ data: ingredient }, { data: ingredientRows }] = await Promise.all([
    supabase.from('ingredients').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('ingredients').select('id, data').eq('user_id', user.id),
  ]);

  if (!ingredient) notFound();

  const userIngredients = (ingredientRows ?? [])
    .filter((i) => i.id !== id) // exclude self from composition options
    .map((i) => {
      const d = i.data as { name?: string; unit?: string; homemade?: boolean };
      return {
        id: i.id as string,
        name: d?.name ?? '',
        unit: d?.unit ?? 'cl',
        homemade: d?.homemade ?? false,
      };
    });

  const d = ingredient.data as {
    name?: string;
    type?: string;
    unit?: string;
    price?: number;
    stock?: number;
    format?: number;
    homemade?: boolean;
    composition?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
    yield?: number;
    yieldUnit?: string;
    steps?: string;
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
    composition: d?.composition,
    yield: d?.yield,
    yieldUnit: d?.yieldUnit,
    steps: d?.steps,
  };

  return (
    <>
      <TopBar title="Modifier l'ingrédient" backHref={`/ingredients/${id}`} />
      <main className="px-4 py-5 pb-safe">
        <IngredientForm userId={user.id} userIngredients={userIngredients} initialData={initialData} />
      </main>
    </>
  );
}
