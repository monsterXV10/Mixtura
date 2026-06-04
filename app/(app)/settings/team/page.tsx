import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { PLANS, hasFeature, type PlanId } from '@/config/plans';
import TeamClient from './TeamClient';
import type { Team, TeamMember, TeamInvitation, TeamSharedItem, TeamNote } from '@/lib/team';

export const dynamic = 'force-dynamic';

export default async function TeamSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, display_name')
    .eq('id', user.id)
    .single();

  const plan = ((profile?.plan as PlanId) ?? 'free') as PlanId;
  const myName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Moi';

  // Creating/owning a team requires the Team plan. Joining an existing team
  // (by code or invitation) is open to everyone — barmen don't need to pay.
  const canCreateTeam = hasFeature(plan, 'teamManagement');

  // ---- Load team data --------------------------------------------------
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
      supabase.from('teams').select('*').in('id', teamIds).limit(50),
      supabase.from('team_members').select('*').in('team_id', teamIds).limit(200),
      supabase
        .from('team_shared_items')
        .select('*')
        .in('team_id', teamIds)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('team_invitations')
        .select('*')
        .in('team_id', teamIds)
        .eq('accepted', false)
        .limit(100),
      supabase
        .from('team_notes')
        .select('*')
        .in('team_id', teamIds)
        .order('created_at', { ascending: true })
        .limit(200),
    ]);
    teams = (t.data ?? []) as Team[];
    members = (m.data ?? []) as TeamMember[];
    sharedItems = (s.data ?? []) as TeamSharedItem[];
    invitations = (inv.data ?? []) as TeamInvitation[];
    notes = (n.data ?? []) as TeamNote[];
  }

  // ---- Pending invitations addressed to me (teams I'm not yet in) ------
  let pendingInvites: Array<TeamInvitation & { team_name: string }> = [];
  if (user.email) {
    const { data: myInvites } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('email', user.email)
      .eq('accepted', false)
      .limit(50);

    const externalInvites = (myInvites ?? []).filter(
      (i) => !teamIds.includes(i.team_id as string)
    ) as TeamInvitation[];

    if (externalInvites.length > 0) {
      const inviteTeamIds = [...new Set(externalInvites.map((i) => i.team_id))];
      const { data: inviteTeams } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', inviteTeamIds);
      const nameMap = new Map(
        (inviteTeams ?? []).map((tm) => [tm.id as string, tm.name as string])
      );
      pendingInvites = externalInvites.map((i) => ({
        ...i,
        team_name: nameMap.get(i.team_id) ?? 'Équipe',
      }));
    }
  }

  return (
    <>
      <TopBar title="Équipe" backHref="/settings" />
      <main className="px-4 py-5 pb-safe max-w-xl mx-auto">
        <TeamClient
          userId={user.id}
          userEmail={user.email ?? ''}
          myName={myName}
          canCreateTeam={canCreateTeam}
          teamPlanName={PLANS.team.name}
          teams={teams}
          members={members}
          sharedItems={sharedItems}
          invitations={invitations}
          notes={notes}
          pendingInvites={pendingInvites}
        />
      </main>
    </>
  );
}
