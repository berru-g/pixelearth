const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

exports.handler = async (event) => {
  const { session_id } = JSON.parse(event.body)

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)
    return {
      statusCode: 200,
      body: JSON.stringify({ metadata: session.metadata })
    }
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message })
    }
  }
}
