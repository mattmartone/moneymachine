import { query } from '../db.js';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

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

  try {
    const { rows } = await query(`SELECT email, stripe_subscription_id FROM users WHERE id = $1`, [decoded.userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.stripe_subscription_id) {
      return res.status(400).json({ error: 'Already subscribed' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Fade the Chalk — Monthly Membership' },
          unit_amount: 1000,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      metadata: {
        user_id: String(decoded.userId),
      },
      success_url: `${process.env.NEXT_PUBLIC_URL || 'https://fadethechalk.vercel.app'}/shop?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'https://fadethechalk.vercel.app'}/shop?cancelled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('subscribe error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
