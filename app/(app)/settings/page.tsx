import { TopBar } from '@/components/layout/TopBar';
import { Users, User } from 'lucide-react';
import Link from 'next/link';

const SETTINGS_ITEMS = [
  { href: '/settings/team', icon: Users, label: 'Équipe & permissions', desc: 'Membres, rôles, QR code' },
  { href: '/settings/account', icon: User, label: 'Mon compte', desc: 'Profil, mot de passe' },
];

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Paramètres" />
      <main className="px-4 py-5 space-y-3">
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
      </main>
    </>
  );
}
