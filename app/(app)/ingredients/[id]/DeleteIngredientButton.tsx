'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function DeleteIngredientButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Supprimer cet ingrédient définitivement ?')) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from('ingredients').delete().eq('id', id);
    router.push('/ingredients');
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 rounded-lg text-[var(--text-dim)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
      title="Supprimer"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  );
}
