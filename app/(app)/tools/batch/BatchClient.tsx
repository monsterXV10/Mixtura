'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Search, ChevronDown, Minus, Plus, FlaskConical, Package,
  CheckCircle2, Loader2, X, List, BookOpen, Timer, Play, Square,
  RotateCcw, Share2, Users, ChevronRight, Save, FolderOpen, Trash2,
} from 'lucide-react';

type BatchQtyUnit = 'portions' | 'cl' | 'L' | 'btl70' | 'btl100';

interface IngredientStock {
  id: string; name: string; type?: string; unit: string;
  price?: number; format?: number; stock?: number; homemade?: boolean;
  composition?: Array<{ ingredientId?: string; name: string; qty: number; unit: string }>;
  yield?: number; yieldUnit?: string; steps?: string;
}

interface RecipeIngredient {
  ingredientId?: string; recipeRef?: string; qty: number; name: string; unit: string;
  type?: string; homemade?: boolean;
}

interface Recipe {
  id: string; name: string; type: string; ingredients: RecipeIngredient[];
  steps?: string; timerSeconds?: number; method?: string;
}

interface BatchItem {
  key: string; recipe: Recipe; qty: number; qtyUnit: BatchQtyUnit;
}

interface ConsolidatedLine {
  key: string; name: string; unit: string; totalQty: number;
  sources: string[]; ingredientId?: string; stockInfo?: IngredientStock;
}

interface TimerEntry {
  durationSec: number;
  startedAt: string | null;
  label: string;
}

interface Props {
  recipes: Recipe[];
  stockMap: Record<string, IngredientStock>;
  userId: string;
  teams: Array<{ id: string; name: string; batchMode: string }>;
}

const CATEGORY_GROUPS: Record<string, { label: string; bar: string; text: string }> = {
  spirit:   { label: 'Alcool',   bar: 'bg-purple-400',  text: 'text-purple-400' },
  liqueur:  { label: 'Liqueur',  bar: 'bg-violet-400',  text: 'text-violet-400' },
  wine:     { label: 'Vin',      bar: 'bg-rose-400',    text: 'text-rose-400' },
  syrup:    { label: 'Sirop',    bar: 'bg-pink-400',    text: 'text-pink-400' },
  juice:    { label: 'Jus',      bar: 'bg-orange-400',  text: 'text-orange-400' },
  fresh:    { label: 'Frais',    bar: 'bg-emerald-400', text: 'text-emerald-400' },
  dry:      { label: 'Sec',      bar: 'bg-yellow-400',  text: 'text-yellow-400' },
  homemade: { label: 'Maison',   bar: 'bg-blue-400',    text: 'text-blue-400' },
  other:    { label: 'Autre',    bar: 'bg-[var(--border)]', text: 'text-[var(--text-dim)]' },
};
const CATEGORY_ORDER = ['spirit', 'liqueur', 'wine', 'syrup', 'juice', 'fresh', 'dry', 'homemade', 'other'];

const QTY_UNIT_OPTIONS: { value: BatchQtyUnit; label: string }[] = [
  { value: 'portions', label: 'portions' },
  { value: 'cl',       label: 'cl' },
  { value: 'L',        label: 'L' },
  { value: 'btl70',    label: 'btl 70cl' },
  { value: 'btl100',   label: 'btl 100cl' },
];

function toBase(qty: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === 'cl') return qty;
  if (u === 'ml') return qty / 10;
  if (u === 'l') return qty * 100;
  if (u === 'kg') return qty * 1000;
  return qty;
}

function effectivePortions(qty: number, unit: BatchQtyUnit, recipe: Recipe): number {
  if (unit === 'portions') return qty;
  const vol = recipe.ingredients.reduce((s, i) => s + toBase(i.qty, i.unit), 0);
  if (vol <= 0) return qty;
  const target = unit === 'cl' ? qty : unit === 'L' ? qty * 100 : unit === 'btl70' ? qty * 70 : qty * 100;
  return target / vol;
}

