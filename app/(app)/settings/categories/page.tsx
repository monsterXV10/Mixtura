import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import CategoriesClient from './CategoriesClient';
import type { CategoryConfig } from '@/lib/config/categoryFields';

export default async function CategoriesSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('visible_categories, category_suggestions, category_config')
    .eq('id', user.id)
    .single();

  const visibleCategories   = (profile?.visible_categories   as string[] | null)      ?? null;
  const categorySuggestions = (profile?.category_suggestions as Record<string, string[]> | null) ?? null;
  const categoryConfig      = (profile?.category_config      as CategoryConfig | null) ?? null;

  return (
    <>
      <TopBar title="Catalogue & Ingrédients" backHref="/settings" />
      <main className="px-4 py-5 pb-safe max-w-xl mx-auto">
        <CategoriesClient
          userId={user.id}
          visibleCategories={visibleCategories}
          categorySuggestions={categorySuggestions}
          categoryConfig={categoryConfig}
        />
      </main>
    </>
  );
}
