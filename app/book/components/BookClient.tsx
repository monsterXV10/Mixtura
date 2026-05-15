'use client'

import { useState } from 'react'
import Link from 'next/link'
import TopBar from '@/app/components/TopBar'
import type { LegacyRecipeData, RecipeType } from '@/types/recipe'

interface Recipe {
  id: string
  data: LegacyRecipeData
  type: RecipeType
  metadata: Record<string, unknown>
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  cocktail: '🍸',
  coffee: '☕',
  cuisine: '🍳',
}

const TYPE_LABEL: Record<string, string> = {
  cocktail: 'Cocktail',
  coffee: 'Café',
  cuisine: 'Cuisine',
}

export default function BookClient({ recipes }: { recipes: Recipe[] }) {
  const [selected, setSelected] = useState<Recipe | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filtered = recipes.filter(r => {
    const matchSearch = !search || r.data.name?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || r.type === typeFilter
    return matchSearch && matchType
  })

  if (selected) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <TopBar
          title={selected.data.name ?? 'Recette'}
          backHref="#"
          actions={
            <Link
              href={`/recipes/${selected.id}/edit`}
              className="text-xs px-3 py-1.5 rounded-[var(--radius-sm)]"
              style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
            >
              Modifier
            </Link>
          }
        />
        {/* Use a button for back instead of href="#" */}
        <button
          onClick={() => setSelected(null)}
          className="sr-only"
        />

        <div className="p-5 pb-12 space-y-5 max-w-2xl mx-auto">
          {/* Header */}
          <div
            className="rounded-[var(--radius)] p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                {selected.data.name}
              </h1>
              <span className="text-3xl">{TYPE_ICON[selected.type] ?? '📖'}</span>
            </div>
            <span
              className="inline-block text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--gold)', color: '#0A0E1A' }}
            >
              {TYPE_LABEL[selected.type] ?? selected.type}
            </span>

            {/* Metadata cocktail */}
            {selected.type === 'cocktail' && selected.metadata && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(selected.metadata.glass as string) && (
                  <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    🥃 <span style={{ color: 'var(--text)' }}>{selected.metadata.glass as string}</span>
                  </div>
                )}
                {(selected.metadata.family as string) && (
                  <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    🏷 <span style={{ color: 'var(--text)' }}>{selected.metadata.family as string}</span>
                  </div>
                )}
                {(selected.metadata.alcohol as string) && (
                  <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    🍾 <span style={{ color: 'var(--text)' }}>{selected.metadata.alcohol as string}</span>
                  </div>
                )}
                {(selected.metadata.garnish as string) && (
                  <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    🌿 <span style={{ color: 'var(--text)' }}>{selected.metadata.garnish as string}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ingrédients */}
          {selected.data.ingredients?.length ? (
            <div>
              <h2 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                Ingrédients
              </h2>
              <div className="rounded-[var(--radius)] overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {selected.data.ingredients.map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      background: 'var(--surface)',
                      borderBottom: i < selected.data.ingredients!.length - 1 ? '1px solid var(--border)' : 'none',
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
          ) : null}

          {/* Méthode */}
          {selected.data.steps && (
            <div>
              <h2 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                Méthode
              </h2>
              <div
                className="rounded-[var(--radius)] p-4 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {selected.data.steps}
              </div>
            </div>
          )}

          <button
            onClick={() => setSelected(null)}
            className="w-full py-3 rounded-[var(--radius)] text-sm font-medium"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
          >
            ← Retour au livre
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <TopBar title="Livre de recettes" backHref="/" />

      <div className="p-4 space-y-3 pb-8">
        {/* Search */}
        <input
          type="search"
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="field-input"
        />

        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {[
            { v: 'all', l: `Tout (${recipes.length})` },
            { v: 'cocktail', l: `🍸 Cocktails` },
            { v: 'coffee', l: `☕ Cafés` },
            { v: 'cuisine', l: `🍳 Cuisine` },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setTypeFilter(v)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: typeFilter === v ? 'var(--gold)' : 'var(--surface)',
                color: typeFilter === v ? '#0A0E1A' : 'var(--text-dim)',
                border: '1px solid var(--border)',
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Aucune recette trouvée.</p>
            <Link
              href="/recipes/new"
              className="inline-block mt-3 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold"
              style={{ background: 'var(--gold)', color: '#0A0E1A' }}
            >
              + Nouvelle recette
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map(r => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="text-left rounded-[var(--radius)] p-4 transition-opacity hover:opacity-80 active:scale-95"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-base leading-tight" style={{ color: 'var(--text)' }}>
                    {r.data.name}
                  </p>
                  <span className="text-2xl ml-2 flex-shrink-0">{TYPE_ICON[r.type] ?? '📖'}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--surface2)', color: 'var(--gold)' }}
                  >
                    {TYPE_LABEL[r.type] ?? r.type}
                  </span>
                  {r.data.ingredients?.length ? (
                    <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                      {r.data.ingredients.length} ingrédient{r.data.ingredients.length > 1 ? 's' : ''}
                    </span>
                  ) : null}
                  {r.type === 'cocktail' && typeof r.metadata?.glass === 'string' && r.metadata.glass && (
                    <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                      🥃 {r.metadata.glass}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
