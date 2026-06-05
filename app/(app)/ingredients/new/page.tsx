import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { toIngredientOption } from '@/lib/utils/ingredients';
import IngredientForm from '../IngredientForm';

export default async function NewIngredientPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: ingredients }, { data: profile }] = await Promise.all([
    supabase.from('ingredients').select('id, data').eq('user_id', user.id).limit(500),
    supabase.from('profiles').select('visible_categories').eq('id', user.id).single(),
  ]);

  const userIngredients = (ingredients ?? []).map((i) =>
    toIngredientOption({ id: i.id as string, data: i.data })
  );
  const visibleCategories = (profile?.visible_categories as string[] | null) ?? null;

  return (
    <>
      <TopBar title="Nouvel ingrédient" backHref="/ingredients" />
      <main className="px-4 py-5 pb-safe">
        <IngredientForm userId={user.id} userIngredients={userIngredients} visibleCategories={visibleCategories} />
      </main>
    </>
  );
}
