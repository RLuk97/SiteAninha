export const config = { runtime: 'edge' };
import { put } from '@vercel/blob';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, message: 'Método não permitido' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }
  const url = new URL(req.url);
  const filename = url.searchParams.get('filename') || `upload-${Date.now()}`;
  const contentType = req.headers.get('content-type') || 'application/octet-stream';
  try {
    const blob = await put(filename, req.body, { access: 'public', contentType });
    return new Response(JSON.stringify({ ok: true, url: blob.url, filename: filename }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: 'Falha no upload' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
