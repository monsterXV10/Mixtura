import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import IngredientsClient from './IngredientsClient';

export default async function IngredientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return <IngredientsClient initialIngredients={ingredients ?? []} userId={user.id} />;
}
