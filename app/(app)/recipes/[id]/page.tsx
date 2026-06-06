import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { Pencil, FlaskConical, BookOpen } from 'lucide-react';
import { GlassIcon } from '@/components/ui/GlassIcon';
import { RecipeDeleteButton } from '../RecipeDeleteButton';
import { RecipeTimer } from '../RecipeTimer';
import { ShareToTeamButton } from '@/components/shared/ShareToTeamButton';

const METHOD_TIMER_DEFAULTS: Record<string, number> = {
  'Shake': 10,
  'Shake + Double Strain': 12,
  'Stir': 30,
  'Throw': 20,
  'Blend': 30,
};

const METHOD_DEFAULT_STEPS: Record<string, string[]> = {
  'Shake': [
    'Verser les ingrédients dans un shaker avec de la glace.',
    'Shaker énergiquement pendant 10 secondes.',
    'Filtrer dans un verre rafraîchi.',
  ],
  'Shake + Double Strain': [
    'Verser les ingrédients dans un shaker avec de la glace.',
    'Shaker énergiquement pendant 12 secondes.',
    'Filtrer en double passoire dans un verre rafraîchi.',
  ],
  'Stir': [
    'Verser les ingrédients dans un verre à mélange avec de la glace.',
    'Mélanger délicatement à la cuillère pendant 30 secondes.',
    'Filtrer dans un verre rafraîchi.',
  ],
  'Build': [
    'Verser les ingrédients directement dans le verre sur glace.',
    'Mélanger légèrement.',
  ],
  'Blend': [
    'Mettre tous les ingrédients et la glace dans un blender.',
    'Mixer jusqu\'à consistance lisse.',
    'Verser dans le verre.',
  ],
  'Throw': [
    'Verser les ingrédients dans un shaker avec de la glace.',
    'Passer de récipient en récipient en hauteur (throw) plusieurs fois pour aérer.',
    'Verser dans le verre rafraîchi.',
  ],
  'Muddle': [
    'Écraser les ingrédients frais dans le fond du verre.',
    'Ajouter les liquides et la glace.',
    'Mélanger légèrement.',
  ],
  'Direct': [
    'Verser les ingrédients directement dans le verre.',
  ],
};

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
    timerSeconds?: number;
    ingredients?: Array<{
      ingredientId?: string;
      recipeRef?: string;
      qty: number;
      name: string;
      unit: string;
      type?: string;
      alternatives?: Array<{ ingredientId?: string; name: string }>;
    }>;
  } | null;

  const recipeMetadata = recipe.metadata as {
    glass?: string;
    method?: string | string[];
    garnish?: string;
    clarifyingAgent?: string;
    clarifyingAgentId?: string;
    clarifyingPct?: number;
  } | null;

  const name = recipeData?.name ?? 'Sans titre';
  const ingredients = recipeData?.ingredients ?? [];
  const steps = recipeData?.steps ?? '';
  const glass = recipeMetadata?.glass ?? '';
  const rawMethod = recipeMetadata?.method;
  const method = Array.isArray(rawMethod) ? rawMethod[0] ?? '' : rawMethod ?? '';
  const garnish = recipeMetadata?.garnish ?? '';
  const recipeType = recipe.type as string;

  // Timer: manual value wins, otherwise auto-detect from method
  const timerSeconds =
    (recipeData?.timerSeconds ?? 0) > 0
      ? (recipeData!.timerSeconds as number)
      : (METHOD_TIMER_DEFAULTS[method] ?? 0);

  // Fetch stock info to color-code ingredients
  const linkedIds = ingredients
    .flatMap((i) => [
      i.ingredientId,
      ...(i.alternatives ?? []).map((a) => a.ingredientId),
    ])
    .filter((id): id is string => Boolean(id));

  const recipeRefIds = ingredients
    .filter((i) => i.type === 'recipe' && i.recipeRef)
    .map((i) => i.recipeRef as string);

  const stockMap = new Map<string, { homemade?: boolean }>();
  const recipeRefNames = new Map<string, string>(); // recipeId → name
  const ingredientSharePayloads: Array<{ name: string; ingredientData: Record<string, unknown> }> = [];

  await Promise.all([
    linkedIds.length > 0
      ? supabase.from('ingredients').select('id, data').eq('user_id', user.id).in('id', linkedIds).then(({ data: stockRows }) => {
          for (const row of stockRows ?? []) {
            const d = row.data as Record<string, unknown> | null;
            stockMap.set(row.id as string, { homemade: (d?.homemade as boolean | undefined) });
            if (d) ingredientSharePayloads.push({ name: (d.name as string | undefined) ?? '', ingredientData: d });
          }
        })
      : Promise.resolve(),
    recipeRefIds.length > 0
      ? supabase.from('recipes').select('id, data').eq('user_id', user.id).in('id', recipeRefIds).then(({ data: refRows }) => {
          for (const row of refRows ?? []) {
            const n = ((row.data as { name?: string })?.name) ?? 'Recette';
            recipeRefNames.set(row.id as string, n);
          }
        })
      : Promise.resolve(),
  ]);

  const TYPE_LABELS: Record<string, string> = {
    cocktail: 'Cocktail',
    coffee: 'Café',
    cuisine: 'Cuisine',
    service: 'Service',
    milk_punch: 'Milk Punch',
  };

  const TYPE_COLORS: Record<string, string> = {
    cocktail: 'text-blue-400 bg-blue-400/10',
    coffee: 'text-amber-400 bg-amber-400/10',
    cuisine: 'text-emerald-400 bg-emerald-400/10',
    service: 'text-sky-400 bg-sky-400/10',
    milk_punch: 'text-purple-400 bg-purple-400/10',
  };

  // Teams the user belongs to (for sharing) + display name
  const [{ data: memberships }, { data: myProfile }] = await Promise.all([
    supabase.from('team_members').select('team_id').eq('user_id', user.id),
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
  ]);
  const myTeamIds = (memberships ?? []).map((m) => m.team_id as string);
  let myTeams: Array<{ id: string; name: string }> = [];
  if (myTeamIds.length > 0) {
    const { data: teamRows } = await supabase.from('teams').select('id, name').in('id', myTeamIds);
    myTeams = (teamRows ?? []) as Array<{ id: string; name: string }>;
  }
  const sharerName = myProfile?.display_name ?? user.email?.split('@')[0] ?? 'Moi';

  // Split steps into numbered lines; fall back to method-based default
  const manualStepLines = steps
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^\d+[.)]\s*/, ''));

  const stepLines = manualStepLines.length > 0
    ? manualStepLines
    : (METHOD_DEFAULT_STEPS[method] ?? []);

  const stepsAreDefault = manualStepLines.length === 0 && stepLines.length > 0;

  return (
    <>
      <TopBar
        title={name}
        backHref="/recipes"
        actions={
          <div className="flex items-center gap-2">
            <ShareToTeamButton
              userId={user.id}
              sharerName={sharerName}
              teams={myTeams}
              itemType="recipe"
              itemName={name}
              payload={{ type: recipeType, recipeData: recipe.data, metadata: recipe.metadata ?? {} }}
              ingredientsToShare={ingredientSharePayloads}
            />
            <Link
              href={`/recipes/${id}/edit`}
              className="btn-ghost px-3 py-1.5 text-sm flex items-center gap-1.5"
            >
              <Pencil size={14} />
              Modifier
            </Link>
          </div>
        }
      />
      <main className="px-4 py-5 pb-safe space-y-5">
        {/* Header badges */}
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
              <GlassIcon glass={glass} size={11} />
              {glass}
            </span>
          )}
          {method && (
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--surface2)] text-[var(--text-dim)]">
              {method}
            </span>
          )}
          {garnish && (
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--surface2)] text-[var(--text-dim)] italic">
              {garnish}
            </span>
          )}
        </div>

        {/* Ingredients */}
        <div className="card space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[var(--text)] text-sm">
              Ingrédients ({ingredients.length})
            </h2>
            <div className="flex items-center gap-3 text-xs text-[var(--text-dim)]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Stock
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                Maison
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                Recette
              </span>
            </div>
          </div>

          {ingredients.length === 0 ? (
            <p className="text-[var(--text-dim)] text-sm">Aucun ingrédient.</p>
          ) : (
            <ul className="space-y-0">
              {ingredients.map(
                (ing, i) => {
                  // Recipe-as-ingredient
                  if (ing.type === 'recipe' && ing.recipeRef) {
                    return (
                      <li key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-purple-400" />
                        <span className="flex-1 text-[var(--text)] text-sm flex items-center gap-1.5 min-w-0">
                          <Link href={`/recipes/${ing.recipeRef}`} className="hover:text-purple-400 transition-colors truncate">
                            {recipeRefNames.get(ing.recipeRef) ?? ing.name}
                          </Link>
                          <BookOpen size={11} className="text-purple-400 shrink-0" />
                        </span>
                        <span className="text-[var(--gold)] text-sm font-medium tabular-nums shrink-0">
                          {ing.qty} {ing.unit}
                        </span>
                      </li>
                    );
                  }

                  const primaryInfo = ing.ingredientId ? stockMap.get(ing.ingredientId) : undefined;
                  const linkedAltId = !primaryInfo
                    ? ing.alternatives?.find((a) => a.ingredientId && stockMap.has(a.ingredientId))?.ingredientId
                    : undefined;
                  const info = primaryInfo ?? (linkedAltId ? stockMap.get(linkedAltId) : undefined);
                  const hasLink = ing.ingredientId ?? linkedAltId;
                  const dotColor = hasLink
                    ? info
                      ? info.homemade ? 'bg-blue-400' : 'bg-emerald-400'
                      : 'bg-orange-400'
                    : 'bg-[var(--border)]';
                  const isHomemade = info?.homemade;

                  return (
                    <li
                      key={i}
                      className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                      <span className="flex-1 text-[var(--text)] text-sm">
                        {ing.name}
                        {(ing.alternatives ?? []).filter(a => a.name).map((alt, ai) => (
                          <span key={ai} className="text-[var(--text-dim)] text-xs"> ou {alt.name}</span>
                        ))}
                        {isHomemade && (
                          <FlaskConical size={11} className="text-blue-400 shrink-0 inline ml-1" />
                        )}
                      </span>
                      <span className="text-[var(--gold)] text-sm font-medium tabular-nums">
                        {ing.qty} {ing.unit}
                      </span>
                    </li>
                  );
                }
              )}
            </ul>
          )}
        </div>

        {/* Milk Punch — casse */}
        {recipeType === 'milk_punch' && recipeMetadata?.clarifyingAgent && (
          <div className="card space-y-3">
            <h2 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Casse (clarification)
            </h2>
            {(() => {
              const totalMl = ingredients.reduce((s, i) => {
                if (i.unit === 'ml') return s + i.qty;
                if (i.unit === 'cl') return s + i.qty * 10;
                if (i.unit === 'L') return s + i.qty * 1000;
                return s;
              }, 0);
              const pct = recipeMetadata.clarifyingPct ?? 15;
              const qty = totalMl > 0 ? Math.round(totalMl * pct / 100 * 10) / 10 : null;
              return (
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-[var(--text)]">{recipeMetadata.clarifyingAgent}</span>
                  <div className="text-right">
                    {qty !== null && (
                      <span className="text-purple-400 font-semibold font-mono text-sm">{qty} ml</span>
                    )}
                    <span className="text-xs text-[var(--text-dim)] ml-2">({pct}% · {totalMl} ml total)</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Timer */}
        {timerSeconds > 0 && (
          <RecipeTimer
            seconds={timerSeconds}
            label={
              method && METHOD_TIMER_DEFAULTS[method]
                ? `Minuteur · ${method}`
                : 'Minuteur'
            }
          />
        )}

        {/* Steps */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--text)] text-sm">
              Préparation
            </h2>
            {stepsAreDefault && (
              <span className="text-xs text-[var(--text-dim)] bg-[var(--surface2)] px-2 py-0.5 rounded-full">
                par défaut · {method}
              </span>
            )}
          </div>
          {stepLines.length > 0 ? (
            <ol className="space-y-4">
              {stepLines.map((line, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] text-xs font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[var(--text-dim)] text-sm leading-relaxed">
                    {line}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[var(--text-dim)] text-sm">
              Pas d&apos;instructions. Modifie la recette pour en ajouter.
            </p>
          )}
        </div>

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
