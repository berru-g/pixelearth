import { supabase } from './supabase.js'

let user = null
let selectedPixelId = null

const formContainer = document.getElementById('pixel-form')
const form = document.getElementById('customForm')

// Authentification
window.login = async () => {
  const email = document.getElementById('email').value
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) return alert('Erreur: ' + error.message)
  alert('Check ton email pour te connecter.')
}

const session = await supabase.auth.getSession()
user = session?.data?.session?.user || null
if (user) document.getElementById('auth').style.display = 'none'

supabase.auth.onAuthStateChange((_event, session) => {
  user = session?.user
  if (user) document.getElementById('auth').style.display = 'none'
})

// Charger les pixels depuis Supabase
const grid = document.getElementById('grid')
const pixels = new Array(1600).fill().map((_, i) => i)

const { data, error } = await supabase.from('pixels').select('*')
const soldMap = new Set(data?.filter(p => p.is_sold).map(p => p.id))

// si pixel sold alors afficher le contenue
pixels.forEach((id) => {
  const pixelData = data.find(p => p.id === id)
  const div = document.createElement('div')
  div.className = 'pixel'
  div.dataset.pixelId = id

  // Si vendu : afficher image ou couleur
  if (pixelData?.is_sold) {
    div.classList.add('sold')

    if (pixelData.image_url) {
      div.style.backgroundImage = `url('${pixelData.image_url}')`
      div.style.backgroundSize = 'cover'
      div.style.backgroundPosition = 'center'
    } else if (pixelData.color) {
      div.style.backgroundColor = pixelData.color
    }

    // Si lien → clic redirige
    if (pixelData.link_url) {
      div.addEventListener('click', (e) => {
        e.stopPropagation()
        window.open(pixelData.link_url, '_blank')
      })
    }
  }

  // Si NON vendu → sélection possible
  if (!pixelData?.is_sold) {
    div.addEventListener('click', () => {
      if (!user) return alert('Connecte-toi pour acheter.')
      selectedPixelId = id
      formContainer.style.display = 'block'
      window.scrollTo({ top: formContainer.offsetTop, behavior: 'smooth' })
    })
  }

  grid.appendChild(div)
})

/*
pixels.forEach((id) => {
  const div = document.createElement('div')
  div.className = 'pixel'
  if (soldMap.has(id)) div.classList.add('sold')

  div.addEventListener('click', () => {
    if (!user) return alert('Connecte-toi pour acheter.')
    if (div.classList.contains('sold')) return alert('Déjà vendu.')

    selectedPixelId = id
    formContainer.style.display = 'block'
    window.scrollTo({ top: formContainer.offsetTop, behavior: 'smooth' })
  })

  grid.appendChild(div)
})*/

// Formulaire + envoi vers Stripe
form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const color = document.getElementById('color').value
  const imageUrl = document.getElementById('imageUrl').value
  const linkUrl = document.getElementById('linkUrl').value

  const res = await fetch('/.netlify/functions/createCheckoutSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pixelId: selectedPixelId, color, imageUrl, linkUrl }),
  })
  //retour 
  const data = await res.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    alert('Erreur Stripe : ' + data.error);
  }
  

  const result = await res.json()
  if (result.id) {
    /*window.location.href = `https://checkout.stripe.com/pay/${result.id}`*/
    window.location.href = data.url

  } else {
    alert('Erreur Stripe : ' + result.error)
  }
})

// SweetAlert post-achat (si ?session_id dans l'URL)
const urlParams = new URLSearchParams(window.location.search)
const sessionId = urlParams.get('session_id')

if (sessionId) {
  fetch('/.netlify/functions/getSessionData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId })
  })
    .then(res => res.json())
    .then(async (session) => {
      const pixelId = session.metadata.pixelId

      const { data, error } = await supabase.from('pixels').select('*').eq('id', pixelId).single()
      if (error) return

      Swal.fire({
        icon: 'success',
        title: 'Achat validé !',
        html: `Pixel #${data.id} acheté.<br>Couleur : ${data.color}<br>Lien : ${data.link_url}`
      })

      window.history.replaceState({}, document.title, "/")
    })
}
