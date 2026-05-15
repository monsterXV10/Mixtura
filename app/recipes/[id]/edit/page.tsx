import { notFound, redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import TopBar from '@/app/components/TopBar'
import RecipeForm from '@/app/recipes/components/RecipeForm'
import type { Recipe } from '@/types/recipe'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (!recipe) notFound()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <TopBar title="Modifier la recette" backHref={`/recipes/${id}`} />
      <RecipeForm userId={user.id} initial={recipe as Recipe} />
    </div>
  )
}
