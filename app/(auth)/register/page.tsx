'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">Compte créé !</h2>
          <p className="text-[var(--text-dim)] text-sm mb-6">
            Vérifiez votre email pour confirmer votre compte.
          </p>
          <Link href="/login" className="btn-primary w-full py-3">
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-[var(--text)]">Créer un compte</h1>
          <p className="text-[var(--text-dim)] text-sm mt-1">Gratuit, sans carte bancaire</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-dim)] mb-1.5">Prénom / Pseudo</label>
            <input
              type="text"
              className="field-input"
              placeholder="Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
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
              placeholder="8 caractères minimum"
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
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-dim)]">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-[var(--gold)] hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
