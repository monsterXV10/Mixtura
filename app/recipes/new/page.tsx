import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import TopBar from '@/app/components/TopBar'
import RecipeForm from '@/app/recipes/components/RecipeForm'

export default async function NewRecipePage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <TopBar title="Nouvelle recette" backHref="/recipes" />
      <RecipeForm userId={user.id} />
    </div>
  )
}
