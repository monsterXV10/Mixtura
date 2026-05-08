// Serverless function: upload cocktail photo to Vercel Blob
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  // Read raw request body to bypass any body-parser size limits
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  let name, type, data;
  try {
    ({ name, type, data } = JSON.parse(rawBody));
  } catch {
    res.status(400).json({ error: 'Invalid JSON' }); return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) { res.status(500).json({ error: 'Storage not configured' }); return; }

  // Strip data URI prefix and decode base64
  const base64 = (data || '').replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) { res.status(400).json({ error: 'Empty image' }); return; }

  const safeName = (name || 'photo').replace(/[^a-z0-9._-]/gi, '_');

  const blobRes = await fetch(`https://blob.vercel-storage.com/cocktails/${safeName}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': type || 'image/jpeg',
      'x-api-version': '7',
      'x-add-random-suffix': '1',
    },
    body: buffer,
  });

  if (!blobRes.ok) {
    const errText = await blobRes.text();
    res.status(500).json({ error: errText }); return;
  }

  const blob = await blobRes.json();
  res.status(200).json({ url: blob.url });
};
