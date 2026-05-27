import { TopBar } from '@/components/layout/TopBar';

export default function TeamSettingsPage() {
  return (
    <>
      <TopBar title="Équipe" backHref="/settings" />
      <main className="px-4 py-5">
        <p className="text-[var(--text-dim)] text-sm text-center mt-10">
          Gestion d&apos;équipe bientôt disponible.
        </p>
      </main>
    </>
  );
}
