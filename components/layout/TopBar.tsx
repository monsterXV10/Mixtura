'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title: string;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function TopBar({ title, backHref, actions, className }: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 h-14 border-b border-[var(--border)]',
        'bg-[var(--surface)] sticky top-0 z-30',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {backHref && (
          <button
            onClick={() => router.push(backHref)}
            className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="font-semibold text-[var(--text)] text-base">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
