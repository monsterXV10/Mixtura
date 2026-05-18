'use client'

import { useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Ingredient, IngredientData } from '@/types/ingredient'

export function useIngredients(userId: string, initial: Ingredient[]) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initial)
  const [saving, setSaving] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const create = useCallback(
    async (data: IngredientData) => {
      setSaving(true)
      const { data: created, error } = await supabase
        .from('ingredients')
        .insert({ user_id: userId, data })
        .select()
        .single()
      setSaving(false)
      if (error) throw error
      setIngredients(prev => [created as Ingredient, ...prev])
      return created as Ingredient
    },
    [supabase, userId]
  )

  const update = useCallback(
    async (id: string, patch: Partial<IngredientData>) => {
      setSaving(true)
      const current = ingredients.find(i => i.id === id)
      if (!current) { setSaving(false); return }
      const merged = { ...current.data, ...patch }
      const { data: updated, error } = await supabase
        .from('ingredients')
        .update({ data: merged })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
      setSaving(false)
      if (error) throw error
      setIngredients(prev => prev.map(i => i.id === id ? (updated as Ingredient) : i))
    },
    [supabase, ingredients, userId]
  )

  const remove = useCallback(
    async (id: string) => {
      await supabase.from('ingredients').delete().eq('id', id).eq('user_id', userId)
      setIngredients(prev => prev.filter(i => i.id !== id))
    },
    [supabase, userId]
  )

  return { ingredients, saving, create, update, remove }
}
