import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { type PlanId } from '@/config/plans';
import PlanClient from './PlanClient';

export default async function PlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const currentPlan = (profile?.plan ?? 'free') as PlanId;

  return (
    <>
      <TopBar title="Plans & abonnement" />
      <main className="px-4 py-5 pb-24 max-w-xl mx-auto">
        <PlanClient currentPlan={currentPlan} />
      </main>
    </>
  );
}
