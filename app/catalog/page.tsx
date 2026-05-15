import { getSupabaseServerClient } from '@/lib/supabase/server'
import CatalogClient from './components/CatalogClient'

export const revalidate = 3600

export default async function CatalogPage() {
  const supabase = await getSupabaseServerClient()
  const { data: ingredients } = await supabase
    .from('catalog_ingredients')
    .select('id, name, brand, category, type, default_format, default_unit, typical_price, abv, country')
    .order('category')
    .order('name')

  return <CatalogClient ingredients={ingredients ?? []} />
}
