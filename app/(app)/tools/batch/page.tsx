import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import BatchClient from './BatchClient';

export const dynamic = 'force-dynamic';

export default async function BatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: recipeRows },
    { data: ingredientRows },
    { data: memberships },
  ] = await Promise.all([
    supabase.from('recipes').select('id, type, data, metadata').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('ingredients').select('id, data').eq('user_id', user.id),
    supabase.from('team_members').select('team_id').eq('user_id', user.id),
  ]);

  const teamIds = (memberships ?? []).map((m) => m.team_id as string);
  let teams: Array<{ id: string; name: string; batchMode: string }> = [];
  if (teamIds.length > 0) {
    const { data: teamRows } = await supabase.from('teams').select('id, name, settings').in('id', teamIds);
    teams = (teamRows ?? []).map((t) => ({
      id: t.id as string,
      name: t.name as string,
      batchMode: ((t.settings as { batch_mode?: string } | null)?.batch_mode) ?? 'readonly',
    }));
  }

  const recipes = (recipeRows ?? []).map((r) => {
    const d = r.data as {
      name?: string;
      steps?: string;
      timerSeconds?: number;
      ingredients?: Array<{ ingredientId?: string; qty: number; name: string; unit: string; type?: string; homemade?: boolean }>;
    } | null;
    const m = r.metadata as { glass?: string; method?: string | string[] } | null;
    const rawMethod = m?.method;
    return {
      id: r.id as string,
      name: d?.name ?? '',
      type: r.type as string,
      ingredients: d?.ingredients ?? [],
      steps: d?.steps ?? '',
      timerSeconds: d?.timerSeconds ?? 0,
      method: Array.isArray(rawMethod) ? rawMethod[0] : rawMethod,
    };
  }).filter((r) => r.name && r.ingredients.length > 0);

  const stockMap: Record<string, {
    id: string; name: string; type?: string; unit: string;
    price?: number; format?: number; stock?: number; homemade?: boolean;
    composition?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
    yield?: number; yieldUnit?: string; steps?: string;
  }> = {};
  for (const row of ingredientRows ?? []) {
    const d = row.data as {
      name?: string; type?: string; unit?: string; price?: number; format?: number;
      stock?: number; homemade?: boolean;
      composition?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
      yield?: number; yieldUnit?: string; steps?: string;
    } | null;
    stockMap[row.id as string] = {
      id: row.id as string, name: d?.name ?? '', type: d?.type, unit: d?.unit ?? '',
      price: d?.price, format: d?.format, stock: d?.stock, homemade: d?.homemade,
      composition: d?.composition, yield: d?.yield, yieldUnit: d?.yieldUnit, steps: d?.steps,
    };
  }

  return (
    <>
      <TopBar title="Batch" backHref="/tools" />
      <main className="px-4 py-5 pb-24">
        <BatchClient recipes={recipes} stockMap={stockMap} userId={user.id} teams={teams} />
      </main>
    </>
  );
}
