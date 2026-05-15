'use client'

import { useState } from 'react'
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
const GRIND_OPTIONS: CoffeeMetadata['grind'][] = ['fine', 'medium-fine', 'medium', 'coarse']
const GRIND_LABELS: Record<string, string> = { fine: 'Fine', 'medium-fine': 'Médium-fine', medium: 'Médium', coarse: 'Grosse' }
const DIFFICULTY: CuisineMetadata['difficulty'][] = ['easy', 'medium', 'hard']
const DIFFICULTY_LABELS: Record<string, string> = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' }

interface Props {
  userId: string
  initial?: Recipe
}

function emptyIngredient(): RecipeIngredient {
  return { name: '', qty: 0, unit: 'cl' }
}

export default function RecipeForm({ userId, initial }: Props) {
  const router = useRouter()
  const { create, update, saving } = useRecipes(userId, [])

  const [type, setType] = useState<RecipeType>(initial?.type ?? 'cocktail')
  const [name, setName] = useState(initial?.data.name ?? '')
  const [steps, setSteps] = useState(initial?.data.steps ?? '')
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    initial?.data.ingredients?.length ? initial.data.ingredients : [emptyIngredient()]
  )
  const [error, setError] = useState<string | null>(null)

  // Metadata per type
  const initMeta = initial?.metadata ?? defaultMetadata(type)
  const [cocktailMeta, setCocktailMeta] = useState<CocktailMetadata>(
    isCocktailMetadata(initMeta) ? initMeta : { type: 'cocktail' }
  )
  const [coffeeMeta, setCoffeeMeta] = useState<CoffeeMetadata>(
    isCoffeeMetadata(initMeta) ? initMeta : { type: 'coffee', temperature: 'hot', grind: 'medium-fine' }
  )
  const [cuisineMeta, setCuisineMeta] = useState<CuisineMetadata>(
    isCuisineMetadata(initMeta) ? initMeta : { type: 'cuisine', servings: 4, difficulty: 'medium' }
  )

  function handleTypeChange(t: RecipeType) {
    setType(t)
  }

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
    <form onSubmit={handleSubmit} className="p-4 space-y-5 pb-24">
      {/* Sélecteur de type */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>
          TYPE DE RECETTE
        </label>
        <div className="flex gap-2">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className="flex-1 flex flex-col items-center gap-1 py-3 rounded-[var(--radius-sm)] text-xs font-medium transition-all"
              style={{
                background: type === t.value ? 'var(--gold)' : 'var(--surface)',
                color: type === t.value ? '#0A0E1A' : 'var(--text-dim)',
                border: `1px solid ${type === t.value ? 'var(--gold)' : 'var(--border)'}`,
              }}
            >
              <span className="text-xl">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nom */}
      <Field label="NOM DE LA RECETTE">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Negroni, Espresso Martini..."
          className="field-input"
        />
      </Field>

      {/* Champs spécifiques Cocktail */}
      {type === 'cocktail' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="VERRE">
              <input
                type="text"
                value={cocktailMeta.glass ?? ''}
                onChange={e => setCocktailMeta(m => ({ ...m, glass: e.target.value }))}
                placeholder="Coupe, Rocks..."
                className="field-input"
              />
            </Field>
            <Field label="FAMILLE">
              <select
                value={cocktailMeta.family ?? ''}
                onChange={e => setCocktailMeta(m => ({ ...m, family: e.target.value }))}
                className="field-input"
              >
                <option value="">—</option>
                {COCKTAIL_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ALCOOL DE BASE">
              <input
                type="text"
                value={cocktailMeta.alcohol ?? ''}
                onChange={e => setCocktailMeta(m => ({ ...m, alcohol: e.target.value }))}
                placeholder="Gin, Rhum, Vodka..."
                className="field-input"
              />
            </Field>
            <Field label="GARNITURE">
              <input
                type="text"
                value={cocktailMeta.garnish ?? ''}
                onChange={e => setCocktailMeta(m => ({ ...m, garnish: e.target.value }))}
                placeholder="Zeste citron..."
                className="field-input"
              />
            </Field>
          </div>
        </>
      )}

      {/* Champs spécifiques Café */}
      {type === 'coffee' && (
        <>
          <Field label="TEMPÉRATURE">
            <div className="flex gap-2">
              {(['hot', 'iced', 'cold-brew'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCoffeeMeta(m => ({ ...m, temperature: t }))}
                  className="flex-1 py-2 rounded-[var(--radius-sm)] text-xs font-medium"
                  style={{
                    background: coffeeMeta.temperature === t ? 'var(--gold)' : 'var(--surface2)',
                    color: coffeeMeta.temperature === t ? '#0A0E1A' : 'var(--text-dim)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {t === 'hot' ? '🔥 Chaud' : t === 'iced' ? '🧊 Glacé' : '❄️ Cold Brew'}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="MÉTHODE D'EXTRACTION">
              <input
                type="text"
                value={coffeeMeta.brewMethod ?? ''}
                onChange={e => setCoffeeMeta(m => ({ ...m, brewMethod: e.target.value }))}
                placeholder="Espresso, V60, AeroPress..."
                className="field-input"
              />
            </Field>
            <Field label="RATIO CAFÉ:EAU">
              <input
                type="text"
                value={coffeeMeta.ratio ?? ''}
                onChange={e => setCoffeeMeta(m => ({ ...m, ratio: e.target.value }))}
                placeholder="1:15"
                className="field-input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="MOUTURE">
              <select
                value={coffeeMeta.grind ?? 'medium-fine'}
                onChange={e => setCoffeeMeta(m => ({ ...m, grind: e.target.value as CoffeeMetadata['grind'] }))}
                className="field-input"
              >
                {GRIND_OPTIONS.map(g => (
                  <option key={g} value={g}>{GRIND_LABELS[g ?? 'medium']}</option>
                ))}
              </select>
            </Field>
            <Field label="TEMPS D'EXTRACTION (s)">
              <input
                type="number"
                value={coffeeMeta.extractionTime ?? ''}
                onChange={e => setCoffeeMeta(m => ({ ...m, extractionTime: Number(e.target.value) }))}
                placeholder="25"
                min={0}
                className="field-input"
              />
            </Field>
          </div>
        </>
      )}

      {/* Champs spécifiques Cuisine */}
      {type === 'cuisine' && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="PORTIONS">
            <input
              type="number"
              value={cuisineMeta.servings ?? 4}
              onChange={e => setCuisineMeta(m => ({ ...m, servings: Number(e.target.value) }))}
              min={1}
              className="field-input"
            />
          </Field>
          <Field label="PREP (min)">
            <input
              type="number"
              value={cuisineMeta.prepTime ?? ''}
              onChange={e => setCuisineMeta(m => ({ ...m, prepTime: Number(e.target.value) }))}
              min={0}
              placeholder="15"
              className="field-input"
            />
          </Field>
          <Field label="CUISSON (min)">
            <input
              type="number"
              value={cuisineMeta.cookTime ?? ''}
              onChange={e => setCuisineMeta(m => ({ ...m, cookTime: Number(e.target.value) }))}
              min={0}
              placeholder="30"
              className="field-input"
            />
          </Field>
          <div className="col-span-3">
            <Field label="DIFFICULTÉ">
              <div className="flex gap-2">
                {DIFFICULTY.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setCuisineMeta(m => ({ ...m, difficulty: d }))}
                    className="flex-1 py-2 rounded-[var(--radius-sm)] text-xs font-medium"
                    style={{
                      background: cuisineMeta.difficulty === d ? 'var(--gold)' : 'var(--surface2)',
                      color: cuisineMeta.difficulty === d ? '#0A0E1A' : 'var(--text-dim)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {DIFFICULTY_LABELS[d ?? 'medium']}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>
      )}

      {/* Ingrédients */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>
            INGRÉDIENTS
          </label>
          <button
            type="button"
            onClick={addIngredient}
            className="text-xs px-2 py-1 rounded"
            style={{ background: 'var(--surface2)', color: 'var(--gold)' }}
          >
            + Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-2 items-center" style={{ minWidth: 0 }}>
              <input
                type="number"
                value={ing.qty || ''}
                onChange={e => updateIngredient(idx, 'qty', Number(e.target.value))}
                placeholder="0"
                min={0}
                step="0.1"
                className="field-input text-center"
                style={{ width: '3.5rem', flexShrink: 0 }}
              />
              <select
                value={ing.unit}
                onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                className="field-input"
                style={{ width: '3.5rem', flexShrink: 0, paddingLeft: '6px', paddingRight: '4px' }}
              >
                {['cl', 'ml', 'oz', 'g', 'kg', 'trait', 'goutte', 'pièce'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <input
                type="text"
                value={ing.name}
                onChange={e => updateIngredient(idx, 'name', e.target.value)}
                placeholder="Nom de l'ingrédient"
                className="field-input"
                style={{ flex: 1, minWidth: 0 }}
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded text-xs"
                  style={{ background: '#2B0F0F', color: '#FF6B6B' }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Étapes / Méthode */}
      <Field label="MÉTHODE / ÉTAPES">
        <textarea
          value={steps}
          onChange={e => setSteps(e.target.value)}
          placeholder="Décrivez les étapes de préparation..."
          rows={4}
          className="field-input resize-none"
        />
      </Field>

      {error && (
        <p className="text-sm text-red-400 px-1">{error}</p>
      )}

      {/* Bouton submit fixé en bas */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 z-10"
        style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}
      >
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-[var(--radius)] font-semibold text-sm disabled:opacity-50"
          style={{ background: 'var(--gold)', color: '#0A0E1A' }}
        >
          {saving ? 'Sauvegarde...' : initial ? 'Mettre à jour' : 'Créer la recette'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
