'use client';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-full transition-colors',
        'bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--gold)]',
        className
      )}
      aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
