id : integer (primary key, de 0 à 399)

is_sold : boolean (default false)

user_email : text

color : text (optionnel)

link_url : text (optionnel)

💸 Stripe : À faire ensuite

Pour le paiement :

    Créer un petit backend (en Node, Python ou en Serverless sur Vercel/Netlify).

    Quand l’utilisateur clique, tu envoies une requête vers /create-checkout-session.

    Stripe Checkout redirige vers une page de succès où tu stockes l’achat.

✅ Étapes à suivre maintenant :

    ✅ Crée ton projet Supabase.

    ✅ Crée la table pixels avec les colonnes (id, is_sold, user_email, etc.).

    🟨 Génére tes 400 pixels manuellement ou avec un petit script SQL.

    ✅ Renseigne ton SUPABASE_URL et SUPABASE_ANON_KEY dans supabase.js.

    🟨 Pour Stripe, je te prépare ensuite une version avec paiement fonctionnel (à brancher sur un backend léger ou serverless).