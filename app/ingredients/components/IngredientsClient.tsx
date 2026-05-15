'use client'

import { useState } from 'react'
import type { Ingredient, IngredientData } from '@/types/ingredient'
import { INGREDIENT_TYPES, costPerUnit } from '@/types/ingredient'
import { useIngredients } from '@/hooks/useIngredients'
import TopBar from '@/app/components/TopBar'

interface Props {
  initialIngredients: Ingredient[]
  userId: string
}

const UNITS = ['cl', 'ml', 'l', 'g', 'kg', 'oz', 'pièce']

function emptyForm(): Omit<IngredientData, 'id'> {
  return { name: '', category: '', type: 'spirit', price: 0, format: 70, unit: 'cl', stock: 0 }
}

export default function IngredientsClient({ initialIngredients, userId }: Props) {
  const { ingredients, saving, create, update, remove } = useIngredients(userId, initialIngredients)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<IngredientData, 'id'>>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)

  const visible = ingredients.filter(i =>
    i.data.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalValue = ingredients.reduce((sum, i) => sum + (i.data.price ?? 0) * (i.data.stock ?? 0), 0)

  function openCreate() {
    setEditId(null)
    setForm(emptyForm())
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(ing: Ingredient) {
    setEditId(ing.id)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = ing.data
    setForm(rest)
    setFormError(null)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Le nom est requis.'); return }
    setFormError(null)
    try {
      if (editId) {
        await update(editId, form)
      } else {
        await create({ ...form, id: crypto.randomUUID() })
      }
      setShowForm(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  function setField<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  const cpu = costPerUnit({ ...form, id: '' })

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <TopBar
        title="Ingrédients"
        backHref="/"
        actions={
          <button
            onClick={openCreate}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: 'var(--gold)', color: '#0A0E1A' }}
          >
            +
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Récap stock */}
        <div
          className="flex justify-between items-center p-4 rounded-[var(--radius)]"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Références</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{ingredients.length}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Valeur stock</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>
              {totalValue.toFixed(2)} €
            </p>
          </div>
        </div>

        {/* Recherche */}
        <input
          type="search"
          placeholder="Rechercher un ingrédient..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-[var(--radius-sm)] text-sm outline-none"
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />

        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {visible.length} ingrédient{visible.length !== 1 ? 's' : ''}
        </p>

        {/* Liste */}
        {visible.length === 0 ? (
          <div
            className="text-center py-16 rounded-[var(--radius)]"
            style={{ background: 'var(--surface)', color: 'var(--text-dim)' }}
          >
            <p className="text-3xl mb-2">🧪</p>
            <p className="text-sm">Aucun ingrédient</p>
            <button
              onClick={openCreate}
              className="mt-4 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium"
              style={{ background: 'var(--gold)', color: '#0A0E1A' }}
            >
              Ajouter un ingrédient
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map(ing => (
              <li key={ing.id}>
                <button
                  onClick={() => openEdit(ing)}
                  className="w-full flex items-center gap-3 p-4 rounded-[var(--radius)] text-left"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--text)' }}>
                      {ing.data.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                      {INGREDIENT_TYPES.find(t => t.value === ing.data.type)?.label ?? ing.data.type}
                      {ing.data.category ? ` · ${ing.data.category}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono font-medium" style={{ color: 'var(--gold)' }}>
                      {costPerUnit(ing.data).toFixed(3)} €/{ing.data.unit}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                      Stock: {ing.data.stock} × {ing.data.format}{ing.data.unit}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Drawer / formulaire */}
      {showForm && (
        <div
          className="fixed inset-0 flex flex-col justify-end z-50"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-[var(--radius)] overflow-y-auto"
            style={{ background: 'var(--surface)', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sticky top-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
                {editId ? 'Modifier' : 'Nouvel ingrédient'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-dim)' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-8">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-dim)' }}>NOM</label>
                  <input type="text" value={form.name} onChange={e => setField('name', e.target.value)}
                    placeholder="Gin Hendrick's" className="field-input" />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-dim)' }}>TYPE</label>
                  <select value={form.type} onChange={e => setField('type', e.target.value as IngredientData['type'])} className="field-input">
                    {INGREDIENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-dim)' }}>CATÉGORIE</label>
                  <input type="text" value={form.category} onChange={e => setField('category', e.target.value)}
                    placeholder="Gin, Champagne..." className="field-input" />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-dim)' }}>PRIX D'ACHAT (€)</label>
                  <input type="number" value={form.price || ''} onChange={e => setField('price', Number(e.target.value))}
                    min={0} step={0.01} placeholder="28.50" className="field-input" />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-dim)' }}>FORMAT</label>
                  <div className="flex gap-1">
                    <input type="number" value={form.format || ''} onChange={e => setField('format', Number(e.target.value))}
                      min={0} step={0.1} placeholder="70" className="field-input" />
                    <select value={form.unit} onChange={e => setField('unit', e.target.value)} className="field-input w-16">
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-dim)' }}>STOCK (bouteilles)</label>
                  <input type="number" value={form.stock || ''} onChange={e => setField('stock', Number(e.target.value))}
                    min={0} step={0.1} placeholder="3" className="field-input" />
                </div>

                {/* Coût calculé en temps réel */}
                {cpu > 0 && (
                  <div className="col-span-2 p-3 rounded-[var(--radius-sm)]" style={{ background: 'var(--surface2)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Coût calculé</p>
                    <p className="text-sm font-mono font-bold mt-0.5" style={{ color: 'var(--gold)' }}>
                      {cpu.toFixed(4)} € / {form.unit}
                      {form.unit === 'cl' ? ` — ${(cpu * 4.5).toFixed(3)} € / 4.5cl` : ''}
                    </p>
                  </div>
                )}
              </div>

              {formError && <p className="text-sm text-red-400">{formError}</p>}

              <div className="flex gap-3 pt-2">
                {editId && (
                  <button
                    type="button"
                    onClick={async () => { await remove(editId); setShowForm(false) }}
                    className="px-4 py-2.5 rounded-[var(--radius-sm)] text-sm"
                    style={{ background: '#1A0808', color: '#FF6B6B', border: '1px solid #3D1515' }}
                  >
                    Supprimer
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold disabled:opacity-50"
                  style={{ background: 'var(--gold)', color: '#0A0E1A' }}
                >
                  {saving ? '...' : editId ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
