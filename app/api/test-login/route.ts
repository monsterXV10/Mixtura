import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const email = process.env.TEST_LOGIN_EMAIL;
  if (!email || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'TEST_LOGIN_EMAIL or SUPABASE_SERVICE_ROLE_KEY not configured' },
      { status: 500 }
    );
  }

  const origin = request.nextUrl.origin;
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${origin}/callback` },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json(
      { error: error?.message ?? 'Impossible de générer le lien' },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.properties.action_link);
}
