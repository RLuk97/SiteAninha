export const config = { runtime: 'edge' };
import { kv } from '@vercel/kv';

async function listProducts() {
  const items = await kv.get('products');
  return Array.isArray(items) ? items : [];
}

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  const method = req.method;
  let items = await listProducts();
  const index = items.findIndex(p => p.id === id);
  if (index === -1) {
    return new Response(JSON.stringify({ ok: false, message: 'Produto não encontrado' }), { status: 404, headers: { 'content-type': 'application/json' } });
  }
  if (method === 'PUT' || method === 'PATCH') {
    try {
      const data = await req.json();
      const updated = { ...items[index], ...data, updatedAt: Date.now() };
      items[index] = updated;
      await kv.set('products', items);
      return new Response(JSON.stringify({ ok: true, item: updated }), { status: 200, headers: { 'content-type': 'application/json' } });
    } catch {
      return new Response(JSON.stringify({ ok: false, message: 'Falha ao atualizar produto' }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
  }
  if (method === 'DELETE') {
    items = items.filter(p => p.id !== id);
    await kv.set('products', items);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response(JSON.stringify({ ok: false, message: 'Método não permitido' }), { status: 405, headers: { 'content-type': 'application/json' } });
}
