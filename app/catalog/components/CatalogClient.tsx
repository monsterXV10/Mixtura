'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Ingredient {
  id: string
  name: string
  brand: string | null
  category: string
  type: string
  default_format: number
  default_unit: string
  typical_price: number | null
  abv: number | null
  country: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  spirit:       'Spiritueux',
  liqueur:      'Liqueurs',
  bitters:      'Bitters',
  sirop:        'Sirops',
  vin:          'Vins & vermouths',
  'eau de vie': 'Eaux-de-vie',
  épicerie:     'Épicerie',
  fruit:        'Fruits',
  légume:       'Légumes',
}

export default function CatalogClient({ ingredients }: { ingredients: Ingredient[] }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const categories = useMemo(
    () => [...new Set(ingredients.map(i => i.category))].sort(),
    [ingredients]
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return ingredients.filter(i => {
      const matchSearch = !q || i.name.toLowerCase().includes(q) || (i.brand ?? '').toLowerCase().includes(q)
      const matchCat = !activeCategory || i.category === activeCategory
      return matchSearch && matchCat
    })
  }, [ingredients, query, activeCategory])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold tracking-widest" style={{ color: 'var(--gold)' }}>MIXTURA</span>
            <span className="ml-2 text-sm" style={{ color: 'var(--text-dim)' }}>· Catalogue IBA</span>
          </div>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold"
            style={{ background: 'var(--gold)', color: '#0A0E1A' }}
          >
            Se connecter
          </Link>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Rechercher un ingrédient..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-[var(--radius-sm)] text-sm outline-none"
          style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />

        {/* Category chips */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveCategory(null)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              background: activeCategory === null ? 'var(--gold)' : 'var(--surface2)',
              color: activeCategory === null ? '#0A0E1A' : 'var(--text-dim)',
            }}
          >
            Tout ({ingredients.length})
          </button>
          {categories.map(cat => {
            const count = ingredients.filter(i => i.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: activeCategory === cat ? 'var(--gold)' : 'var(--surface2)',
                  color: activeCategory === cat ? '#0A0E1A' : 'var(--text-dim)',
                }}
              >
                {CATEGORY_LABELS[cat] ?? cat} ({count})
              </button>
            )
          })}
        </div>
      </header>

      {/* Grid */}
      <main className="p-4">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--text-dim)' }}>
            Aucun résultat pour &laquo; {query} &raquo;
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map(item => (
              <div
                key={item.id}
                className="rounded-[var(--radius)] p-3 flex flex-col gap-1"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text)' }}>
                    {item.name}
                  </p>
                  {item.abv != null && (
                    <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
                      {item.abv}%
                    </span>
                  )}
                </div>
                {item.brand && (
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{item.brand}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--surface2)', color: 'var(--gold)' }}
                  >
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                  {item.typical_price != null && (
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                      ~{item.typical_price}€/{item.default_format}{item.default_unit}
                    </span>
                  )}
                </div>
                {item.country && (
                  <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{item.country}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CTA bas de page */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none">
        <div
          className="max-w-sm mx-auto text-center p-4 rounded-[var(--radius)] pointer-events-auto"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
            Gérez vos recettes, calculez vos food costs et collaborez en équipe.
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

      {/* Espace pour la CTA fixe */}
      <div className="h-28" />
    </div>
  )
}
