import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  
  const { action, priceId, userId, userEmail } = req.body;

  try {
    if (action === 'create_subscription') {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId }
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        currency: 'ron'
      });

      res.status(200).json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        customerId: customer.id
      });
    }

    if (action === 'cancel_subscription') {
      const { subscriptionId } = req.body;
      await stripe.subscriptions.cancel(subscriptionId);
      res.status(200).json({ success: true });
    }

  } catch(e) {
    console.error('Stripe error:', e);
    res.status(500).json({ error: e.message });
  }
}