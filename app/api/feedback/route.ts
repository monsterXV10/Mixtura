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

  const { error } = await supabase.from('feedback').insert({
    user_id: user.id,
    type,
    location,
    description: description.trim(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send email via Resend if configured
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FEEDBACK_EMAIL = process.env.FEEDBACK_EMAIL ?? 'kuhlichalexis@gmail.com';
  if (RESEND_API_KEY) {
    const typeLabel = type === 'bug' ? '🐛 Bug' : '✨ Suggestion';
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
            <p style="background:#f5f5f5;padding:12px;border-radius:6px;white-space:pre-wrap">${description.trim()}</p>
            <p style="color:#888;font-size:12px">Utilisateur : ${user.email}</p>
          </div>`,
      }),
    }).catch(() => {/* non-blocking */});
  }

  return NextResponse.json({ ok: true });
}
