import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://szqwzslmaglrignthtfj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6cXd6c2xtYWdscmlnbnRodGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzgxMjEsImV4cCI6MjA2NDExNDEyMX0.gHTwZFfI_vXzA0i6Di1btqV_ojOv8vcMJTzAuW_A6pI'
const supabase = createClient(supabaseUrl, supabaseKey)

let user = null

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