import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm font-medium" style={{ color: 'var(--gold)' }}>
            ← Retour à Mixtura
          </Link>
        </div>
        {children}
        <footer className="mt-16 pt-8 border-t text-xs space-y-1" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
          <div className="flex gap-4 flex-wrap">
            <Link href="/legal/mentions" className="hover:underline">Mentions légales</Link>
            <Link href="/legal/cgu" className="hover:underline">CGU</Link>
            <Link href="/legal/confidentialite" className="hover:underline">Confidentialité</Link>
          </div>
          <p>© {new Date().getFullYear()} Mixtura. Tous droits réservés.</p>
        </footer>
      </div>
    </div>
  );
}
