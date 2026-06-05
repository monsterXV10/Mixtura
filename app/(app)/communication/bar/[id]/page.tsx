import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { Edit2, FlaskConical, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<string, string> = {
  spirit: 'Spiritueux', liqueur: 'Liqueur', wine: 'Vin',
  syrup: 'Sirop', juice: 'Jus', fresh: 'Frais',
  dry: 'Sec', water: 'Eau', homemade: 'Fait maison', other: 'Autre',
};

const CATEGORY_COLORS: Record<string, string> = {
  spirit: 'text-amber-400 bg-amber-400/10',
  liqueur: 'text-purple-400 bg-purple-400/10',
  wine: 'text-rose-400 bg-rose-400/10',
  syrup: 'text-pink-400 bg-pink-400/10',
  juice: 'text-orange-400 bg-orange-400/10',
  fresh: 'text-emerald-400 bg-emerald-400/10',
  dry: 'text-yellow-400 bg-yellow-400/10',
  water: 'text-blue-300 bg-blue-300/10',
  homemade: 'text-blue-400 bg-blue-400/10',
  other: 'text-[var(--text-dim)] bg-[var(--surface2)]',
};

const PREP_TYPE_LABELS: Record<string, string> = {
  sirop: 'Sirop', infusion: 'Infusion', clarification: 'Clarification',
  'fat-wash': 'Fat Wash', batch: 'Batch', teinture: 'Teinture',
  cordial: 'Cordial', puree: 'Purée',
};

export default async function TeamIngredientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ team?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: memberships } = await supabase
    .from('team_members').select('team_id').eq('user_id', user.id);
  const teamIds = (memberships ?? []).map((m) => m.team_id as string);
  if (teamIds.length === 0) redirect('/communication');

  const { data: ingredient } = await supabase
    .from('team_ingredients')
    .select('*')
    .eq('id', id)
    .single();

  if (!ingredient || !teamIds.includes(ingredient.team_id as string)) notFound();

  const teamId = sp.team ?? (ingredient.team_id as string);

  const [{ data: memberRow }, { data: team }] = await Promise.all([
    supabase.from('team_members').select('role').eq('team_id', ingredient.team_id).eq('user_id', user.id).maybeSingle(),
    supabase.from('teams').select('id, name, owner_id').eq('id', ingredient.team_id).single(),
  ]);

  const t = team as { id: string; name: string; owner_id: string } | null;
  const isManager = t?.owner_id === user.id || memberRow?.role === 'admin' || memberRow?.role === 'manager';
  const canEdit = isManager || ingredient.created_by === user.id;

  const d = ingredient.data as {
    name?: string; type?: string; unit?: string; price?: number;
    stock?: number; format?: number; homemade?: boolean;
    brand?: string; family?: string; supplier?: string;
    composition?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
    yield?: number; yieldUnit?: string; steps?: string; preparationType?: string;
  };

  const isHomemade = d.homemade === true;
  const catKey = isHomemade ? 'homemade' : (d.type?.toLowerCase() ?? 'other');
  const catLabel = isHomemade
    ? (d.preparationType ? (PREP_TYPE_LABELS[d.preparationType] ?? 'Maison') : 'Fait maison')
    : (CATEGORY_LABELS[catKey] ?? CATEGORY_LABELS['other']);
  const catColor = CATEGORY_COLORS[catKey] ?? CATEGORY_COLORS['other'];

  const stock = d.stock ?? 0;
  const stockPct = !isHomemade && d.format && d.format > 0 ? Math.min(100, (stock / d.format) * 100) : null;
  const stockOk = stock > 0;
  const stockLow = stockPct !== null && stockPct < 20 && stockOk;

  return (
    <>
      <TopBar
        title={d.name ?? 'Ingrédient'}
        backHref={`/communication/bar?team=${teamId}`}
        actions={
          canEdit ? (
            <Link href={`/communication/bar/${id}/edit?team=${teamId}`} className="btn-ghost px-3 py-1.5 text-sm gap-1">
              <Edit2 size={14} /> Modifier
            </Link>
          ) : undefined
        }
      />

      <main className="px-4 py-5 pb-safe space-y-4 max-w-xl mx-auto">
        {/* Header card */}
        <div className="card space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isHomemade ? (
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

          {!isHomemade && (
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

          {isHomemade && d.yield && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--text-dim)]">Rendement</p>
                <p className="text-sm font-semibold text-[var(--text)]">
                  {d.yield} {d.yieldUnit}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-dim)]">Unité d&apos;utilisation</p>
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
              {stock} {isHomemade ? (d.yieldUnit ?? d.unit ?? '') : (d.unit ?? '')}
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

        {/* Composition (homemade only) */}
        {isHomemade && d.composition && d.composition.length > 0 && (
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
        {isHomemade && d.steps && (
          <div className="card space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">Instructions</h2>
            <p className="text-sm text-[var(--text-dim)] whitespace-pre-line leading-relaxed">{d.steps}</p>
          </div>
        )}
      </main>
    </>
  );
}
