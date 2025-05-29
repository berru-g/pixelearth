const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let session;

  try {
    session = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (session.type === 'checkout.session.completed') {
    const data = session.data.object;
    const meta = data.metadata;

    await supabase.from('pixels').update({
      is_sold: true,
      color: meta.color,
      image_url: meta.imageUrl,
      link_url: meta.linkUrl,
      stripe_session_id: data.id
    }).eq('id', meta.pixelId);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
