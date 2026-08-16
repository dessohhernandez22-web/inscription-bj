import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { updateEcoleInfo } from '../../data/api-director'
import { getEcoles } from '../../data/api'

export default function Parametres() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    nom: '', ville: '', quartier: '', telephone: '', email: '', siteWeb: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const ecoles = await getEcoles()
        const list = Array.isArray(ecoles) ? ecoles : ecoles.data || []
        const ecole = list.find(e => e.id === user?.ecoleId) || {}
        setForm({
          nom: ecole.nom || '',
          ville: ecole.ville || '',
          quartier: ecole.quartier || '',
          telephone: ecole.telephone || '',
          email: ecole.email || '',
          siteWeb: ecole.siteWeb || ecole.site_web || '',
        })
      } catch (e) {
        toast.error('Erreur chargement des informations')
      } finally {
        setLoading(false)
      }
    }
    if (user?.ecoleId) load()
    else setLoading(false)
  }, [user])

  const handleSave = async () => {
    if (!form.nom.trim()) {
      toast.error('Le nom de l\'école est obligatoire')
      return
    }
    setSaving(true)
    try {
      await updateEcoleInfo(user?.ecoleId, form)
      toast.success('Informations mises à jour avec succès')
    } catch (e) {
      toast.error(e.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-benin-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>Paramètres – Direction – eInscription.bj</title>
      </Helmet>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 mt-1">Informations de l'établissement</p>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-benin-green/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-benin-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Informations de l'école</h2>
              <p className="text-sm text-gray-500">Modifiez les informations publiques de votre établissement</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'école *</label>
            <input value={form.nom} onChange={e => setField('nom', e.target.value)} className="input-field w-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input value={form.ville} onChange={e => setField('ville', e.target.value)} className="input-field w-full" placeholder="Ex: Porto-Novo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
              <input value={form.quartier} onChange={e => setField('quartier', e.target.value)} className="input-field w-full" placeholder="Ex: Centre-ville" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input value={form.telephone} onChange={e => setField('telephone', e.target.value)} className="input-field w-full" placeholder="+229 XX XX XX XX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} className="input-field w-full" placeholder="contact@ecole.bj" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
            <input value={form.siteWeb} onChange={e => setField('siteWeb', e.target.value)} className="input-field w-full" placeholder="https://www.ecole.bj" />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-benin-green text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M5 13l4 4L19 7" />
            </svg>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
