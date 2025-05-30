// Charger les pixels
const grid = document.getElementById('grid')
const pixels = new Array(1600).fill().map((_, i) => i)

const { data, error } = await supabase.from('pixels').select('*')
const soldMap = new Set(data?.filter(p => p.is_sold).map(p => p.id))

pixels.forEach((id) => {
  const div = document.createElement('div')
  div.className = 'pixel'
  if (soldMap.has(id)) div.classList.add('sold')
  div.addEventListener('click', async () => {
    if (!user) return alert('Connecte-toi pour acheter.');
    if (div.classList.contains('sold')) return alert('Déjà vendu.');

    selectedPixelId = id;
    formContainer.style.display = 'block';
    window.scrollTo({ top: formContainer.offsetTop, behavior: 'smooth' });
  });

  // check session
  async function buyPixel(pixelId, color, imageUrl, linkUrl) {
    const res = await fetch('/.netlify/functions/createCheckoutSession', {
      method: 'POST',
      body: JSON.stringify({ pixelId, color, imageUrl, linkUrl }),
    });

    const data = await res.json();
    if (data.id) {
      window.location.href = `https://checkout.stripe.com/pay/${data.id}`;
    }
  }

  //stripe
  let selectedPixelId = null;

  const formContainer = document.getElementById('pixel-form');
  const form = document.getElementById('customForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const color = document.getElementById('color').value;
    const imageUrl = document.getElementById('imageUrl').value;
    const linkUrl = document.getElementById('linkUrl').value;

    const res = await fetch('/.netlify/functions/createCheckoutSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pixelId: selectedPixelId,
        color,
        imageUrl,
        linkUrl,
      }),
    });

    const data = await res.json();
    if (data.id) {
      window.location.href = `https://checkout.stripe.com/pay/${data.id}`;
    } else {
      alert('Erreur Stripe : ' + data.error);
    }
  });
  
  //popup SweetAlert
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  if (sessionId) {
    fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${'sk_test_...'}`
      }
    })
      .then(res => res.json())
      .then(async (session) => {
        const pixelId = session.metadata.pixelId;

        const { data, error } = await supabase.from('pixels').select('*').eq('id', pixelId).single();
        if (error) return;

        Swal.fire({
          icon: 'success',
          title: 'Achat validé !',
          html: `Pixel #${data.id} acheté.<br>Couleur : ${data.color}<br>Lien : ${data.link_url}`,
        });

        // Nettoyer l’URL
        window.history.replaceState({}, document.title, "/");
      });
  }