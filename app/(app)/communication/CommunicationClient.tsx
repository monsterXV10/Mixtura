'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Users, BookOpen, FlaskConical, ClipboardList, Download, MessageSquare,
  Send, Trash2, Loader2, X, Plus, Check, Search, ChevronDown, Eye,
  UserPlus, Copy, Mail, LogIn, Lock, Crown, Shield,
  User as UserIcon, ShieldCheck, LogOut, Link2, Timer, Play, Square, RotateCcw,
  Package, ChevronRight,
} from 'lucide-react';
import {
  ROLE_LABELS, ROLE_COLORS, memberRole, generateTeamCode, randomToken,
} from '@/lib/team';
import { ensureIngredients, type IngredientRef } from '@/lib/utils/ingredients';
import type { Team, TeamMember, TeamInvitation, TeamSharedItem, TeamNote, TeamRole } from '@/lib/team';
import Link from 'next/link';

interface MyRecipe {
  id: string; type: string; name: string;
  data: Record<string, unknown>; metadata: Record<string, unknown>;
}

interface BatchRow {
  id: string; user_id: string; team_id: string | null; name: string;
  items: Array<{ key: string; recipeName: string; qty: number; qtyUnit: string; ingredients?: Array<{ ingredientId?: string; qty: number; name: string; unit: string; type?: string; homemade?: boolean }>; steps?: string | null }>;
  timers: Record<string, { durationSec: number; startedAt: string | null; label: string }>;
  checked: string[];
  checked_by?: Record<string, { name: string; userId: string }>;
  status: string; created_at: string; updated_at: string;
}

interface Props {
  userId: string;
  userEmail: string;
  myName: string;
  canCreateTeam: boolean;
  teamPlanName: string;
  teams: Team[];
  members: TeamMember[];
  invitations: TeamInvitation[];
  sharedItems: TeamSharedItem[];
  notes: TeamNote[];
  myRecipes: MyRecipe[];
  pendingInvites: Array<TeamInvitation & { team_name: string }>;
  teamBatches?: BatchRow[];
}

type MainTab = 'shares' | 'members' | 'batches';
type ShareTab = 'recipe' | 'ingredient' | 'menu';

