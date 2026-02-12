export const config = { runtime: 'nodejs' };
import { sql } from '@vercel/postgres';

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.UPSTASH_REDIS_URL ||
  process.env.URL_REDIS ||
  process.env.REDIS_URL;
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC NOT NULL,
      stock INTEGER NOT NULL,
      category TEXT NOT NULL,
      brand TEXT NOT NULL,
      image TEXT NOT NULL,
      is_available BOOLEAN NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `;
}

async function getProduct(id) {
  await ensureTable();
  const { rows } = await sql`
    SELECT
      id,
      name,
      description,
      price,
      stock,
      category,
      brand,
      image,
      is_available AS "isAvailable",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM products
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows && rows[0] ? rows[0] : null;
}

function parseJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try {
        const s = Buffer.concat(chunks).toString('utf8');
        resolve(s ? JSON.parse(s) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
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
  const current = await getProduct(id);
  if (!current) {
    res.status(404).json({ ok: false, message: 'Produto não encontrado' });
    return;
  }
  if (method === 'PUT' || method === 'PATCH') {
    try {
      const data = await parseJson(req);
      const updatedAt = Date.now();
      await sql`
        UPDATE products SET
          name = ${data.name ?? current.name},
          description = ${data.description ?? current.description},
          price = ${data.price ?? current.price},
          stock = ${data.stock ?? current.stock},
          category = ${data.category ?? current.category},
          brand = ${data.brand ?? current.brand},
          image = ${data.image ?? current.image},
          is_available = ${typeof data.isAvailable === 'boolean' ? data.isAvailable : current.isAvailable},
          updated_at = ${updatedAt}
        WHERE id = ${id}
      `;
      const updated = { ...current, ...data, updatedAt };
      res.status(200).json({ ok: true, item: updated });
      return;
    } catch {
      res.status(500).json({ ok: false, message: 'Falha ao atualizar produto' });
      return;
    }
  }
  if (method === 'DELETE') {
    await ensureTable();
    await sql`DELETE FROM products WHERE id = ${id}`;
    res.status(200).json({ ok: true });
    return;
  }
  res.status(405).json({ ok: false, message: 'Método não permitido' });
}
