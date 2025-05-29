const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { pixelId, color, imageUrl, linkUrl } = JSON.parse(event.body);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Pixel #${pixelId}`,
          },
          unit_amount: 100, // 1€ en centimes
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.SITE_URL}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/?canceled=true`,
      metadata: {
        pixelId,
        color,
        imageUrl,
        linkUrl
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id })
    };
  } catch (error) {
    console.error('Stripe Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
