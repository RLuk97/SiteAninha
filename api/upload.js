export const config = { runtime: 'nodejs' };
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Método não permitido' });
    return;
  }
  const filename = (req.query?.filename) || `upload-${Date.now()}`;
  const contentType = req.headers['content-type'] || 'application/octet-stream';
  try {
    const buffer = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
    const blob = await put(filename, buffer, { access: 'public', contentType });
    res.status(200).json({ ok: true, url: blob.url, filename });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Falha no upload' });
  }
}
