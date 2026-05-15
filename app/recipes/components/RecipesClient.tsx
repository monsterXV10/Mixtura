'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Recipe, RecipeType } from '@/types/recipe'
import { useRecipes } from '@/hooks/useRecipes'
import TopBar from '@/app/components/TopBar'

const TYPE_LABELS: Record<RecipeType, string> = {
  cocktail: '🍸 Cocktail',
  coffee: '☕ Café',
  cuisine: '🍳 Cuisine',
}

const TYPE_COLORS: Record<RecipeType, string> = {
  cocktail: '#1E2B4D',
  coffee: '#2B1A0F',
  cuisine: '#1A2B1E',
}

interface Props {
  initialRecipes: Recipe[]
  userId: string
}

export default function RecipesClient({ initialRecipes, userId }: Props) {
  const { recipes, remove } = useRecipes(userId, initialRecipes)
  const [filter, setFilter] = useState<RecipeType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const visible = recipes.filter(r => {
    const matchType = filter === 'all' || r.type === filter
    const matchSearch = r.data.name?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  async function handleDelete(id: string) {
    await remove(id)
    setConfirmDelete(null)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <TopBar title="Recettes" backHref="/" actions={
        <Link
          href="/recipes/new"
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
          style={{ background: 'var(--gold)', color: '#0A0E1A' }}
        >
          +
        </Link>
      } />

      <div className="p-4 space-y-3">
        {/* Barre de recherche */}
        <input
          type="search"
          placeholder="Rechercher une recette..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-[var(--radius-sm)] text-sm outline-none"
          style={{
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
          }}
        />

        {/* Filtres par type */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'cocktail', 'coffee', 'cuisine'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: filter === t ? 'var(--gold)' : 'var(--surface)',
                color: filter === t ? '#0A0E1A' : 'var(--text-dim)',
                border: `1px solid ${filter === t ? 'var(--gold)' : 'var(--border)'}`,
              }}
            >
              {t === 'all' ? 'Tout' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Compteur */}
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {visible.length} recette{visible.length !== 1 ? 's' : ''}
        </p>

        {/* Liste */}
        {visible.length === 0 ? (
          <div
            className="text-center py-16 rounded-[var(--radius)]"
            style={{ background: 'var(--surface)', color: 'var(--text-dim)' }}
          >
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">Aucune recette</p>
            <Link
              href="/recipes/new"
              className="inline-block mt-4 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium"
              style={{ background: 'var(--gold)', color: '#0A0E1A' }}
            >
              Créer une recette
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map(recipe => (
              <li key={recipe.id}>
                <div
                  className="flex items-center gap-3 p-4 rounded-[var(--radius)] relative group"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  {/* Indicateur de type */}
                  <div
                    className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: TYPE_COLORS[recipe.type] }}
                  >
                    {recipe.type === 'cocktail' ? '🍸' : recipe.type === 'coffee' ? '☕' : '🍳'}
                  </div>

                  <Link href={`/recipes/${recipe.id}`} className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--text)' }}>
                      {recipe.data.name || 'Sans nom'}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-dim)' }}>
                      {TYPE_LABELS[recipe.type]}
                      {recipe.data.family ? ` · ${recipe.data.family}` : ''}
                      {recipe.data.ingredients?.length
                        ? ` · ${recipe.data.ingredients.length} ingrédient${recipe.data.ingredients.length > 1 ? 's' : ''}`
                        : ''}
                    </p>
                  </Link>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/recipes/${recipe.id}/edit`}
                      className="w-7 h-7 flex items-center justify-center rounded text-xs"
                      style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}
                    >
                      ✏️
                    </Link>
                    <button
                      onClick={() => setConfirmDelete(recipe.id)}
                      className="w-7 h-7 flex items-center justify-center rounded text-xs"
                      style={{ background: '#2B0F0F', color: '#FF6B6B' }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center p-4 z-50"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-sm p-6 rounded-[var(--radius)] space-y-4"
            style={{ background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="font-medium" style={{ color: 'var(--text)' }}>
              Supprimer cette recette ?
            </p>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-[var(--radius-sm)] text-sm"
                style={{ background: 'var(--surface2)', color: 'var(--text)' }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 rounded-[var(--radius-sm)] text-sm font-medium"
                style={{ background: '#FF4444', color: '#fff' }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
