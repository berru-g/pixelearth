console.log('GRID →', grid)
console.log('DATA →', data)
console.log(`Pixel #${id} :`, pixelData)


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

// chargement des pixel sold et affichage des link & img
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
})
/*patch
data.forEach(pixel => {
  const div = document.querySelector(`.pixel[data-pixel-id="${pixel.id}"]`)
  if (!div) return

  if (pixel.is_sold || pixel.image_url || pixel.color || pixel.link_url) {
    div.classList.add('sold')

    if (pixel.image_url) {
      div.style.backgroundImage = `url('${pixel.image_url}')`
      div.style.backgroundSize = 'cover'
      div.style.backgroundPosition = 'center'
    } else if (pixel.color) {
      div.style.backgroundColor = pixel.color
    }

    if (pixel.link_url) {
      div.addEventListener('click', (e) => {
        e.stopPropagation()
        window.open(pixel.link_url, '_blank')
      })
    }
  }
})
*/

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
  /*retour 
  const data = await res.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    alert('Erreur Stripe : ' + data.error);
  }
  */

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
      if (error) {
        console.error("Erreur Supabase:", error);
        alert("Erreur Supabase:", error);
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Achat validé !',
        html: `Pixel #${data.id} acheté.<br>Couleur : ${data.color}<br>Lien : ${data.link_url}`
      })

      window.history.replaceState({}, document.title, "/")
    })
}
