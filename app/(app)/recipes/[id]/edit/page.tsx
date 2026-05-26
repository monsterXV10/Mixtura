import { TopBar } from '@/components/layout/TopBar';

export default function EditRecipePage() {
  return (
    <>
      <TopBar title="Modifier la recette" backHref="/recipes" />
      <main className="px-4 py-5">
        <p className="text-[var(--text-dim)] text-sm text-center mt-10">
          Formulaire d&apos;édition de recette bientôt disponible.
        </p>
      </main>
    </>
  );
}
