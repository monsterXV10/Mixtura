'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Recipe, RecipeType, RecipeIngredient, LegacyRecipeData, CoffeeMetadata, CocktailMetadata, CuisineMetadata } from '@/types/recipe'
import { isCoffeeMetadata, isCocktailMetadata, isCuisineMetadata, defaultMetadata } from '@/types/recipe'
import { useRecipes } from '@/hooks/useRecipes'

const TYPES: { value: RecipeType; label: string; icon: string }[] = [
  { value: 'cocktail', label: 'Cocktail', icon: '🍸' },
  { value: 'coffee', label: 'Café', icon: '☕' },
  { value: 'cuisine', label: 'Cuisine', icon: '🍳' },
]

const COCKTAIL_FAMILIES = ['Sour', 'Fizz', 'Highball', 'Sling', 'Flip', 'Collins', 'Old Fashioned', 'Martini', 'Negroni', 'Tropical', 'Hot', 'Autre']
const GLASS_OPTIONS = ['Cocktail / Martini', 'Coupe', 'Rocks / Old Fashioned', 'Highball', 'Collins', 'Nick & Nora', 'Flûte', 'Verre à vin', 'Tiki Mug', 'Shot', 'Mug', 'Tumbler']
const MENU_OPTIONS = ['Carte principale', 'Carte saison', 'Carte été', 'Carte hiver', 'Brunch', 'Happy Hour', 'Signature', 'Classiques', 'Sans alcool', 'Hors carte']
const GRIND_OPTIONS: CoffeeMetadata['grind'][] = ['fine', 'medium-fine', 'medium', 'coarse']
const GRIND_LABELS: Record<string, string> = { fine: 'Fine', 'medium-fine': 'Médium-fine', medium: 'Médium', coarse: 'Grosse' }
const DIFFICULTY: CuisineMetadata['difficulty'][] = ['easy', 'medium', 'hard']
const DIFFICULTY_LABELS: Record<string, string> = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' }

interface Props {
  userId: string
  initial?: Recipe
  ingredientNames?: string[]
}

function emptyIngredient(): RecipeIngredient {
  return { name: '', qty: 0, unit: 'cl' }
}

