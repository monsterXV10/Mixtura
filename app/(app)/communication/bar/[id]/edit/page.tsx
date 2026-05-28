import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import TeamIngredientForm from '../../TeamIngredientForm';

export const dynamic = 'force-dynamic';

export default async function EditTeamIngredientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ team?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: memberships } = await supabase
    .from('team_members').select('team_id').eq('user_id', user.id);
  const teamIds = (memberships ?? []).map((m) => m.team_id as string);
  if (teamIds.length === 0) redirect('/communication');

  const { data: ingredient } = await supabase
    .from('team_ingredients')
    .select('*')
    .eq('id', id)
    .single();

  if (!ingredient || !teamIds.includes(ingredient.team_id as string)) notFound();

  const teamId = sp.team ?? (ingredient.team_id as string);

  // Permission check: creator or manager/owner can edit
  const [{ data: memberRow }, { data: team }] = await Promise.all([
    supabase.from('team_members').select('role').eq('team_id', ingredient.team_id).eq('user_id', user.id).maybeSingle(),
    supabase.from('teams').select('owner_id').eq('id', ingredient.team_id).single(),
  ]);

  const t = team as { owner_id: string } | null;
  const isManager = t?.owner_id === user.id || memberRow?.role === 'admin' || memberRow?.role === 'manager';
  if (!isManager && ingredient.created_by !== user.id) redirect(`/communication/bar/${id}?team=${teamId}`);

  const { data: ingredientRows } = await supabase
    .from('team_ingredients')
    .select('id, data')
    .eq('team_id', teamId);

  const teamIngredients = (ingredientRows ?? [])
    .filter((i) => i.id !== id)
    .map((i) => ({
      id: i.id as string,
      name: ((i.data as { name?: string })?.name) ?? '',
      unit: ((i.data as { unit?: string })?.unit) ?? 'cl',
    }));

  const d = ingredient.data as {
    name?: string; type?: string; unit?: string; price?: number;
    stock?: number; format?: number; homemade?: boolean;
    brand?: string; family?: string; supplier?: string;
    composition?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
    yield?: number; yieldUnit?: string; steps?: string; preparationType?: string;
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
  };

  return (
    <>
      <TopBar title="Modifier l'ingrédient" backHref={`/communication/bar/${id}?team=${teamId}`} />
      <main className="px-4 py-5 pb-safe">
        <TeamIngredientForm
          userId={user.id}
          teamId={teamId}
          teamIngredients={teamIngredients}
          initialData={initialData}
        />
      </main>
    </>
  );
}
