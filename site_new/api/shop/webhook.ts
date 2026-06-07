import { query } from '../db.js';
import { logComm } from '../lib/logComm.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export const config = {
  api: { bodyParser: false }
};

async function getRawBody(req: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = parseInt(session.metadata?.user_id || '0');
    const tokens = parseInt(session.metadata?.tokens || '0');
    const packId = session.metadata?.pack_id || '';

    if (userId && tokens) {
      await query(
        `UPDATE users SET tokens = tokens + $1, lifetime_tokens_used = lifetime_tokens_used + 0 WHERE id = $2`,
        [tokens, userId]
      );

      const { rows } = await query(`SELECT tokens FROM users WHERE id = $1`, [userId]);
      const newBalance = rows[0]?.tokens || 0;

      await logComm(
        userId,
        'token_purchase',
        `Token pack purchased — ${packId}`,
        `Purchased ${tokens.toLocaleString()} tokens. New balance: ${newBalance.toLocaleString()}.`
      );
    }
  }

  return res.status(200).json({ received: true });
}
