'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Recipe } from '@/types/recipe'
import { isCoffeeMetadata, isCocktailMetadata, isCuisineMetadata } from '@/types/recipe'
import { useRecipes } from '@/hooks/useRecipes'
import TopBar from '@/app/components/TopBar'

const TYPE_ICONS: Record<string, string> = {
  cocktail: '🍸',
  coffee: '☕',
  cuisine: '🍳',
}

interface Props {
  recipe: Recipe
  userId: string
}

export default function RecipeDetail({ recipe, userId }: Props) {
  const router = useRouter()
  const { remove } = useRecipes(userId, [])
  const m = recipe.metadata

  async function handleDelete() {
    if (!confirm('Supprimer cette recette définitivement ?')) return
    await remove(recipe.id)
    router.push('/recipes')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <TopBar
        title={recipe.data.name || 'Recette'}
        backHref="/recipes"
        actions={
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium"
            style={{ background: 'var(--surface2)', color: 'var(--gold)' }}
          >
            Modifier
          </Link>
        }
      />

      <div className="p-4 space-y-5 pb-20">
        {/* En-tête recette */}
        <div
          className="p-5 rounded-[var(--radius)]"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">{TYPE_ICONS[recipe.type]}</span>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                {recipe.data.name}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
                {recipe.type.charAt(0).toUpperCase() + recipe.type.slice(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Métadonnées Cocktail */}
        {isCocktailMetadata(m) && (m.glass || m.family || m.alcohol || m.garnish) && (
          <Section title="Informations">
            <div className="grid grid-cols-2 gap-3">
              {m.glass && <InfoChip label="Verre" value={m.glass} />}
              {m.family && <InfoChip label="Famille" value={m.family} />}
              {m.alcohol && <InfoChip label="Alcool" value={m.alcohol} />}
              {m.garnish && <InfoChip label="Garniture" value={m.garnish} />}
            </div>
          </Section>
        )}

        {/* Métadonnées Café */}
        {isCoffeeMetadata(m) && (
          <Section title="Paramètres café">
            <div className="grid grid-cols-2 gap-3">
              {m.temperature && (
                <InfoChip
                  label="Température"
                  value={m.temperature === 'hot' ? '🔥 Chaud' : m.temperature === 'iced' ? '🧊 Glacé' : '❄️ Cold Brew'}
                />
              )}
              {m.brewMethod && <InfoChip label="Méthode" value={m.brewMethod} />}
              {m.ratio && <InfoChip label="Ratio" value={m.ratio} />}
              {m.grind && <InfoChip label="Mouture" value={m.grind} />}
              {m.extractionTime && <InfoChip label="Extraction" value={`${m.extractionTime}s`} />}
            </div>
          </Section>
        )}

        {/* Métadonnées Cuisine */}
        {isCuisineMetadata(m) && (
          <Section title="Informations">
            <div className="grid grid-cols-3 gap-3">
              {m.servings && <InfoChip label="Portions" value={String(m.servings)} />}
              {m.prepTime && <InfoChip label="Prep" value={`${m.prepTime} min`} />}
              {m.cookTime && <InfoChip label="Cuisson" value={`${m.cookTime} min`} />}
              {m.difficulty && (
                <InfoChip
                  label="Difficulté"
                  value={m.difficulty === 'easy' ? 'Facile' : m.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                />
              )}
            </div>
          </Section>
        )}

        {/* Ingrédients */}
        {recipe.data.ingredients?.length > 0 && (
          <Section title={`Ingrédients (${recipe.data.ingredients.length})`}>
            <ul className="space-y-2">
              {recipe.data.ingredients.map((ing, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 rounded-[var(--radius-sm)]"
                  style={{ background: 'var(--surface2)' }}
                >
                  <span style={{ color: 'var(--text)' }}>{ing.name}</span>
                  <span className="text-sm font-mono" style={{ color: 'var(--gold)' }}>
                    {ing.qty} {ing.unit}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Étapes */}
        {recipe.data.steps && (
          <Section title="Méthode">
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--text)' }}
            >
              {recipe.data.steps}
            </p>
          </Section>
        )}

        {/* Danger zone */}
        <div className="pt-4">
          <button
            onClick={handleDelete}
            className="w-full py-2.5 rounded-[var(--radius-sm)] text-sm"
            style={{ background: '#1A0808', color: '#FF6B6B', border: '1px solid #3D1515' }}
          >
            Supprimer la recette
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="p-4 rounded-[var(--radius)]"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-[var(--radius-sm)]" style={{ background: 'var(--surface2)' }}>
      <p className="text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}
