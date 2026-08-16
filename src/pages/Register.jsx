import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', nom: '', prenom: '', telephone: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await register({ ...form, role: 'parent' })
      toast.success('Compte créé avec succès')
      navigate('/')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte parent</h1>
          <p className="text-gray-500 mt-2">Inscrivez-vous sur eInscription.bj pour inscrire vos enfants</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input type="text" required value={form.prenom} onChange={e => update('prenom', e.target.value)}
                className="input-field" placeholder="Jean" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input type="text" required value={form.nom} onChange={e => update('nom', e.target.value)}
                className="input-field" placeholder="Dupont" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={e => update('email', e.target.value)}
              className="input-field" placeholder="vous@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" value={form.telephone} onChange={e => update('telephone', e.target.value)}
              className="input-field" placeholder="+229 01 00 00 00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" required minLength={6} value={form.password} onChange={e => update('password', e.target.value)}
              className="input-field" placeholder="Minimum 6 caractères" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Inscription...' : 'Créer mon compte'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="text-benin-green font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
