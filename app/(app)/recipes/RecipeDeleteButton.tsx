'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Trash2, Loader2 } from 'lucide-react';

export function RecipeDeleteButton({ recipeId, userId }: { recipeId: string; userId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    setError('');
    const supabase = createClient();
    const { error: delError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', userId);

    if (delError) {
      setError('Suppression impossible. Réessayez.');
      setDeleting(false);
      return;
    }

    router.push('/recipes');
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setConfirm(false)}
            className="btn-ghost flex-1 py-2.5 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 text-sm rounded-lg bg-red-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          >
            {deleting ? (
              <><Loader2 size={14} className="animate-spin" />Suppression…</>
            ) : (
              'Confirmer'
            )}
          </button>
        </div>
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-2"
      style={{ color: 'var(--text-dim)', borderColor: 'rgba(239,68,68,0.2)' }}
    >
      <Trash2 size={15} className="text-red-400" />
      <span className="text-red-400">Supprimer cette recette</span>
    </button>
  );
}
