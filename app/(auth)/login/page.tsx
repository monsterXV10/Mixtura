'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  async function handleGoogleSignIn() {
    setError(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
  }

  async function handleDemo() {
    setDemoLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      setError("Mode démo non disponible — créez un compte gratuit.")
      setDemoLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Vérifiez votre email pour confirmer votre inscription.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-sm rounded-[var(--radius)] overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {/* Bouton démo — mis en avant */}
        <div className="p-6 pb-4" style={{ background: 'var(--surface)' }}>
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold tracking-widest" style={{ color: 'var(--gold)' }}>
              MIXTURA
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
              Outil professionnel pour mixologues
            </p>
          </div>

          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="w-full py-4 rounded-[var(--radius-sm)] font-bold text-base transition-opacity hover:opacity-90 disabled:opacity-60 flex flex-col items-center gap-1"
            style={{ background: 'var(--gold)', color: '#0A0E1A' }}
          >
            <span>{demoLoading ? 'Chargement…' : '▶ Essayer sans compte'}</span>
            <span className="text-xs font-normal opacity-70">Toutes les fonctionnalités — aucune inscription</span>
          </button>

          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
            Vos données sont conservées le temps de la session.
          </p>
        </div>

        <div
          className="flex items-center gap-3 px-6"
          style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', paddingTop: '12px', paddingBottom: '12px' }}
        >
          <hr className="flex-1" style={{ borderColor: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>ou se connecter</span>
          <hr className="flex-1" style={{ borderColor: 'var(--border)' }} />
        </div>

        <div className="p-6 pt-4" style={{ background: 'var(--surface)' }}>
          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-[var(--radius-sm)] mb-4 font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h13.1c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.4-10.6 7.4-17.5z" fill="#4285F4"/>
              <path d="M24 48c6.5 0 12-2.1 16-5.8l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.5 42.6 14.7 48 24 48z" fill="#34A853"/>
              <path d="M10.6 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6V13.2H2.5C.9 16.4 0 20.1 0 24s.9 7.6 2.5 10.8l8.1-6.2z" fill="#FBBC05"/>
              <path d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.4 30.4 0 24 0 14.7 0 6.5 5.4 2.5 13.2l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>

          {/* Email / Password */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] outline-none text-sm"
              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] outline-none text-sm"
              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />

            {error && <p className="text-xs text-red-400 px-1">{error}</p>}
            {message && <p className="text-xs text-green-400 px-1">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[var(--radius-sm)] font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              {loading ? '...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>

          <p className="text-center text-xs mt-4" style={{ color: 'var(--text-dim)' }}>
            {mode === 'login' ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
              className="underline"
              style={{ color: 'var(--gold)' }}
            >
              {mode === 'login' ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <Link
              href="/catalog"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-[var(--radius-sm)] text-xs transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-dim)' }}
            >
              📖 Consulter le catalogue IBA sans compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
