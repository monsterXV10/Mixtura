import { TopBar } from '@/components/layout/TopBar';

export default function BatchPage() {
  return (
    <>
      <TopBar title="Batch Tool" backHref="/tools" />
      <main className="px-4 py-5">
        <p className="text-[var(--text-dim)] text-sm text-center mt-10">
          Sélectionnez une recette pour démarrer un batch.
        </p>
      </main>
    </>
  );
}
