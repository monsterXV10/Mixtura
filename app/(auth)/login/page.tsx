'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Loader2 } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError('Email ou mot de passe incorrect.'); }
    else { router.push('/dashboard'); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{ background: 'var(--bg)' }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 opacity-20"
        style={{ background: 'radial-gradient(ellipse at center, var(--gold) 0%, transparent 70%)' }}
        aria-hidden
      />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <img
            src="/icons/icon.svg"
            alt="Mixtura"
            className="w-14 h-14 rounded-2xl mx-auto mb-5"
            style={{ boxShadow: '0 4px 20px rgba(200,169,110,0.35)' }}
          />
          <h1 className="text-2xl font-bold text-[var(--text)]" style={{ letterSpacing: '-0.03em' }}>
            Mixtura
          </h1>
          <p className="text-[var(--text-dim)] text-sm mt-1.5">Connectez-vous à votre espace bar</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="btn-ghost w-full py-3 text-sm font-medium"
          >
            {googleLoading ? <Loader2 size={15} className="animate-spin" /> : <GoogleIcon />}
            {googleLoading ? 'Redirection…' : 'Continuer avec Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-[11px] text-[var(--text-dim)] font-medium">ou</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                className="field-input"
                placeholder="vous@exemple.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
                Mot de passe
              </label>
              <input
                type="password"
                className="field-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/15 rounded-xl px-3 py-2.5">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="mt-5 text-center space-y-2">
          <p className="text-sm text-[var(--text-dim)]">
            Pas encore de compte ?{' '}
            <Link href="/register" className="font-medium" style={{ color: 'var(--gold)' }}>
              S&apos;inscrire
            </Link>
          </p>
          <Link href="/demo" className="block text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            Essayer sans compte →
          </Link>
          {process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_TEST_LOGIN === 'true' && (
            <a
              href="/api/test-login"
              className="block text-xs text-orange-400 border border-orange-400/20 rounded-xl py-2 hover:bg-orange-400/5 transition-colors mt-2"
            >
              Connexion test (dev)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
