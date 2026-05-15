import { getSupabaseServerClient } from '@/lib/supabase/server'
import CatalogClient from './components/CatalogClient'

export const revalidate = 3600

export interface CatalogRecipe {
  id: string
  name: string
  glass: string | null
  family: string | null
  alcohol: string | null
  method: string | null
  ice: string | null
  garnish: string | null
  ingredients: { qty: number; name: string; unit: string }[]
  steps: string | null
  source: string | null
}

export default async function CatalogPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: recipes } = await supabase
    .from('catalog')
    .select('id, name, glass, family, alcohol, method, ice, garnish, ingredients, steps, source')
    .order('name')

  return <CatalogClient recipes={(recipes ?? []) as CatalogRecipe[]} userId={user?.id ?? null} />
}
