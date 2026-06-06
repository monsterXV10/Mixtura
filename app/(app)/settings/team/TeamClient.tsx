'use client';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import QRCode from 'react-qr-code';
import {
  Users, UserPlus, Copy, Check, QrCode, LogOut, Trash2, Crown,
  Shield, User as UserIcon, Loader2, Plus, LogIn, Mail, X,
  BookOpen, FlaskConical, Download, MessageSquare, Send, ShieldCheck, Lock, Link2,
} from 'lucide-react';
import {
  ROLE_LABELS, ROLE_COLORS, memberRole, generateTeamCode, randomToken,
} from '@/lib/team';
import type {
  Team, TeamMember, TeamInvitation, TeamSharedItem, TeamNote, TeamRole,
} from '@/lib/team';

interface Props {
  userId: string;
  userEmail: string;
  myName: string;
  canCreateTeam: boolean;
  teamPlanName: string;
  teams: Team[];
  members: TeamMember[];
  sharedItems: TeamSharedItem[];
  invitations: TeamInvitation[];
  notes: TeamNote[];
  pendingInvites: Array<TeamInvitation & { team_name: string }>;
}

export default function TeamClient({
  userId, userEmail, myName, canCreateTeam, teamPlanName,
  teams, members, sharedItems, invitations, notes, pendingInvites,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teams[0]?.id ?? null);
  const activeTeam = teams.find((t) => t.id === selectedTeamId) ?? teams[0] ?? null;

  // form state
  const [newTeamName, setNewTeamName] = useState('');
  const [joinCode, setJoinCode] = useState(searchParams.get('join')?.toUpperCase() ?? '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'admin'>('user');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [dismissedInvites, setDismissedInvites] = useState<Set<string>>(new Set());

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showSharedTab, setShowSharedTab] = useState<'recipe' | 'ingredient'>('recipe');

  // derived for active team
  const myRole: TeamRole = useMemo(() => {
    if (!activeTeam) return 'user';
    const me = members.find((m) => m.team_id === activeTeam.id && m.user_id === userId);
    if (activeTeam.owner_id === userId) return 'owner';
    return me ? memberRole(me, activeTeam.owner_id) : 'user';
  }, [activeTeam, members, userId]);

  const canManage = myRole === 'owner' || myRole === 'admin';

  const teamMembers = activeTeam ? members.filter((m) => m.team_id === activeTeam.id) : [];
  const teamInvites = activeTeam ? invitations.filter((i) => i.team_id === activeTeam.id) : [];
  const teamShared = activeTeam ? sharedItems.filter((s) => s.team_id === activeTeam.id) : [];

  const joinUrl =
    typeof window !== 'undefined' && activeTeam
      ? `${window.location.origin}/settings/team?join=${activeTeam.code}`
      : '';

  // ---------------------------------------------------------------- actions
  async function createTeam() {
    const name = newTeamName.trim();
    if (!name) return;
    setBusy('create');
    setError('');
    const code = generateTeamCode();
    const { data: team, error: e1 } = await supabase
      .from('teams')
      .insert({ name, code, owner_id: userId })
      .select()
      .single();
    if (e1 || !team) {
      setError("Impossible de créer l'équipe.");
      setBusy(null);
      return;
    }
    const { error: e2 } = await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userId,
      email: userEmail,
      display_name: myName,
      role: 'admin',
    });
    if (e2) {
      setError("Équipe créée mais l'ajout du membre a échoué.");
    }
    setNewTeamName('');
    setSelectedTeamId(team.id as string);
    setBusy(null);
    router.refresh();
  }

  async function joinByCode() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setBusy('join');
    setError('');
    const { data: teamRaw } = await supabase.rpc('get_team_by_code', { p_code: code }).maybeSingle();
    const team = teamRaw as { id: string; name: string; settings: Record<string, unknown> } | null;
    if (!team) {
      setError('Aucune équipe avec ce code.');
      setBusy(null);
      return;
    }
    const already = members.some((m) => m.team_id === team.id && m.user_id === userId);
    if (already) {
      setError('Vous êtes déjà dans cette équipe.');
      setBusy(null);
      return;
    }
    const { error: e } = await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userId,
      email: userEmail,
      display_name: myName,
      role: 'user',
    });
    if (e) {
      setError('Impossible de rejoindre cette équipe.');
      setBusy(null);
      return;
    }
    // mark any matching invitation accepted
    await supabase
      .from('team_invitations')
      .update({ accepted: true })
      .eq('team_id', team.id)
      .eq('email', userEmail);
    setJoinCode('');
    setSelectedTeamId(team.id as string);
    setBusy(null);
    router.refresh();
  }

  async function acceptInvite(invite: TeamInvitation) {
    setBusy(`inv-${invite.id}`);
    const { error: e } = await supabase.from('team_members').insert({
      team_id: invite.team_id,
      user_id: userId,
      email: userEmail,
      display_name: myName,
      role: invite.role ?? 'user',
    });
    if (!e) {
      await supabase.from('team_invitations').update({ accepted: true }).eq('id', invite.id);
      setSelectedTeamId(invite.team_id);
    }
    setBusy(null);
    router.refresh();
  }

  async function invite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !activeTeam) return;
    setBusy('invite');
    setError('');
    const { error: e } = await supabase.from('team_invitations').insert({
      team_id: activeTeam.id,
      email,
      role: inviteRole,
      token: randomToken(),
      invited_by: userId,
    });
    if (e) {
      setError("Impossible d'enregistrer l'invitation.");
      setBusy(null);
      return;
    }
    // Try to send a real email (no-op if email service isn't configured).
    try {
      const joinUrl = `${window.location.origin}/settings/team?join=${activeTeam.code}`;
      const { error: fnErr } = await supabase.functions.invoke('invite-email', {
        body: { teamId: activeTeam.id, inviteeEmail: email, joinUrl },
      });
      if (fnErr) {
        setError("Invitation créée. Email non envoyé — partagez le code à la place.");
      }
    } catch {
      setError("Invitation créée. Email non envoyé — partagez le code à la place.");
    }
    setInviteEmail('');
    setBusy(null);
    router.refresh();
  }

  async function revokeInvite(id: string) {
    setBusy(`rev-${id}`);
    await supabase.from('team_invitations').delete().eq('id', id);
    setBusy(null);
    router.refresh();
  }

  async function changeRole(member: TeamMember, role: 'user' | 'admin') {
    setBusy(`role-${member.id}`);
    await supabase.from('team_members').update({ role }).eq('id', member.id);
    setBusy(null);
    router.refresh();
  }

  async function removeMember(member: TeamMember) {
    if (!confirm(`Retirer ${member.display_name ?? member.email} de l'équipe ?`)) return;
    setBusy(`rm-${member.id}`);
    await supabase.from('team_members').delete().eq('id', member.id);
    setBusy(null);
    router.refresh();
  }

  async function leaveTeam() {
    if (!activeTeam) return;
    if (!confirm("Quitter cette équipe ?")) return;
    setBusy('leave');
    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', activeTeam.id)
      .eq('user_id', userId);
    setSelectedTeamId(null);
    setBusy(null);
    router.refresh();
  }

  async function deleteTeam() {
    if (!activeTeam) return;
    if (!confirm(`Supprimer définitivement l'équipe "${activeTeam.name}" ? Cette action est irréversible.`)) return;
    setBusy('delete');
    await supabase.from('teams').delete().eq('id', activeTeam.id);
    setSelectedTeamId(null);
    setBusy(null);
    router.refresh();
  }

  async function importSharedItem(item: TeamSharedItem) {
    setBusy(`imp-${item.id}`);
    setError('');
    if (item.item_type === 'recipe') {
      const d = item.data as { type?: string; recipeData?: Record<string, unknown>; metadata?: Record<string, unknown> };
      await supabase.from('recipes').insert({
        user_id: userId,
        type: d.type ?? 'cocktail',
        data: d.recipeData ?? {},
        metadata: d.metadata ?? {},
      });
    } else {
      const d = item.data as { ingredientData?: Record<string, unknown> };
      await supabase.from('ingredients').insert({
        user_id: userId,
        data: d.ingredientData ?? {},
      });
    }
    setBusy(null);
    setError('');
    alert('Importé dans vos ' + (item.item_type === 'recipe' ? 'recettes' : 'ingrédients') + ' !');
  }

  async function deleteSharedItem(item: TeamSharedItem) {
    if (!confirm('Retirer cet élément du partage équipe ?')) return;
    setBusy(`dsi-${item.id}`);
    const name = (item.data as { name?: string }).name;
    if (name) {
      await supabase
        .from('team_shared_items')
        .delete()
        .eq('team_id', item.team_id)
        .eq('item_type', item.item_type)
        .filter('data->>name', 'eq', name);
    } else {
      await supabase.from('team_shared_items').delete().eq('id', item.id);
    }
    setBusy(null);
    router.refresh();
  }

  async function addNote(itemId: string) {
    const content = (noteDrafts[itemId] ?? '').trim();
    if (!content || !activeTeam) return;
    setBusy(`note-${itemId}`);
    await supabase.from('team_notes').insert({
      team_id: activeTeam.id,
      user_id: userId,
      author_name: myName,
      item_id: itemId,
      content,
    });
    setNoteDrafts((p) => ({ ...p, [itemId]: '' }));
    setBusy(null);
    router.refresh();
  }

  async function deleteNote(id: string) {
    setBusy(`dn-${id}`);
    await supabase.from('team_notes').delete().eq('id', id);
    setBusy(null);
    router.refresh();
  }

  function copyCode() {
    if (!activeTeam) return;
    navigator.clipboard?.writeText(activeTeam.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function copyLink() {
    if (!joinUrl) return;
    navigator.clipboard?.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  }

  function toggleNotes(id: string) {
    setOpenNotes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ---------------------------------------------------------------- render
  const visiblePending = pendingInvites.filter((i) => !dismissedInvites.has(i.id));

  return (
    <div className="space-y-5">
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Pending invitations addressed to me */}
      {visiblePending.length > 0 && (
        <div className="space-y-2">
          {visiblePending.map((inv) => (
            <div key={inv.id} className="card border-[var(--gold)]/30 flex items-center gap-3">
              <Mail size={18} className="text-[var(--gold)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text)]">
                  Invitation à rejoindre <strong>{inv.team_name}</strong>
                </p>
                <p className="text-xs text-[var(--text-dim)]">
                  En tant que {ROLE_LABELS[(inv.role as TeamRole) ?? 'user'] ?? 'Barman'}
                </p>
              </div>
              <button
                onClick={() => acceptInvite(inv)}
                disabled={busy === `inv-${inv.id}`}
                className="btn-primary px-3 py-1.5 text-xs"
              >
                {busy === `inv-${inv.id}` ? <Loader2 size={13} className="animate-spin" /> : 'Rejoindre'}
              </button>
              <button
                onClick={() => setDismissedInvites((p) => new Set(p).add(inv.id))}
                className="p-1 text-[var(--text-dim)] hover:text-[var(--text)]"
                aria-label="Ignorer"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No team → onboarding */}
      {teams.length === 0 ? (
        <>
          {/* Join — available to everyone, including free accounts */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
              <LogIn size={15} className="text-[var(--gold)]" /> Rejoindre une équipe
            </h2>
            <p className="text-xs text-[var(--text-dim)]">
              Entrez le code fourni par votre établissement, ou scannez son QR code.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Code à 6 caractères"
                maxLength={6}
                className="field-input flex-1 font-mono tracking-widest uppercase"
              />
              <button
                onClick={joinByCode}
                disabled={busy === 'join' || !joinCode.trim()}
                className="btn-primary px-4 text-sm"
              >
                {busy === 'join' ? <Loader2 size={15} className="animate-spin" /> : 'Rejoindre'}
              </button>
            </div>
          </div>

          {/* Create — gated behind the Team plan */}
          {canCreateTeam ? (
            <div className="card space-y-3">
              <h2 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
                <Plus size={15} className="text-[var(--gold)]" /> Créer une équipe
              </h2>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Nom de l'établissement"
                className="field-input"
              />
              <button
                onClick={createTeam}
                disabled={busy === 'create' || !newTeamName.trim()}
                className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
              >
                {busy === 'create' ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
                Créer l&apos;équipe
              </button>
            </div>
          ) : (
            <div className="card space-y-3">
              <h2 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
                <Lock size={15} className="text-[var(--text-dim)]" /> Créer une équipe
              </h2>
              <p className="text-sm text-[var(--text-dim)]">
                Créer et gérer votre propre équipe nécessite le plan{' '}
                <span className="text-[var(--gold)] font-medium">{teamPlanName}</span>. Vos
                barmans, eux, peuvent rejoindre gratuitement avec un code.
              </p>
              <Link href="/settings" className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-2">
                <Crown size={14} className="text-[var(--gold)]" />
                Passer au plan {teamPlanName}
              </Link>
            </div>
          )}
        </>
      ) : (
        activeTeam && (
          <>
            {/* Team switcher */}
            {teams.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeamId(t.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      t.id === activeTeam.id
                        ? 'bg-[var(--gold)] text-[#0A0E1A]'
                        : 'bg-[var(--surface2)] text-[var(--text-dim)] border border-[var(--border)]'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            {/* Header card: name, code, QR */}
            <div className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-bold text-[var(--text)] text-lg truncate">{activeTeam.name}</h2>
                  <p className="text-xs text-[var(--text-dim)]">
                    {teamMembers.length} membre{teamMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${ROLE_COLORS[myRole]}`}>
                  {myRole === 'owner' ? <Crown size={11} /> : myRole === 'admin' ? <Shield size={11} /> : <UserIcon size={11} />}
                  {ROLE_LABELS[myRole]}
                </span>
              </div>

              {/* Code + actions */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-[var(--surface2)] rounded-lg px-3 py-2">
                  <span className="text-xs text-[var(--text-dim)]">Code</span>
                  <span className="font-mono font-bold tracking-widest text-[var(--text)]">{activeTeam.code}</span>
                </div>
                <button
                  onClick={copyCode}
                  className="p-2.5 rounded-lg bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
                  aria-label="Copier le code"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
                <button
                  onClick={() => setShowQR((v) => !v)}
                  className={`p-2.5 rounded-lg transition-colors ${showQR ? 'bg-[var(--gold)] text-[#0A0E1A]' : 'bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)]'}`}
                  aria-label="QR code"
                >
                  <QrCode size={16} />
                </button>
                <button
                  onClick={copyLink}
                  className="p-2.5 rounded-lg bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
                  aria-label="Copier le lien d'invitation"
                  title="Copier le lien d'invitation"
                >
                  {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Link2 size={16} />}
                </button>
              </div>

              {showQR && (
                <div className="flex flex-col items-center gap-2 py-3">
                  <div className="bg-white p-3 rounded-lg">
                    <QRCode value={joinUrl} size={160} />
                  </div>
                  <p className="text-xs text-[var(--text-dim)] text-center">
                    Scannez pour rejoindre l&apos;équipe
                  </p>
                </div>
              )}
            </div>

            {/* Members */}
            <div className="card space-y-3">
              <h3 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
                <Users size={15} className="text-[var(--gold)]" /> Membres
              </h3>
              <ul className="space-y-2">
                {teamMembers.map((m) => {
                  const role = memberRole(m, activeTeam.owner_id);
                  const isMe = m.user_id === userId;
                  const canEditThis = canManage && role !== 'owner' && !isMe;
                  return (
                    <li key={m.id} className="flex items-center gap-3 py-1.5 border-b border-[var(--border)] last:border-0">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ROLE_COLORS[role]}`}>
                        {role === 'owner' ? <Crown size={14} /> : role === 'admin' ? <Shield size={14} /> : <UserIcon size={14} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text)] truncate">
                          {m.display_name ?? m.email ?? 'Membre'} {isMe && <span className="text-[var(--text-dim)]">(vous)</span>}
                        </p>
                        <p className="text-xs text-[var(--text-dim)]">{ROLE_LABELS[role]}</p>
                      </div>
                      {canEditThis && (
                        <div className="flex items-center gap-1">
                          {role === 'user' ? (
                            <button
                              onClick={() => changeRole(m, 'admin')}
                              disabled={busy === `role-${m.id}`}
                              className="p-1.5 text-[var(--text-dim)] hover:text-blue-400 transition-colors"
                              aria-label="Promouvoir manager"
                              title="Promouvoir manager"
                            >
                              <ShieldCheck size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => changeRole(m, 'user')}
                              disabled={busy === `role-${m.id}`}
                              className="p-1.5 text-blue-400 hover:text-[var(--text-dim)] transition-colors"
                              aria-label="Rétrograder barman"
                              title="Rétrograder barman"
                            >
                              <Shield size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => removeMember(m)}
                            disabled={busy === `rm-${m.id}`}
                            className="p-1.5 text-[var(--text-dim)] hover:text-red-400 transition-colors"
                            aria-label="Retirer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Invitations (managers/owner) */}
            {canManage && (
              <div className="card space-y-3">
                <h3 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
                  <UserPlus size={15} className="text-[var(--gold)]" /> Inviter
                </h3>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="field-input w-full"
                />
                <div className="flex gap-2">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'user' | 'admin')}
                    className="field-input w-32 shrink-0"
                  >
                    <option value="user">Barman</option>
                    <option value="admin">Manager</option>
                  </select>
                  <button
                    onClick={invite}
                    disabled={busy === 'invite' || !inviteEmail.trim()}
                    className="btn-ghost flex-1 py-2 text-sm flex items-center justify-center gap-2"
                  >
                    {busy === 'invite' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Créer l&apos;invitation
                  </button>
                </div>
                {/* Shareable join link */}
                <div className="space-y-1.5">
                  <p className="text-xs text-[var(--text-dim)]">Ou partagez ce lien directement :</p>
                  <div className="flex items-center gap-2 bg-[var(--surface2)] rounded-lg px-3 py-2">
                    <Link2 size={13} className="text-[var(--text-dim)] shrink-0" />
                    <span className="flex-1 text-xs text-[var(--text-dim)] truncate font-mono">
                      {joinUrl || `…/settings/team?join=${activeTeam.code}`}
                    </span>
                    <button
                      onClick={copyLink}
                      className="shrink-0 p-1 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
                      aria-label="Copier le lien"
                    >
                      {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {teamInvites.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {teamInvites.map((inv) => (
                      <li key={inv.id} className="flex items-center gap-2 text-sm">
                        <Mail size={13} className="text-[var(--text-dim)] shrink-0" />
                        <span className="flex-1 truncate text-[var(--text-dim)]">{inv.email}</span>
                        <span className="text-xs text-[var(--text-dim)]">{ROLE_LABELS[(inv.role as TeamRole) ?? 'user']}</span>
                        <button
                          onClick={copyLink}
                          className="p-1 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
                          aria-label="Copier le lien"
                          title="Copier le lien d'invitation"
                        >
                          {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Link2 size={13} />}
                        </button>
                        <button
                          onClick={() => revokeInvite(inv.id)}
                          disabled={busy === `rev-${inv.id}`}
                          className="p-1 text-[var(--text-dim)] hover:text-red-400"
                          aria-label="Annuler"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Shared items */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text)] text-sm">Partagé avec l&apos;équipe</h3>
                <div className="flex items-center gap-1 bg-[var(--surface2)] rounded-lg p-0.5">
                  <button
                    onClick={() => setShowSharedTab('recipe')}
                    className={`text-xs px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${showSharedTab === 'recipe' ? 'bg-[var(--surface)] text-[var(--text)]' : 'text-[var(--text-dim)]'}`}
                  >
                    <BookOpen size={12} /> Recettes
                  </button>
                  <button
                    onClick={() => setShowSharedTab('ingredient')}
                    className={`text-xs px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${showSharedTab === 'ingredient' ? 'bg-[var(--surface)] text-[var(--text)]' : 'text-[var(--text-dim)]'}`}
                  >
                    <FlaskConical size={12} /> Ingrédients
                  </button>
                </div>
              </div>

              {(() => {
                const seen = new Set<string>();
                const items = teamShared.filter((s) => {
                  if (s.item_type !== showSharedTab) return false;
                  const name = ((s.data as { name?: string }).name ?? s.id).toLowerCase();
                  if (seen.has(name)) return false;
                  seen.add(name);
                  return true;
                });
                if (items.length === 0) {
                  return (
                    <p className="text-sm text-[var(--text-dim)] py-2">
                      Rien de partagé. Utilisez le bouton « Partager » sur une {showSharedTab === 'recipe' ? 'recette' : 'fiche ingrédient'}.
                    </p>
                  );
                }
                return (
                  <ul className="space-y-2">
                    {items.map((item) => {
                      const itemNotes = notes.filter((n) => n.item_id === item.id);
                      const name = (item.data as { name?: string }).name ?? 'Sans nom';
                      const canDelete = item.shared_by === userId || canManage;
                      const notesOpen = openNotes.has(item.id);
                      return (
                        <li key={item.id} className="border border-[var(--border)] rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--text)] truncate">{name}</p>
                              <p className="text-xs text-[var(--text-dim)]">
                                Partagé par {item.sharer_name ?? 'un membre'}
                              </p>
                            </div>
                            <button
                              onClick={() => importSharedItem(item)}
                              disabled={busy === `imp-${item.id}`}
                              className="btn-ghost px-2.5 py-1 text-xs flex items-center gap-1"
                            >
                              {busy === `imp-${item.id}` ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                              Importer
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => deleteSharedItem(item)}
                                disabled={busy === `dsi-${item.id}`}
                                className="p-1.5 text-[var(--text-dim)] hover:text-red-400"
                                aria-label="Retirer"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => toggleNotes(item.id)}
                            className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] flex items-center gap-1"
                          >
                            <MessageSquare size={12} />
                            {itemNotes.length > 0 ? `${itemNotes.length} note${itemNotes.length !== 1 ? 's' : ''}` : 'Ajouter une note'}
                          </button>

                          {notesOpen && (
                            <div className="space-y-2 pt-1">
                              {itemNotes.map((n) => (
                                <div key={n.id} className="flex items-start gap-2 text-sm bg-[var(--surface2)] rounded-md px-2.5 py-1.5">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[var(--text)]">{n.content}</p>
                                    <p className="text-xs text-[var(--text-dim)]">{n.author_name ?? 'Membre'}</p>
                                  </div>
                                  {n.user_id === userId && (
                                    <button
                                      onClick={() => deleteNote(n.id)}
                                      className="p-0.5 text-[var(--text-dim)] hover:text-red-400 shrink-0"
                                      aria-label="Supprimer la note"
                                    >
                                      <X size={13} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={noteDrafts[item.id] ?? ''}
                                  onChange={(e) => setNoteDrafts((p) => ({ ...p, [item.id]: e.target.value }))}
                                  onKeyDown={(e) => e.key === 'Enter' && addNote(item.id)}
                                  placeholder="Écrire une note…"
                                  className="field-input flex-1 text-sm py-1.5"
                                />
                                <button
                                  onClick={() => addNote(item.id)}
                                  disabled={busy === `note-${item.id}` || !(noteDrafts[item.id] ?? '').trim()}
                                  className="btn-primary px-3 text-xs"
                                >
                                  {busy === `note-${item.id}` ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>

            {/* Batch settings (managers only) */}
            {canManage && (
              <div className="card space-y-3">
                <h3 className="font-semibold text-[var(--text)] text-sm">Réglages Batch</h3>
                <p className="text-xs text-[var(--text-dim)]">Mode d'interaction des membres sur les batches partagés</p>
                <div className="space-y-2">
                  {([
                    { value: 'readonly',     label: 'Lecture seule',  desc: 'Les membres voient le batch et les timers' },
                    { value: 'collaborative', label: 'Collaboratif',   desc: 'Tout le monde peut cocher et démarrer les timers' },
                    { value: 'assigned',     label: 'Avec assignation', desc: 'Le manager assigne les étapes à des membres' },
                  ] as const).map((opt) => {
                    const current = (activeTeam?.settings?.batch_mode ?? 'readonly');
                    const isSelected = current === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={async () => {
                          if (!activeTeam) return;
                          const supabase = createClient();
                          await supabase.from('teams').update({
                            settings: { ...(activeTeam.settings ?? {}), batch_mode: opt.value },
                          }).eq('id', activeTeam.id);
                          router.refresh();
                        }}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${isSelected ? 'border-[var(--gold)] bg-[var(--gold)]/5' : 'border-[var(--border)] hover:border-[var(--gold-dim)]'}`}
                      >
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-[var(--gold)] bg-[var(--gold)]' : 'border-[var(--border)]'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#0A0E1A]" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text)]">{opt.label}</p>
                          <p className="text-xs text-[var(--text-dim)]">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Join another / Danger zone */}
            <div className="card space-y-3">
              <h3 className="font-semibold text-[var(--text)] text-sm">Autres actions</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Rejoindre une autre équipe (code)"
                  maxLength={6}
                  className="field-input flex-1 font-mono tracking-widest uppercase text-sm"
                />
                <button
                  onClick={joinByCode}
                  disabled={busy === 'join' || !joinCode.trim()}
                  className="btn-ghost px-3 text-sm"
                >
                  {busy === 'join' ? <Loader2 size={14} className="animate-spin" /> : 'Rejoindre'}
                </button>
              </div>

              {myRole === 'owner' ? (
                <button
                  onClick={deleteTeam}
                  disabled={busy === 'delete'}
                  className="w-full py-2.5 text-sm flex items-center justify-center gap-2 text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition-colors"
                >
                  {busy === 'delete' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Supprimer l&apos;équipe
                </button>
              ) : (
                <button
                  onClick={leaveTeam}
                  disabled={busy === 'leave'}
                  className="w-full py-2.5 text-sm flex items-center justify-center gap-2 text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition-colors"
                >
                  {busy === 'leave' ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                  Quitter l&apos;équipe
                </button>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
