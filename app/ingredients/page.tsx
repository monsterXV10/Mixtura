import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import IngredientsClient from '@/app/ingredients/components/IngredientsClient'
import type { Ingredient } from '@/types/ingredient'

export default async function IngredientsPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('*')
    .order('updated_at', { ascending: false })

  return (
    <IngredientsClient
      initialIngredients={(ingredients ?? []) as Ingredient[]}
      userId={user.id}
    />
  )
}
