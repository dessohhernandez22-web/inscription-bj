import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { sendAnnouncement, getAnnouncements, getClasses } from '../../data/api-director'

export default function Communication() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ titre: '', message: '', cible: 'all', classeId: '' })
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState('send')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const ecoleId = user?.ecoleId
      const [a, c] = await Promise.all([
        getAnnouncements({ ecoleId }),
        getClasses({ ecoleId }),
      ])
      setAnnouncements(Array.isArray(a) ? a : a.data || [])
      setClasses(Array.isArray(c) ? c : c.data || [])
    } catch (e) {
      toast.error('Erreur chargement des données')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSend = async () => {
    if (!form.titre.trim() || !form.message.trim()) {
      toast.error('Le titre et le message sont obligatoires')
      return
    }
    setSending(true)
    try {
      await sendAnnouncement({ ...form, ecoleId: user?.ecoleId })
      toast.success('Annonce envoyée avec succès')
      setShowModal(false)
      setForm({ titre: '', message: '', cible: 'all', classeId: '' })
      fetchData()
      setActiveTab('history')
    } catch (e) {
      toast.error(e.message || "Erreur lors de l'envoi")
    } finally {
      setSending(false)
    }
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>Communication – Direction – eInscription.bj</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Communication</h1>
          <p className="text-gray-500 mt-1">Envoyer des annonces aux parents</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setActiveTab('send') }}
          className="bg-benin-green text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Nouvelle annonce
        </button>
      </div>

      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setActiveTab('send')}
          className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'send' ? 'bg-benin-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Envoyer
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'history' ? 'bg-benin-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Historique ({announcements.length})
        </button>
      </div>

      {activeTab === 'history' && (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-benin-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700">Aucune annonce envoyée</h3>
            <p className="text-gray-500 mt-1">Les annonces envoyées apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(a => (
              <div key={a.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900">{a.titre || a.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{a.message || a.contenu}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{a.dateCreation ? new Date(a.dateCreation).toLocaleDateString('fr-FR') : ''}</span>
                      <span>·</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        a.cible === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {a.cible === 'all' ? 'Tous les parents' : `Classe: ${a.nomClasse || a.classeId}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle annonce</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  value={form.titre}
                  onChange={e => setField('titre', e.target.value)}
                  className="input-field w-full"
                  placeholder="Ex: Réunion parent-professeur"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={form.message}
                  onChange={e => setField('message', e.target.value)}
                  className="input-field w-full min-h-[120px]"
                  placeholder="Rédigez votre message ici..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destinataires</label>
                <select value={form.cible} onChange={e => setField('cible', e.target.value)} className="input-field w-full">
                  <option value="all">Tous les parents</option>
                  <option value="classe">Classe spécifique</option>
                </select>
              </div>
              {form.cible === 'classe' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                  <select value={form.classeId} onChange={e => setField('classeId', e.target.value)} className="input-field w-full">
                    <option value="">Sélectionner</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Annuler</button>
              <button onClick={handleSend} disabled={sending} className="bg-benin-green text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
