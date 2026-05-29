import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { BookOpen, Package, Wrench, Users, Clock, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const firstName = (user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Barman').split(' ')[0];

  const [recipesRes, ingredientsRes] = await Promise.all([
    supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('ingredients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const recipeCount = recipesRes.count ?? 0;
  const ingredientCount = ingredientsRes.count ?? 0;

  const MODULES = [
    { href: '/recipes',       icon: BookOpen,      title: 'Recettes',  desc: 'Cocktails & cafés',     accent: '#60a5fa' },
    { href: '/ingredients',   icon: Package,       title: 'Stocks',    desc: 'Inventaire',            accent: '#34d399' },
    { href: '/tools',         icon: Wrench,        title: 'Outils',    desc: 'Batch & calcul',        accent: '#C8A96E' },
    { href: '/communication', icon: Users,         title: 'Équipe',    desc: 'Partage & timers',      accent: '#c084fc' },
  ];

  return (
    <>
      <TopBar title="Mixtura" />
      <main className="px-4 pt-5 pb-safe space-y-5">

        {/* Greeting */}
        <div className="pt-1">
          <p className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-widest mb-1">Tableau de bord</p>
          <h2 className="text-2xl font-bold text-[var(--text)]" style={{ letterSpacing: '-0.03em' }}>
            Bonsoir, {firstName}
          </h2>
        </div>

        {/* Stats strip */}
        <div
          className="rounded-2xl p-4 flex gap-4"
          style={{
            background: 'linear-gradient(135deg, var(--surface2) 0%, var(--surface) 100%)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {[
            { value: recipeCount,     label: 'Recettes' },
            { value: ingredientCount, label: 'Ingrédients' },
          ].map(({ value, label }) => (
            <div key={label} className="flex-1 text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--gold)', letterSpacing: '-0.04em' }}>
                {value}
              </p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">{label}</p>
            </div>
          ))}
          <div className="w-px bg-[var(--border)]" />
          <div className="flex-1 flex flex-col items-center justify-center gap-1">
            <Link
              href="/recipes/new"
              className="btn-primary h-8 px-3 text-xs gap-1.5 rounded-lg"
            >
              <Plus size={13} /> Recette
            </Link>
          </div>
        </div>

        {/* Quick action — batch */}
        <Link
          href="/tools/batch"
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 group"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(200,169,110,0.12)' }}
          >
            <Clock size={17} style={{ color: 'var(--gold)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text)]">Lancer un batch</p>
            <p className="text-xs text-[var(--text-dim)]">Production en cours ou nouveau</p>
          </div>
          <ChevronRight size={16} className="text-[var(--text-dim)] group-hover:text-[var(--text)] transition-colors" />
        </Link>

        {/* Modules grid */}
        <div className="grid grid-cols-2 gap-3">
          {MODULES.map(({ href, icon: Icon, title, desc, accent }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col gap-3 rounded-2xl p-4 transition-all duration-150 group"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${accent}18` }}
              >
                <Icon size={17} style={{ color: accent }} />
              </div>
              <div>
                <p className="font-semibold text-[var(--text)] text-sm leading-tight">{title}</p>
                <p className="text-[11px] text-[var(--text-dim)] mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </>
  );
}
