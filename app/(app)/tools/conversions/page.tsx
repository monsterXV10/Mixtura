import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import ConversionsClient from './ConversionsClient';

export const dynamic = 'force-dynamic';

export default async function ConversionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: rows } = await supabase
    .from('ingredients')
    .select('id, data')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(500);

  const ingredients = (rows ?? []).flatMap((r) => {
    const d = r.data as {
      name?: string; unit?: string; isOutput?: boolean;
      weightConversion?: { referenceQty: number; grams: number };
    } | null;
    if (!d?.name || d?.isOutput) return [];
    return [{
      id: r.id as string,
      name: d.name,
      unit: d.unit ?? '',
      weightConversion: d.weightConversion,
    }];
  });

  return (
    <>
      <TopBar title="Conversions poids" backHref="/tools" />
      <main className="px-4 py-5 pb-24">
        <ConversionsClient ingredients={ingredients} userId={user.id} />
      </main>
    </>
  );
}
