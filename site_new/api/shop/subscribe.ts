import { query } from '../db.js';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const JWT_SECRET = process.env.JWT_SECRET || '';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let email: string | null = null;
    let userId: number | null = null;

    // Two flows: authenticated user OR new signup with email
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        const { rows } = await query(`SELECT id, email, stripe_subscription_id FROM users WHERE id = $1`, [decoded.userId]);
        if (rows[0]?.stripe_subscription_id) {
          return res.status(400).json({ error: 'Already subscribed' });
        }
        email = rows[0]?.email;
        userId = rows[0]?.id;
      } catch {}
    }

    // New signup from homepage (no auth, just email)
    if (!email && req.body.email) {
      email = req.body.email.toLowerCase().trim();
      await query(`INSERT INTO users (email, role, created_at) VALUES ($1, 'member', NOW()) ON CONFLICT (email) DO NOTHING`, [email]);
      const { rows } = await query(`SELECT id FROM users WHERE email = $1`, [email]);
      userId = rows[0]?.id;
    }

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Fade the Chalk — Monthly Membership' },
          unit_amount: 9900,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      metadata: {
        user_id: String(userId || 0),
      },
      success_url: `${process.env.NEXT_PUBLIC_URL || 'https://fadethechalk.vercel.app'}/mobile?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'https://fadethechalk.vercel.app'}?cancelled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('subscribe error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
