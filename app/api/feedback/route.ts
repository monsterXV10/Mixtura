import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const VALID_TYPES = ['bug', 'suggestion'];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, location, description } = await req.json();
  if (!type || !location || !description?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (typeof location !== 'string' || location.length > 100) {
    return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
  }

  const desc = description.trim();
  if (desc.length > 5000) {
    return NextResponse.json({ error: 'Description too long' }, { status: 400 });
  }

  // Rate limit: max 5 feedbacks per 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', tenMinutesAgo);
  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez dans quelques minutes.' }, { status: 429 });
  }

  const { error } = await supabase.from('feedback').insert({
    user_id: user.id,
    type,
    location,
    description: desc,
  });
  if (error) return NextResponse.json({ error: 'Erreur lors de l\'enregistrement.' }, { status: 500 });

  const typeLabel = type === 'bug' ? '🐛 Bug' : '✨ Suggestion';

  // Create GitHub Issue
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (GITHUB_TOKEN) {
    const sanitizeGh = (s: string) => s.replace(/@/g, '@ ').replace(/#(\d+)/g, '# $1');
    const issueBody = [
      `**Type :** ${typeLabel}`,
      `**Section :** ${sanitizeGh(location)}`,
      `**Utilisateur :** ${user.email}`,
      ``,
      `**Description :**`,
      sanitizeGh(desc),
    ].join('\n');

    await fetch('https://api.github.com/repos/monsterXV10/Mixtura/issues', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title: `[${type === 'bug' ? 'Bug' : 'Feature'}] ${sanitizeGh(location)} — ${sanitizeGh(desc.slice(0, 60))}${desc.length > 60 ? '…' : ''}`,
        body: issueBody,
        labels: [type === 'bug' ? 'bug' : 'enhancement'],
      }),
    }).catch(() => {/* non-blocking */});
  }

  // Send email via Resend
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FEEDBACK_EMAIL = process.env.FEEDBACK_EMAIL ?? 'support.mixtura@gmail.com';
  if (RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mixtura Feedback <noreply@mixtura.buzz>',
        to: [FEEDBACK_EMAIL],
        subject: `[Mixtura] ${typeLabel} — ${location}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;color:#1a1a1a">
            <h2 style="margin:0 0 16px">${escapeHtml(typeLabel)} signalé</h2>
            <p><strong>Section :</strong> ${escapeHtml(location)}</p>
            <p><strong>Description :</strong></p>
            <p style="background:#f5f5f5;padding:12px;border-radius:6px;white-space:pre-wrap">${escapeHtml(desc)}</p>
            <p style="color:#888;font-size:12px">Utilisateur : ${escapeHtml(user.email ?? '')}</p>
          </div>`,
      }),
    }).catch(() => {/* non-blocking */});
  }

  return NextResponse.json({ ok: true });
}
