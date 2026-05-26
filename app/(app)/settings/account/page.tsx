import { TopBar } from '@/components/layout/TopBar';

export default function AccountSettingsPage() {
  return (
    <>
      <TopBar title="Mon compte" backHref="/settings" />
      <main className="px-4 py-5">
        <p className="text-[var(--text-dim)] text-sm text-center mt-10">
          Gestion du compte bientôt disponible.
        </p>
      </main>
    </>
  );
}
