import { supabase } from './supabase.js'

let user = null
const selectedPixels = new Set()

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

pixels.forEach((id) => {
  const div = document.createElement('div')
  div.className = 'pixel'
  div.dataset.pixelId = id

  if (soldMap.has(id)) {
    div.classList.add('sold')
  }

  div.addEventListener('click', () => {
    if (!user) return alert('Connecte-toi pour acheter.')
    if (div.classList.contains('sold')) return alert('Déjà vendu.')

    if (selectedPixels.has(id)) {
      selectedPixels.delete(id)
      div.classList.remove('selected')
    } else {
      selectedPixels.add(id)
      div.classList.add('selected')
    }

    formContainer.style.display = selectedPixels.size > 0 ? 'block' : 'none'
  })

  grid.appendChild(div)
})

// Formulaire + envoi vers Stripe
form.addEventListener('submit', async (e) => {
  e.preventDefault()

  if (selectedPixels.size === 0) {
    return alert('Sélectionne au moins un pixel.')
  }

  const color = document.getElementById('color').value
  const imageUrl = document.getElementById('imageUrl').value
  const linkUrl = document.getElementById('linkUrl').value
  const pixelIds = Array.from(selectedPixels)

  const res = await fetch('/.netlify/functions/createCheckoutSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pixelIds, color, imageUrl, linkUrl }),
  })

  const data = await res.json()

  if (data.url) {
    window.location.href = data.url
  } else {
    alert('Erreur Stripe : ' + data.error)
  }

  console.log('Réponse Stripe:', data)
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
      const pixelIds = session.metadata.pixelIds?.split(',') || []

      const { data, error } = await supabase
        .from('pixels')
        .select('*')
        .in('id', pixelIds.map(Number))

      if (error) return

      Swal.fire({
        icon: 'success',
        title: 'Achat validé !',
        html: `Pixel(s) acheté(s) :<br>${data.map(p => `#${p.id}`).join(', ')}<br>Couleur : ${data[0]?.color}<br>Lien : ${data[0]?.link_url}`
      })

      window.history.replaceState({}, document.title, "/")
    })
}