export default function RecipeForm({ userId, initial, ingredientNames = [] }: Props) {
  const router = useRouter()
  const { create, update, saving } = useRecipes(userId, [])

  const [type, setType] = useState<RecipeType>(initial?.type ?? 'cocktail')
  const [name, setName] = useState(initial?.data.name ?? '')
  const [steps, setSteps] = useState(initial?.data.steps ?? '')
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    initial?.data.ingredients?.length ? initial.data.ingredients : [emptyIngredient()]
  )
  const [error, setError] = useState<string | null>(null)
  const [activeIngIdx, setActiveIngIdx] = useState<number | null>(null)
  const ingInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const initMeta = initial?.metadata ?? defaultMetadata(type)
  const [cocktailMeta, setCocktailMeta] = useState<CocktailMetadata>(
    isCocktailMetadata(initMeta) ? initMeta : { type: 'cocktail' }
  )
  const initGlass = isCocktailMetadata(initMeta) ? (initMeta.glass ?? '') : ''
  const [glassCustom, setGlassCustom] = useState(!GLASS_OPTIONS.includes(initGlass) && initGlass !== '')
  const initMenu = isCocktailMetadata(initMeta) ? (initMeta.menu ?? '') : ''
  const [menuCustom, setMenuCustom] = useState(!MENU_OPTIONS.includes(initMenu) && initMenu !== '')
  const [coffeeMeta, setCoffeeMeta] = useState<CoffeeMetadata>(
    isCoffeeMetadata(initMeta) ? initMeta : { type: 'coffee', temperature: 'hot', grind: 'medium-fine' }
  )
  const [cuisineMeta, setCuisineMeta] = useState<CuisineMetadata>(
    isCuisineMetadata(initMeta) ? initMeta : { type: 'cuisine', servings: 4, difficulty: 'medium' }
  )

  function updateIngredient(idx: number, field: keyof RecipeIngredient, value: string | number) {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing))
  }

  function addIngredient() {
    setIngredients(prev => [...prev, emptyIngredient()])
  }

  function removeIngredient(idx: number) {
    setIngredients(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom de la recette est requis.'); return }
    setError(null)

    const data: LegacyRecipeData = {
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      steps,
      ingredients: ingredients.filter(i => i.name.trim()),
    }
    const metadata = type === 'cocktail' ? cocktailMeta : type === 'coffee' ? coffeeMeta : cuisineMeta

    try {
      if (initial) {
        await update(initial.id, data, metadata)
        router.push(`/recipes/${initial.id}`)
      } else {
        const created = await create(data, type, metadata)
        router.push(`/recipes/${created.id}`)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pb-24">
      <div className="max-w-xl mx-auto px-4 pt-4 space-y-3">

        {/* Sélecteur de type — tabs compacts */}
        <div
          className="flex rounded-[var(--radius)] overflow-hidden p-1 gap-1"
          style={{ background: 'var(--surface)' }}
        >
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-all"
              style={{
                background: type === t.value ? 'var(--gold)' : 'transparent',
                color: type === t.value ? '#0A0E1A' : 'var(--text-dim)',
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Nom */}
        <div className="rounded-[var(--radius)] overflow-hidden" style={{ background: 'var(--surface)' }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nom de la recette"
            className="w-full px-4 py-4 text-lg font-semibold bg-transparent outline-none"
            style={{ color: 'var(--text)' }}
            autoFocus={!initial}
          />
        </div>

        {/* Ingrédients — section centrale */}
        <Section title="Ingrédients" icon="🧪">
          <div className="space-y-2">
            {ingredients.map((ing, idx) => {
              const query = ing.name.toLowerCase()
              const suggestions = activeIngIdx === idx && ing.name.length >= 1
                ? ingredientNames.filter(n => n.toLowerCase().includes(query) && n.toLowerCase() !== query)
                : []
              return (
              <div key={idx} className="flex gap-2 items-center">
                <div className="relative" style={{ flex: 1, minWidth: 0 }}>
                  <input
                    ref={el => { ingInputRefs.current[idx] = el }}
                    type="text"
                    value={ing.name}
                    onChange={e => updateIngredient(idx, 'name', e.target.value)}
                    onFocus={() => setActiveIngIdx(idx)}
                    onBlur={() => setTimeout(() => setActiveIngIdx(null), 160)}
                    placeholder="Ingrédient"
                    className="field-input"
                    style={{ width: '100%' }}
                  />
                  {suggestions.length > 0 && (
                    <ul
                      className="absolute left-0 right-0 top-full mt-1 rounded-[var(--radius-sm)] overflow-hidden z-30 shadow-lg"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
                    >
                      {suggestions.slice(0, 6).map(s => (
                        <li key={s}>
                          <button
                            type="button"
                            onMouseDown={() => {
                              updateIngredient(idx, 'name', s)
                              setActiveIngIdx(null)
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:opacity-80"
                            style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <input
                  type="number"
                  value={ing.qty || ''}
                  onChange={e => updateIngredient(idx, 'qty', Number(e.target.value))}
                  placeholder="Qté"
                  min={0}
                  step="0.1"
                  className="field-input text-center font-semibold"
                  style={{ width: '4rem', flexShrink: 0 }}
                />
                <select
                  value={ing.unit}
                  onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                  className="field-input"
                  style={{ width: '4rem', flexShrink: 0, paddingLeft: '6px', paddingRight: '2px' }}
                >
                  {['cl', 'ml', 'oz', 'g', 'kg', 'trait', 'goutte', 'pièce'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-sm"
                    style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}
                  >
                    ×
                  </button>
                )}
              </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            className="mt-2 w-full py-2.5 rounded-[var(--radius-sm)] text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
            style={{ background: 'var(--surface2)', color: 'var(--gold)', border: '1px dashed var(--gold)', opacity: 0.8 }}
          >
            + Ajouter un ingrédient
          </button>
        </Section>

        {/* Champs spécifiques par type */}
        {type === 'cocktail' && (
          <Section title="Détails" icon="🥃">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Verre</label>
                {!glassCustom ? (
                  <select
                    value={cocktailMeta.glass ?? ''}
                    onChange={e => {
                      if (e.target.value === '__autre') {
                        setGlassCustom(true)
                        setCocktailMeta(m => ({ ...m, glass: '' }))
                      } else {
                        setCocktailMeta(m => ({ ...m, glass: e.target.value }))
                      }
                    }}
                    className="field-input"
                  >
                    <option value="">— Choisir —</option>
                    {GLASS_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    <option value="__autre">Autre…</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cocktailMeta.glass ?? ''}
                      onChange={e => setCocktailMeta(m => ({ ...m, glass: e.target.value }))}
                      placeholder="Ex: Ceramic tiki mug..."
                      className="field-input flex-1"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setGlassCustom(false); setCocktailMeta(m => ({ ...m, glass: '' })) }}
                      className="px-3 rounded-[var(--radius-sm)] text-xs"
                      style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border)', flexShrink: 0 }}
                    >
                      ← Liste
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Famille</label>
                <select
                  value={cocktailMeta.family ?? ''}
                  onChange={e => setCocktailMeta(m => ({ ...m, family: e.target.value }))}
                  className="field-input"
                >
                  <option value="">—</option>
                  {COCKTAIL_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Menu / Carte</label>
                {!menuCustom ? (
                  <select
                    value={cocktailMeta.menu ?? ''}
                    onChange={e => {
                      if (e.target.value === '__autre') {
                        setMenuCustom(true)
                        setCocktailMeta(m => ({ ...m, menu: '' }))
                      } else {
                        setCocktailMeta(m => ({ ...m, menu: e.target.value }))
                      }
                    }}
                    className="field-input"
                  >
                    <option value="">— Choisir —</option>
                    {MENU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    <option value="__autre">Autre…</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cocktailMeta.menu ?? ''}
                      onChange={e => setCocktailMeta(m => ({ ...m, menu: e.target.value }))}
                      placeholder="Ex: Carte printemps..."
                      className="field-input flex-1"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setMenuCustom(false); setCocktailMeta(m => ({ ...m, menu: '' })) }}
                      className="px-3 rounded-[var(--radius-sm)] text-xs flex-shrink-0"
                      style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
                    >
                      ← Liste
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Garniture</label>
                <input
                  type="text"
                  value={cocktailMeta.garnish ?? ''}
                  onChange={e => setCocktailMeta(m => ({ ...m, garnish: e.target.value }))}
                  placeholder="Zeste, feuille..."
                  className="field-input"
                />
              </div>
            </div>
          </Section>
        )}

        {type === 'coffee' && (
          <Section title="Détails café" icon="☕">
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Température</label>
                <div className="flex gap-2">
                  {(['hot', 'iced', 'cold-brew'] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => setCoffeeMeta(m => ({ ...m, temperature: t }))}
                      className="flex-1 py-2 rounded-[var(--radius-sm)] text-xs font-medium"
                      style={{
                        background: coffeeMeta.temperature === t ? 'var(--gold)' : 'var(--surface2)',
                        color: coffeeMeta.temperature === t ? '#0A0E1A' : 'var(--text-dim)',
                        border: '1px solid var(--border)',
                      }}>
                      {t === 'hot' ? '🔥 Chaud' : t === 'iced' ? '🧊 Glacé' : '❄️ Cold Brew'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Méthode</label>
                  <input type="text" value={coffeeMeta.brewMethod ?? ''}
                    onChange={e => setCoffeeMeta(m => ({ ...m, brewMethod: e.target.value }))}
                    placeholder="Espresso, V60..." className="field-input" />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Ratio café:eau</label>
                  <input type="text" value={coffeeMeta.ratio ?? ''}
                    onChange={e => setCoffeeMeta(m => ({ ...m, ratio: e.target.value }))}
                    placeholder="1:15" className="field-input" />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Mouture</label>
                  <select value={coffeeMeta.grind ?? 'medium-fine'}
                    onChange={e => setCoffeeMeta(m => ({ ...m, grind: e.target.value as CoffeeMetadata['grind'] }))}
                    className="field-input">
                    {GRIND_OPTIONS.map(g => <option key={g} value={g}>{GRIND_LABELS[g ?? 'medium']}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Extraction (s)</label>
                  <input type="number" value={coffeeMeta.extractionTime ?? ''}
                    onChange={e => setCoffeeMeta(m => ({ ...m, extractionTime: Number(e.target.value) }))}
                    placeholder="25" min={0} className="field-input" />
                </div>
              </div>
            </div>
          </Section>
        )}

        {type === 'cuisine' && (
          <Section title="Détails cuisine" icon="🍳">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Portions</label>
                <input type="number" value={cuisineMeta.servings ?? 4}
                  onChange={e => setCuisineMeta(m => ({ ...m, servings: Number(e.target.value) }))}
                  min={1} className="field-input" />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Prép (min)</label>
                <input type="number" value={cuisineMeta.prepTime ?? ''}
                  onChange={e => setCuisineMeta(m => ({ ...m, prepTime: Number(e.target.value) }))}
                  placeholder="15" min={0} className="field-input" />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Cuisson (min)</label>
                <input type="number" value={cuisineMeta.cookTime ?? ''}
                  onChange={e => setCuisineMeta(m => ({ ...m, cookTime: Number(e.target.value) }))}
                  placeholder="30" min={0} className="field-input" />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Difficulté</label>
              <div className="flex gap-2">
                {DIFFICULTY.map(d => (
                  <button key={d} type="button"
                    onClick={() => setCuisineMeta(m => ({ ...m, difficulty: d }))}
                    className="flex-1 py-2 rounded-[var(--radius-sm)] text-sm font-medium"
                    style={{
                      background: cuisineMeta.difficulty === d ? 'var(--gold)' : 'var(--surface2)',
                      color: cuisineMeta.difficulty === d ? '#0A0E1A' : 'var(--text-dim)',
                      border: '1px solid var(--border)',
                    }}>
                    {DIFFICULTY_LABELS[d ?? 'medium']}
                  </button>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* Méthode / étapes */}
        <Section title="Préparation" icon="📋">
          <textarea
            value={steps}
            onChange={e => setSteps(e.target.value)}
            placeholder="Décrivez les étapes de préparation..."
            rows={4}
            className="field-input resize-none"
          />
        </Section>

        {error && (
          <p className="text-sm text-red-400 px-1">{error}</p>
        )}
      </div>

      {/* Bouton submit fixé en bas */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 z-10"
        style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}
      >
        <div className="max-w-xl mx-auto">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-[var(--radius)] font-bold text-base disabled:opacity-50"
            style={{ background: 'var(--gold)', color: '#0A0E1A' }}
          >
            {saving ? 'Sauvegarde…' : initial ? 'Mettre à jour' : 'Créer la recette'}
          </button>
        </div>
      </div>
    </form>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-base">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
          {title}
        </span>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}
