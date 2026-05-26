'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email ou mot de passe incorrect.');
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--gold)] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#0A0E1A] font-bold text-xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Connexion</h1>
          <p className="text-[var(--text-dim)] text-sm mt-1">Bon retour sur Mixtura</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-dim)] mb-1.5">Email</label>
            <input
              type="email"
              className="field-input"
              placeholder="vous@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-dim)] mb-1.5">Mot de passe</label>
            <input
              type="password"
              className="field-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-[var(--text-dim)]">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-[var(--gold)] hover:underline">
              S&apos;inscrire
            </Link>
          </p>
          <Link href="/demo" className="block text-sm text-[var(--text-dim)] hover:text-[var(--gold)]">
            Essayer la démo →
          </Link>
        </div>
      </div>
    </div>
  );
}
