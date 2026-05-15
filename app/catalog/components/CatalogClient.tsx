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

  const glasses = useMemo(() => {
    const s = new Set(recipes.map(r => r.glass).filter(Boolean) as string[])
    return [...s].sort()
  }, [recipes])

  const [glassFilter, setGlassFilter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return recipes.filter(r => {
      const matchQ = !q || r.name.toLowerCase().includes(q) ||
        (r.alcohol ?? '').toLowerCase().includes(q) ||
        (r.family ?? '').toLowerCase().includes(q)
      const matchG = !glassFilter || r.glass === glassFilter
      return matchQ && matchG
    })
  }, [recipes, query, glassFilter])

  async function handleImport(recipe: CatalogRecipe) {
    if (!userId) return
    setImporting(true)
    const supabase = getSupabaseBrowserClient()
    await supabase.from('recipes').insert({
      user_id: userId,
      type: 'cocktail',
      data: {
        id: crypto.randomUUID(),
        name: recipe.name,
        ingredients: recipe.ingredients ?? [],
        steps: recipe.steps ?? '',
      },
      metadata: {
        type: 'cocktail',
        glass: recipe.glass ?? '',
        family: recipe.family ?? '',
        alcohol: recipe.alcohol ?? '',
        garnish: recipe.garnish ?? '',
        method: recipe.method ?? '',
      },
    })
    setImporting(false)
    setImportDone(true)
    setTimeout(() => setImportDone(false), 2500)
  }

  /* ── Detail view ── */
  if (selected) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        {/* Header */}
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
          {/* Fiche */}
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
              {selected.method && <Meta icon="🔧" label="Méthode" value={selected.method} />}
              {selected.ice && <Meta icon="🧊" label="Glace" value={selected.ice} />}
              {selected.garnish && <Meta icon="🌿" label="Garniture" value={selected.garnish} />}
            </div>
          </div>

          {/* Ingrédients */}
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

          {/* Méthode */}
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

  /* ── Liste ── */
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-10 px-4 py-3"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {userId ? (
              <Link
                href="/"
                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)]"
                style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}
              >
                ←
              </Link>
            ) : null}
            <div>
              <span className="text-lg font-bold tracking-widest" style={{ color: 'var(--gold)' }}>MIXTURA</span>
              <span className="ml-2 text-sm" style={{ color: 'var(--text-dim)' }}>· Catalogue IBA ({recipes.length})</span>
            </div>
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

        <input
          type="search"
          placeholder="Rechercher un cocktail, un alcool..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="field-input"
        />

        {/* Filtres verre */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setGlassFilter(null)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: glassFilter === null ? 'var(--gold)' : 'var(--surface2)',
              color: glassFilter === null ? '#0A0E1A' : 'var(--text-dim)',
            }}
          >
            Tous
          </button>
          {glasses.map(g => (
            <button
              key={g}
              onClick={() => setGlassFilter(glassFilter === g ? null : g)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: glassFilter === g ? 'var(--gold)' : 'var(--surface2)',
                color: glassFilter === g ? '#0A0E1A' : 'var(--text-dim)',
              }}
            >
              {shortGlass(g)}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 pb-8">
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
                  {r.ingredients?.length > 0 && (
                    <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                      {r.ingredients.length} ingr.
                    </span>
                  )}
                  {r.method && (
                    <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{r.method}</span>
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

function Meta({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="text-xs">
      <span style={{ color: 'var(--text-dim)' }}>{icon} {label} · </span>
      <span style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  )
}
