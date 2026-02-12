export const config = { runtime: 'nodejs' };
import { put, list } from '@vercel/blob';

const FILENAME = 'catalog.json';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: FILENAME });
      let url = null;
      if (blobs && blobs.length) {
        const exact = blobs.find(b => b.pathname === FILENAME);
        url = (exact || blobs[0]).url;
      }
      if (!url) {
        res.status(200).json({ ok: true, items: [] });
        return;
      }
      const r = await fetch(url, { cache: 'no-store' });
      const text = await r.text();
      const items = JSON.parse(text);
      res.status(200).json({ ok: true, items: Array.isArray(items) ? items : [] });
    } catch {
      res.status(200).json({ ok: true, items: [] });
    }
    return;
  }
  if (req.method === 'PUT') {
    try {
      const items = req.body?.items;
      if (!Array.isArray(items)) {
        res.status(400).json({ ok: false, message: 'Formato inválido: items deve ser um array' });
        return;
      }
      await put(FILENAME, JSON.stringify(items), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      });
      res.status(200).json({ ok: true });
    } catch {
      res.status(500).json({ ok: false, message: 'Falha ao salvar catálogo' });
    }
    return;
  }
  res.status(405).json({ ok: false, message: 'Método não permitido' });
}
