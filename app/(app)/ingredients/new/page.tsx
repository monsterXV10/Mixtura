import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { toIngredientOption } from '@/lib/utils/ingredients';
import IngredientForm from '../IngredientForm';

export default async function NewIngredientPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, data')
    .eq('user_id', user.id);

  const userIngredients = (ingredients ?? []).map((i) =>
    toIngredientOption({ id: i.id as string, data: i.data })
  );

  return (
    <>
      <TopBar title="Nouvel ingrédient" backHref="/ingredients" />
      <main className="px-4 py-5 pb-safe">
        <IngredientForm userId={user.id} userIngredients={userIngredients} />
      </main>
    </>
  );
}
