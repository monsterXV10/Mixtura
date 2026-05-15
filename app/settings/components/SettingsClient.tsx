'use client'

import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TopBar from '@/app/components/TopBar'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  user: User
  profile: { display_name: string | null; plan: string } | null
}

export default function SettingsClient({ user, profile }: Props) {
  const { signOut } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const name = profile?.display_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0]
  const plan = profile?.plan ?? 'free'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <TopBar title="Paramètres" backHref="/" />

      <div className="p-4 space-y-4 pb-8 max-w-lg mx-auto">
        {/* Profil */}
        <section
          className="rounded-[var(--radius)] overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          <div className="px-4 py-3" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Compte</p>
          </div>
          <div className="divide-y" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
            <Row label="Nom" value={name ?? '—'} />
            <Row label="Email" value={user.email ?? '—'} />
            <Row label="Plan">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: plan === 'free' ? 'var(--surface)' : 'var(--gold)', color: plan === 'free' ? 'var(--text-dim)' : '#0A0E1A', border: '1px solid var(--border)' }}
              >
                {plan.toUpperCase()}
              </span>
            </Row>
          </div>
        </section>

        {/* Navigation */}
        <section
          className="rounded-[var(--radius)] overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          <div className="px-4 py-3" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Accès rapide</p>
          </div>
          <div style={{ background: 'var(--surface2)' }}>
            {[
              { href: '/recipes', label: '🍸 Mes recettes' },
              { href: '/ingredients', label: '🧪 Mes ingrédients' },
              { href: '/batch', label: '📦 Batch Calculator' },
              { href: '/book', label: '📖 Livre de recettes' },
              { href: '/catalog', label: '🗂 Catalogue IBA' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-4 py-3 text-sm"
                style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}
              >
                {label}
                <span style={{ color: 'var(--text-dim)' }}>›</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Déconnexion */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-[var(--radius)] text-sm font-semibold"
          style={{ background: '#2B0F0F', color: '#FF6B6B', border: '1px solid #5C1A1A' }}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{label}</span>
      {children ?? <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{value}</span>}
    </div>
  )
}
