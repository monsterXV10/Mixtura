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
        'flex items-center justify-between px-4 h-14',
        'sticky top-0 z-30',
        className
      )}
      style={{
        background: 'linear-gradient(180deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 92%, transparent) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 0 var(--border), 0 2px 16px rgba(0,0,0,0.15)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {backHref && (
          <button
            onClick={() => router.push(backHref)}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all duration-150"
            aria-label="Retour"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <h1
          className="font-semibold text-[var(--text)] text-[15px] truncate"
          style={{ letterSpacing: '-0.01em' }}
        >
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
