import { query } from '../db.js';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

const PACKS = [
  { id: 'pack_1m', name: '1,000,000 Tokens', tokens: 1000000, price: 1000 },
  { id: 'pack_2.5m', name: '2,500,000 Tokens', tokens: 2500000, price: 2000 },
  { id: 'pack_5m', name: '5,000,000 Tokens', tokens: 5000000, price: 3500 },
];

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  let decoded: any;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { pack_id } = req.body;
  const pack = PACKS.find(p => p.id === pack_id);
  if (!pack) {
    return res.status(400).json({ error: 'Invalid pack' });
  }

  try {
    const { rows } = await query(`SELECT email FROM users WHERE id = $1`, [decoded.userId]);
    const email = rows[0]?.email;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Fade the Chalk — ${pack.name}` },
          unit_amount: pack.price,
        },
        quantity: 1,
      }],
      metadata: {
        user_id: String(decoded.userId),
        pack_id: pack.id,
        tokens: String(pack.tokens),
      },
      success_url: `${process.env.NEXT_PUBLIC_URL || 'https://fadethechalk.vercel.app'}/shop?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'https://fadethechalk.vercel.app'}/shop?cancelled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('checkout error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
