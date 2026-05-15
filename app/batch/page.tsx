import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import BatchClient from './components/BatchClient'

export default async function BatchPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, data, type, metadata')
    .eq('user_id', user.id)
    .order('data->name')

  return <BatchClient recipes={recipes ?? []} />
}
