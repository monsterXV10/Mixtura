import { TopBar } from '@/components/layout/TopBar';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function RecipesPage() {
  return (
    <>
      <TopBar
        title="Recettes"
        actions={
          <Link href="/recipes/new" className="btn-primary px-3 py-1.5 text-sm gap-1">
            <Plus size={15} />
            Ajouter
          </Link>
        }
      />
      <main className="px-4 py-5">
        <p className="text-[var(--text-dim)] text-sm text-center mt-10">
          Aucune recette pour l&apos;instant.
        </p>
      </main>
    </>
  );
}
