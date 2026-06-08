import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { Plus, ScrollText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MenusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: menuRows } = await supabase
    .from('menus')
    .select('id, name, data, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const menus = (menuRows ?? []).map((m) => {
    const d = m.data as { sections?: Array<{ name: string; items?: unknown[] }> } | null;
    const sections = d?.sections ?? [];
    const total = sections.reduce((s, sec) => s + (sec.items?.length ?? 0), 0);
    return {
      id: m.id as string,
      name: (m.name as string) || 'Sans titre',
      sectionCount: sections.length,
      itemCount: total,
      updatedAt: m.updated_at as string,
    };
  });

  async function createMenu() {
    'use server';
    const sb = await createClient();
    const { data: { user: u } } = await sb.auth.getUser();
    if (!u) return;
    const { data } = await sb.from('menus').insert({ user_id: u.id, name: 'Nouveau menu', data: { sections: [] } }).select('id').single();
    if (data) redirect(`/menus/${data.id}`);
  }

  return (
    <>
      <TopBar title="Menus" />
      <main className="px-4 py-5 pb-24 space-y-4">
        <form action={createMenu}>
          <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Plus size={16} />
            Créer un menu
          </button>
        </form>

        {menus.length === 0 ? (
          <div className="card text-center py-12 space-y-3">
            <ScrollText size={32} className="mx-auto text-[var(--text-dim)] opacity-40" />
            <p className="text-[var(--text-dim)] text-sm">Aucun menu pour l&apos;instant.</p>
            <p className="text-xs text-[var(--text-dim)] opacity-60">Crée ta première carte pour organiser tes cocktails.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {menus.map((m) => (
              <Link key={m.id} href={`/menus/${m.id}`} className="card block hover:border-[var(--border-hover)] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--text)] truncate">{m.name}</p>
                    <p className="text-xs text-[var(--text-dim)] mt-1">
                      {m.sectionCount} section{m.sectionCount !== 1 ? 's' : ''} · {m.itemCount} cocktail{m.itemCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-[var(--text-dim)] shrink-0 mt-1">
                    {new Date(m.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
