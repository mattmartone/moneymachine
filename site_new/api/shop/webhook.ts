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

  // One-time token pack purchase
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === 'payment') {
      const userId = parseInt(session.metadata?.user_id || '0');
      const tokens = parseInt(session.metadata?.tokens || '0');
      const packId = session.metadata?.pack_id || '';

      if (userId && tokens) {
        await query(
          `UPDATE users SET tokens = tokens + $1 WHERE id = $2`,
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

    if (session.mode === 'subscription') {
      const userId = parseInt(session.metadata?.user_id || '0');
      const subscriptionId = session.subscription as string;

      if (userId) {
        // Ensure column exists
        await query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT
        `).catch(() => {});
        await query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none'
        `).catch(() => {});

        await query(
          `UPDATE users SET stripe_subscription_id = $1, subscription_status = 'active', tokens = tokens + 5000000 WHERE id = $2`,
          [subscriptionId, userId]
        );

        const { rows } = await query(`SELECT tokens FROM users WHERE id = $1`, [userId]);
        const newBalance = rows[0]?.tokens || 0;

        await logComm(
          userId,
          'subscription_started',
          'Monthly membership activated',
          `Welcome to the crew. 5,000,000 tokens credited. Balance: ${newBalance.toLocaleString()}.`
        );
      }
    }
  }

  // Monthly renewal — credit tokens each billing cycle
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    // Skip the first invoice (already handled by checkout.session.completed)
    if (invoice.billing_reason === 'subscription_cycle') {
      const subscriptionId = invoice.subscription as string;

      const { rows } = await query(
        `SELECT id FROM users WHERE stripe_subscription_id = $1`,
        [subscriptionId]
      );

      if (rows.length > 0) {
        const userId = rows[0].id;
        await query(
          `UPDATE users SET tokens = tokens + 1000000 WHERE id = $1`,
          [userId]
        );

        const balanceResult = await query(`SELECT tokens FROM users WHERE id = $1`, [userId]);
        const newBalance = balanceResult.rows[0]?.tokens || 0;

        await logComm(
          userId,
          'subscription_renewal',
          'Monthly tokens refreshed',
          `1,000,000 tokens credited for this month. Balance: ${newBalance.toLocaleString()}.`
        );
      }
    }
  }

  // Subscription cancelled or payment failed
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    await query(
      `UPDATE users SET subscription_status = 'cancelled', stripe_subscription_id = NULL WHERE stripe_subscription_id = $1`,
      [subscription.id]
    );
  }

  return res.status(200).json({ received: true });
}
