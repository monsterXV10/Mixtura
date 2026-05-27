// Supabase Edge Function: invite-email
// Sends a team invitation email via Resend.
// Secrets required (set in Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  — your Resend API key (re_...)
//   RESEND_FROM     — optional, e.g. "Mixtura <noreply@votredomaine.com>".
//                     Defaults to Resend's onboarding sender (test only).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const { teamId, inviteeEmail, joinUrl } = await req.json();
    if (!teamId || !inviteeEmail) return json({ error: 'Missing teamId or inviteeEmail' }, 400);

    // Caller-scoped client (RLS applies, identity from JWT)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    // Authorization: caller must own or manage the team
    const { data: team } = await supabase
      .from('teams')
      .select('id, name, code, owner_id')
      .eq('id', teamId)
      .single();
    if (!team) return json({ error: 'Team not found' }, 404);

    const { data: me } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();

    const isManager =
      team.owner_id === user.id || (me && ['admin', 'manager'].includes(me.role));
    if (!isManager) return json({ error: 'Forbidden' }, 403);

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY not configured' }, 500);

    const from = Deno.env.get('RESEND_FROM') ?? 'Mixtura <onboarding@resend.dev>';
    const inviterName =
      (user.user_metadata?.full_name as string) ?? user.email ?? 'Un collègue';
    const url = typeof joinUrl === 'string' ? joinUrl : '';

    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#0A0E1A">
        <div style="text-align:center;margin-bottom:24px">
          <div style="display:inline-flex;width:48px;height:48px;border-radius:12px;background:#C8A45C;align-items:center;justify-content:center">
            <span style="color:#0A0E1A;font-weight:700;font-size:22px;line-height:48px">M</span>
          </div>
        </div>
        <h1 style="font-size:20px;text-align:center;margin:0 0 8px">Rejoignez l'équipe ${team.name}</h1>
        <p style="text-align:center;color:#555;margin:0 0 24px">${inviterName} vous invite sur Mixtura.</p>
        <div style="background:#f4f1ea;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">Code d'équipe</p>
          <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:6px;font-family:monospace">${team.code}</p>
        </div>
        ${
          url
            ? `<div style="text-align:center;margin-bottom:24px"><a href="${url}" style="display:inline-block;background:#C8A45C;color:#0A0E1A;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:10px">Rejoindre l'équipe</a></div>`
            : ''
        }
        <p style="text-align:center;color:#888;font-size:13px;margin:0">
          Ou ouvrez Mixtura → Réglages → Équipe → Rejoindre, et entrez le code ci-dessus.
        </p>
      </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [inviteeEmail],
        subject: `Rejoignez l'équipe ${team.name} sur Mixtura`,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: 'Resend send failed', detail }, 502);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