function fmtTime(totalSec: number): string {
  const sec = Math.max(0, totalSec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getRemaining(entry: { durationSec: number; startedAt: string | null }): number {
  if (!entry.startedAt) return entry.durationSec;
  const elapsed = Math.floor((Date.now() - new Date(entry.startedAt).getTime()) / 1000);
  return Math.max(0, entry.durationSec - elapsed);
}

export default function CommunicationClient({
  userId, userEmail, myName, canCreateTeam, teamPlanName,
  teams, members, invitations, sharedItems, notes, myRecipes, pendingInvites,
  teamBatches = [],
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teams[0]?.id ?? null);
  const activeTeam = teams.find((t) => t.id === selectedTeamId) ?? teams[0] ?? null;

  const [mainTab, setMainTab] = useState<MainTab>('shares');
  const [shareTab, setShareTab] = useState<ShareTab>('recipe');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Join / create
  const [joinCode, setJoinCode] = useState('');
  const [newTeamName, setNewTeamName] = useState('');

  // Invite members
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'admin'>('user');

  // Link copy
  const [copiedLink, setCopiedLink] = useState(false);

  // Notes & preview
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [openPreview, setOpenPreview] = useState<Set<string>>(new Set());
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  // Menu composer
  const [composing, setComposing] = useState(false);
  const [menuName, setMenuName] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [recipeSearch, setRecipeSearch] = useState('');

  // Dismissed pending invites
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Live batches state (for real-time timer updates)
  const [liveBatches, setLiveBatches] = useState<BatchRow[]>(teamBatches);
  const [tick, setTick] = useState(0);
  const [collapsedBatches, setCollapsedBatches] = useState<Set<string>>(new Set());
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLiveBatches(teamBatches);
  }, [teamBatches]);

  const hasActiveTimers = liveBatches.some((b) =>
    Object.values(b.timers ?? {}).some((t) => t.startedAt && getRemaining(t) > 0)
  );
  useEffect(() => {
    if (!hasActiveTimers) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [hasActiveTimers]);

  // Subscribe to batch updates for shared batches
  useEffect(() => {
    if (liveBatches.length === 0) return;
    const supabase = createClient();
    const batchIds = liveBatches.map((b) => b.id);
    const ch = supabase.channel('team-batches')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'batches' }, (payload) => {
        if (!batchIds.includes((payload.new as BatchRow).id)) return;
        setLiveBatches((prev) => prev.map((b) => b.id === (payload.new as BatchRow).id ? payload.new as BatchRow : b));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [liveBatches.length]);

  async function toggleBatchChecked(batchId: string, itemKey: string) {
    const batch = liveBatches.find((b) => b.id === batchId);
    if (!batch) return;
    const current = batch.checked ?? [];
    const isChecked = current.includes(itemKey);
    const updated = isChecked ? current.filter((k) => k !== itemKey) : [...current, itemKey];
    const currentBy = batch.checked_by ?? {};
    const updatedBy: Record<string, { name: string; userId: string }> = isChecked
      ? Object.fromEntries(Object.entries(currentBy).filter(([k]) => k !== itemKey))
      : { ...currentBy, [itemKey]: { name: myName, userId } };
    setLiveBatches((prev) => prev.map((b) => b.id === batchId ? { ...b, checked: updated, checked_by: updatedBy } : b));
    const supabase = createClient();
    await supabase.from('batches').update({ checked: updated, checked_by: updatedBy, updated_at: new Date().toISOString() }).eq('id', batchId);
  }

  async function toggleBatchTimer(batchId: string, timerKey: string) {
    const batch = liveBatches.find((b) => b.id === batchId);
    if (!batch) return;
    const entry = batch.timers[timerKey];
    if (!entry) return;
    const remaining = getRemaining(entry);
    let newEntry: typeof entry;
    if (remaining <= 0) {
      newEntry = { ...entry, startedAt: null };
    } else if (entry.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(entry.startedAt).getTime()) / 1000);
      newEntry = { ...entry, durationSec: Math.max(0, entry.durationSec - elapsed), startedAt: null };
    } else {
      newEntry = { ...entry, startedAt: new Date().toISOString() };
    }
    const supabase = createClient();
    await supabase.from('batches').update({ timers: { ...batch.timers, [timerKey]: newEntry }, updated_at: new Date().toISOString() }).eq('id', batchId);
  }

  const myRole: TeamRole = useMemo(() => {
    if (!activeTeam) return 'user';
    const me = members.find((m) => m.team_id === activeTeam.id && m.user_id === userId);
    if (activeTeam.owner_id === userId) return 'owner';
    return me ? memberRole(me, activeTeam.owner_id) : 'user';
  }, [activeTeam, members, userId]);

  const canManage = myRole === 'owner' || myRole === 'admin';

  const joinUrl = typeof window !== 'undefined' && activeTeam
    ? `${window.location.origin}/settings/team?join=${activeTeam.code}`
    : activeTeam ? `/settings/team?join=${activeTeam.code}` : '';

  const teamMembers = activeTeam ? members.filter((m) => m.team_id === activeTeam.id) : [];
  const teamInvites = activeTeam ? invitations.filter((i) => i.team_id === activeTeam.id) : [];
  const teamShared = activeTeam ? sharedItems.filter((s) => s.team_id === activeTeam.id) : [];
  const teamBatchesForActiveTeam = activeTeam ? liveBatches.filter((b) => b.team_id === activeTeam.id) : [];

  const { counts, items } = useMemo(() => {
    const seenByType: Record<string, Set<string>> = { recipe: new Set(), ingredient: new Set(), menu: new Set() };
    const deduped: typeof teamShared = [];
    for (const s of teamShared) {
      const name = ((s.data as { name?: string }).name ?? s.id).toLowerCase();
      const bucket = seenByType[s.item_type];
      if (!bucket || bucket.has(name)) continue;
      bucket.add(name);
      deduped.push(s);
    }
    return {
      counts: {
        recipe: seenByType.recipe.size,
        ingredient: seenByType.ingredient.size,
        menu: seenByType.menu.size,
      },
      items: deduped.filter((s) => s.item_type === shareTab),
    };
  }, [teamShared, shareTab]);

  const filteredRecipes = useMemo(() => {
    if (!recipeSearch.trim()) return myRecipes;
    const q = recipeSearch.toLowerCase();
    return myRecipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [myRecipes, recipeSearch]);

  // ── actions ──────────────────────────────────────────────────────────────
  async function joinByCode() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setBusy('join'); setError('');
    const { data: team } = await supabase.from('teams').select('*').eq('code', code).maybeSingle();
    if (!team) { setError('Aucune équipe avec ce code.'); setBusy(null); return; }
    const already = members.some((m) => m.team_id === team.id && m.user_id === userId);
    if (already) { setError('Vous êtes déjà dans cette équipe.'); setBusy(null); return; }
    const { error: e } = await supabase.from('team_members').insert({
      team_id: team.id, user_id: userId, email: userEmail, display_name: myName, role: 'user',
    });
    if (e) { setError('Impossible de rejoindre cette équipe.'); setBusy(null); return; }
    await supabase.from('team_invitations').update({ accepted: true }).eq('team_id', team.id).eq('email', userEmail);
    setJoinCode(''); setSelectedTeamId(team.id as string); setBusy(null); router.refresh();
  }

  async function createTeam() {
    const name = newTeamName.trim();
    if (!name) return;
    setBusy('create'); setError('');
    const code = generateTeamCode();
    const { data: team, error: e1 } = await supabase.from('teams').insert({ name, code, owner_id: userId }).select().single();
    if (e1 || !team) { setError("Impossible de créer l'équipe."); setBusy(null); return; }
    await supabase.from('team_members').insert({ team_id: team.id, user_id: userId, email: userEmail, display_name: myName, role: 'admin' });
    setNewTeamName(''); setSelectedTeamId(team.id as string); setBusy(null); router.refresh();
  }

  async function acceptInvite(inv: TeamInvitation) {
    setBusy(`inv-${inv.id}`);
    const { error: e } = await supabase.from('team_members').insert({
      team_id: inv.team_id, user_id: userId, email: userEmail, display_name: myName, role: inv.role ?? 'user',
    });
    if (!e) {
      await supabase.from('team_invitations').update({ accepted: true }).eq('id', inv.id);
      setSelectedTeamId(inv.team_id);
    }
    setBusy(null); router.refresh();
  }

  async function invite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !activeTeam) return;
    setBusy('invite'); setError('');
    const { error: e } = await supabase.from('team_invitations').insert({
      team_id: activeTeam.id, email, role: inviteRole, token: randomToken(), invited_by: userId,
    });
    if (e) { setError("Impossible d'enregistrer l'invitation."); setBusy(null); return; }
    try {
      const url = `${window.location.origin}/settings/team?join=${activeTeam.code}`;
      await supabase.functions.invoke('invite-email', { body: { teamId: activeTeam.id, inviteeEmail: email, joinUrl: url } });
    } catch { /* email optional */ }
    setInviteEmail(''); setBusy(null); router.refresh();
  }

  async function revokeInvite(id: string) {
    setBusy(`rev-${id}`);
    await supabase.from('team_invitations').delete().eq('id', id);
    setBusy(null); router.refresh();
  }

  async function changeRole(m: TeamMember, role: 'user' | 'admin') {
    setBusy(`role-${m.id}`);
    await supabase.from('team_members').update({ role }).eq('id', m.id);
    setBusy(null); router.refresh();
  }

  async function removeMember(m: TeamMember) {
    if (!confirm(`Retirer ${m.display_name ?? m.email} de l'équipe ?`)) return;
    setBusy(`rm-${m.id}`);
    await supabase.from('team_members').delete().eq('id', m.id);
    setBusy(null); router.refresh();
  }

  async function leaveTeam() {
    if (!activeTeam || !confirm('Quitter cette équipe ?')) return;
    setBusy('leave');
    await supabase.from('team_members').delete().eq('team_id', activeTeam.id).eq('user_id', userId);
    setSelectedTeamId(null); setBusy(null); router.refresh();
  }

  async function importItem(item: TeamSharedItem) {
    setBusy(`imp-${item.id}`);
    try {
      if (item.item_type === 'recipe') {
        const d = item.data as { type?: string; recipeData?: Record<string, unknown>; metadata?: Record<string, unknown> };
        const recipeData = { ...(d.recipeData ?? {}) } as Record<string, unknown> & { ingredients?: IngredientRef[] };
        if (Array.isArray(recipeData.ingredients) && recipeData.ingredients.length) {
          recipeData.ingredients = await ensureIngredients(supabase, userId, recipeData.ingredients);
        }
        await supabase.from('recipes').insert({ user_id: userId, type: d.type ?? 'cocktail', data: recipeData, metadata: d.metadata ?? {} });
        alert('Recette importée — ingrédients ajoutés à vos stocks.');
      } else if (item.item_type === 'ingredient') {
        const d = item.data as { ingredientData?: Record<string, unknown> };
        await supabase.from('ingredients').insert({ user_id: userId, data: d.ingredientData ?? {} });
        alert('Ingrédient importé dans vos stocks.');
      } else if (item.item_type === 'menu') {
        const d = item.data as { recipes?: Array<{ name?: string; type?: string; recipeData?: Record<string, unknown>; metadata?: Record<string, unknown> }> };
        const seen = new Set(myRecipes.map((r) => r.name.toLowerCase()));
        const rows: Array<Record<string, unknown>> = [];
        let skipped = 0;
        for (const r of d.recipes ?? []) {
          const nm = (r.name ?? (r.recipeData as { name?: string })?.name ?? '').toLowerCase();
          if (nm && seen.has(nm)) { skipped++; continue; }
          if (nm) seen.add(nm);
          const rd = { ...(r.recipeData ?? {}) } as Record<string, unknown> & { ingredients?: IngredientRef[] };
          if (Array.isArray(rd.ingredients) && rd.ingredients.length) rd.ingredients = await ensureIngredients(supabase, userId, rd.ingredients);
          rows.push({ user_id: userId, type: r.type ?? 'cocktail', data: rd, metadata: r.metadata ?? {} });
        }
        if (rows.length) await supabase.from('recipes').insert(rows);
        alert(`${rows.length} recette(s) importée(s)${skipped ? ` · ${skipped} déjà présente(s) ignorée(s)` : ''}.`);
      }
      router.refresh();
    } finally { setBusy(null); }
  }

  async function deleteItem(item: TeamSharedItem) {
    if (!confirm('Retirer cet élément du partage équipe ?')) return;
    setBusy(`del-${item.id}`);
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
    setBusy(null); router.refresh();
  }

  async function addNote(itemId: string) {
    const content = (noteDrafts[itemId] ?? '').trim();
    if (!content || !activeTeam) return;
    setBusy(`note-${itemId}`);
    await supabase.from('team_notes').insert({ team_id: activeTeam.id, user_id: userId, author_name: myName, item_id: itemId, content });
    setNoteDrafts((p) => ({ ...p, [itemId]: '' }));
    setBusy(null); router.refresh();
  }

  async function deleteNote(id: string) {
    setBusy(`dn-${id}`);
    await supabase.from('team_notes').delete().eq('id', id);
    setBusy(null); router.refresh();
  }

  async function shareMenu() {
    const name = menuName.trim();
    if (!name || !activeTeam || picked.size === 0) return;
    setBusy('menu');
    const recipes = myRecipes.filter((r) => picked.has(r.id)).map((r) => ({ name: r.name, type: r.type, recipeData: r.data, metadata: r.metadata }));
    await supabase.from('team_shared_items').insert({ team_id: activeTeam.id, shared_by: userId, sharer_name: myName, item_type: 'menu', share_mode: 'copy', data: { name, recipes } });
    setMenuName(''); setPicked(new Set()); setComposing(false); setBusy(null); setShareTab('menu'); router.refresh();
  }

  function toggle(set: Set<string>, setFn: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setFn(next);
  }

  function copyLink() {
    if (!joinUrl) return;
    navigator.clipboard?.writeText(joinUrl);
    setCopiedLink(true); setTimeout(() => setCopiedLink(false), 1500);
  }

  // ── PDF helpers ───────────────────────────────────────────────────────────
  function calcPortions(item: { qty: number; qtyUnit: string; ingredients?: Array<{ qty: number; unit: string }> }): number {
    if (item.qtyUnit === 'portions') return item.qty;
    if (!item.ingredients?.length) return item.qty;
    const vol = item.ingredients.reduce((s, i) => {
      const u = i.unit.toLowerCase();
      return s + (u === 'cl' ? i.qty : u === 'ml' ? i.qty / 10 : u === 'l' ? i.qty * 100 : i.qty);
    }, 0);
    if (vol <= 0) return item.qty;
    const target = item.qtyUnit === 'cl' ? item.qty : item.qtyUnit === 'L' ? item.qty * 100 : item.qtyUnit === 'btl70' ? item.qty * 70 : item.qty * 100;
    return target / vol;
  }

  function downloadBatchPdf(batch: BatchRow) {
    const ingMap = new Map<string, { name: string; qty: number; unit: string }>();
    for (const item of batch.items ?? []) {
      const p = calcPortions(item);
      for (const ing of item.ingredients ?? []) {
        const k = ing.name.toLowerCase();
        const qty = Math.round(ing.qty * p * 100) / 100;
        if (ingMap.has(k)) { ingMap.get(k)!.qty += qty; }
        else { ingMap.set(k, { name: ing.name, qty, unit: ing.unit }); }
      }
    }
    const allIngredients = [...ingMap.values()].sort((a, b) => a.name.localeCompare(b.name));
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const css = 'body{font-family:-apple-system,Arial,sans-serif;max-width:800px;margin:0 auto;padding:2rem;color:#1a1a2e}h1{font-size:1.5rem;margin-bottom:.25rem}.date{color:#888;font-size:.85rem;margin-bottom:2rem}h2{font-size:1rem;text-transform:uppercase;letter-spacing:.1em;color:#888;margin:2rem 0 .75rem;border-top:1px solid #eee;padding-top:1rem}table{width:100%;border-collapse:collapse;margin-bottom:1rem}td{padding:.4rem .5rem;border-bottom:1px solid #f0f0f0;font-size:.9rem}td:last-child{text-align:right;font-weight:500}.recipe-title{font-weight:700;font-size:1rem;margin:1.5rem 0 .5rem}.recipe-qty{color:#888;font-size:.85rem;margin-left:.5rem;font-weight:normal}.steps{font-style:italic;color:#555;margin-top:.5rem;font-size:.85rem;white-space:pre-wrap}@media print{body{padding:0}}';
    const ingRows = allIngredients.map((ing) => `<tr><td>${ing.name}</td><td>${ing.qty} ${ing.unit}</td></tr>`).join('');
    const recipeBlocks = (batch.items ?? []).map((item) => {
      const p = calcPortions(item);
      const rows = (item.ingredients ?? []).map((ing) => `<tr><td>${ing.name}</td><td>${Math.round(ing.qty * p * 100) / 100} ${ing.unit}</td></tr>`).join('');
      const stepsHtml = item.steps ? `<p class="steps">${item.steps}</p>` : '';
      return `<div class="recipe-title">${item.recipeName}<span class="recipe-qty">${item.qty} ${item.qtyUnit}</span></div><table>${rows}</table>${stepsHtml}`;
    }).join('');
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${batch.name || 'Batch'}</title><style>${css}</style></head><body><h1>${batch.name || 'Batch sans titre'}</h1><p class="date">Généré le ${dateStr}</p><h2>Liste consolidée des produits</h2><table>${ingRows}</table><h2>Recettes</h2>${recipeBlocks}</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { alert('Autorisez les pop-ups pour télécharger le PDF.'); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  }

  // ── render: no team ──────────────────────────────────────────────────────
  const visiblePending = pendingInvites.filter((i) => !dismissed.has(i.id));

  if (!activeTeam) {
    return (
      <div className="space-y-4">
        {/* Pending invitations */}
        {visiblePending.length > 0 && (
          <div className="space-y-2">
            {visiblePending.map((inv) => (
              <div key={inv.id} className="card border-[var(--gold)]/30 flex items-center gap-3">
                <Mail size={18} className="text-[var(--gold)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text)]">Invitation à rejoindre <strong>{inv.team_name}</strong></p>
                  <p className="text-xs text-[var(--text-dim)]">En tant que {ROLE_LABELS[(inv.role as TeamRole) ?? 'user']}</p>
                </div>
                <button onClick={() => acceptInvite(inv)} disabled={busy === `inv-${inv.id}`} className="btn-primary px-3 py-1.5 text-xs">
                  {busy === `inv-${inv.id}` ? <Loader2 size={13} className="animate-spin" /> : 'Rejoindre'}
                </button>
                <button onClick={() => setDismissed((p) => new Set(p).add(inv.id))} className="p-1 text-[var(--text-dim)] hover:text-[var(--text)]">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Join by code */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
            <LogIn size={15} className="text-[var(--gold)]" /> Rejoindre une équipe
          </h2>
          <p className="text-xs text-[var(--text-dim)]">Entrez le code fourni par votre établissement.</p>
          <div className="flex gap-2">
            <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Code à 6 caractères" maxLength={6}
              className="field-input flex-1 font-mono tracking-widest uppercase" />
            <button onClick={joinByCode} disabled={busy === 'join' || !joinCode.trim()} className="btn-primary px-4 text-sm">
              {busy === 'join' ? <Loader2 size={15} className="animate-spin" /> : 'Rejoindre'}
            </button>
          </div>
        </div>

        {/* Create team */}
        {canCreateTeam ? (
          <div className="card space-y-3">
            <h2 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
              <Plus size={15} className="text-[var(--gold)]" /> Créer une équipe
            </h2>
            <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Nom de l'établissement" className="field-input" />
            <button onClick={createTeam} disabled={busy === 'create' || !newTeamName.trim()}
              className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
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
              Créer une équipe nécessite le plan <span className="text-[var(--gold)] font-medium">{teamPlanName}</span>.
              Vos barmans peuvent rejoindre gratuitement avec un code.
            </p>
            <Link href="/settings" className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-2">
              <Crown size={14} className="text-[var(--gold)]" /> Passer au plan {teamPlanName}
            </Link>
          </div>
        )}

        {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
      </div>
    );
  }

  // ── render: in team ──────────────────────────────────────────────────────
  const TAB_SHARE: Record<ShareTab, { label: string; icon: typeof BookOpen }> = {
    recipe: { label: 'Cocktails', icon: BookOpen },
    ingredient: { label: 'Ingrédients', icon: FlaskConical },
    menu: { label: 'Menus', icon: ClipboardList },
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

      {/* Pending invites for me */}
      {visiblePending.length > 0 && (
        <div className="space-y-2">
          {visiblePending.map((inv) => (
            <div key={inv.id} className="card border-[var(--gold)]/30 flex items-center gap-3">
              <Mail size={18} className="text-[var(--gold)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text)]">Invitation à rejoindre <strong>{inv.team_name}</strong></p>
              </div>
              <button onClick={() => acceptInvite(inv)} disabled={busy === `inv-${inv.id}`} className="btn-primary px-3 py-1.5 text-xs">
                {busy === `inv-${inv.id}` ? <Loader2 size={13} className="animate-spin" /> : 'Rejoindre'}
              </button>
              <button onClick={() => setDismissed((p) => new Set(p).add(inv.id))} className="p-1 text-[var(--text-dim)]"><X size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Team header */}
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {teams.length > 1 ? (
              <select value={activeTeam.id} onChange={(e) => setSelectedTeamId(e.target.value)}
                className="bg-transparent font-bold text-[var(--text)] text-lg focus:outline-none truncate max-w-[200px]">
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            ) : (
              <h2 className="font-bold text-[var(--text)] text-lg truncate">{activeTeam.name}</h2>
            )}
            <p className="text-xs text-[var(--text-dim)]">{teamMembers.length} membre{teamMembers.length !== 1 ? 's' : ''}</p>
          </div>
          <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${ROLE_COLORS[myRole]}`}>
            {myRole === 'owner' ? <Crown size={11} /> : myRole === 'admin' ? <Shield size={11} /> : <UserIcon size={11} />}
            {ROLE_LABELS[myRole]}
          </span>
        </div>
      </div>

      {/* Bar stock shortcut */}
      <Link
        href={`/communication/bar?team=${activeTeam.id}`}
        className="flex items-center gap-3 px-4 py-3 card hover:border-[var(--gold-dim)] transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center shrink-0">
          <Package size={18} className="text-[var(--gold)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text)]">Stock du bar</p>
          <p className="text-xs text-[var(--text-dim)]">Gérer les ingrédients de l&apos;équipe</p>
        </div>
        <ChevronRight size={16} className="text-[var(--text-dim)] shrink-0" />
      </Link>

      {/* Main tabs */}
      <div className="flex rounded-lg bg-[var(--surface2)] p-0.5 gap-0.5">
        <button type="button" onClick={() => setMainTab('shares')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${mainTab === 'shares' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-dim)]'}`}>
          <BookOpen size={14} /> Partages
        </button>
        <button type="button" onClick={() => setMainTab('batches')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${mainTab === 'batches' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-dim)]'}`}>
          <Timer size={14} /> Batch
          {teamBatchesForActiveTeam.length > 0 && (
            <span className={`text-[10px] rounded-full px-1.5 py-px leading-none ${mainTab === 'batches' ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'bg-[var(--surface)] text-[var(--text-dim)]'}`}>
              {teamBatchesForActiveTeam.length}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setMainTab('members')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${mainTab === 'members' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-dim)]'}`}>
          <Users size={14} /> Membres
          <span className="text-xs bg-[var(--surface2)] text-[var(--text-dim)] rounded-full px-1.5 py-px leading-none">{teamMembers.length}</span>
        </button>
      </div>

      {/* ── MEMBERS TAB ── */}
      {mainTab === 'members' && (
        <div className="space-y-4">
          {/* Member list */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
              <Users size={14} className="text-[var(--gold)]" /> Membres
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
                          <button onClick={() => changeRole(m, 'admin')} disabled={busy === `role-${m.id}`}
                            className="p-1.5 text-[var(--text-dim)] hover:text-blue-400 transition-colors" title="Promouvoir manager">
                            <ShieldCheck size={15} />
                          </button>
                        ) : (
                          <button onClick={() => changeRole(m, 'user')} disabled={busy === `role-${m.id}`}
                            className="p-1.5 text-blue-400 hover:text-[var(--text-dim)] transition-colors" title="Rétrograder barman">
                            <Shield size={15} />
                          </button>
                        )}
                        <button onClick={() => removeMember(m)} disabled={busy === `rm-${m.id}`}
                          className="p-1.5 text-[var(--text-dim)] hover:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Invite */}
          {canManage && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
                <UserPlus size={14} className="text-[var(--gold)]" /> Inviter
              </h3>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemple.com" className="field-input w-full" />
              <div className="flex gap-2">
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'user' | 'admin')} className="field-input w-32 shrink-0">
                  <option value="user">Barman</option>
                  <option value="admin">Manager</option>
                </select>
                <button onClick={invite} disabled={busy === 'invite' || !inviteEmail.trim()}
                  className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2">
                  {busy === 'invite' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Inviter
                </button>
              </div>

              {/* Share link */}
              <div className="flex items-center gap-2 bg-[var(--surface2)] rounded-lg px-3 py-2">
                <Link2 size={13} className="text-[var(--text-dim)] shrink-0" />
                <span className="flex-1 text-xs text-[var(--text-dim)] truncate font-mono">
                  {joinUrl || `…/settings/team?join=${activeTeam.code}`}
                </span>
                <button onClick={copyLink} className="shrink-0 p-1 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
                  {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>

              {/* Pending invites list */}
              {teamInvites.length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {teamInvites.map((inv) => (
                    <li key={inv.id} className="flex items-center gap-2 text-sm">
                      <Mail size={13} className="text-[var(--text-dim)] shrink-0" />
                      <span className="flex-1 truncate text-[var(--text-dim)]">{inv.email}</span>
                      <span className="text-xs text-[var(--text-dim)]">{ROLE_LABELS[(inv.role as TeamRole) ?? 'user']}</span>
                      <button onClick={() => revokeInvite(inv.id)} disabled={busy === `rev-${inv.id}`}
                        className="p-1 text-[var(--text-dim)] hover:text-red-400">
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Leave */}
          {myRole !== 'owner' && (
            <button onClick={leaveTeam} disabled={busy === 'leave'}
              className="w-full py-2.5 text-sm flex items-center justify-center gap-2 text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition-colors">
              {busy === 'leave' ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              Quitter l&apos;équipe
            </button>
          )}
        </div>
      )}

      {/* ── BATCHES TAB ── */}
      {mainTab === 'batches' && (
        <div className="space-y-3">
          {teamBatchesForActiveTeam.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Timer size={36} className="text-[var(--text-dim)] opacity-30" />
              <p className="text-sm text-[var(--text-dim)]">Aucun batch actif partagé</p>
              <p className="text-xs text-[var(--text-dim)] opacity-70">Partage un batch depuis l'outil Batch</p>
            </div>
          ) : teamBatchesForActiveTeam.map((batch) => {
            const totalItems = batch.items?.length ?? 0;
            const checkedCount = (batch.checked ?? []).filter((k) => batch.items?.some((i) => i.key === k)).length;
            const batchMode = activeTeam?.settings?.batch_mode ?? 'readonly';
            const canInteract = batch.user_id === userId || batchMode === 'collaborative' || batchMode === 'assigned';

            const isOpen = !collapsedBatches.has(batch.id);
            return (
              <div key={batch.id} className="card p-0 overflow-hidden">
                {/* Header */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <button type="button"
                      onClick={() => setCollapsedBatches((prev) => { const n = new Set(prev); n.has(batch.id) ? n.delete(batch.id) : n.add(batch.id); return n; })}
                      className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-[var(--text)]">{batch.name || 'Batch sans titre'}</p>
                      <p className="text-xs text-[var(--text-dim)] mt-0.5">
                        {checkedCount}/{totalItems} recette{totalItems !== 1 ? 's' : ''} préparée{checkedCount !== 1 ? 's' : ''}
                      </p>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => downloadBatchPdf(batch)}
                        className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-colors"
                        title="Télécharger en PDF">
                        <Download size={15} />
                      </button>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${canInteract ? 'bg-emerald-400/10 text-emerald-400' : 'bg-[var(--surface2)] text-[var(--text-dim)]'}`}>
                        {canInteract ? 'Actif' : 'Lecture'}
                      </span>
                      <button type="button"
                        onClick={() => setCollapsedBatches((prev) => { const n = new Set(prev); n.has(batch.id) ? n.delete(batch.id) : n.add(batch.id); return n; })}
                        className="p-1">
                        <ChevronDown size={15} className={`text-[var(--text-dim)] transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      </button>
                    </div>
                  </div>
                  {totalItems > 0 && (
                    <div className="mt-2 h-1 bg-[var(--surface2)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--gold)] rounded-full transition-all"
                        style={{ width: `${Math.min(100, (checkedCount / totalItems) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {isOpen && (
                  <>
                    {/* Recipes list */}
                    {batch.items && batch.items.length > 0 && (
                      <div className="border-b border-[var(--border)]">
                        {batch.items.map((item) => {
                          const isDone = batch.checked?.includes(item.key);
                          const hasIngredients = (item.ingredients?.length ?? 0) > 0;
                          const hasContent = hasIngredients || !!item.steps;
                          const recipeKey = `${batch.id}:${item.key}`;
                          const isExpanded = expandedRecipes.has(recipeKey);
                          const checkerName = isDone ? (batch.checked_by?.[item.key]?.name ?? null) : null;
                          const portions = calcPortions(item);
                          const maisonIngs = (item.ingredients ?? []).filter((i) => i.homemade);
                          const autreIngs = (item.ingredients ?? []).filter((i) => !i.homemade);
                          const hasGroups = maisonIngs.length > 0 && autreIngs.length > 0;
                          return (
                            <div key={item.key} className={`border-t border-[var(--border)] ${isDone ? 'opacity-60' : ''}`}>
                              <div className="flex items-center gap-3 px-4 py-2.5">
                                {canInteract ? (
                                  <button type="button" onClick={() => toggleBatchChecked(batch.id, item.key)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isDone ? 'bg-[var(--gold)] border-[var(--gold)]' : 'border-[var(--border)]'}`}>
                                    {isDone && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#0A0E1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                  </button>
                                ) : (
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDone ? 'bg-emerald-400' : 'bg-[var(--border)]'}`} />
                                )}
                                {hasContent ? (
                                  <button type="button"
                                    onClick={() => toggle(expandedRecipes, setExpandedRecipes, recipeKey)}
                                    className="flex-1 flex items-center gap-1 min-w-0 text-left">
                                    <span className={`text-sm font-medium text-[var(--text)] truncate ${isDone ? 'line-through' : ''}`}>{item.recipeName}</span>
                                    <ChevronDown size={12} className={`shrink-0 text-[var(--text-dim)] transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                  </button>
                                ) : (
                                  <span className={`flex-1 text-sm font-medium text-[var(--text)] truncate ${isDone ? 'line-through' : ''}`}>{item.recipeName}</span>
                                )}
                                {checkerName && (
                                  <span className="text-[10px] text-emerald-400 shrink-0">{checkerName}</span>
                                )}
                                <span className="text-xs text-[var(--text-dim)] tabular-nums shrink-0">{item.qty} {item.qtyUnit}</span>
                              </div>
                              {isExpanded && hasContent && (
                                <div className="px-4 pb-3 space-y-2">
                                  {hasIngredients && (
                                    hasGroups ? (
                                      <>
                                        <div className="space-y-1 pl-8">
                                          {autreIngs.map((ing, idx) => (
                                            <div key={idx} className="flex justify-between gap-2">
                                              <span className="text-xs text-[var(--text-dim)] truncate">{ing.name}</span>
                                              <span className="text-xs font-mono text-[var(--text-dim)] shrink-0 tabular-nums">{Math.round(ing.qty * portions * 100) / 100} {ing.unit}</span>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="border-t border-dashed border-[var(--border)] pt-2 space-y-1 pl-8">
                                          {maisonIngs.map((ing, idx) => (
                                            <div key={idx} className="flex justify-between gap-2">
                                              <span className="text-xs text-[var(--text-dim)] truncate">{ing.name}</span>
                                              <span className="text-xs font-mono text-[var(--text-dim)] shrink-0 tabular-nums">{Math.round(ing.qty * portions * 100) / 100} {ing.unit}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="space-y-1 pl-8">
                                        {item.ingredients!.map((ing, idx) => (
                                          <div key={idx} className="flex justify-between gap-2">
                                            <span className="text-xs text-[var(--text-dim)] truncate">{ing.name}</span>
                                            <span className="text-xs font-mono text-[var(--text-dim)] shrink-0 tabular-nums">{Math.round(ing.qty * portions * 100) / 100} {ing.unit}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  )}
                                  {item.steps && (
                                    <p className="text-xs text-[var(--text-dim)] italic pl-8 leading-relaxed whitespace-pre-line">{item.steps}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Timers */}
                    {Object.entries(batch.timers ?? {}).length > 0 && (
                      <div className="px-4 py-3 space-y-2 border-b border-[var(--border)]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">Timers</p>
                        {Object.entries(batch.timers).map(([key, timer]) => {
                          const remaining = getRemaining(timer);
                          const isActive = !!timer.startedAt && remaining > 0;
                          const isDone = remaining <= 0;
                          return (
                            <div key={key} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Timer size={12} className={isDone ? 'text-emerald-400' : isActive ? 'text-[var(--gold)]' : 'text-[var(--text-dim)]'} />
                                <span className="text-xs text-[var(--text-dim)]">{timer.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-mono text-sm font-semibold tabular-nums ${isDone ? 'text-emerald-400' : isActive ? 'text-[var(--gold)]' : 'text-[var(--text)]'}`}>
                                  {isDone ? '✓' : fmtTime(remaining)}
                                </span>
                                {canInteract && (
                                  <button type="button" onClick={() => toggleBatchTimer(batch.id, key)}
                                    className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-orange-400/10 text-orange-400' : isDone ? 'bg-emerald-400/10 text-emerald-400' : 'bg-[var(--gold)]/10 text-[var(--gold)]'}`}>
                                    {isActive ? <Square size={12} /> : isDone ? <RotateCcw size={12} /> : <Play size={12} />}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Stop sharing — creator only */}
                    {batch.user_id === userId && (
                      <button type="button"
                        onClick={async () => {
                          if (!confirm('Arrêter le partage de ce batch ?')) return;
                          const sb = createClient();
                          await sb.from('batches').update({ team_id: null }).eq('id', batch.id);
                          setLiveBatches((prev) => prev.filter((b) => b.id !== batch.id));
                        }}
                        className="w-full px-4 py-2.5 flex items-center justify-center gap-1.5 text-xs text-[var(--text-dim)] hover:text-red-400 hover:bg-red-400/5 transition-colors">
                        <X size={13} /> Arrêter le partage
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── SHARES TAB ── */}
      {mainTab === 'shares' && (
        <div className="space-y-4">
          {/* Team header actions */}
          <div className="flex items-center justify-between">
            <span />
            <button onClick={() => setComposing((v) => !v)} className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5">
              <Plus size={13} /> Créer un menu
            </button>
          </div>

          {/* Menu composer */}
          {composing && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
                <ClipboardList size={15} className="text-[var(--gold)]" /> Nouveau menu
              </h3>
              <input type="text" value={menuName} onChange={(e) => setMenuName(e.target.value)}
                placeholder="Nom du menu (ex. Carte été)" className="field-input" />
              {myRecipes.length === 0 ? (
                <p className="text-sm text-[var(--text-dim)]">Vous n&apos;avez pas encore de recettes.</p>
              ) : (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                    <input type="text" value={recipeSearch} onChange={(e) => setRecipeSearch(e.target.value)}
                      placeholder="Rechercher une recette…" className="field-input pl-10 text-sm" />
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1 -mx-1 px-1">
                    {filteredRecipes.map((r) => {
                      const on = picked.has(r.id);
                      return (
                        <button key={r.id} onClick={() => toggle(picked, setPicked, r.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${on ? 'bg-[var(--gold)]/10 text-[var(--text)]' : 'hover:bg-[var(--surface2)] text-[var(--text-dim)]'}`}>
                          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? 'bg-[var(--gold)] border-[var(--gold)]' : 'border-[var(--border)]'}`}>
                            {on && <Check size={11} className="text-[#0A0E1A]" />}
                          </span>
                          <span className="truncate flex-1">{r.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setComposing(false); setPicked(new Set()); setMenuName(''); }} className="btn-ghost flex-1 py-2 text-sm">Annuler</button>
                <button onClick={shareMenu} disabled={busy === 'menu' || !menuName.trim() || picked.size === 0}
                  className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2">
                  {busy === 'menu' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Partager ({picked.size})
                </button>
              </div>
            </div>
          )}

          {/* Share type tabs */}
          <div className="flex gap-1 bg-[var(--surface2)] rounded-lg p-1">
            {(Object.keys(TAB_SHARE) as ShareTab[]).map((t) => {
              const { label, icon: Icon } = TAB_SHARE[t];
              return (
                <button key={t} onClick={() => setShareTab(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-medium transition-colors ${shareTab === t ? 'bg-[var(--surface)] text-[var(--text)]' : 'text-[var(--text-dim)]'}`}>
                  <Icon size={13} /> {label}
                  <span className="text-[10px] opacity-70">{counts[t]}</span>
                </button>
              );
            })}
          </div>

          {/* Items */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
              {(() => { const Icon = TAB_SHARE[shareTab].icon; return <Icon size={36} className="text-[var(--text-dim)] opacity-40" />; })()}
              <p className="text-sm text-[var(--text-dim)] max-w-xs">
                {shareTab === 'menu' ? 'Aucun menu partagé. Cliquez sur « Créer un menu ».' :
                 shareTab === 'recipe' ? 'Aucun cocktail partagé. Utilisez « Partager » sur une recette.' :
                 'Aucun ingrédient partagé. Utilisez « Partager » sur une fiche ingrédient.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => {
                const itemNotes = notes.filter((n) => n.item_id === item.id);
                const name = (item.data as { name?: string }).name ?? 'Sans nom';
                const menuRecipes = item.item_type === 'menu' ? ((item.data as { recipes?: Array<{ name?: string }> }).recipes ?? []) : [];
                const canDelete = item.shared_by === userId || canManage;
                return (
                  <li key={item.id} className="card space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text)] truncate">{name}</p>
                        <p className="text-xs text-[var(--text-dim)]">
                          {item.item_type === 'menu' && `${menuRecipes.length} recette(s) · `}
                          Partagé par {item.sharer_name ?? 'un membre'}
                        </p>
                      </div>
                      <button onClick={() => importItem(item)} disabled={busy === `imp-${item.id}`}
                        className="btn-ghost px-2.5 py-1 text-xs flex items-center gap-1 shrink-0">
                        {busy === `imp-${item.id}` ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                        Importer
                      </button>
                      {canDelete && (
                        <button onClick={() => deleteItem(item)} disabled={busy === `del-${item.id}`}
                          className="p-2 text-[var(--text-dim)] hover:text-red-400 shrink-0">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {item.item_type === 'menu' && menuRecipes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {menuRecipes.map((r, i) => (
                          <span key={i} className="text-xs bg-[var(--surface2)] text-[var(--text-dim)] px-2 py-0.5 rounded-full">{r.name ?? 'Recette'}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button onClick={() => toggle(openPreview, setOpenPreview, item.id)}
                        className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] flex items-center gap-1">
                        <Eye size={12} /> Aperçu
                        <ChevronDown size={12} className={`transition-transform ${openPreview.has(item.id) ? 'rotate-180' : ''}`} />
                      </button>
                      <button onClick={() => toggle(openNotes, setOpenNotes, item.id)}
                        className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] flex items-center gap-1">
                        <MessageSquare size={12} />
                        {itemNotes.length > 0 ? `${itemNotes.length} note(s)` : 'Ajouter une note'}
                      </button>
                    </div>

                    {openPreview.has(item.id) && <ItemPreview item={item} />}

                    {openNotes.has(item.id) && (
                      <div className="space-y-2">
                        {itemNotes.map((n) => (
                          <div key={n.id} className="flex items-start gap-2 text-sm bg-[var(--surface2)] rounded-md px-2.5 py-1.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-[var(--text)]">{n.content}</p>
                              <p className="text-xs text-[var(--text-dim)]">{n.author_name ?? 'Membre'}</p>
                            </div>
                            {n.user_id === userId && (
                              <button onClick={() => deleteNote(n.id)} className="p-0.5 text-[var(--text-dim)] hover:text-red-400 shrink-0"><X size={13} /></button>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input type="text" value={noteDrafts[item.id] ?? ''} onChange={(e) => setNoteDrafts((p) => ({ ...p, [item.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && addNote(item.id)}
                            placeholder="Écrire une note…" className="field-input flex-1 text-sm py-1.5" />
                          <button onClick={() => addNote(item.id)} disabled={busy === `note-${item.id}` || !(noteDrafts[item.id] ?? '').trim()} className="btn-primary px-3 text-xs">
                            {busy === `note-${item.id}` ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── preview ──────────────────────────────────────────────────────────────────
function ItemPreview({ item }: { item: TeamSharedItem }) {
  if (item.item_type === 'recipe') {
    const rd = (item.data as { recipeData?: { ingredients?: Array<{ qty?: number; unit?: string; name?: string }>; steps?: string } }).recipeData ?? {};
    const ings = rd.ingredients ?? [];
    return (
      <div className="rounded-lg border border-[var(--border)] p-3 space-y-2 text-sm">
        {ings.length > 0 ? (
          <ul className="space-y-1">
            {ings.map((g, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="text-[var(--text)] truncate">{g.name ?? '—'}</span>
                <span className="text-[var(--text-dim)] shrink-0">{g.qty ? `${g.qty} ${g.unit ?? ''}` : ''}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-[var(--text-dim)]">Aucun ingrédient renseigné.</p>}
        {rd.steps && <p className="text-[var(--text-dim)] whitespace-pre-wrap pt-2 border-t border-[var(--border)]">{rd.steps}</p>}
      </div>
    );
  }
  if (item.item_type === 'ingredient') {
    const ig = (item.data as { ingredientData?: Record<string, unknown> }).ingredientData ?? {};
    const rows: Array<[string, string]> = [];
    const add = (label: string, v: unknown) => { if (v !== undefined && v !== null && v !== '' && v !== 0) rows.push([label, String(v)]); };
    add('Type', (ig as { type?: string }).type);
    add('Famille', (ig as { family?: string }).family);
    add('Marque', (ig as { brand?: string }).brand);
    add('Unité', (ig as { unit?: string }).unit);
    const comp = (ig as { composition?: Array<{ name?: string; qty?: number; unit?: string }> }).composition ?? [];
    return (
      <div className="rounded-lg border border-[var(--border)] p-3 space-y-2 text-sm">
        {rows.length > 0 ? <dl className="space-y-1">{rows.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-2"><dt className="text-[var(--text-dim)]">{k}</dt><dd className="text-[var(--text)] truncate">{v}</dd></div>)}</dl> : <p className="text-[var(--text-dim)]">Pas de détail disponible.</p>}
        {comp.length > 0 && <div className="pt-2 border-t border-[var(--border)]"><p className="text-xs text-[var(--text-dim)] mb-1">Composition</p><ul className="space-y-1">{comp.map((c, i) => <li key={i} className="flex items-center justify-between gap-2"><span className="text-[var(--text)] truncate">{c.name ?? '—'}</span><span className="text-[var(--text-dim)] shrink-0">{c.qty ? `${c.qty} ${c.unit ?? ''}` : ''}</span></li>)}</ul></div>}
      </div>
    );
  }
  const recs = (item.data as { recipes?: Array<{ name?: string; recipeData?: { ingredients?: Array<{ qty?: number; unit?: string; name?: string }> } }> }).recipes ?? [];
  return (
    <div className="rounded-lg border border-[var(--border)] p-3 space-y-3 text-sm">
      {recs.length === 0 ? <p className="text-[var(--text-dim)]">Menu vide.</p> : recs.map((r, i) => {
        const ings = r.recipeData?.ingredients ?? [];
        return (
          <div key={i} className="space-y-1">
            <p className="font-medium text-[var(--text)]">{r.name ?? 'Recette'}</p>
            {ings.length > 0 && <ul className="space-y-0.5 pl-2">{ings.map((g, j) => <li key={j} className="flex items-center justify-between gap-2 text-[var(--text-dim)]"><span className="truncate">{g.name ?? '—'}</span><span className="shrink-0">{g.qty ? `${g.qty} ${g.unit ?? ''}` : ''}</span></li>)}</ul>}
          </div>
        );
      })}
    </div>
  );
}
