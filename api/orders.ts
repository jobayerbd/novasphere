
import { db } from '@vercel/postgres';
import { VercelResponse, VercelRequest } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const client = await db.connect();

    if (request.method === 'GET') {
      const { rows } = await client.sql`SELECT * FROM orders ORDER BY date DESC;`;
      const orders = rows.map(o => ({
        ...o,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        shippingCharge: o.shipping_charge,
        shippingMethodName: o.shipping_method,
        paymentMethodName: o.payment_method,
        shippingAddress: o.shipping_address
      }));
      return response.status(200).json(orders);
    }

    if (request.method === 'POST') {
      const o = request.body;
      await client.sql`
        INSERT INTO orders (id, user_id, date, customer_name, customer_email, customer_phone, items, total, shipping_charge, shipping_method, payment_method, status, shipping_address)
        VALUES (${o.id}, ${o.userId}, ${o.date}, ${o.customerName}, ${o.customerEmail}, ${o.customerPhone}, ${JSON.stringify(o.items)}, ${o.total}, ${o.shippingCharge}, ${o.shippingMethodName}, ${o.paymentMethodName}, ${o.status}, ${JSON.stringify(o.shippingAddress)});
      `;
      return response.status(201).json({ message: 'Order created' });
    }

    if (request.method === 'PATCH') {
      const { id, status } = request.body;
      await client.sql`UPDATE orders SET status = ${status} WHERE id = ${id};`;
      return response.status(200).json({ message: 'Status updated' });
    }

    return response.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error(error);
    return response.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
