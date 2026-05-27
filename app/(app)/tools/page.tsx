import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { Package, TrendingUp, ArrowLeftRight, Percent, Droplets } from 'lucide-react';

const tools = [
  {
    href: '/tools/batch',
    icon: Package,
    title: 'Batch de production',
    desc: 'Calculez et consolidez vos ingrédients pour produire plusieurs recettes',
    color: 'text-[var(--gold)]',
    bg: 'bg-[var(--gold)]/10',
  },
  {
    href: '/tools/cout-marge',
    icon: TrendingUp,
    title: 'Coût & Marge',
    desc: 'Calculez le coût matière, le prix de vente conseillé et la marge',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    href: '/tools/convertisseur',
    icon: ArrowLeftRight,
    title: 'Convertisseur',
    desc: 'Convertissez entre cl, ml, oz, barspoon, dash, g, kg…',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    href: '/tools/abv',
    icon: Percent,
    title: 'Calculateur ABV',
    desc: 'Calculez le degré alcoolique final d'un assemblage',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    href: '/tools/dilution',
    icon: Droplets,
    title: 'Dilution',
    desc: 'Estimez l'eau de dilution selon la méthode (Shake / Stir / Build)',
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
  },
];

export default function ToolsPage() {
  return (
    <>
      <TopBar title="Outils" />
      <main className="px-4 py-5 space-y-3">
        {tools.map(({ href, icon: Icon, title, desc, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="card flex items-center gap-4 hover:border-[var(--gold-dim)] transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={24} className={color} />
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">{title}</p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </main>
    </>
  );
}
