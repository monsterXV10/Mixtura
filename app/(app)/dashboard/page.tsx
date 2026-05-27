import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { BookOpen, Package, Wrench, Users, Clock, TrendingUp, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Barman';

  const [recipesRes, ingredientsRes] = await Promise.all([
    supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('ingredients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const recipeCount = recipesRes.count ?? 0;
  const ingredientCount = ingredientsRes.count ?? 0;

  const MODULES = [
    {
      href: '/recipes',
      icon: BookOpen,
      title: 'Recettes',
      desc: 'Cocktails, batchs, cafés',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      href: '/ingredients',
      icon: Package,
      title: 'Stocks',
      desc: 'Ingrédients & inventaire',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      href: '/tools',
      icon: Wrench,
      title: 'Outils',
      desc: 'Batch, calculateurs',
      color: 'text-[var(--gold)]',
      bg: 'bg-[var(--gold)]/10',
    },
    {
      href: '/communication',
      icon: Users,
      title: 'Équipe',
      desc: 'Messages & timers',
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
  ];

  return (
    <>
      <TopBar title="Mixtura" />
      <main className="px-4 py-5 space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">
            Bonjour, {name} 👋
          </h2>
          <p className="text-sm text-[var(--text-dim)] mt-0.5">
            Que faisons-nous aujourd&apos;hui ?
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <Link
            href="/recipes/new"
            className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--gold)] text-[#0A0E1A] font-semibold text-sm"
          >
            <Plus size={16} />
            Nouvelle recette
          </Link>
          <Link
            href="/tools/batch"
            className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] font-semibold text-sm"
          >
            <Clock size={16} />
            Lancer un batch
          </Link>
        </div>

        {/* Modules grid */}
        <div className="grid grid-cols-2 gap-3">
          {MODULES.map(({ href, icon: Icon, title, desc, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="card flex flex-col gap-3 hover:border-[var(--gold-dim)] transition-colors active:scale-98"
            >
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="font-semibold text-[var(--text)] text-sm">{title}</p>
                <p className="text-xs text-[var(--text-dim)] mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-[var(--gold)]" />
            <span className="font-semibold text-sm text-[var(--text)]">Aperçu</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--gold)]">{recipeCount}</p>
              <p className="text-xs text-[var(--text-dim)]">Recettes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--gold)]">{ingredientCount}</p>
              <p className="text-xs text-[var(--text-dim)]">Ingrédients</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--gold)]">0</p>
              <p className="text-xs text-[var(--text-dim)]">Batchs</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
