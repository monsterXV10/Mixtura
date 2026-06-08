import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import MenuClient from './MenuClient';

export const dynamic = 'force-dynamic';

export default async function MenuDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ addRecipe?: string; addName?: string }>;
}) {
  const { id } = await params;
  const { addRecipe, addName } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: menu }, { data: recipeRows }] = await Promise.all([
    supabase.from('menus').select('id, name, data').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('recipes').select('id, type, data').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(500),
  ]);

  if (!menu) notFound();

  const recipes = (recipeRows ?? []).map((r) => {
    const d = r.data as { name?: string } | null;
    return { id: r.id as string, name: d?.name ?? '', type: r.type as string };
  }).filter((r) => r.name);

  return (
    <>
      <TopBar title={menu.name as string || 'Menu'} backHref="/menus" />
      <main className="px-4 py-5 pb-24">
        <MenuClient
          menu={{ id: menu.id as string, name: menu.name as string, data: menu.data as object }}
          recipes={recipes}
          userId={user.id}
          preloadRecipeId={addRecipe}
          preloadRecipeName={addName}
        />
      </main>
    </>
  );
}
