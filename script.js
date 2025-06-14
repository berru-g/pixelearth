import { supabase } from './supabase.js'

let user = null
let selectedPixelId = null

const formContainer = document.getElementById('pixel-form')
const form = document.getElementById('customForm')

// Authentification
window.login = async () => {
  const email = document.getElementById('email').value
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) {
    return Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: error.message
    })
  }

  Swal.fire({
    icon: 'info',
    title: 'Vérifie ta boîte mail 📩',
    text: 'Un lien de connexion t’a été envoyé.'
  })

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

// compteur ratio vendu/restant
const pixelCounter = document.getElementById('pixel-counter')
const totalPixels = pixels.length
const soldPixels = soldMap.size

pixelCounter.textContent = `⬜ Pixels vendus : ${soldPixels} / ${totalPixels}`


// chargement des pixel sold et affichage des link & img
pixels.forEach((id) => {
  const div = document.createElement('div')
  div.className = 'pixel'
  div.title = `Pixel #${id}`

  if (soldMap.has(id)) div.classList.add('sold')

  // 🔧 Ajout : appliquer color / image / lien si dispo
  const pixelData = data.find(p => p.id === id)
  if (pixelData?.link_url) {
    div.title = pixelData.link_url
  } else {
    div.title = `Pixel #${id}`
  }

  if (pixelData) {
    if (pixelData.image_url) {
      div.style.setProperty('background-image', `url('${pixelData.image_url}')`, 'important')
      div.style.backgroundSize = 'cover'
      div.style.backgroundPosition = 'center'
    } else if (pixelData.color) {
      div.style.setProperty('background-color', pixelData.color, 'important')
    }
    // redirection auto
    /*if (pixelData.link_url) {
      div.addEventListener('click', (e) => {
        e.stopPropagation()
        window.open(pixelData.link_url, '_blank')
      })
    }*/
  }

  div.addEventListener('click', () => {
    if (!user) {
      return Swal.fire({
        icon: 'warning',
        title: 'Connexion requise',
        text: 'Connecte-toi pour acheter un pixel.'
      })
    }

    if (div.classList.contains('sold')) {
      const pixelData = data.find(p => p.id === id)
      // affichage du nom  du proprio du pixel
      let ownerText = `🌍`
      if (pixelData?.user_email && pixelData?.link_url) {
        ownerText += `<br><strong>Propriétaire :</strong> ${pixelData.user_email}<br><strong>Site :</strong> <a href="${pixelData.link_url}" target="_blank">${pixelData.link_url}</a>`
      }

      return Swal.fire({
        icon: 'info',
        title: 'Pixel déja vendu',
        html: ownerText,
      })
    }



    selectedPixelId = id
    formContainer.style.display = 'block'
    window.scrollTo({ top: formContainer.offsetTop, behavior: 'smooth' })
  })

  grid.appendChild(div)
})

// Formulaire + envoi vers Stripe
form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const color = document.getElementById('color')?.value || null
  const imageUrl = document.getElementById('imageUrl')?.value || null
  const linkUrl = document.getElementById('linkUrl')?.value || null

  if (!selectedPixelId) {
    return Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: 'Aucun pixel sélectionné.'
    })
  }

  const res = await fetch('/.netlify/functions/createCheckoutSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pixelId: selectedPixelId, color, imageUrl, linkUrl }),
  })

  const result = await res.json()

  if (result?.url) {
    window.location.href = result.url
  } else if (result?.id) {
    window.location.href = `https://checkout.stripe.com/pay/${result.id}`
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Erreur Stripe',
      text: result.error || 'Une erreur est survenue.'
    })
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
        title: 'Achat validé merci !',
        html: `Pixel #${data.id} acheté.<br>Couleur : ${data.color}<br>Lien : ${data.link_url}`
      })

      window.history.replaceState({}, document.title, "/")
    })
}
