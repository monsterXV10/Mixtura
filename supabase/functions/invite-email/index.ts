// Supabase Edge Function: invite-email
// Sends a team invitation email via Resend.
// Secrets required (set in Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  — your Resend API key (re_...)
//   RESEND_FROM     — optional, e.g. "Mixtura <noreply@votredomaine.com>".
//                     Defaults to Resend's onboarding sender (test only).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = new Set([
  'https://mixtura.buzz',
  'https://www.mixtura.buzz',
  'http://localhost:3000',
]);

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://mixtura.buzz';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401, origin);

    const { teamId, inviteeEmail, joinUrl } = await req.json();
    if (!teamId || !inviteeEmail) return json({ error: 'Missing teamId or inviteeEmail' }, 400, origin);

    // Caller-scoped client (RLS applies, identity from JWT)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401, origin);

    // Authorization: caller must own or manage the team
    const { data: team } = await supabase
      .from('teams')
      .select('id, name, code, owner_id')
      .eq('id', teamId)
      .single();
    if (!team) return json({ error: 'Team not found' }, 404, origin);

    const { data: me } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();

    const isManager =
      team.owner_id === user.id || (me && ['admin', 'manager'].includes(me.role));
    if (!isManager) return json({ error: 'Forbidden' }, 403, origin);

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY not configured' }, 500, origin);

    const rawName = (user.user_metadata?.full_name as string) ?? user.email ?? 'Un collègue';
    const inviterName = escapeHtml(rawName);
    const teamName = escapeHtml(team.name as string);
    const teamCode = escapeHtml(team.code as string);
    const from = `${rawName} via Mixtura <invitations@mixtura.buzz>`;

    // Only allow https:// join URLs to prevent javascript: injection
    const safeUrl = typeof joinUrl === 'string' && joinUrl.startsWith('https://') ? joinUrl : '';

    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a1a;background:#ffffff">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1a1a1a">Bonjour,</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1a1a1a">
          <strong>${inviterName}</strong> vous invite à rejoindre l'équipe <strong>${teamName}</strong> sur Mixtura, l'outil de gestion de bar et de cocktails.
        </p>
        <p style="margin:0 0 8px;font-size:14px;color:#555">Votre code d'équipe :</p>
        <p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:8px;font-family:monospace;color:#1a1a1a">${teamCode}</p>
        ${
          safeUrl
            ? `<p style="margin:0 0 24px"><a href="${escapeHtml(safeUrl)}" style="display:inline-block;background:#C8A45C;color:#0A0E1A;text-decoration:none;font-weight:600;padding:10px 24px;border-radius:8px;font-size:14px">Rejoindre l'équipe →</a></p>`
            : ''
        }
        <p style="margin:0 0 32px;font-size:13px;line-height:1.6;color:#777">
          Ou ouvrez Mixtura → Réglages → Équipe → Rejoindre, et entrez le code ci-dessus.
        </p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 16px">
        <p style="margin:0;font-size:12px;color:#999">Mixtura — mixtura.buzz</p>
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
      return json({ error: 'Resend send failed', detail }, 502, origin);
    }

    return json({ ok: true }, 200, origin);
  } catch {
    return json({ error: 'Internal server error' }, 500, origin);
  }
});
