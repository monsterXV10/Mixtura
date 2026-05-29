'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, Package, Wrench, MessageSquare, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Accueil' },
  { href: '/recipes',       icon: BookOpen,         label: 'Recettes' },
  { href: '/ingredients',   icon: Package,          label: 'Stocks' },
  { href: '/tools',         icon: Wrench,           label: 'Outils' },
  { href: '/communication', icon: MessageSquare,    label: 'Équipe' },
  { href: '/settings',      icon: Settings,         label: 'Réglages' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        background: 'linear-gradient(0deg, var(--surface) 60%, color-mix(in srgb, var(--surface) 85%, transparent) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div
        className="flex items-center justify-around px-1 max-w-lg mx-auto"
        style={{ height: 'calc(56px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors duration-150',
                active ? 'text-[var(--gold)]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              )}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'var(--gold)', boxShadow: '0 0 8px var(--gold)' }}
                />
              )}
              <Icon
                size={19}
                strokeWidth={active ? 2.2 : 1.6}
                style={active ? { filter: 'drop-shadow(0 0 5px rgba(200,169,110,0.55))' } : undefined}
              />
              <span className={cn('text-[9.5px] leading-tight tracking-wide', active ? 'font-semibold' : 'font-medium')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
