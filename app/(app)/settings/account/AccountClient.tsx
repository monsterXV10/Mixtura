'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  User, Mail, Crown, Lock, LogOut, Loader2, Check, Eye, EyeOff, ChevronRight,
} from 'lucide-react';

interface Props {
  userId: string;
  email: string;
  displayName: string;
  planName: string;
  provider: string;
}

export default function AccountClient({ userId, email, displayName, planName, provider }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(displayName);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameErr, setNameErr] = useState('');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSavingName(true);
    setNameSaved(false);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', userId);
    setSavingName(false);
    if (!error) {
      setNameSaved(true);
      setNameErr('');
      setTimeout(() => setNameSaved(false), 2000);
      router.refresh();
    } else {
      setNameErr('Impossible de sauvegarder le nom.');
    }
  }

  async function changePassword() {
    setPwdMsg(null);
    if (password.length < 6) {
      setPwdMsg({ type: 'err', text: 'Le mot de passe doit faire au moins 6 caractères.' });
      return;
    }
    if (password !== confirm) {
      setPwdMsg({ type: 'err', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPwd(false);
    if (error) {
      setPwdMsg({ type: 'err', text: 'Impossible de mettre à jour le mot de passe.' });
    } else {
      setPwdMsg({ type: 'ok', text: 'Mot de passe mis à jour.' });
      setPassword('');
      setConfirm('');
    }
  }

  async function logout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Profile */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
          <User size={15} className="text-[var(--gold)]" /> Profil
        </h2>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
            Nom affiché
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              className="field-input flex-1"
            />
            <button
              onClick={saveName}
              disabled={savingName || !name.trim() || name.trim() === displayName}
              className="btn-primary px-4 text-sm flex items-center gap-1.5"
            >
              {savingName ? (
                <Loader2 size={14} className="animate-spin" />
              ) : nameSaved ? (
                <Check size={14} />
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
          {nameErr && (
            <p className="text-xs text-red-400">{nameErr}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
            Email
          </label>
          <div className="flex items-center gap-2 field-input opacity-70">
            <Mail size={15} className="text-[var(--text-dim)]" />
            <span className="text-sm text-[var(--text)]">{email}</span>
          </div>
        </div>

        <Link href="/settings/plan" className="flex items-center justify-between pt-1 hover:opacity-80 transition-opacity">
          <span className="text-xs text-[var(--text-dim)]">Plan actuel</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium text-[var(--gold)] bg-[var(--gold)]/10 flex items-center gap-1">
              <Crown size={11} /> {planName}
            </span>
            <ChevronRight size={13} className="text-[var(--text-dim)]" />
          </div>
        </Link>
      </div>

      {/* Password */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
          <Lock size={15} className="text-[var(--gold)]" /> Mot de passe
        </h2>

        {provider !== 'email' && (
          <p className="text-xs text-[var(--text-dim)] bg-[var(--surface2)] rounded-lg px-3 py-2">
            Vous êtes connecté via {provider}. Définir un mot de passe ici permet aussi de vous
            connecter par email.
          </p>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="field-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text)]"
              aria-label={showPwd ? 'Masquer' : 'Afficher'}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
            Confirmer
          </label>
          <input
            type={showPwd ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="field-input"
          />
        </div>

        {pwdMsg && (
          <p
            className={`text-sm rounded-lg px-3 py-2 ${
              pwdMsg.type === 'ok'
                ? 'text-emerald-400 bg-emerald-400/10'
                : 'text-red-400 bg-red-400/10'
            }`}
          >
            {pwdMsg.text}
          </p>
        )}

        <button
          onClick={changePassword}
          disabled={savingPwd || !password || !confirm}
          className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-2"
        >
          {savingPwd ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
          Mettre à jour le mot de passe
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        disabled={loggingOut}
        className="w-full py-3 text-sm flex items-center justify-center gap-2 text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition-colors"
      >
        {loggingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
        Se déconnecter
      </button>
    </div>
  );
}
