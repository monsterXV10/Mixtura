'use client'

import { useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Recipe, RecipeType, LegacyRecipeData, RecipeMetadata } from '@/types/recipe'
import { defaultMetadata } from '@/types/recipe'

export function useRecipes(userId: string, initial: Recipe[]) {
  const [recipes, setRecipes] = useState<Recipe[]>(initial)
  const [saving, setSaving] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const create = useCallback(
    async (data: LegacyRecipeData, type: RecipeType, metadata?: RecipeMetadata) => {
      setSaving(true)
      const row = {
        user_id: userId,
        type,
        data,
        metadata: metadata ?? defaultMetadata(type),
      }
      const { data: created, error } = await supabase
        .from('recipes')
        .insert(row)
        .select()
        .single()
      setSaving(false)
      if (error) throw error
      setRecipes(prev => [created as Recipe, ...prev])
      return created as Recipe
    },
    [supabase, userId]
  )

  const update = useCallback(
    async (id: string, data: Partial<LegacyRecipeData>, metadata?: RecipeMetadata) => {
      setSaving(true)
      const current = recipes.find(r => r.id === id)
      if (!current) { setSaving(false); return }

      const merged = { ...current.data, ...data }
      const patch: Partial<Recipe> = { data: merged }
      if (metadata) patch.metadata = metadata

      const { data: updated, error } = await supabase
        .from('recipes')
        .update(patch)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
      setSaving(false)
      if (error) throw error
      setRecipes(prev => prev.map(r => (r.id === id ? (updated as Recipe) : r)))
    },
    [supabase, recipes, userId]
  )

  const remove = useCallback(
    async (id: string) => {
      await supabase.from('recipes').delete().eq('id', id).eq('user_id', userId)
      setRecipes(prev => prev.filter(r => r.id !== id))
    },
    [supabase, userId]
  )

  return { recipes, saving, create, update, remove }
}
