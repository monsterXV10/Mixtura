import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import IngredientForm from '../IngredientForm';

export default async function NewIngredientPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, data')
    .eq('user_id', user.id);

  const userIngredients = (ingredients ?? []).map((i) => {
    const d = i.data as { name?: string; unit?: string; homemade?: boolean };
    return {
      id: i.id as string,
      name: d?.name ?? '',
      unit: d?.unit ?? 'cl',
      homemade: d?.homemade ?? false,
    };
  });

  return (
    <>
      <TopBar title="Nouvel ingrédient" backHref="/ingredients" />
      <main className="px-4 py-5 pb-safe">
        <IngredientForm userId={user.id} userIngredients={userIngredients} />
      </main>
    </>
  );
}
