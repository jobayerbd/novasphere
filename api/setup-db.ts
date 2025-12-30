
import { db } from '@vercel/postgres';
import { VercelResponse, VercelRequest } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const client = await db.connect();

    // Products টেবিল তৈরি
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

    // Orders টেবিল তৈরি
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

    // চেক করা হচ্ছে প্রোডাক্ট আছে কি না, না থাকলে সিডিং করা হবে
    const productCheck = await client.sql`SELECT COUNT(*) FROM products;`;
    if (parseInt(productCheck.rows[0].count) === 0) {
      await client.sql`
        INSERT INTO products (id, name, description, regular_price, price, category, image, stock, rating, variations, gallery)
        VALUES ('1', 'Aether Pro Wireless', 'Premium noise cancelling headphones.', 349.99, 299.99, 'electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800', 25, 4.8, '[]', '[]');
      `;
    }

    return response.status(200).json({ 
      success: true, 
      message: 'Database structure is ready and seeded.' 
    });
  } catch (error: any) {
    console.error(error);
    return response.status(500).json({ 
      error: error.message,
      hint: "Make sure you have linked your Vercel Postgres database in the project settings."
    });
  }
}
