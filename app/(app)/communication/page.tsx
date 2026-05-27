import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import CommunicationClient from './CommunicationClient';
import type { Team, TeamMember, TeamSharedItem, TeamNote } from '@/lib/team';

export const dynamic = 'force-dynamic';

export default async function CommunicationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();
  const myName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Moi';

  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id);
  const teamIds = (memberships ?? []).map((m) => m.team_id as string);

  let teams: Team[] = [];
  let members: TeamMember[] = [];
  let sharedItems: TeamSharedItem[] = [];
  let notes: TeamNote[] = [];

  if (teamIds.length > 0) {
    const [t, m, s, n] = await Promise.all([
      supabase.from('teams').select('*').in('id', teamIds),
      supabase.from('team_members').select('*').in('team_id', teamIds),
      supabase
        .from('team_shared_items')
        .select('*')
        .in('team_id', teamIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('team_notes')
        .select('*')
        .in('team_id', teamIds)
        .order('created_at', { ascending: true }),
    ]);
    teams = (t.data ?? []) as Team[];
    members = (m.data ?? []) as TeamMember[];
    sharedItems = (s.data ?? []) as TeamSharedItem[];
    notes = (n.data ?? []) as TeamNote[];
  }

  // The user's own recipes, used to compose a menu to share
  const { data: recipeRows } = await supabase
    .from('recipes')
    .select('id, type, data, metadata')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const myRecipes = (recipeRows ?? []).map((r) => ({
    id: r.id as string,
    type: (r.type as string) ?? 'cocktail',
    name: ((r.data as { name?: string })?.name) ?? 'Sans titre',
    data: r.data as Record<string, unknown>,
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
  }));

  return (
    <>
      <TopBar title="Équipe" />
      <main className="px-4 py-4 pb-24 max-w-xl mx-auto">
        <CommunicationClient
          userId={user.id}
          myName={myName}
          teams={teams}
          members={members}
          sharedItems={sharedItems}
          notes={notes}
          myRecipes={myRecipes}
        />
      </main>
    </>
  );
}
