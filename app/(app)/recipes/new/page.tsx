import { TopBar } from '@/components/layout/TopBar';

export default function NewRecipePage() {
  return (
    <>
      <TopBar title="Nouvelle recette" backHref="/recipes" />
      <main className="px-4 py-5">
        <p className="text-[var(--text-dim)] text-sm text-center mt-10">
          Formulaire de création de recette bientôt disponible.
        </p>
      </main>
    </>
  );
}
