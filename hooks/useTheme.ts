'use client';
import { useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('mixtura-theme') as Theme | null;
    const initial = stored ?? 'dark';
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const applyTheme = (t: Theme) => {
    document.documentElement.classList.toggle('theme-light', t === 'light');
  };

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('mixtura-theme', next);
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
