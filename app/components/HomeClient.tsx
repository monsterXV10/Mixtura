'use client'

import type { User } from '@supabase/supabase-js'
import { useAuth } from '@/contexts/AuthContext'

interface HomeClientProps {
  user: User
}

const TILES = [
  { icon: '🍸', label: 'Recettes', href: '/recipes' },
  { icon: '🧪', label: 'Ingrédients', href: '/ingredients' },
  { icon: '📦', label: 'Batch', href: '/batch' },
  { icon: '📖', label: 'Livre', href: '/book' },
  { icon: '🗂', label: 'Catalogue', href: '/catalog' },
  { icon: '⚙️', label: 'Paramètres', href: '/settings' },
]

export default function HomeClient({ user }: HomeClientProps) {
  const { signOut } = useAuth()
  const name =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    ''
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Topbar */}
      <header
        className="flex items-center justify-between px-4 h-14 sticky top-0 z-10"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-lg font-bold tracking-widest" style={{ color: 'var(--gold)' }}>
          MIXTURA
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:block" style={{ color: 'var(--text-dim)' }}>
            {name}
          </span>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm select-none"
            style={{ background: 'var(--gold)', color: '#0A0E1A' }}
          >
            {initial}
          </div>
          <button
            onClick={signOut}
            className="text-xs px-3 py-1 rounded-[var(--radius-sm)]"
            style={{
              background: 'var(--surface2)',
              color: 'var(--text-dim)',
              border: '1px solid var(--border)',
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main grid */}
      <main className="flex-1 p-4">
        <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
          Bonjour <strong style={{ color: 'var(--text)' }}>{name}</strong> 👋
        </p>
        <div className="grid grid-cols-2 gap-3">
          {TILES.map(tile => (
            <a
              key={tile.href}
              href={tile.href}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-[var(--radius)] transition-opacity hover:opacity-80 active:scale-95"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <span className="text-3xl">{tile.icon}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {tile.label}
              </span>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
