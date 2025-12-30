
import { db } from '@vercel/postgres';
import { VercelResponse, VercelRequest } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const client = await db.connect();

  if (request.method === 'GET') {
    const { rows } = await client.sql`SELECT * FROM products ORDER BY name ASC;`;
    // Map snake_case to camelCase for frontend
    const products = rows.map(r => ({
      ...r,
      regularPrice: r.regular_price,
      salePrice: r.sale_price,
    }));
    return response.status(200).json(products);
  }

  if (request.method === 'POST') {
    const p = request.body;
    await client.sql`
      INSERT INTO products (id, name, description, regular_price, sale_price, price, category, image, stock, rating, variations, gallery)
      VALUES (${p.id}, ${p.name}, ${p.description}, ${p.regularPrice}, ${p.salePrice}, ${p.price}, ${p.category}, ${p.image}, ${p.stock}, ${p.rating}, ${JSON.stringify(p.variations)}, ${JSON.stringify(p.gallery)})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        regular_price = EXCLUDED.regular_price,
        sale_price = EXCLUDED.sale_price,
        price = EXCLUDED.price,
        category = EXCLUDED.category,
        image = EXCLUDED.image,
        stock = EXCLUDED.stock,
        rating = EXCLUDED.rating,
        variations = EXCLUDED.variations,
        gallery = EXCLUDED.gallery;
    `;
    return response.status(201).json({ message: 'Product updated' });
  }

  if (request.method === 'DELETE') {
    const { id } = request.query;
    await client.sql`DELETE FROM products WHERE id = ${id as string};`;
    return response.status(200).json({ message: 'Deleted' });
  }
}
