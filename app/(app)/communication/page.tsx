import { TopBar } from '@/components/layout/TopBar';

export default function CommunicationPage() {
  return (
    <>
      <TopBar title="Équipe" />
      <main className="px-4 py-5">
        <p className="text-[var(--text-dim)] text-sm text-center mt-10">
          Communication d&apos;équipe bientôt disponible.
        </p>
      </main>
    </>
  );
}
