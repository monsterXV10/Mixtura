import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import TeamStockClient from './TeamStockClient';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BarStockPage({
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

  const [{ data: team }, { data: allTeams }, { data: memberRow }, { data: ingredients }] =
    await Promise.all([
      supabase.from('teams').select('id, name, owner_id').eq('id', teamId).single(),
      supabase.from('teams').select('id, name').in('id', teamIds),
      supabase.from('team_members').select('role').eq('team_id', teamId).eq('user_id', user.id).maybeSingle(),
      supabase.from('team_ingredients').select('*').eq('team_id', teamId).order('updated_at', { ascending: false }),
    ]);

  if (!team) redirect('/communication');

  const t = team as { id: string; name: string; owner_id: string };
  const isManager = t.owner_id === user.id || memberRow?.role === 'admin' || memberRow?.role === 'manager';

  return (
    <>
      <TopBar
        title={`Stock — ${t.name}`}
        backHref="/communication"
        actions={
          <Link href={`/communication/bar/new?team=${teamId}`} className="btn-primary h-9 px-3 text-sm gap-1">
            <Plus size={15} /> Ajouter
          </Link>
        }
      />
      <TeamStockClient
        ingredients={ingredients ?? []}
        teamId={teamId}
        userId={user.id}
        isManager={isManager}
        teams={(allTeams ?? []) as Array<{ id: string; name: string }>}
      />
    </>
  );
}
