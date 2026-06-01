import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, location, description } = await req.json();
  if (!type || !location || !description?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const desc = description.trim();

  const { error } = await supabase.from('feedback').insert({
    user_id: user.id,
    type,
    location,
    description: desc,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const typeLabel = type === 'bug' ? '🐛 Bug' : '✨ Suggestion';

  // Create GitHub Issue
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (GITHUB_TOKEN) {
    const issueBody = [
      `**Type :** ${typeLabel}`,
      `**Section :** ${location}`,
      `**Utilisateur :** ${user.email}`,
      ``,
      `**Description :**`,
      desc,
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
        title: `[${type === 'bug' ? 'Bug' : 'Feature'}] ${location} — ${desc.slice(0, 60)}${desc.length > 60 ? '…' : ''}`,
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
            <h2 style="margin:0 0 16px">${typeLabel} signalé</h2>
            <p><strong>Section :</strong> ${location}</p>
            <p><strong>Description :</strong></p>
            <p style="background:#f5f5f5;padding:12px;border-radius:6px;white-space:pre-wrap">${desc}</p>
            <p style="color:#888;font-size:12px">Utilisateur : ${user.email}</p>
          </div>`,
      }),
    }).catch(() => {/* non-blocking */});
  }

  return NextResponse.json({ ok: true });
}
