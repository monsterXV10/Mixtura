import { TopBar } from '@/components/layout/TopBar';
import { Users, User, Crown, FileText, Zap } from 'lucide-react';
import Link from 'next/link';

const SETTINGS_ITEMS = [
  { href: '/settings/account', icon: User, label: 'Mon compte', desc: 'Profil, mot de passe' },
  { href: '/settings/plan', icon: Crown, label: 'Plan & abonnement', desc: 'Voir les plans, upgrade' },
  { href: '/settings/team', icon: Users, label: 'Équipe & permissions', desc: 'Membres, rôles, QR code' },
];

const LEGAL_ITEMS = [
  { href: '/legal/cgu', label: 'CGU' },
  { href: '/legal/confidentialite', label: 'Confidentialité' },
  { href: '/legal/mentions', label: 'Mentions légales' },
];

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Paramètres" />
      <main className="px-4 py-5 pb-24 space-y-3">
        {SETTINGS_ITEMS.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="card flex items-center gap-4 hover:border-[var(--gold-dim)] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--surface2)] flex items-center justify-center">
              <Icon size={18} className="text-[var(--gold)]" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-[var(--text)] text-sm">{label}</p>
              <p className="text-xs text-[var(--text-dim)]">{desc}</p>
            </div>
          </Link>
        ))}

        <div className="card space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-[var(--text-dim)]" />
            <p className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Application</p>
          </div>
          <Link href="/" className="block text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors py-0.5">
            Page d&apos;accueil →
          </Link>
          <Link href="/features" className="block text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors py-0.5">
            Fonctionnalités →
          </Link>
        </div>

        <div className="card space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-[var(--text-dim)]" />
            <p className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">Légal</p>
          </div>
          {LEGAL_ITEMS.map(({ href, label }) => (
            <Link key={href} href={href} className="block text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors py-0.5">
              {label} →
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
