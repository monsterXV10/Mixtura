'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { CatalogRecipe } from '../page'

const GLASS_SHORT: Record<string, string> = {
  'Cocktail Glass': 'Cocktail',
  'Martini Glass': 'Martini',
  'Old Fashioned Glass': 'Old Fashioned',
  'Highball Glass': 'Highball',
  'Collins Glass': 'Collins',
  'Wine Glass': 'Wine',
  'Champagne Flute': 'Flûte',
  'Shot Glass': 'Shot',
  'Copper Mug': 'Mug',
}

function shortGlass(g: string | null) {
  if (!g) return null
  return GLASS_SHORT[g] ?? g
}

const CATALOG_SOURCES = [
  { id: 'iba', label: 'IBA', icon: '🍸', available: true },
  { id: 'custom', label: 'Mes catalogues', icon: '+', available: false },
]

export default function CatalogClient({
  recipes,
  userId,
}: {
  recipes: CatalogRecipe[]
  userId: string | null
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CatalogRecipe | null>(null)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [activeSource, setActiveSource] = useState('iba')

  const glasses = useMemo(() => {
    const s = new Set(recipes.map(r => r.glass).filter(Boolean) as string[])
    return [...s].sort()
  }, [recipes])

  const families = useMemo(() => {
    const s = new Set(recipes.map(r => r.family).filter(Boolean) as string[])
    return [...s].sort()
  }, [recipes])

  const [glassFilter, setGlassFilter] = useState<string | null>(null)
  const [familyFilter, setFamilyFilter] = useState<string | null>(null)
  const [filterTab, setFilterTab] = useState<'glass' | 'family'>('glass')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return recipes.filter(r => {
      const matchQ = !q ||
        r.name.toLowerCase().includes(q) ||
        (r.alcohol ?? '').toLowerCase().includes(q) ||
        (r.family ?? '').toLowerCase().includes(q)
      const matchG = !glassFilter || r.glass === glassFilter
      const matchF = !familyFilter || r.family === familyFilter
      return matchQ && matchG && matchF
    })
  }, [recipes, query, glassFilter, familyFilter])

  async function handleImport(recipe: CatalogRecipe) {
    if (!userId) return
    setImporting(true)
    const supabase = getSupabaseBrowserClient()

    // Normalise les unités IBA vers les unités de l'app
    const unitMap: Record<string, string> = {
      dashes: 'trait', dash: 'trait', drops: 'goutte', drop: 'goutte',
      pieces: 'pièce', piece: 'pièce', barspoon: 'pièce',
    }
    const normalizeIngredients = (ings: CatalogRecipe['ingredients']) =>
      ings.map(ing => ({
        name: ing.name,
        qty: ing.qty,
        unit: unitMap[ing.unit?.toLowerCase()] ?? ing.unit ?? 'cl',
      }))

    // method est string dans le catalogue, string[] dans l'app
    const methodArr = recipe.method
      ? (Array.isArray(recipe.method) ? recipe.method : [recipe.method])
      : undefined

    await supabase.from('recipes').insert({
      user_id: userId,
      type: 'cocktail',
      data: {
        id: crypto.randomUUID(),
        name: recipe.name,
        ingredients: normalizeIngredients(recipe.ingredients ?? []),
        steps: recipe.steps ?? '',
      },
      metadata: {
        type: 'cocktail',
        ...(recipe.glass    && { glass:   recipe.glass }),
        ...(recipe.family   && { family:  recipe.family }),
        ...(recipe.alcohol  && { alcohol: recipe.alcohol }),
        ...(recipe.garnish  && { garnish: recipe.garnish }),
        ...(methodArr       && { method:  methodArr }),
      },
    })
    setImporting(false)
    setImportDone(true)
    setTimeout(() => setImportDone(false), 2500)
  }

  /* ── Vue détail ── */
  if (selected) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <header
          className="sticky top-0 z-10 flex items-center gap-3 px-4 h-14"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => { setSelected(null); setImportDone(false) }}
            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] flex-shrink-0"
            style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}
          >
            ←
          </button>
          <h1 className="flex-1 font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
            {selected.name}
          </h1>
          {userId && (
            <button
              onClick={() => handleImport(selected)}
              disabled={importing || importDone}
              className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold flex-shrink-0 disabled:opacity-60"
              style={{ background: importDone ? '#1a3a1a' : 'var(--gold)', color: importDone ? '#4ade80' : '#0A0E1A' }}
            >
              {importing ? '…' : importDone ? '✓ Importée' : '+ Importer'}
            </button>
          )}
        </header>

        <div className="p-4 pb-12 space-y-5 max-w-2xl mx-auto">
          <div className="rounded-[var(--radius)] p-5 space-y-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{selected.name}</h2>
                {selected.source && (
                  <span className="text-xs" style={{ color: 'var(--gold)' }}>{selected.source}</span>
                )}
              </div>
              <span className="text-3xl">🍸</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {selected.glass && <Meta icon="🥃" label="Verre" value={selected.glass} />}
              {selected.family && <Meta icon="🏷" label="Famille" value={selected.family} />}
              {selected.alcohol && <Meta icon="🍾" label="Alcool" value={selected.alcohol} />}
              {selected.method && <Meta icon="🔧" label="Méthode" value={String(selected.method)} />}
              {selected.ice && <Meta icon="🧊" label="Glace" value={selected.ice} />}
              {selected.garnish && <Meta icon="🌿" label="Garniture" value={selected.garnish} />}
            </div>
          </div>

          {selected.ingredients?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-dim)' }}>Ingrédients</p>
              <div className="rounded-[var(--radius)] overflow-hidden"
                style={{ border: '1px solid var(--border)' }}>
                {selected.ingredients.map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      background: 'var(--surface)',
                      borderBottom: i < selected.ingredients.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span style={{ color: 'var(--text)' }}>{ing.name}</span>
                    <span className="font-semibold" style={{ color: 'var(--gold)' }}>
                      {ing.qty} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selected.steps && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-dim)' }}>Préparation</p>
              <div
                className="rounded-[var(--radius)] p-4 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {selected.steps}
              </div>
            </div>
          )}

          {!userId && (
            <div className="text-center p-4 rounded-[var(--radius)]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--text-dim)' }}>
                Connectez-vous pour importer cette recette dans votre carnet.
              </p>
              <Link
                href="/login"
                className="inline-block px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold"
                style={{ background: 'var(--gold)', color: '#0A0E1A' }}
              >
                Se connecter
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ── Vue liste ── */
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-10 px-4 py-3 space-y-3"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        {/* Titre + actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {userId && (
              <Link
                href="/"
                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)]"
                style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}
              >
                ←
              </Link>
            )}
            <span className="text-lg font-bold tracking-widest" style={{ color: 'var(--gold)' }}>
              CATALOGUE
            </span>
          </div>
          {!userId && (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold"
              style={{ background: 'var(--gold)', color: '#0A0E1A' }}
            >
              Se connecter
            </Link>
          )}
        </div>

        {/* Barre de recherche */}
        <input
          type="search"
          placeholder="Rechercher un cocktail, un alcool, une famille..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="field-input"
        />

        {/* Onglets source */}
        <div className="flex gap-2">
          {CATALOG_SOURCES.map(src => (
            <button
              key={src.id}
              onClick={() => src.available && setActiveSource(src.id)}
              disabled={!src.available}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all"
              style={{
                background: activeSource === src.id ? 'var(--gold)' : 'var(--surface2)',
                color: activeSource === src.id ? '#0A0E1A' : src.available ? 'var(--text-dim)' : 'var(--border)',
                border: src.available ? 'none' : '1px dashed var(--border)',
                cursor: src.available ? 'pointer' : 'not-allowed',
                opacity: src.available ? 1 : 0.5,
              }}
            >
              <span>{src.icon}</span>
              <span>{src.label}</span>
              {src.id === 'iba' && activeSource === 'iba' && (
                <span className="ml-1 opacity-70">({recipes.length})</span>
              )}
              {!src.available && (
                <span className="ml-1 text-[9px] uppercase tracking-wide opacity-60">bientôt</span>
              )}
            </button>
          ))}
        </div>

        {/* Filtres : onglets Verre / Famille */}
        <div>
          <div className="flex gap-2 mb-2">
            {(['glass', 'family'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{
                  color: filterTab === tab ? 'var(--gold)' : 'var(--text-dim)',
                  borderBottom: filterTab === tab ? '1px solid var(--gold)' : '1px solid transparent',
                }}
              >
                {tab === 'glass' ? '🥃 Verre' : '🏷 Famille'}
                {tab === 'glass' && glassFilter && ' ·'}
                {tab === 'family' && familyFilter && ' ·'}
              </button>
            ))}
            {(glassFilter || familyFilter) && (
              <button
                onClick={() => { setGlassFilter(null); setFamilyFilter(null) }}
                className="text-xs ml-auto"
                style={{ color: 'var(--text-dim)' }}
              >
                Effacer ×
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filterTab === 'glass' && (
              <>
                <Chip label="Tous" active={!glassFilter} onClick={() => setGlassFilter(null)} />
                {glasses.map(g => (
                  <Chip key={g} label={shortGlass(g) ?? g} active={glassFilter === g} onClick={() => setGlassFilter(glassFilter === g ? null : g)} />
                ))}
              </>
            )}
            {filterTab === 'family' && (
              <>
                <Chip label="Toutes" active={!familyFilter} onClick={() => setFamilyFilter(null)} />
                {families.map(f => (
                  <Chip key={f} label={f} active={familyFilter === f} onClick={() => setFamilyFilter(familyFilter === f ? null : f)} />
                ))}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 pb-8">
        <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
          {filtered.length} recette{filtered.length !== 1 ? 's' : ''}
          {(glassFilter || familyFilter || query) ? ' trouvée' + (filtered.length !== 1 ? 's' : '') : ''}
        </p>
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--text-dim)' }}>
            Aucun résultat pour &laquo; {query} &raquo;
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filtered.map(r => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="text-left rounded-[var(--radius)] p-4 transition-opacity hover:opacity-80 active:scale-95"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate" style={{ color: 'var(--text)' }}>
                      {r.name}
                    </p>
                    {r.alcohol && (
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-dim)' }}>{r.alcohol}</p>
                    )}
                  </div>
                  <span className="text-xl flex-shrink-0">🍸</span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {r.glass && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--surface2)', color: 'var(--gold)' }}
                    >
                      {shortGlass(r.glass)}
                    </span>
                  )}
                  {r.family && (
                    <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{r.family}</span>
                  )}
                  {r.ingredients?.length > 0 && (
                    <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                      {r.ingredients.length} ingr.
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {!userId && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none">
          <div
            className="max-w-sm mx-auto text-center p-4 rounded-[var(--radius)] pointer-events-auto"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
              Importez ces recettes dans votre carnet personnel.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 rounded-[var(--radius-sm)] text-sm font-semibold"
              style={{ background: 'var(--gold)', color: '#0A0E1A' }}
            >
              Créer un compte gratuit
            </Link>
          </div>
        </div>
      )}
      {!userId && <div className="h-28" />}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        background: active ? 'var(--gold)' : 'var(--surface2)',
        color: active ? '#0A0E1A' : 'var(--text-dim)',
      }}
    >
      {label}
    </button>
  )
}

function Meta({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="text-xs">
      <span style={{ color: 'var(--text-dim)' }}>{icon} {label} · </span>
      <span style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  )
}
