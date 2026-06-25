# Script de correction — GlorySound connexion page
# Lancez depuis le dossier glorysound\frontend

$content = @'
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

export default function ConnexionPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      router.push('/admin/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#0A1628,#0d2b55)',padding:'1rem',fontFamily:'sans-serif'}}>
      <div style={{width:'100%',maxWidth:'400px'}}>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>♪</div>
          <h1 style={{color:'white',fontSize:'1.8rem',fontWeight:700,letterSpacing:'.1em',margin:'0 0 4px'}}>GLORYSOUND</h1>
          <p style={{color:'rgba(255,255,255,.5)',fontSize:'13px',margin:0}}>Espace Administrateur</p>
        </div>
        <div style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'16px',padding:'2rem'}}>
          <h2 style={{color:'white',fontSize:'1.1rem',fontWeight:600,margin:'0 0 1.25rem'}}>Connexion</h2>
          {error && <div style={{background:'rgba(217,79,59,.15)',border:'1px solid rgba(217,79,59,.3)',borderRadius:'8px',padding:'8px 12px',color:'#F87171',fontSize:'13px',marginBottom:'1rem'}}>{error}</div>}
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            <div>
              <label style={{display:'block',color:'rgba(255,255,255,.6)',fontSize:'13px',marginBottom:'5px'}}>Adresse e-mail</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@glorysound.ht" autoComplete="email"
                style={{width:'100%',padding:'11px 14px',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',color:'white',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',color:'rgba(255,255,255,.6)',fontSize:'13px',marginBottom:'5px'}}>Mot de passe</label>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                style={{width:'100%',padding:'11px 14px',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',color:'white',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <button type="submit" disabled={loading}
              style={{padding:'12px',background:loading?'rgba(232,160,32,.6)':'#E8A020',color:'#0A1628',fontWeight:700,fontSize:'15px',borderRadius:'8px',border:'none',cursor:loading?'not-allowed':'pointer',marginTop:'4px'}}>
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
          <div style={{marginTop:'1.25rem',paddingTop:'1.25rem',borderTop:'1px solid rgba(255,255,255,.08)',textAlign:'center'}}>
            <a href="/" style={{color:'rgba(255,255,255,.25)',fontSize:'12px',textDecoration:'none'}}>← Retour au site public</a>
          </div>
        </div>
      </div>
    </div>
  )
}
'@

# Écrire le fichier
$content | Set-Content -Encoding UTF8 "src\app\admin\connexion\page.tsx"
Write-Host "✔ Fichier connexion\page.tsx corrigé !" -ForegroundColor Green

# Supprimer le cache Next.js
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✔ Cache .next supprimé !" -ForegroundColor Green
}

Write-Host ""
Write-Host "Maintenant tapez : npm run dev" -ForegroundColor Yellow