function fmt(qty: number, unit: string): string {
  if (unit === 'ml' && qty >= 1000) { const l = qty / 1000; return `${l % 1 === 0 ? l : l.toFixed(1)} L`; }
  if (unit === 'cl' && qty >= 100)  { const l = qty / 100;  return `${l % 1 === 0 ? l : l.toFixed(1)} L`; }
  if (unit === 'g'  && qty >= 1000) { const k = qty / 1000; return `${k % 1 === 0 ? k : k.toFixed(1)} kg`; }
  return `${Math.round(qty * 100) / 100} ${unit}`;
}

function fmtTime(totalSec: number): string {
  const sec = Math.max(0, totalSec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getRemaining(entry: TimerEntry): number {
  if (!entry.startedAt) return entry.durationSec;
  const elapsed = Math.floor((Date.now() - new Date(entry.startedAt).getTime()) / 1000);
  return Math.max(0, entry.durationSec - elapsed);
}

function stockStatus(line: ConsolidatedLine): 'ok' | 'low' | 'insufficient' | 'unknown' {
  if (!line.ingredientId || line.stockInfo?.stock === undefined) return 'unknown';
  const a = line.stockInfo.stock;
  if (a >= line.totalQty) return 'ok';
  if (a >= line.totalQty * 0.8) return 'low';
  return 'insufficient';
}

function groupByCategory(ings: RecipeIngredient[], stockMap: Record<string, IngredientStock>) {
  const byName: Record<string, IngredientStock> = {};
  for (const s of Object.values(stockMap)) {
    if (s.name) byName[s.name.toLowerCase()] = s;
  }
  const g: Record<string, RecipeIngredient[]> = {};
  for (const ing of ings) {
    const info = ing.ingredientId
      ? stockMap[ing.ingredientId]
      : byName[ing.name.toLowerCase()];
    const isHomemade = info?.homemade ?? ing.homemade ?? (ing.type === 'recipe');
    const rawType = info?.type ?? ing.type;
    const cat = isHomemade ? 'homemade' : (rawType?.toLowerCase() ?? 'other');
    (g[cat] ??= []).push(ing);
  }
  return g;
}

let counter = 0;
const GLOBAL_TIMER_KEY = '__global';

export default function BatchClient({ recipes, stockMap, userId, teams }: Props) {
  const [batchName, setBatchName]   = useState('');
  const [items, setItems]           = useState<BatchItem[]>([]);
  const [search, setSearch]         = useState('');
  const [open, setOpen]             = useState(false);
  const [view, setView]             = useState<'recipes' | 'total'>('recipes');
  const [checked, setChecked]       = useState<Set<string>>(new Set());
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [timers, setTimers]         = useState<Record<string, TimerEntry>>({});
  const [globalInput, setGlobalInput] = useState(''); // "HH:MM" or "MM:SS"
  const [producing, setProducing]   = useState(false);
  const [error, setError]           = useState('');
  const [done, setDone]             = useState(false);
  const [batchId, setBatchId]       = useState<string | null>(null);
  const [sharing, setSharing]       = useState(false);
  const [shareTeamId, setShareTeamId] = useState(teams[0]?.id ?? '');
  const [sharedTeamId, setSharedTeamId] = useState<string | null>(null);
  const [tick, setTick]             = useState(0);
  const [saving, setSaving]         = useState(false);
  const [savedOk, setSavedOk]       = useState(false);
  const [savedBatches, setSavedBatches] = useState<Array<{
    id: string; name: string; updated_at: string;
    items: Array<{ key: string; recipeId: string; recipeName: string; qty: number; qtyUnit: BatchQtyUnit; ingredients: RecipeIngredient[]; steps: string | null }>;
    timers: Record<string, TimerEntry>; checked: string[];
  }>>([]);
  const [showSaved, setShowSaved]   = useState(false);

  // Stable boolean so the interval is only recreated when active state flips, not on every timer update
  const hasActiveTimers = Object.values(timers).some((t) => t.startedAt !== null && getRemaining(t) > 0);

  useEffect(() => {
    if (!hasActiveTimers) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [hasActiveTimers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? recipes.filter((r) => r.name.toLowerCase().includes(q)) : recipes;
  }, [recipes, search]);

  function addItem(recipe: Recipe) {
    counter++;
    const key = `i${counter}`;
    setItems((p) => [...p, { key, recipe, qty: 1, qtyUnit: 'portions' }]);
    if (recipe.timerSeconds && recipe.timerSeconds > 0) {
      setTimers((p) => ({
        ...p,
        [key]: { durationSec: recipe.timerSeconds!, startedAt: null, label: recipe.method ?? 'Technique' },
      }));
    }
    setSearch(''); setOpen(false);
  }

  function removeItem(key: string) {
    setItems((p) => p.filter((i) => i.key !== key));
    setTimers((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  function updateQty(key: string, delta: number | null, val?: number) {
    setItems((p) => p.map((i) => i.key !== key ? i : {
      ...i, qty: delta !== null ? Math.max(1, i.qty + delta) : Math.max(1, val ?? 1),
    }));
  }

  function updateUnit(key: string, unit: BatchQtyUnit) {
    setItems((p) => p.map((i) => i.key === key ? { ...i, qtyUnit: unit } : i));
  }

  function toggleTimer(key: string) {
    setTimers((p) => {
      const entry = p[key];
      if (!entry) return p;
      const remaining = getRemaining(entry);
      if (remaining <= 0) {
        return { ...p, [key]: { ...entry, startedAt: null } };
      }
      if (entry.startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(entry.startedAt).getTime()) / 1000);
        return { ...p, [key]: { ...entry, durationSec: Math.max(0, entry.durationSec - elapsed), startedAt: null } };
      }
      const newEntry = { ...entry, startedAt: new Date().toISOString() };
      if (batchId && sharedTeamId) syncTimerToDb(batchId, key, newEntry);
      return { ...p, [key]: newEntry };
    });
  }

  function resetTimer(key: string) {
    setTimers((p) => {
      const entry = p[key];
      if (!entry) return p;
      const recipe = items.find((i) => i.key === key)?.recipe;
      const dur = recipe?.timerSeconds ?? entry.durationSec;
      return { ...p, [key]: { ...entry, durationSec: dur, startedAt: null } };
    });
  }

  function addGlobalTimer() {
    const parts = globalInput.trim().split(':').map(Number);
    if (parts.some(isNaN)) return;
    let sec = 0;
    if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) sec = parts[0] * 60 + parts[1];
    else sec = parts[0] * 60;
    if (sec <= 0) return;
    setTimers((p) => ({ ...p, [GLOBAL_TIMER_KEY]: { durationSec: sec, startedAt: null, label: 'Timer global' } }));
    setGlobalInput('');
  }

  const lines = useMemo((): ConsolidatedLine[] => {
    const map = new Map<string, ConsolidatedLine>();
    for (const item of items) {
      const portions = effectivePortions(item.qty, item.qtyUnit, item.recipe);
      for (const ing of item.recipe.ingredients) {
        const byName: Record<string, IngredientStock> = {};
        for (const s of Object.values(stockMap)) { if (s.name) byName[s.name.toLowerCase()] = s; }
        const info = ing.ingredientId ? stockMap[ing.ingredientId] : byName[ing.name.toLowerCase()];
        const k = ing.ingredientId ? `id:${ing.ingredientId}` : `n:${ing.name.toLowerCase()}`;
        const ex = map.get(k);
        if (ex) {
          ex.totalQty += ing.qty * portions;
          if (!ex.sources.includes(item.recipe.name)) ex.sources.push(item.recipe.name);
        } else {
          map.set(k, { key: k, name: info?.name ?? ing.name, unit: ing.unit, totalQty: ing.qty * portions, sources: [item.recipe.name], ingredientId: ing.ingredientId, stockInfo: info });
        }
      }
    }
    return [...map.values()];
  }, [items, stockMap]);

  function toggleChecked(key: string) {
    setChecked((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }
  function toggleExpanded(key: string) {
    setExpanded((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  async function fetchSavedBatches() {
    const sb = createClient();
    const { data } = await sb.from('batches').select('id, name, items, timers, checked, updated_at')
      .eq('user_id', userId).eq('status', 'active').is('team_id', null)
      .order('updated_at', { ascending: false }).limit(20);
    setSavedBatches((data ?? []) as typeof savedBatches);
  }

  useEffect(() => { fetchSavedBatches(); }, []);

  function loadBatch(saved: typeof savedBatches[number]) {
    counter = 0;
    const restored: BatchItem[] = saved.items.map((si) => {
      counter++;
      const found = recipes.find((r) => r.id === si.recipeId);
      return {
        key: si.key,
        qty: si.qty,
        qtyUnit: si.qtyUnit,
        recipe: found ?? {
          id: si.recipeId, name: si.recipeName, type: 'cocktail',
          ingredients: si.ingredients, steps: si.steps ?? '', timerSeconds: 0,
        },
      };
    });
    setBatchName(saved.name === 'Batch sans titre' ? '' : saved.name);
    setItems(restored);
    setTimers(saved.timers ?? {});
    setChecked(new Set(saved.checked ?? []));
    setBatchId(saved.id);
    setSharedTeamId(null);
    setExpanded(new Set());
    setChecked(new Set(saved.checked ?? []));
    setShowSaved(false);
  }

  async function deleteSavedBatch(id: string) {
    const sb = createClient();
    await sb.from('batches').delete().eq('id', id);
    setSavedBatches((p) => p.filter((b) => b.id !== id));
    if (batchId === id) { setBatchId(null); }
  }

  const saveBatch = useCallback(async (opts?: { teamId?: string }): Promise<boolean> => {
    const supabase = createClient();
    const payload = {
      name: batchName || 'Batch sans titre',
      items: items.map((i) => ({ key: i.key, recipeId: i.recipe.id, recipeName: i.recipe.name, qty: i.qty, qtyUnit: i.qtyUnit, ingredients: i.recipe.ingredients, steps: i.recipe.steps ?? null })),
      timers,
      checked: [...checked],
      status: 'active' as const,
      updated_at: new Date().toISOString(),
    };
    if (opts?.teamId) Object.assign(payload, { team_id: opts.teamId });

    if (batchId) {
      const { error } = await supabase.from('batches').update(payload).eq('id', batchId);
      return !error;
    } else {
      const { data, error } = await supabase.from('batches').insert({ user_id: userId, ...payload }).select('id').single();
      if (!error && data?.id) setBatchId(data.id as string);
      return !error;
    }
  }, [batchName, items, timers, checked, batchId, userId]);

  async function syncTimerToDb(id: string, key: string, entry: TimerEntry) {
    const supabase = createClient();
    const { data } = await supabase.from('batches').select('timers').eq('id', id).single();
    const current = (data?.timers ?? {}) as Record<string, TimerEntry>;
    await supabase.from('batches').update({ timers: { ...current, [key]: entry } }).eq('id', id);
  }

  async function handleSave() {
    if (items.length === 0) return;
    setSaving(true);
    setError('');
    const ok = await saveBatch();
    setSaving(false);
    if (ok) {
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      await fetchSavedBatches();
    } else {
      setError('Impossible de sauvegarder le batch.');
    }
  }

  async function handleShare() {
    if (!shareTeamId) return;
    setSharing(true);
    setError('');
    const ok = await saveBatch({ teamId: shareTeamId });
    if (ok) setSharedTeamId(shareTeamId);
    else setError('Impossible de partager le batch.');
    setSharing(false);
  }

  // Real-time subscription when batch is shared
  useEffect(() => {
    if (!batchId || !sharedTeamId) return;
    const supabase = createClient();
    const ch = supabase.channel(`batch:${batchId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'batches',
        filter: `id=eq.${batchId}`,
      }, (payload) => {
        const row = payload.new as { timers?: Record<string, TimerEntry>; checked?: string[] };
        if (row.timers) setTimers(row.timers);
        if (row.checked) setChecked(new Set(row.checked));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [batchId, sharedTeamId]);

  async function handleProduce() {
    setProducing(true); setError('');
    const supabase = createClient();

    const toUpdate = lines.filter((l) => l.ingredientId);
    if (toUpdate.length === 0) { setDone(true); setProducing(false); return; }

    const ids = [...new Set(toUpdate.map((l) => l.ingredientId!))];
    const { data: freshRows, error: fetchErr } = await supabase
      .from('ingredients')
      .select('id, data')
      .in('id', ids)
      .eq('user_id', userId);

    if (fetchErr) { setError('Erreur lors de la mise à jour du stock.'); setProducing(false); return; }

    const freshMap = new Map((freshRows ?? []).map((r) => [r.id as string, r.data as Record<string, unknown>]));

    const results = await Promise.all(
      toUpdate
        .filter((l) => {
          const d = freshMap.get(l.ingredientId!);
          return d && typeof d.stock === 'number' && !d.unlimitedStock;
        })
        .map((l) => {
          const d = freshMap.get(l.ingredientId!)!;
          return supabase.from('ingredients')
            .update({
              data: { ...d, stock: Math.max(0, (d.stock as number) - l.totalQty) },
              updated_at: new Date().toISOString(),
            })
            .eq('id', l.ingredientId!)
            .eq('user_id', userId);
        })
    );

    if (results.find((r) => r.error)) {
      setError('Erreur lors de la mise à jour du stock.');
    } else {
      if (batchId) await supabase.from('batches').update({ status: 'done' }).eq('id', batchId);
      setDone(true);
    }
    setProducing(false);
  }

  // ── done ────────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <CheckCircle2 size={48} className="text-emerald-400" />
        <p className="text-lg font-semibold text-[var(--text)]">Production validée</p>
        <p className="text-sm text-[var(--text-dim)]">Le stock a été mis à jour.</p>
        <button type="button" onClick={() => { setItems([]); setChecked(new Set()); setBatchName(''); setTimers({}); setDone(false); setBatchId(null); setSharedTeamId(null); }} className="btn-primary mt-2">
          Nouveau batch
        </button>
      </div>
    );
  }

  const allChecked = lines.length > 0 && checked.size === lines.length;
  const globalTimer = timers[GLOBAL_TIMER_KEY];
  const sharedTeam = teams.find((t) => t.id === sharedTeamId);

  return (
    <div className="space-y-3 max-w-xl mx-auto">

      {/* ── Saved batches ── */}
      {savedBatches.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <button type="button"
            onClick={() => setShowSaved((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-[var(--text-dim)] hover:bg-[var(--surface2)] transition-colors">
            <div className="flex items-center gap-2">
              <FolderOpen size={14} className="text-[var(--gold)]" />
              <span className="font-medium text-[var(--text)]">Batches enregistrés</span>
              <span className="text-[10px] rounded-full px-1.5 py-px bg-[var(--gold)]/20 text-[var(--gold)]">{savedBatches.length}</span>
            </div>
            <ChevronDown size={14} className={`transition-transform ${showSaved ? '' : '-rotate-90'}`} />
          </button>
          {showSaved && (
            <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
              {savedBatches.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{b.name}</p>
                    <p className="text-xs text-[var(--text-dim)] mt-0.5 truncate">
                      {b.items.map((i) => i.recipeName).join(' · ')} · {new Date(b.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <button type="button" onClick={() => loadBatch(b)}
                    className="shrink-0 px-3 py-1.5 text-xs btn-primary">
                    Reprendre
                  </button>
                  <button type="button" onClick={() => deleteSavedBatch(b.id)}
                    className="shrink-0 p-1.5 text-[var(--text-dim)] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Batch name ── */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nom du batch (ex. Soirée vendredi…)"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          className="field-input font-semibold text-base flex-1"
        />
        {items.length > 0 && (
          <button type="button" onClick={handleSave} disabled={saving}
            className="btn-ghost px-3 flex items-center gap-1.5 text-sm shrink-0">
            {saving ? <Loader2 size={14} className="animate-spin" /> : savedOk ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Save size={14} />}
            {savedOk ? 'Enregistré' : 'Sauver'}
          </button>
        )}
      </div>

      {/* ── Search / add ── */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] pointer-events-none" />
        <input
          type="text"
          placeholder="Ajouter une recette…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="field-input !pl-10 w-full"
        />
        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 card p-1 shadow-xl max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-[var(--text-dim)] text-center py-4">Aucun résultat</p>
            ) : filtered.map((r) => (
              <button key={r.id} type="button" onMouseDown={(e) => { e.preventDefault(); addItem(r); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-[var(--surface2)] rounded-md transition-colors">
                <span className="flex-1 text-[var(--text)] truncate">{r.name}</span>
                <span className={`shrink-0 text-xs rounded-full px-2 py-0.5 border ${r.type === 'homemade' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10' : 'text-[var(--gold)] border-[var(--gold)]/30 bg-[var(--gold)]/10'}`}>
                  {r.type === 'homemade' ? 'Maison' : 'Recette'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Shared badge ── */}
      {sharedTeam && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-400/10 border border-blue-400/20">
          <Users size={13} className="text-blue-400 shrink-0" />
          <p className="text-xs text-blue-400">Partagé avec <strong>{sharedTeam.name}</strong> · en direct</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Package size={40} className="text-[var(--text-dim)] opacity-25" />
          <p className="text-sm text-[var(--text-dim)]">Ajoutez des recettes pour calculer votre batch</p>
        </div>
      ) : (
        <>
          {/* ── Tabs ── */}
          <div className="flex rounded-lg bg-[var(--surface2)] p-0.5 gap-0.5">
            {([
              { key: 'recipes', icon: BookOpen, label: 'Recettes', count: items.length },
              { key: 'total',   icon: List,     label: 'Liste totale', count: lines.length },
            ] as const).map(({ key, icon: Icon, label, count }) => (
              <button key={key} type="button" onClick={() => setView(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${view === key ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-dim)]'}`}>
                <Icon size={14} />
                {label}
                <span className={`text-[10px] rounded-full px-1.5 py-px leading-none ${view === key ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'bg-[var(--surface)] text-[var(--text-dim)]'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* ── RECETTES TAB ── */}
          {view === 'recipes' && (
            <div className="space-y-3">
              {items.map((item) => {
                const portions = effectivePortions(item.qty, item.qtyUnit, item.recipe);
                const groups   = groupByCategory(item.recipe.ingredients, stockMap);
                const cats     = CATEGORY_ORDER.filter((c) => groups[c]);
                const recipeTimer = timers[item.key];
                const remaining = recipeTimer ? getRemaining(recipeTimer) : 0;
                const timerActive = !!recipeTimer?.startedAt && remaining > 0;
                const timerDone = !!recipeTimer && remaining <= 0;

                return (
                  <div key={item.key} className="card p-0 overflow-hidden">
                    {/* Recipe header */}
                    <div className="px-4 pt-3 pb-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2 mb-2.5">
                        <p className="flex-1 font-semibold text-[var(--text)] truncate">{item.recipe.name}</p>
                        <button type="button" onClick={() => removeItem(item.key)}
                          className="shrink-0 p-1.5 rounded-md text-[var(--text-dim)] hover:text-red-400 hover:bg-red-400/10 transition-colors">
                          <X size={15} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-[var(--surface2)] rounded-lg p-1">
                          <button type="button" onClick={() => updateQty(item.key, -1)}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-colors">
                            <Minus size={14} />
                          </button>
                          <input type="number" min="1" max="9999" value={item.qty}
                            onChange={(e) => updateQty(item.key, null, parseInt(e.target.value) || 1)}
                            className="w-14 text-center bg-transparent text-[var(--text)] font-semibold text-sm focus:outline-none" />
                          <button type="button" onClick={() => updateQty(item.key, 1)}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-colors">
                            <Plus size={14} />
                          </button>
                        </div>
                        <select value={item.qtyUnit} onChange={(e) => updateUnit(item.key, e.target.value as BatchQtyUnit)}
                          className="field-input text-sm flex-1">
                          {QTY_UNIT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Ingredient groups */}
                    <div className="px-4 py-3 space-y-4">
                      {cats.length === 0 ? (
                        <p className="text-xs text-[var(--text-dim)] text-center">Aucun ingrédient</p>
                      ) : cats.map((catKey) => {
                        const cat = CATEGORY_GROUPS[catKey] ?? CATEGORY_GROUPS.other;
                        return (
                          <div key={catKey} className="flex gap-3">
                            <div className={`w-0.5 rounded-full ${cat.bar} shrink-0 mt-1`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${cat.text}`}>{cat.label}</p>
                              <div className="space-y-1.5">
                                {groups[catKey].map((ing) => {
                                  const info      = ing.ingredientId ? stockMap[ing.ingredientId] : undefined;
                                  const refRecipe = ing.recipeRef ? recipes.find((r) => r.id === ing.recipeRef) : undefined;
                                  const scaledQty = ing.qty * portions;
                                  const ingKey    = `${item.key}:${ing.ingredientId ?? ing.recipeRef ?? ing.name}`;
                                  const isHomemade  = info?.homemade ?? ing.type === 'recipe';
                                  const composition = info?.composition ?? refRecipe?.ingredients;
                                  const steps       = info?.steps ?? refRecipe?.steps;
                                  const hasDetails  = isHomemade && ((composition?.length ?? 0) > 0 || !!steps);
                                  const isExpanded  = expanded.has(ingKey);
                                  const yB = toBase(info?.yield ?? 1, info?.yieldUnit ?? ing.unit);
                                  const nB = toBase(scaledQty, ing.unit);
                                  const scale = yB > 0 ? nB / yB : 1;

                                  return (
                                    <div key={ingKey}>
                                      <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => hasDetails && toggleExpanded(ingKey)}
                                          className={`shrink-0 w-5 flex items-center justify-center ${hasDetails ? 'text-[var(--text-dim)] hover:text-[var(--text)]' : 'cursor-default'}`}>
                                          {hasDetails
                                            ? <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            : isHomemade ? <FlaskConical size={11} className="text-blue-400" /> : null
                                          }
                                        </button>
                                        <span className="flex-1 text-sm text-[var(--text)] truncate">{info?.name ?? ing.name}</span>
                                        <span className="text-sm font-mono font-medium text-[var(--text)] shrink-0 tabular-nums">
                                          {fmt(scaledQty, ing.unit)}
                                        </span>
                                      </div>
                                      {isExpanded && (
                                        <div className="ml-5 mt-1.5 mb-2 pl-3 border-l-2 border-[var(--border)] space-y-1">
                                          {composition?.map((c, ci) => (
                                            <div key={ci} className="flex justify-between gap-2 text-xs">
                                              <span className="text-[var(--text-dim)] truncate">{c.name}</span>
                                              <span className="font-mono text-[var(--text-dim)] shrink-0 tabular-nums">{refRecipe ? `${c.qty} ${c.unit}` : fmt(c.qty * scale, c.unit)}</span>
                                            </div>
                                          ))}
                                          {steps && (
                                            <p className="text-xs text-[var(--text-dim)] italic leading-relaxed pt-1">→ {steps}</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Steps + Timer */}
                    {(item.recipe.steps || recipeTimer) && (
                      <div className="px-4 pb-3 border-t border-[var(--border)] pt-3 space-y-3">
                        {item.recipe.steps && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)] mb-1.5">Préparation</p>
                            <p className="text-sm text-[var(--text-dim)] leading-relaxed whitespace-pre-line">{item.recipe.steps}</p>
                          </div>
                        )}

                        {recipeTimer && (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Timer size={13} className={timerActive ? 'text-[var(--gold)]' : timerDone ? 'text-emerald-400' : 'text-[var(--text-dim)]'} />
                              <span className="text-xs text-[var(--text-dim)]">{recipeTimer.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-lg font-semibold tabular-nums ${timerDone ? 'text-emerald-400' : timerActive ? 'text-[var(--gold)]' : 'text-[var(--text)]'}`}>
                                {timerDone ? '✓' : fmtTime(remaining)}
                              </span>
                              <button type="button" onClick={() => toggleTimer(item.key)}
                                className={`p-2 rounded-lg transition-colors ${timerActive ? 'bg-orange-400/10 text-orange-400 hover:bg-orange-400/20' : timerDone ? 'bg-emerald-400/10 text-emerald-400' : 'bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/20'}`}>
                                {timerActive ? <Square size={14} /> : timerDone ? <CheckCircle2 size={14} /> : <Play size={14} />}
                              </button>
                              {(timerActive || timerDone) && (
                                <button type="button" onClick={() => resetTimer(item.key)}
                                  className="p-2 rounded-lg text-[var(--text-dim)] hover:bg-[var(--surface2)] transition-colors">
                                  <RotateCcw size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── LISTE TOTALE TAB ── */}
          {view === 'total' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-dim)]">{lines.length} ingrédient{lines.length > 1 ? 's' : ''}</p>
                <button type="button" onClick={() => allChecked ? setChecked(new Set()) : setChecked(new Set(lines.map((l) => l.key)))}
                  className="btn-ghost py-1 px-3 text-xs">
                  {allChecked ? 'Tout décocher' : 'Tout cocher'}
                </button>
              </div>
              <div className="card divide-y divide-[var(--border)] p-0 overflow-hidden">
                {lines.map((line) => {
                  const isChecked = checked.has(line.key);
                  const status = stockStatus(line);
                  return (
                    <button key={line.key} type="button" onClick={() => toggleChecked(line.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface2)] transition-colors ${isChecked ? 'opacity-40' : ''}`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-[var(--gold)] border-[var(--gold)]' : 'border-[var(--border)]'}`}>
                        {isChecked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#0A0E1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      {line.stockInfo?.homemade
                        ? <FlaskConical size={14} className="text-blue-400 shrink-0" />
                        : <Package size={14} className="text-[var(--gold)] shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm text-[var(--text)] ${isChecked ? 'line-through' : ''}`}>{line.name}</p>
                        <p className="text-xs text-[var(--text-dim)] truncate mt-0.5">{line.sources.join(' · ')}</p>
                        {line.stockInfo?.stock !== undefined && (
                          <p className={`text-xs mt-0.5 ${status === 'ok' ? 'text-emerald-400' : status === 'low' ? 'text-orange-400' : status === 'insufficient' ? 'text-red-400' : 'text-[var(--text-dim)]'}`}>
                            Stock: {line.stockInfo.stock} {line.stockInfo.unit}
                            {status === 'insufficient' && ' · insuffisant'}
                            {status === 'low' && ' · juste'}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-mono font-semibold text-[var(--text)] shrink-0 tabular-nums">
                        {fmt(line.totalQty, line.unit)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Global timer ── */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-[var(--gold)]" />
              <p className="text-sm font-semibold text-[var(--text)]">Timer global</p>
            </div>
            {globalTimer ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-mono text-2xl font-bold tabular-nums ${getRemaining(globalTimer) <= 0 ? 'text-emerald-400' : globalTimer.startedAt ? 'text-[var(--gold)]' : 'text-[var(--text)]'}`}>
                    {getRemaining(globalTimer) <= 0 ? '✓ Terminé' : fmtTime(getRemaining(globalTimer))}
                  </p>
                  <p className="text-xs text-[var(--text-dim)] mt-0.5">{globalTimer.label}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => toggleTimer(GLOBAL_TIMER_KEY)}
                    className={`p-2.5 rounded-lg transition-colors ${globalTimer.startedAt && getRemaining(globalTimer) > 0 ? 'bg-orange-400/10 text-orange-400' : 'bg-[var(--gold)]/10 text-[var(--gold)]'}`}>
                    {globalTimer.startedAt && getRemaining(globalTimer) > 0 ? <Square size={16} /> : <Play size={16} />}
                  </button>
                  <button type="button" onClick={() => setTimers((p) => { const n = { ...p }; delete n[GLOBAL_TIMER_KEY]; return n; })}
                    className="p-2.5 rounded-lg text-[var(--text-dim)] hover:bg-[var(--surface2)]">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="MM:SS ou HH:MM:SS"
                  value={globalInput}
                  onChange={(e) => setGlobalInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGlobalTimer()}
                  className="field-input text-sm flex-1"
                />
                <button type="button" onClick={addGlobalTimer}
                  className="btn-primary px-4 shrink-0">
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ── Share with team ── */}
          {teams.length > 0 && !sharedTeamId && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Share2 size={14} className="text-[var(--gold)]" />
                <p className="text-sm font-semibold text-[var(--text)]">Partager avec l'équipe</p>
              </div>
              {teams.length > 1 && (
                <select value={shareTeamId} onChange={(e) => setShareTeamId(e.target.value)} className="field-input text-sm">
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
              {teams.length === 1 && (
                <p className="text-xs text-[var(--text-dim)]">{teams[0].name}</p>
              )}
              <button type="button" onClick={handleShare} disabled={sharing}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {sharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                Partager en direct
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

          <button type="button" onClick={handleProduce} disabled={producing || lines.length === 0}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {producing ? <><Loader2 size={16} className="animate-spin" />Enregistrement…</> : 'Valider la production'}
          </button>
        </>
      )}
    </div>
  );
}
