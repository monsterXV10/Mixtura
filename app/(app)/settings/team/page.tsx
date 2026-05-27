import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { PLANS, hasFeature, type PlanId } from '@/config/plans';
import { Lock, Crown } from 'lucide-react';
import Link from 'next/link';
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

  // ---- Plan gate -------------------------------------------------------
  if (!hasFeature(plan, 'teamManagement')) {
    return (
      <>
        <TopBar title="Équipe" backHref="/settings" />
        <main className="px-4 py-5 pb-safe max-w-xl mx-auto">
          <div className="card flex flex-col items-center text-center gap-4 py-10">
            <div className="w-14 h-14 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
              <Lock size={24} className="text-[var(--gold)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text)]">
                Gestion d&apos;équipe — Plan {PLANS.team.name}
              </h2>
              <p className="text-sm text-[var(--text-dim)] mt-2 max-w-sm">
                Invitez vos barmans, gérez les rôles et partagez recettes,
                préparations et notes avec toute l&apos;équipe.
              </p>
            </div>
            <ul className="text-sm text-[var(--text-dim)] space-y-1.5 text-left">
              <li className="flex items-center gap-2">
                <Crown size={14} className="text-[var(--gold)]" /> Rôles &amp; permissions
              </li>
              <li className="flex items-center gap-2">
                <Crown size={14} className="text-[var(--gold)]" /> Invitations par code &amp; QR
              </li>
              <li className="flex items-center gap-2">
                <Crown size={14} className="text-[var(--gold)]" /> Partage de recettes &amp; ingrédients
              </li>
            </ul>
            <Link href="/settings" className="btn-primary px-5 py-2.5 text-sm mt-2">
              Passer au plan {PLANS.team.name}
            </Link>
          </div>
        </main>
      </>
    );
  }

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
      supabase.from('teams').select('*').in('id', teamIds),
      supabase.from('team_members').select('*').in('team_id', teamIds),
      supabase
        .from('team_shared_items')
        .select('*')
        .in('team_id', teamIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('team_invitations')
        .select('*')
        .in('team_id', teamIds)
        .eq('accepted', false),
      supabase
        .from('team_notes')
        .select('*')
        .in('team_id', teamIds)
        .order('created_at', { ascending: true }),
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
      .eq('accepted', false);

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
