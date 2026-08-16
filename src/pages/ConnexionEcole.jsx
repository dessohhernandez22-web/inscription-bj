import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Helmet } from 'react-helmet-async'

export default function ConnexionEcole() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetDone, setResetDone] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async e => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.user.role !== 'directeur') {
        toast.error('Ce compte n\'est pas un directeur d\'école')
        return
      }
      toast.success(`Bienvenue ${result.user.prenom}`)
      navigate('/ecole/gestion')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async e => {
    e.preventDefault()
    if (!resetEmail) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/mot-de-passe-oublie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setResetDone(true)
      toast.success('Mot de passe provisoire généré')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <Helmet><title>Espace école – Connexion – eInscription.bj</title></Helmet>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-benin-green rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Espace école</h1>
          <p className="text-gray-500 mt-2">Connexion réservée aux directeurs d'établissement</p>
        </div>

        {!showForgot ? (
          <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-5">
            <p className="text-sm text-gray-500 bg-blue-50 rounded-xl p-3">
              Identifiants fournis par votre circonscription scolaire ou IEP.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="directeur@ecole.bj" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <button type="button" onClick={() => setShowForgot(true)} className="w-full text-sm text-benin-green font-medium hover:underline text-center">
              Mot de passe oublié ?
            </button>
          </form>
        ) : resetDone ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">Un nouveau mot de passe provisoire vous a été communiqué.</p>
            <p className="text-sm text-gray-500">Contactez votre circonscription si vous n'avez pas reçu vos identifiants.</p>
            <button onClick={() => { setShowForgot(false); setResetDone(false); setResetEmail('') }} className="btn-primary w-full">
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-5">
            <p className="text-sm text-gray-500">
              Entrez votre email. Un mot de passe provisoire vous sera communiqué.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                className="input-field" placeholder="directeur@ecole.bj" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Traitement...' : 'Réinitialiser le mot de passe'}
            </button>
            <button type="button" onClick={() => setShowForgot(false)} className="w-full text-sm text-gray-500 hover:text-gray-700">
              Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
