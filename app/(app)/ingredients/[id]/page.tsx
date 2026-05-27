import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { Edit2, FlaskConical, Package, ArrowLeft } from 'lucide-react';
import TimerWidget from '../TimerWidget';
import { ShareToTeamButton } from '@/components/shared/ShareToTeamButton';

const CATEGORY_LABELS: Record<string, string> = {
  spirit: 'Spiritueux', liqueur: 'Liqueur', wine: 'Vin',
  syrup: 'Sirop', juice: 'Jus', fresh: 'Frais',
  dry: 'Sec', homemade: 'Fait maison', other: 'Autre',
};

const CATEGORY_COLORS: Record<string, string> = {
  spirit: 'text-amber-400 bg-amber-400/10',
  liqueur: 'text-purple-400 bg-purple-400/10',
  wine: 'text-rose-400 bg-rose-400/10',
  syrup: 'text-pink-400 bg-pink-400/10',
  juice: 'text-orange-400 bg-orange-400/10',
  fresh: 'text-emerald-400 bg-emerald-400/10',
  dry: 'text-yellow-400 bg-yellow-400/10',
  homemade: 'text-blue-400 bg-blue-400/10',
  other: 'text-[var(--text-dim)] bg-[var(--surface2)]',
};

export default async function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ingredient } = await supabase
    .from('ingredients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!ingredient) notFound();

  const d = ingredient.data as {
    name?: string;
    type?: string;
    unit?: string;
    price?: number;
    stock?: number;
    format?: number;
    homemade?: boolean;
    brand?: string;
    family?: string;
    supplier?: string;
    composition?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
    yield?: number;
    yieldUnit?: string;
    steps?: string;
    isPreparation?: boolean;
    isOutput?: boolean;
    sourcePreparationId?: string;
    outputs?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
  };

  // Si c'est une sortie, récupérer la prépa source pour afficher le lien
  let sourcePrepName: string | null = null;
  if (d.isOutput && d.sourcePreparationId) {
    const { data: sourcePrep } = await supabase
      .from('ingredients')
      .select('id, data')
      .eq('id', d.sourcePreparationId)
      .eq('user_id', user.id)
      .single();
    if (sourcePrep) {
      sourcePrepName = ((sourcePrep.data as { name?: string })?.name) ?? null;
    }
  }

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

  const catKey = d.type ?? 'other';
  const catLabel = CATEGORY_LABELS[catKey] ?? CATEGORY_LABELS['other'];
  const catColor = CATEGORY_COLORS[catKey] ?? CATEGORY_COLORS['other'];

  const stockPct = d.format && d.format > 0 ? Math.min(100, ((d.stock ?? 0) / d.format) * 100) : null;
  const stockOk = (d.stock ?? 0) > 0;
  const stockLow = stockPct !== null && stockPct < 20 && stockOk;

  return (
    <>
      <TopBar
        title={d.name ?? 'Ingrédient'}
        backHref="/ingredients"
        actions={
          <div className="flex items-center gap-2">
            <ShareToTeamButton
              userId={user.id}
              sharerName={sharerName}
              teams={myTeams}
              itemType="ingredient"
              itemName={d.name ?? 'Ingrédient'}
              payload={{ ingredientData: ingredient.data }}
            />
            <Link href={`/ingredients/${id}/edit`} className="btn-ghost px-3 py-1.5 text-sm gap-1">
              <Edit2 size={14} />
              Modifier
            </Link>
          </div>
        }
      />

      <main className="px-4 py-5 pb-safe space-y-4 max-w-xl mx-auto">
        {/* Header card */}
        <div className="card space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {d.homemade ? (
                <FlaskConical size={20} className="text-blue-400 shrink-0" />
              ) : (
                <Package size={20} className="text-[var(--gold)] shrink-0" />
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-[var(--text)] truncate">{d.name}</h1>
                {(d.brand || d.family) && (
                  <p className="text-xs text-[var(--text-dim)] truncate">
                    {[d.brand, d.family].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>
              {catLabel}
            </span>
          </div>

          {!d.homemade && (
            <div className="grid grid-cols-2 gap-3">
              {d.supplier && (
                <div className="col-span-2">
                  <p className="text-xs text-[var(--text-dim)]">Fournisseur</p>
                  <p className="text-sm font-semibold text-[var(--text)]">{d.supplier}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-[var(--text-dim)]">Prix achat</p>
                <p className="text-sm font-semibold text-[var(--text)]">
                  {d.price ? `${d.price.toFixed(2)} €` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-dim)]">Format</p>
                <p className="text-sm font-semibold text-[var(--text)]">
                  {d.format ? `${d.format} ${d.unit}` : '—'}
                </p>
              </div>
              {d.price && d.format && d.format > 0 && (
                <div>
                  <p className="text-xs text-[var(--text-dim)]">Coût / {d.unit}</p>
                  <p className="text-sm font-semibold text-[var(--gold)]">
                    {(d.price / d.format).toFixed(3)} €
                  </p>
                </div>
              )}
            </div>
          )}

          {d.homemade && d.yield && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--text-dim)]">Rendement</p>
                <p className="text-sm font-semibold text-[var(--text)]">
                  {d.yield} {d.yieldUnit}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-dim)]">Unité d'utilisation</p>
                <p className="text-sm font-semibold text-[var(--text)]">{d.unit}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stock */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Stock</h2>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              !stockOk ? 'bg-red-400' : stockLow ? 'bg-orange-400' : 'bg-emerald-400'
            }`} />
            <span className="text-sm text-[var(--text)]">
              {(d.stock ?? 0)} {d.unit ?? ''}
              {!stockOk && <span className="text-red-400 ml-2 text-xs">Épuisé</span>}
              {stockLow && <span className="text-orange-400 ml-2 text-xs">Stock bas</span>}
            </span>
          </div>
          {stockPct !== null && (
            <div className="h-1.5 bg-[var(--surface2)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  !stockOk ? 'bg-red-400' : stockLow ? 'bg-orange-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${stockPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Lien vers la prépa source (si c'est une sortie) */}
        {d.isOutput && d.sourcePreparationId && (
          <div className="card space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">Préparation source</h2>
            <Link
              href={`/ingredients/${d.sourcePreparationId}`}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft size={14} />
              <FlaskConical size={14} />
              {sourcePrepName ?? 'Voir la préparation'}
            </Link>
          </div>
        )}

        {/* Sorties (multi-output prep) */}
        {d.isPreparation && d.outputs && d.outputs.length > 0 && (
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <FlaskConical size={15} className="text-blue-400" />
              Sorties de la préparation
            </h2>
            <ul className="space-y-2">
              {d.outputs.map((out, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[var(--text)]">
                    {out.ingredientId ? (
                      <Link
                        href={`/ingredients/${out.ingredientId}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {out.name}
                      </Link>
                    ) : (
                      out.name
                    )}
                  </span>
                  <span className="text-[var(--gold)] font-mono">
                    {out.qty} {out.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Composition (homemade only) */}
        {d.homemade && d.composition && d.composition.length > 0 && (
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <FlaskConical size={15} className="text-blue-400" />
              Composition
            </h2>
            <ul className="space-y-2">
              {d.composition.map((comp, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text)]">{comp.name}</span>
                  <span className="text-[var(--gold)] font-mono">
                    {comp.qty} {comp.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        {d.homemade && d.steps && (
          <div className="card space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">Instructions</h2>
            <p className="text-sm text-[var(--text-dim)] whitespace-pre-line leading-relaxed">{d.steps}</p>
          </div>
        )}

        {/* Timer — always shown for homemade preparations */}
        {d.homemade && <TimerWidget />}
      </main>
    </>
  );
}
