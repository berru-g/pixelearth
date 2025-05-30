const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { pixelIds, color, imageUrl, linkUrl } = JSON.parse(event.body)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Pixels ${pixelIds.join(', ')}`,
        },
        unit_amount: 100,
      },
      quantity: pixelIds.length,
    }],
    mode: 'payment',
    success_url: `${process.env.SITE_URL}/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.SITE_URL}/?canceled=true`,
    metadata: {
      pixelIds: pixelIds.join(','),
      color,
      imageUrl,
      linkUrl,
    }
  })


  return {
    statusCode: 200,
    body: JSON.stringify({ url: session.url }) // ← Important !
  };

} catch (error) {
  console.error('Stripe Error:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: error.message })
  };
}
};
