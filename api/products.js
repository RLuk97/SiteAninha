export const config = { runtime: 'nodejs' };
import { kv } from '@vercel/kv';

const seedProducts = [
  { id: '1', name: 'Natura Luna', description: 'Perfume feminino floral, notas de jasmim e sândalo. Uma fragrância delicada e sofisticada para momentos especiais.', price: 149.9, category: 'perfumes', brand: 'Natura', image: 'images/product-perfume-1.png', stock: 10, isAvailable: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: '2', name: 'Avon Far Away', description: 'Colônia feminina amadeirada com notas de baunilha e musk. Perfeita para o dia a dia.', price: 89.9, category: 'colonias', brand: 'Avon', image: 'images/product-perfume-2.png', stock: 15, isAvailable: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: '3', name: 'Natura Ekos Creme', description: 'Hidratante corporal com óleo de castanha. Nutre profundamente a pele com ingredientes da biodiversidade brasileira.', price: 59.9, category: 'corpo', brand: 'Natura', image: 'images/product-body-1.png', stock: 20, isAvailable: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: '4', name: 'Natura Tododia', description: 'Creme hidratante para mãos e corpo com aveia. Textura leve e absorção rápida.', price: 34.9, category: 'corpo', brand: 'Natura', image: 'images/product-body-2.png', stock: 25, isAvailable: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: '5', name: 'Natura Plant Shampoo', description: 'Shampoo fortalecedor com extratos naturais. Limpa suavemente e fortalece os fios.', price: 42.9, category: 'cabelo', brand: 'Natura', image: 'images/product-hair-1.png', stock: 12, isAvailable: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: '6', name: 'Avon Advance', description: 'Condicionador reparador para cabelos danificados. Repara pontas duplas e dá brilho.', price: 38.9, category: 'cabelo', brand: 'Avon', image: 'images/product-hair-2.png', stock: 8, isAvailable: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: '7', name: 'Natura Una Batom', description: 'Batom matte de longa duração. Cor intensa e hidratação por até 8 horas.', price: 49.9, category: 'maquiagem', brand: 'Natura', image: 'images/product-makeup-1.png', stock: 30, isAvailable: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: '8', name: 'Avon True Color', description: 'Paleta de sombras com 8 cores vibrantes. Alta pigmentação e durabilidade.', price: 69.9, category: 'maquiagem', brand: 'Avon', image: 'images/product-makeup-2.png', stock: 5, isAvailable: true, createdAt: Date.now(), updatedAt: Date.now() },
];

async function listProducts() {
  let items = await kv.get('products');
  if (!items || !Array.isArray(items)) {
    await kv.set('products', seedProducts);
    items = seedProducts;
  }
  return items;
}

export default async function handler(req, res) {
  const method = req.method;
  if (method === 'GET') {
    const items = await listProducts();
    res.status(200).json({ ok: true, items });
    return;
  }
  if (method === 'POST') {
    try {
      const data = req.body || {};
      const required = ['name', 'description', 'price', 'stock', 'category', 'brand', 'image', 'isAvailable'];
      for (const key of required) {
        if (data[key] === undefined || data[key] === null) {
          res.status(400).json({ ok: false, message: `Campo obrigatório: ${key}` });
          return;
        }
      }
      const items = await listProducts();
      const newItem = {
        id: Date.now().toString(),
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const next = [newItem, ...items];
      await kv.set('products', next);
      res.status(201).json({ ok: true, item: newItem });
      return;
    } catch {
      res.status(500).json({ ok: false, message: 'Falha ao criar produto' });
      return;
    }
  }
  res.status(405).json({ ok: false, message: 'Método não permitido' });
}
