export const config = { runtime: 'nodejs' };
import { kv } from '@vercel/kv';

async function listProducts() {
  const items = await kv.get('products');
  return Array.isArray(items) ? items : [];
}

export default async function handler(req, res) {
  const method = req.method;
  let id = (req.query && req.query.id) || null;
  if (!id) {
    try {
      const url = new URL(req.url, 'http://localhost');
      id = url.pathname.split('/').pop();
    } catch {}
  }
  let items = await listProducts();
  const index = items.findIndex(p => p.id === id);
  if (index === -1) {
    res.status(404).json({ ok: false, message: 'Produto não encontrado' });
    return;
  }
  if (method === 'PUT' || method === 'PATCH') {
    try {
      const data = req.body || {};
      const updated = { ...items[index], ...data, updatedAt: Date.now() };
      items[index] = updated;
      await kv.set('products', items);
      res.status(200).json({ ok: true, item: updated });
      return;
    } catch {
      res.status(500).json({ ok: false, message: 'Falha ao atualizar produto' });
      return;
    }
  }
  if (method === 'DELETE') {
    items = items.filter(p => p.id !== id);
    await kv.set('products', items);
    res.status(200).json({ ok: true });
    return;
  }
  res.status(405).json({ ok: false, message: 'Método não permitido' });
}
