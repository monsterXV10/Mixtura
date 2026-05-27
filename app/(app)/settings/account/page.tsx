import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { PLANS, type PlanId } from '@/config/plans';
import AccountClient from './AccountClient';

export const dynamic = 'force-dynamic';

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, plan')
    .eq('id', user.id)
    .single();

  const plan = ((profile?.plan as PlanId) ?? 'free') as PlanId;
  const provider = (user.app_metadata?.provider as string) ?? 'email';

  return (
    <>
      <TopBar title="Mon compte" backHref="/settings" />
      <main className="px-4 py-5 pb-safe max-w-xl mx-auto">
        <AccountClient
          userId={user.id}
          email={user.email ?? ''}
          displayName={profile?.display_name ?? ''}
          planName={PLANS[plan].name}
          provider={provider}
        />
      </main>
    </>
  );
}
