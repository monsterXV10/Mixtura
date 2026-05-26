import { TopBar } from '@/components/layout/TopBar';
import { Plus } from 'lucide-react';

export default function IngredientsPage() {
  return (
    <>
      <TopBar
        title="Stocks"
        actions={
          <button className="btn-primary px-3 py-1.5 text-sm gap-1">
            <Plus size={15} />
            Ajouter
          </button>
        }
      />
      <main className="px-4 py-5">
        <p className="text-[var(--text-dim)] text-sm text-center mt-10">
          Aucun ingrédient pour l&apos;instant.
        </p>
      </main>
    </>
  );
}
