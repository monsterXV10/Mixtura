'use client';
import { useState, useRef, useEffect } from 'react';
import { ScrollText, ChevronDown, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  recipeId: string;
  recipeName: string;
  menus: Array<{ id: string; name: string; hasRecipe: boolean }>;
}

export function AddToMenuButton({ recipeId, recipeName, menus }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (menus.length === 0) {
    return (
      <a
        href={`/menus?addRecipe=${recipeId}&addName=${encodeURIComponent(recipeName)}`}
        className="btn-ghost w-full py-2.5 flex items-center justify-center gap-2 text-sm"
      >
        <ScrollText size={15} />
        Créer un menu avec ce cocktail
      </a>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="btn-ghost w-full py-2.5 flex items-center justify-center gap-2 text-sm"
      >
        <ScrollText size={15} />
        Ajouter à un menu
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden">
          <p className="px-3 py-2 text-[10px] text-[var(--text-dim)] uppercase tracking-wide font-medium border-b border-[var(--border)]">
            Ajouter à un menu
          </p>
          <ul>
            {menus.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    if (!m.hasRecipe) {
                      router.push(`/menus/${m.id}?addRecipe=${recipeId}&addName=${encodeURIComponent(recipeName)}`);
                    } else {
                      router.push(`/menus/${m.id}`);
                    }
                  }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2 text-sm text-[var(--text)] hover:bg-[var(--surface2)] transition-colors"
                >
                  {m.hasRecipe && <Check size={13} className="text-emerald-400 shrink-0" />}
                  <span className={`flex-1 truncate ${m.hasRecipe ? 'text-[var(--text-dim)]' : ''}`}>{m.name}</span>
                  {m.hasRecipe && <span className="text-[10px] text-[var(--text-dim)]">déjà ajouté</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(`/menus?addRecipe=${recipeId}&addName=${encodeURIComponent(recipeName)}`);
              }}
              className="w-full text-left px-3 py-2.5 text-xs text-[var(--text-dim)] hover:bg-[var(--surface2)] transition-colors"
            >
              + Créer un nouveau menu avec ce cocktail
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
