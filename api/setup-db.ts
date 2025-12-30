
import { db } from '@vercel/postgres';
import { VercelResponse, VercelRequest } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const client = await db.connect();

    // Create Products Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        regular_price FLOAT NOT NULL,
        sale_price FLOAT,
        price FLOAT NOT NULL,
        category TEXT,
        image TEXT,
        stock INTEGER,
        rating FLOAT,
        variations JSONB,
        gallery JSONB
      );
    `;

    // Create Orders Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        date TEXT,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        items JSONB,
        total FLOAT,
        shipping_charge FLOAT,
        shipping_method TEXT,
        payment_method TEXT,
        status TEXT,
        shipping_address JSONB
      );
    `;

    return response.status(200).json({ message: 'Tables created successfully' });
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
