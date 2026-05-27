'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Users, BookOpen, FlaskConical, ClipboardList, Download, MessageSquare,
  Send, Trash2, Loader2, X, Plus, Check, Search, ChevronDown, Eye,
} from 'lucide-react';
import { memberRole } from '@/lib/team';
import { ensureIngredients, type IngredientRef } from '@/lib/utils/ingredients';
import type { Team, TeamMember, TeamSharedItem, TeamNote } from '@/lib/team';

interface MyRecipe {
  id: string;
  type: string;
  name: string;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

interface Props {
  userId: string;
  myName: string;
  teams: Team[];
  members: TeamMember[];
  sharedItems: TeamSharedItem[];
  notes: TeamNote[];
  myRecipes: MyRecipe[];
}

type Tab = 'recipe' | 'ingredient' | 'menu';

export default function CommunicationClient({
  userId, myName, teams, members, sharedItems, notes, myRecipes,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teams[0]?.id ?? null);
  const activeTeam = teams.find((t) => t.id === selectedTeamId) ?? teams[0] ?? null;

  const [tab, setTab] = useState<Tab>('recipe');
  const [busy, setBusy] = useState<string | null>(null);
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [openPreview, setOpenPreview] = useState<Set<string>>(new Set());
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  // menu composer
  const [composing, setComposing] = useState(false);
  const [menuName, setMenuName] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [recipeSearch, setRecipeSearch] = useState('');

  const isManager = useMemo(() => {
    if (!activeTeam) return false;
    if (activeTeam.owner_id === userId) return true;
    const me = members.find((m) => m.team_id === activeTeam.id && m.user_id === userId);
    return me ? memberRole(me, activeTeam.owner_id) !== 'user' : false;
  }, [activeTeam, members, userId]);

  const teamShared = activeTeam ? sharedItems.filter((s) => s.team_id === activeTeam.id) : [];
  const counts = {
    recipe: teamShared.filter((s) => s.item_type === 'recipe').length,
    ingredient: teamShared.filter((s) => s.item_type === 'ingredient').length,
    menu: teamShared.filter((s) => s.item_type === 'menu').length,
  };
  const items = teamShared.filter((s) => s.item_type === tab);

  const filteredRecipes = useMemo(() => {
    if (!recipeSearch.trim()) return myRecipes;
    const q = recipeSearch.toLowerCase();
    return myRecipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [myRecipes, recipeSearch]);

  // ---------------------------------------------------------------- actions
  async function importItem(item: TeamSharedItem) {
    setBusy(`imp-${item.id}`);
    try {
      if (item.item_type === 'recipe') {
        const d = item.data as { type?: string; recipeData?: Record<string, unknown>; metadata?: Record<string, unknown> };
        const recipeData = { ...(d.recipeData ?? {}) } as Record<string, unknown> & { ingredients?: IngredientRef[] };
        if (Array.isArray(recipeData.ingredients) && recipeData.ingredients.length) {
          recipeData.ingredients = await ensureIngredients(supabase, userId, recipeData.ingredients);
        }
        await supabase.from('recipes').insert({
          user_id: userId,
          type: d.type ?? 'cocktail',
          data: recipeData,
          metadata: d.metadata ?? {},
        });
        alert('Recette importée — ingrédients ajoutés à vos stocks.');
      } else if (item.item_type === 'ingredient') {
        const d = item.data as { ingredientData?: Record<string, unknown> };
        await supabase.from('ingredients').insert({ user_id: userId, data: d.ingredientData ?? {} });
        alert('Ingrédient importé dans vos stocks.');
      } else if (item.item_type === 'menu') {
        const d = item.data as {
          recipes?: Array<{ name?: string; type?: string; recipeData?: Record<string, unknown>; metadata?: Record<string, unknown> }>;
        };
        const seen = new Set(myRecipes.map((r) => r.name.toLowerCase()));
        const rows: Array<Record<string, unknown>> = [];
        let skipped = 0;
        for (const r of d.recipes ?? []) {
          const nm = (r.name ?? (r.recipeData as { name?: string })?.name ?? '').toLowerCase();
          if (nm && seen.has(nm)) { skipped++; continue; }
          if (nm) seen.add(nm);
          const rd = { ...(r.recipeData ?? {}) } as Record<string, unknown> & { ingredients?: IngredientRef[] };
          if (Array.isArray(rd.ingredients) && rd.ingredients.length) {
            rd.ingredients = await ensureIngredients(supabase, userId, rd.ingredients);
          }
          rows.push({ user_id: userId, type: r.type ?? 'cocktail', data: rd, metadata: r.metadata ?? {} });
        }
        if (rows.length) await supabase.from('recipes').insert(rows);
        alert(`${rows.length} recette(s) importée(s)${skipped ? ` · ${skipped} déjà présente(s) ignorée(s)` : ''}.`);
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function deleteItem(item: TeamSharedItem) {
    if (!confirm('Retirer cet élément du partage équipe ?')) return;
    setBusy(`del-${item.id}`);
    await supabase.from('team_shared_items').delete().eq('id', item.id);
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

  async function shareMenu() {
    const name = menuName.trim();
    if (!name || !activeTeam || picked.size === 0) return;
    setBusy('menu');
    const recipes = myRecipes
      .filter((r) => picked.has(r.id))
      .map((r) => ({ name: r.name, type: r.type, recipeData: r.data, metadata: r.metadata }));
    await supabase.from('team_shared_items').insert({
      team_id: activeTeam.id,
      shared_by: userId,
      sharer_name: myName,
      item_type: 'menu',
      share_mode: 'copy',
      data: { name, recipes },
    });
    setMenuName('');
    setPicked(new Set());
    setComposing(false);
    setBusy(null);
    setTab('menu');
    router.refresh();
  }

  function toggleNotes(id: string) {
    setOpenNotes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function togglePreview(id: string) {
    setOpenPreview((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function togglePick(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ---------------------------------------------------------------- empty
  if (!activeTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--surface2)] flex items-center justify-center">
          <Users size={24} className="text-[var(--text-dim)]" />
        </div>
        <div>
          <p className="font-semibold text-[var(--text)]">Aucune équipe</p>
          <p className="text-sm text-[var(--text-dim)] mt-1 max-w-xs">
            Rejoignez ou créez une équipe pour partager cocktails, ingrédients et menus.
          </p>
        </div>
        <Link href="/settings/team" className="btn-primary px-5 py-2.5 text-sm">
          Aller à l&apos;équipe
        </Link>
      </div>
    );
  }

  const TAB_META: Record<Tab, { label: string; icon: typeof BookOpen }> = {
    recipe: { label: 'Cocktails', icon: BookOpen },
    ingredient: { label: 'Ingrédients', icon: FlaskConical },
    menu: { label: 'Menus', icon: ClipboardList },
  };

  return (
    <div className="space-y-4">
      {/* Team header + switcher */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Users size={16} className="text-[var(--gold)] shrink-0" />
          {teams.length > 1 ? (
            <select
              value={activeTeam.id}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-transparent text-[var(--text)] font-semibold text-sm focus:outline-none"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : (
            <span className="font-semibold text-[var(--text)] text-sm truncate">{activeTeam.name}</span>
          )}
        </div>
        <button
          onClick={() => setComposing((v) => !v)}
          className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus size={13} /> Créer un menu
        </button>
      </div>

      {/* Menu composer */}
      {composing && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
            <ClipboardList size={15} className="text-[var(--gold)]" /> Nouveau menu
          </h3>
          <input
            type="text"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            placeholder="Nom du menu (ex. Carte été)"
            className="field-input"
          />
          {myRecipes.length === 0 ? (
            <p className="text-sm text-[var(--text-dim)]">
              Vous n&apos;avez pas encore de recettes à ajouter.
            </p>
          ) : (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                <input
                  type="text"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder="Rechercher une recette…"
                  className="field-input pl-10 text-sm"
                />
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 -mx-1 px-1">
                {filteredRecipes.map((r) => {
                  const on = picked.has(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => togglePick(r.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        on ? 'bg-[var(--gold)]/10 text-[var(--text)]' : 'hover:bg-[var(--surface2)] text-[var(--text-dim)]'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        on ? 'bg-[var(--gold)] border-[var(--gold)]' : 'border-[var(--border)]'
                      }`}>
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
            <button
              onClick={() => { setComposing(false); setPicked(new Set()); setMenuName(''); }}
              className="btn-ghost flex-1 py-2 text-sm"
            >
              Annuler
            </button>
            <button
              onClick={shareMenu}
              disabled={busy === 'menu' || !menuName.trim() || picked.size === 0}
              className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2"
            >
              {busy === 'menu' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Partager ({picked.size})
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface2)] rounded-lg p-1">
        {(Object.keys(TAB_META) as Tab[]).map((t) => {
          const { label, icon: Icon } = TAB_META[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-medium transition-colors ${
                tab === t ? 'bg-[var(--surface)] text-[var(--text)]' : 'text-[var(--text-dim)]'
              }`}
            >
              <Icon size={13} /> {label}
              <span className="text-[10px] opacity-70">{counts[t]}</span>
            </button>
          );
        })}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          {(() => {
            const Icon = TAB_META[tab].icon;
            return <Icon size={36} className="text-[var(--text-dim)] opacity-40" />;
          })()}
          <p className="text-sm text-[var(--text-dim)] max-w-xs">
            {tab === 'menu'
              ? 'Aucun menu partagé. Cliquez sur « Créer un menu ».'
              : tab === 'recipe'
              ? 'Aucun cocktail partagé. Utilisez « Partager » sur une recette.'
              : 'Aucun ingrédient partagé. Utilisez « Partager » sur une fiche ingrédient.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const itemNotes = notes.filter((n) => n.item_id === item.id);
            const name = (item.data as { name?: string }).name ?? 'Sans nom';
            const menuRecipes = item.item_type === 'menu'
              ? ((item.data as { recipes?: Array<{ name?: string }> }).recipes ?? [])
              : [];
            const canDelete = item.shared_by === userId || isManager;
            const notesOpen = openNotes.has(item.id);
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
                  <button
                    onClick={() => importItem(item)}
                    disabled={busy === `imp-${item.id}`}
                    className="btn-ghost px-2.5 py-1 text-xs flex items-center gap-1 shrink-0"
                  >
                    {busy === `imp-${item.id}` ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    Importer
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => deleteItem(item)}
                      disabled={busy === `del-${item.id}`}
                      className="p-2 text-[var(--text-dim)] hover:text-red-400 shrink-0"
                      aria-label="Retirer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Menu contents */}
                {item.item_type === 'menu' && menuRecipes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {menuRecipes.map((r, i) => (
                      <span key={i} className="text-xs bg-[var(--surface2)] text-[var(--text-dim)] px-2 py-0.5 rounded-full">
                        {r.name ?? 'Recette'}
                      </span>
                    ))}
                  </div>
                )}

                {/* Aperçu + notes */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePreview(item.id)}
                    className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] flex items-center gap-1"
                  >
                    <Eye size={12} />
                    Aperçu
                    <ChevronDown size={12} className={`transition-transform ${openPreview.has(item.id) ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => toggleNotes(item.id)}
                    className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] flex items-center gap-1"
                  >
                    <MessageSquare size={12} />
                    {itemNotes.length > 0 ? `${itemNotes.length} note(s)` : 'Ajouter une note'}
                  </button>
                </div>

                {openPreview.has(item.id) && <ItemPreview item={item} />}

                {notesOpen && (
                  <div className="space-y-2">
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
      )}
    </div>
  );
}

// ---------------------------------------------------------------- preview
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
        ) : (
          <p className="text-[var(--text-dim)]">Aucun ingrédient renseigné.</p>
        )}
        {rd.steps && (
          <p className="text-[var(--text-dim)] whitespace-pre-wrap pt-2 border-t border-[var(--border)]">{rd.steps}</p>
        )}
      </div>
    );
  }

  if (item.item_type === 'ingredient') {
    const ig = (item.data as { ingredientData?: Record<string, unknown> }).ingredientData ?? {};
    const rows: Array<[string, string]> = [];
    const add = (label: string, v: unknown) => {
      if (v !== undefined && v !== null && v !== '' && v !== 0) rows.push([label, String(v)]);
    };
    add('Type', (ig as { type?: string }).type);
    add('Famille', (ig as { family?: string }).family);
    add('Marque', (ig as { brand?: string }).brand);
    add('Unité', (ig as { unit?: string }).unit);
    add('Format', (ig as { format?: number }).format);
    add('Prix', (ig as { price?: number }).price);
    const comp = (ig as { composition?: Array<{ name?: string; qty?: number; unit?: string }> }).composition ?? [];
    return (
      <div className="rounded-lg border border-[var(--border)] p-3 space-y-2 text-sm">
        {rows.length > 0 ? (
          <dl className="space-y-1">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-2">
                <dt className="text-[var(--text-dim)]">{k}</dt>
                <dd className="text-[var(--text)] truncate">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-[var(--text-dim)]">Pas de détail disponible.</p>
        )}
        {comp.length > 0 && (
          <div className="pt-2 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-dim)] mb-1">Composition</p>
            <ul className="space-y-1">
              {comp.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="text-[var(--text)] truncate">{c.name ?? '—'}</span>
                  <span className="text-[var(--text-dim)] shrink-0">{c.qty ? `${c.qty} ${c.unit ?? ''}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // menu
  const recs = (item.data as { recipes?: Array<{ name?: string; recipeData?: { ingredients?: Array<{ qty?: number; unit?: string; name?: string }> } }> }).recipes ?? [];
  return (
    <div className="rounded-lg border border-[var(--border)] p-3 space-y-3 text-sm">
      {recs.length === 0 ? (
        <p className="text-[var(--text-dim)]">Menu vide.</p>
      ) : (
        recs.map((r, i) => {
          const ings = r.recipeData?.ingredients ?? [];
          return (
            <div key={i} className="space-y-1">
              <p className="font-medium text-[var(--text)]">{r.name ?? 'Recette'}</p>
              {ings.length > 0 && (
                <ul className="space-y-0.5 pl-2">
                  {ings.map((g, j) => (
                    <li key={j} className="flex items-center justify-between gap-2 text-[var(--text-dim)]">
                      <span className="truncate">{g.name ?? '—'}</span>
                      <span className="shrink-0">{g.qty ? `${g.qty} ${g.unit ?? ''}` : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
