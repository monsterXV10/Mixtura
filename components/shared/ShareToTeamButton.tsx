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
}

export function ShareToTeamButton({
  userId, sharerName, teams, itemType, itemName, payload,
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
    const { error } = await supabase.from('team_shared_items').insert({
      team_id: teamId,
      shared_by: userId,
      sharer_name: sharerName,
      item_type: itemType,
      share_mode: 'copy',
      data: { name: itemName, ...payload },
    });
    setBusy(null);
    if (!error) {
      setSharedTeams((p) => new Set(p).add(teamId));
      if (teams.length === 1) setOpen(false);
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
