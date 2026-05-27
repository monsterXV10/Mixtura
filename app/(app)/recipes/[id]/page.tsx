import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { Pencil, GlassWater, Flame } from 'lucide-react';
import { RecipeDeleteButton } from '../RecipeDeleteButton';

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!recipe) notFound();

  const recipeData = recipe.data as {
    name?: string;
    steps?: string;
    ingredients?: Array<{ qty: number; name: string; unit: string }>;
  } | null;

  const recipeMetadata = recipe.metadata as {
    glass?: string;
    method?: string | string[];
    garnish?: string;
  } | null;

  const name = recipeData?.name ?? 'Sans titre';
  const ingredients = recipeData?.ingredients ?? [];
  const steps = recipeData?.steps ?? '';
  const glass = recipeMetadata?.glass ?? '';
  const rawMethod = recipeMetadata?.method;
  const method = Array.isArray(rawMethod) ? rawMethod[0] ?? '' : rawMethod ?? '';
  const garnish = recipeMetadata?.garnish ?? '';
  const recipeType = recipe.type as string;

  const TYPE_LABELS: Record<string, string> = {
    cocktail: 'Cocktail',
    coffee: 'Café',
    cuisine: 'Cuisine',
  };

  const TYPE_COLORS: Record<string, string> = {
    cocktail: 'text-blue-400 bg-blue-400/10',
    coffee: 'text-amber-400 bg-amber-400/10',
    cuisine: 'text-emerald-400 bg-emerald-400/10',
  };

  return (
    <>
      <TopBar
        title={name}
        backHref="/recipes"
        actions={
          <Link
            href={`/recipes/${id}/edit`}
            className="btn-ghost px-3 py-1.5 text-sm flex items-center gap-1.5"
          >
            <Pencil size={14} />
            Modifier
          </Link>
        }
      />
      <main className="px-4 py-5 pb-safe space-y-5">
        {/* Header info */}
        <div className="flex flex-wrap gap-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              TYPE_COLORS[recipeType] ?? TYPE_COLORS.cocktail
            }`}
          >
            {TYPE_LABELS[recipeType] ?? 'Recette'}
          </span>
          {glass && (
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--surface2)] text-[var(--text-dim)] flex items-center gap-1">
              <GlassWater size={11} />
              {glass}
            </span>
          )}
          {method && (
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--surface2)] text-[var(--text-dim)]">
              {method}
            </span>
          )}
          {garnish && (
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--surface2)] text-[var(--text-dim)]">
              {garnish}
            </span>
          )}
        </div>

        {/* Ingredients */}
        <div className="card space-y-2">
          <h2 className="font-semibold text-[var(--text)] text-sm mb-3">
            Ingrédients ({ingredients.length})
          </h2>
          {ingredients.length === 0 ? (
            <p className="text-[var(--text-dim)] text-sm">Aucun ingrédient.</p>
          ) : (
            <ul className="space-y-2">
              {ingredients.map(
                (ing: { qty: number; name: string; unit: string }, i: number) => (
                  <li
                    key={i}
                    className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0"
                  >
                    <span className="text-[var(--text)] text-sm">{ing.name}</span>
                    <span className="text-[var(--gold)] text-sm font-medium tabular-nums">
                      {ing.qty} {ing.unit}
                    </span>
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        {/* Steps */}
        {steps && (
          <div className="card">
            <h2 className="font-semibold text-[var(--text)] text-sm mb-3 flex items-center gap-2">
              <Flame size={14} className="text-[var(--gold)]" />
              Préparation
            </h2>
            <p className="text-[var(--text-dim)] text-sm whitespace-pre-wrap leading-relaxed">
              {steps}
            </p>
          </div>
        )}

        {/* Actions */}
        <Link
          href={`/recipes/${id}/edit`}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          <Pencil size={16} />
          Modifier cette recette
        </Link>
        <RecipeDeleteButton recipeId={id} userId={user.id} />
      </main>
    </>
  );
}
