import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import CoutMargeClient from './CoutMargeClient';

export default async function CoutMargePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: recipeRows }, { data: ingredientRows }] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, type, data, metadata')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(500),
    supabase
      .from('ingredients')
      .select('id, data')
      .eq('user_id', user.id)
      .limit(500),
  ]);

  const recipes = (recipeRows ?? [])
    .map((r) => {
      const d = r.data as { name?: string; ingredients?: Array<{ ingredientId?: string; qty: number; name: string; unit: string }> } | null;
      const m = r.metadata as { glass?: string; method?: string | string[] } | null;
      const rawMethod = m?.method;
      return {
        id: r.id as string,
        name: d?.name ?? '',
        type: r.type as string,
        ingredients: d?.ingredients ?? [],
        glass: m?.glass,
        method: Array.isArray(rawMethod) ? rawMethod[0] : rawMethod,
      };
    })
    .filter((r) => r.name && r.ingredients.length > 0);

  const stockMap: Record<string, { id: string; name: string; unit: string; price?: number; format?: number; stock?: number; homemade?: boolean }> = {};
  for (const row of ingredientRows ?? []) {
    const d = row.data as { name?: string; unit?: string; price?: number; format?: number; stock?: number; homemade?: boolean } | null;
    stockMap[row.id as string] = {
      id: row.id as string,
      name: d?.name ?? '',
      unit: d?.unit ?? '',
      price: d?.price,
      format: d?.format,
      stock: d?.stock,
      homemade: d?.homemade,
    };
  }

  return (
    <>
      <TopBar title="Coût & Marge" backHref="/tools" />
      <main className="px-4 py-5 pb-safe">
        <CoutMargeClient recipes={recipes} stockMap={stockMap} />
      </main>
    </>
  );
}
