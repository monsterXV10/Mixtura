'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Share2, Check, Loader2, Users } from 'lucide-react';

interface ShareToTeamButtonProps {
  userId: string;
  sharerName: string;
  teams: Array<{ id: string; name: string }>;
  itemType: 'recipe' | 'ingredient';
  itemName: string;
  /** jsonb snapshot stored in team_shared_items.data */
  payload: Record<string, unknown>;
  /** When sharing a recipe, also share its ingredients */
  ingredientsToShare?: Array<{ name: string; ingredientData: Record<string, unknown> }>;
}

export function ShareToTeamButton({
  userId, sharerName, teams, itemType, itemName, payload, ingredientsToShare,
}: ShareToTeamButtonProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [sharedTeams, setSharedTeams] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (teams.length === 0) return null;

  async function shareTo(teamId: string) {
    setBusy(teamId);
    try {
      const [{ data: existingMain, error: checkErr }, { data: existingIngs, error: ingsErr }] = await Promise.all([
        supabase
          .from('team_shared_items')
          .select('id')
          .eq('team_id', teamId)
          .eq('item_type', itemType)
          .filter('data->>name', 'eq', itemName)
          .maybeSingle(),
        itemType === 'recipe' && ingredientsToShare?.length
          ? supabase.from('team_shared_items').select('data').eq('team_id', teamId).eq('item_type', 'ingredient')
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (checkErr) throw checkErr;

      if (existingMain) {
        setSharedTeams((p) => new Set(p).add(teamId));
        if (teams.length === 1) setOpen(false);
        return;
      }

      const rows: Array<Record<string, unknown>> = [
        {
          team_id: teamId,
          shared_by: userId,
          sharer_name: sharerName,
          item_type: itemType,
          share_mode: 'copy',
          data: { name: itemName, ...payload },
        },
      ];

      if (itemType === 'recipe' && ingredientsToShare?.length) {
        const alreadyShared = new Set(
          (ingsErr ? [] : (existingIngs ?? [])).map(
            (e) => ((e.data as { name?: string }).name ?? '').toLowerCase()
          )
        );
        for (const ing of ingredientsToShare) {
          if (!ing.name || alreadyShared.has(ing.name.toLowerCase())) continue;
          rows.push({
            team_id: teamId,
            shared_by: userId,
            sharer_name: sharerName,
            item_type: 'ingredient',
            share_mode: 'copy',
            data: { name: ing.name, ingredientData: ing.ingredientData },
          });
        }
      }

      const { error } = await supabase.from('team_shared_items').insert(rows);
      // 23505 = unique_violation: item was shared concurrently, treat as success
      if (!error || (error as { code?: string }).code === '23505') {
        setSharedTeams((p) => new Set(p).add(teamId));
        if (teams.length === 1) setOpen(false);
      }
    } finally {
      setBusy(null);
    }
  }

  // Single team → one-click share
  if (teams.length === 1) {
    const t = teams[0];
    const done = sharedTeams.has(t.id);
    return (
      <button
        onClick={() => !done && shareTo(t.id)}
        disabled={busy === t.id || done}
        className="btn-ghost px-3 py-1.5 text-sm flex items-center gap-1.5"
      >
        {busy === t.id ? (
          <Loader2 size={14} className="animate-spin" />
        ) : done ? (
          <Check size={14} className="text-emerald-400" />
        ) : (
          <Share2 size={14} />
        )}
        {done ? 'Partagé' : 'Partager'}
      </button>
    );
  }

  // Multiple teams → dropdown
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost px-3 py-1.5 text-sm flex items-center gap-1.5"
      >
        <Share2 size={14} />
        Partager
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 card p-1 shadow-lg min-w-[180px]">
          <p className="text-xs text-[var(--text-dim)] px-2.5 py-1.5">Partager avec…</p>
          {teams.map((t) => {
            const done = sharedTeams.has(t.id);
            return (
              <button
                key={t.id}
                onClick={() => shareTo(t.id)}
                disabled={busy === t.id || done}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface2)] rounded-md transition-colors text-left disabled:opacity-60"
              >
                {busy === t.id ? (
                  <Loader2 size={14} className="animate-spin shrink-0" />
                ) : done ? (
                  <Check size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <Users size={14} className="text-[var(--text-dim)] shrink-0" />
                )}
                <span className="truncate">{t.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
