import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import BookClient from './components/BookClient'

export default async function BookPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, data, type, metadata, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <BookClient recipes={recipes ?? []} />
}
