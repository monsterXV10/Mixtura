import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import RecipesClient from '@/app/recipes/components/RecipesClient'
import type { Recipe } from '@/types/recipe'

export default async function RecipesPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return <RecipesClient initialRecipes={(recipes ?? []) as Recipe[]} userId={user.id} />
}
