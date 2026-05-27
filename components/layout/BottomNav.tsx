'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Package,
  Wrench,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { href: '/recipes', icon: BookOpen, label: 'Recettes' },
  { href: '/ingredients', icon: Package, label: 'Stocks' },
  { href: '/tools', icon: Wrench, label: 'Outils' },
  { href: '/communication', icon: MessageSquare, label: 'Équipe' },
  { href: '/settings', icon: Settings, label: 'Réglages' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 flex-1 py-2 rounded-lg transition-colors text-xs',
                active
                  ? 'text-[var(--gold)]'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              <span className={cn('text-[10px] leading-tight', active && 'font-semibold')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
