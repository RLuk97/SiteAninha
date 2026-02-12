export const config = { runtime: 'nodejs' };
import { Redis } from '@upstash/redis';

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.UPSTASH_REDIS_URL ||
  process.env.URL_REDIS ||
  process.env.REDIS_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.UPSTASH_REDIS_TOKEN ||
  process.env.TOKEN_REDIS ||
  process.env.REDIS_TOKEN;
const redis =
  REDIS_URL && REDIS_TOKEN
    ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
    : null;

async function listProducts() {
  if (!redis) return [];
  const items = await redis.get('products');
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
      if (!redis) {
        res.status(500).json({ ok: false, message: 'Redis não configurado. Adicione UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN.' });
        return;
      }
      const data = req.body || {};
      const updated = { ...items[index], ...data, updatedAt: Date.now() };
      items[index] = updated;
      await redis.set('products', items);
      res.status(200).json({ ok: true, item: updated });
      return;
    } catch {
      res.status(500).json({ ok: false, message: 'Falha ao atualizar produto' });
      return;
    }
  }
  if (method === 'DELETE') {
    if (!redis) {
      res.status(500).json({ ok: false, message: 'Redis não configurado. Adicione UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN.' });
      return;
    }
    items = items.filter(p => p.id !== id);
    await redis.set('products', items);
    res.status(200).json({ ok: true });
    return;
  }
  res.status(405).json({ ok: false, message: 'Método não permitido' });
}
