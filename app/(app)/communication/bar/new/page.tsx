import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import TeamIngredientForm from '../TeamIngredientForm';

export const dynamic = 'force-dynamic';

export default async function NewTeamIngredientPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: memberships } = await supabase
    .from('team_members').select('team_id').eq('user_id', user.id);
  const teamIds = (memberships ?? []).map((m) => m.team_id as string);
  if (teamIds.length === 0) redirect('/communication');

  const teamId = params.team && teamIds.includes(params.team) ? params.team : teamIds[0];

  const { data: ingredientRows } = await supabase
    .from('team_ingredients')
    .select('id, data')
    .eq('team_id', teamId)
    .limit(200);

  const teamIngredients = (ingredientRows ?? []).map((i) => ({
    id: i.id as string,
    name: ((i.data as { name?: string })?.name) ?? '',
    unit: ((i.data as { unit?: string })?.unit) ?? 'cl',
  }));

  return (
    <>
      <TopBar title="Nouvel ingrédient" backHref={`/communication/bar?team=${teamId}`} />
      <main className="px-4 py-5 pb-safe">
        <TeamIngredientForm userId={user.id} teamId={teamId} teamIngredients={teamIngredients} />
      </main>
    </>
  );
}
