'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import TopBar from '@/app/components/TopBar'
import type { LegacyRecipeData } from '@/types/recipe'

interface Recipe {
  id: string
  data: LegacyRecipeData
  type: string
  metadata: Record<string, unknown>
}

export default function BatchClient({ recipes }: { recipes: Recipe[] }) {
  const [selectedId, setSelectedId] = useState<string>(recipes[0]?.id ?? '')
  const [multiplier, setMultiplier] = useState(10)
  const [unit, setUnit] = useState<'portions' | 'litres'>('portions')

  const recipe = useMemo(
    () => recipes.find(r => r.id === selectedId),
    [recipes, selectedId]
  )

  const baseQty = useMemo(() => {
    if (!recipe?.data.ingredients?.length) return 0
    return recipe.data.ingredients.reduce((sum, i) => {
      const qty = i.qty ?? 0
      if (['cl', 'ml'].includes(i.unit ?? '')) {
        return sum + (i.unit === 'ml' ? qty / 100 : qty / 100)
      }
      return sum
    }, 0)
  }, [recipe])

  const effectiveMultiplier = useMemo(() => {
    if (unit === 'litres' && baseQty > 0) {
      return Math.round((multiplier * 100) / (baseQty * 100)) || 1
    }
    return multiplier
  }, [unit, multiplier, baseQty])

  if (!recipes.length) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <TopBar title="Batch Calculator" backHref="/" />
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Aucune recette disponible.</p>
          <Link
            href="/recipes/new"
            className="px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold"
            style={{ background: 'var(--gold)', color: '#0A0E1A' }}
          >
            Créer une recette
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <TopBar title="Batch Calculator" backHref="/" />

      <div className="p-4 space-y-4 pb-8">
        {/* Sélection recette */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
            RECETTE DE BASE
          </label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="field-input"
          >
            {recipes.map(r => (
              <option key={r.id} value={r.id}>{r.data.name}</option>
            ))}
          </select>
        </div>

        {/* Multiplicateur */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
            QUANTITÉ CIBLE
          </label>
          <div className="flex gap-2">
            <div className="flex rounded-[var(--radius-sm)] overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
              {(['portions', 'litres'] as const).map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className="px-3 py-2 text-xs font-medium"
                  style={{
                    background: unit === u ? 'var(--gold)' : 'var(--surface2)',
                    color: unit === u ? '#0A0E1A' : 'var(--text-dim)',
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={multiplier}
              onChange={e => setMultiplier(Math.max(1, Number(e.target.value)))}
              min={1}
              className="field-input flex-1"
            />
          </div>
          {unit === 'portions' && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
              × {effectiveMultiplier} par rapport à la recette de base
            </p>
          )}
          {unit === 'litres' && baseQty > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
              ≈ {effectiveMultiplier} portions (base = {(baseQty).toFixed(2)} L)
            </p>
          )}
        </div>

        {/* Résultat */}
        {recipe && recipe.data.ingredients?.length ? (
          <div
            className="rounded-[var(--radius)] overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
            >
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  {recipe.data.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {effectiveMultiplier} portions
                </p>
              </div>
              <span className="text-2xl">📦</span>
            </div>
            <div style={{ background: 'var(--surface2)' }}>
              {recipe.data.ingredients.map((ing, i) => {
                const scaled = (ing.qty ?? 0) * effectiveMultiplier
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: i < recipe.data.ingredients!.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <span className="text-sm" style={{ color: 'var(--text)' }}>{ing.name}</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--gold)' }}>
                      {scaled % 1 === 0 ? scaled : scaled.toFixed(1)} {ing.unit}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--text-dim)' }}>
            Cette recette n&apos;a pas d&apos;ingrédients saisis.
          </p>
        )}
      </div>
    </div>
  )
}
