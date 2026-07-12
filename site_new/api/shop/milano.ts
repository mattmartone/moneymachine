import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'The Milano — Fade the Chalk',
            description: 'Daily picks, race theories, Commission alerts. Full card from Claudio before post time.',
          },
          unit_amount: 9900,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_URL || 'https://fadethechalk.vercel.app'}/mobile?welcome=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'https://fadethechalk.vercel.app'}/mobile`,
    });

    return res.redirect(303, session.url);
  } catch (err: any) {
    console.error('milano checkout error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
