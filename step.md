📁 /mon-projet
├── index.html
├── style.css
├── script.js
├── supabase.js (optionnel si intégré dans index)
├── netlify/
│   └── functions/
│       ├── createCheckoutSession.js
│       └── stripeWebhook.js
├── .gitignore
└── package.json (optionnel)

## RECAP GLOBAL

➡️ SUPABASE – CONFIGURATION table

create table pixels (
  id integer primary key,
  is_sold boolean default false,
  user_email text,
  color text default '#ffffff',
  image_url text,
  link_url text,
  stripe_session_id text
);

➡️  SUPABASE CONFIG SQL

 insert into pixels (id)
select generate_series(0, 1599);


➡️ Activer l’auth par email (avec OTP)

    Supabase > Auth > Settings > Auth providers > Email
    ✅ coche Enable email auth

🟦 3. STRIPE – CONFIGURATION

A. Crée ton compte : https://dashboard.stripe.com/test/apikeys

    Clé secrète (sk_test_...)

    Clé publique (pas utile ici car on utilise checkout.sessions.create côté backend)

B. Crée un endpoint webhook

    Dashboard > Developers > Webhooks

    Ajouter une URL :

https://tonsite.netlify.app/.netlify/functions/stripeWebhook

Coche l'événement checkout.session.completed

Stripe va te générer une clé whsec_...

🟨 4. NETLIFY – CONFIGURATION & DEPLOY
A. Crée ton site Netlify (via Git ou Upload manuel)

    Connecte ton GitHub OU

    Glisse ton dossier avec index.html

B. Ajoute les Variables d’environnement :

    Site Settings > Environment variables

Nom	Valeur provenant de
STRIPE_SECRET_KEY	Stripe dashboard
STRIPE_WEBHOOK_SECRET	Webhook Stripe
SUPABASE_URL	Supabase > Settings > API
SUPABASE_SERVICE_ROLE_KEY	Supabase > Settings > API (⚠️ pas public)
✅ Coche “all scopes” si c’est proposé.

🧪 5. TEST DEPUIS index.html

    L’utilisateur se connecte par email

    Il clique un pixel libre

    Un formulaire s’affiche (lien, image, couleur)

    Il clique “Acheter” → Stripe Checkout

    Stripe redirige vers index.html?session_id=...

    Ton JS affiche une SweetAlert de succès

    Le pixel est mis à jour via le webhook Stripe → Supabase

📦 6. FICHIERS BACKEND
/netlify/functions/createCheckoutSession.js

    Crée une session Stripe avec metadata

    Redirige vers Stripe Checkout

/netlify/functions/stripeWebhook.js

    Reçoit le webhook checkout.session.completed

    Met à jour Supabase avec les infos metadata

🧹 7. À vérifier en cas de Netlify Deploy Fail

✅ Check ta structure :

    Pas de faute dans netlify/functions/*.js

    Pas de console.log ou require() mal placé

    Ton fichier .env n’est pas pushé

    Ton package.json contient "type": "module" si tu veux utiliser import (sinon reste en require)

✅ Supabase ne doit jamais recevoir ta clé service_role dans le front
🔐 .gitignore recommandé :

.env
node_modules

Pour le paiement :

    ✅ Petit backend Netlify

    ✅ Quand l’utilisateur clique,  envoies une requête vers /create-checkout-session


    ✅ Crée le projet Supabase.

    ✅ Créer la table pixels avec les colonnes (id, is_sold, user_email, etc.).

    ✅ Générer les 400 pixels manuellement ou avec un petit script SQL.

    ✅ Renseigner SUPABASE_URL et SUPABASE_ANON_KEY dans supabase.js.

    ✅ config Stripe /Stripe Checkout redirige vers un popup (sweetalert) de succès
