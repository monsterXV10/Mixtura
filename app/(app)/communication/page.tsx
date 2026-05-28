import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { PLANS, hasFeature, type PlanId } from '@/config/plans';
import CommunicationClient from './CommunicationClient';
import type { Team, TeamMember, TeamInvitation, TeamSharedItem, TeamNote } from '@/lib/team';

export const dynamic = 'force-dynamic';

export default async function CommunicationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, display_name')
    .eq('id', user.id)
    .single();

  const plan = ((profile?.plan as PlanId) ?? 'free') as PlanId;
  const myName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Moi';
  const canCreateTeam = hasFeature(plan, 'teamManagement');

  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id);
  const teamIds = (memberships ?? []).map((m) => m.team_id as string);

  let teams: Team[] = [];
  let members: TeamMember[] = [];
  let sharedItems: TeamSharedItem[] = [];
  let invitations: TeamInvitation[] = [];
  let notes: TeamNote[] = [];

  if (teamIds.length > 0) {
    const [t, m, s, inv, n] = await Promise.all([
      supabase.from('teams').select('*').in('id', teamIds),
      supabase.from('team_members').select('*').in('team_id', teamIds),
      supabase.from('team_shared_items').select('*').in('team_id', teamIds).order('created_at', { ascending: false }),
      supabase.from('team_invitations').select('*').in('team_id', teamIds).eq('accepted', false),
      supabase.from('team_notes').select('*').in('team_id', teamIds).order('created_at', { ascending: true }),
    ]);
    teams = (t.data ?? []) as Team[];
    members = (m.data ?? []) as TeamMember[];
    sharedItems = (s.data ?? []) as TeamSharedItem[];
    invitations = (inv.data ?? []) as TeamInvitation[];
    notes = (n.data ?? []) as TeamNote[];
  }

  // Invitations addressed to the current user (teams they're not yet in)
  let pendingInvites: Array<TeamInvitation & { team_name: string }> = [];
  if (user.email) {
    const { data: myInvites } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('email', user.email)
      .eq('accepted', false);
    const external = (myInvites ?? []).filter((i) => !teamIds.includes(i.team_id as string)) as TeamInvitation[];
    if (external.length > 0) {
      const invTeamIds = [...new Set(external.map((i) => i.team_id))];
      const { data: invTeams } = await supabase.from('teams').select('id, name').in('id', invTeamIds);
      const nameMap = new Map((invTeams ?? []).map((t) => [t.id as string, t.name as string]));
      pendingInvites = external.map((i) => ({ ...i, team_name: nameMap.get(i.team_id) ?? 'Équipe' }));
    }
  }

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

  // Active batches shared with user's teams
  interface BatchRow {
    id: string; user_id: string; team_id: string | null; name: string;
    items: Array<{ key: string; recipeName: string; qty: number; qtyUnit: string }>;
    timers: Record<string, { durationSec: number; startedAt: string | null; label: string }>;
    checked: string[]; status: string; created_at: string; updated_at: string;
  }
  let teamBatches: BatchRow[] = [];
  if (teamIds.length > 0) {
    const { data: batchRows } = await supabase
      .from('batches')
      .select('*')
      .in('team_id', teamIds)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });
    teamBatches = (batchRows ?? []) as BatchRow[];
  }

  return (
    <>
      <TopBar title="Équipe" />
      <main className="px-4 py-4 pb-24 max-w-xl mx-auto">
        <CommunicationClient
          userId={user.id}
          userEmail={user.email ?? ''}
          myName={myName}
          canCreateTeam={canCreateTeam}
          teamPlanName={PLANS.team.name}
          teams={teams}
          members={members}
          invitations={invitations}
          sharedItems={sharedItems}
          notes={notes}
          myRecipes={myRecipes}
          pendingInvites={pendingInvites}
          teamBatches={teamBatches}
        />
      </main>
    </>
  );
}
