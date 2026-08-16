import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getPaiements, savePaiement, getPaiementsStats } from '../../data/api-director'

export default function PaiementsList() {
  const { user } = useAuth()
  const [paiements, setPaiements] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ eleveId: '', montant: '', type: 'frais_scolarite', description: '', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)
  const [selectedPaiement, setSelectedPaiement] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const ecoleId = user?.ecoleId
      const [p, s] = await Promise.all([
        getPaiements({ ecoleId }),
        getPaiementsStats(ecoleId).catch(() => null),
      ])
      setPaiements(Array.isArray(p) ? p : p.data || [])
      setStats(s)
    } catch {
      toast.error('Erreur chargement des données')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredPaiements = paiements.filter(p => {
    const matchSearch = !search || `${p.prenom || ''} ${p.nom || ''} ${p.eleveNom || ''}`.toLowerCase().includes(search.toLowerCase())
    const matchStatut = !filterStatut || p.statut === filterStatut
    const matchType = !filterType || p.type === filterType
    return matchSearch && matchStatut && matchType
  })

  const handleAdd = async () => {
    if (!form.eleveId || !form.montant) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    setSaving(true)
    try {
      await savePaiement({ ...form, ecoleId: user?.ecoleId })
      toast.success('Paiement enregistré avec succès')
      setShowModal(false)
      setForm({ eleveId: '', montant: '', type: 'frais_scolarite', description: '', date: new Date().toISOString().split('T')[0] })
      fetchData()
    } catch (e) {
      toast.error(e.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const getTypeLabel = (type) => {
    const types = {
      frais_scolarite: 'Frais scolarité',
      inscription: 'Inscription',
      minerval: 'Minerval',
      transport: 'Transport',
      cantine: 'Cantine',
      uniforme: 'Uniforme',
      autre: 'Autre',
    }
    return types[type] || type
  }

  const getTypeColor = (type) => {
    const colors = {
      frais_scolarite: 'bg-blue-100 text-blue-700',
      inscription: 'bg-purple-100 text-purple-700',
      minerval: 'bg-green-100 text-green-700',
      transport: 'bg-yellow-100 text-yellow-700',
      cantine: 'bg-orange-100 text-orange-700',
      uniforme: 'bg-pink-100 text-pink-700',
      autre: 'bg-gray-100 text-gray-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const totalMontant = filteredPaiements.reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>Paiements – Direction – eInscription.bj</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Gestion des paiements</h1>
          <p className="text-gray-500 mt-1">Suivi des paiements des élèves</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-benin-green text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          Enregistrer un paiement
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card">
            <p className="text-xs text-gray-500">Total encaissé</p>
            <p className="text-xl font-extrabold text-benin-green">{(stats.totalEncaisse || totalMontant).toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500">En attente</p>
            <p className="text-xl font-extrabold text-yellow-600">{(stats.totalEnAttente || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500">Paiements</p>
            <p className="text-xl font-extrabold text-blue-600">{stats.nombrePaiements || paiements.length}</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500">Taux recouvrement</p>
            <p className="text-xl font-extrabold text-purple-600">{stats.tauxRecouvrement || 0}%</p>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Rechercher un élève..." value={search} onChange={e => setSearch(e.target.value)} className="input-field flex-1" />
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="input-field">
            <option value="">Tous les statuts</option>
            <option value="paye">Payé</option>
            <option value="en_attente">En attente</option>
            <option value="partiel">Partiel</option>
            <option value="annule">Annulé</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field">
            <option value="">Tous les types</option>
            <option value="frais_scolarite">Frais scolarité</option>
            <option value="inscription">Inscription</option>
            <option value="minerval">Minerval</option>
            <option value="transport">Transport</option>
            <option value="cantine">Cantine</option>
            <option value="uniforme">Uniforme</option>
            <option value="autre">Autre</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-benin-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPaiements.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">Aucun paiement trouvé</h3>
          <p className="text-gray-500 mt-1">Aucun paiement ne correspond à vos critères.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Élève</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Montant</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Statut</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaiements.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                        {(p.prenom || p.elevePrenom || '?')?.[0]}{(p.nom || p.eleveNom || '?')?.[0]}
                      </div>
                      <span className="font-medium text-gray-900">{p.prenom || p.elevePrenom || ''} {p.nom || p.eleveNom || ''}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(p.type)}`}>
                      {getTypeLabel(p.type)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">{parseFloat(p.montant || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td className="py-3 px-4 text-gray-600">{p.date ? new Date(p.date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.statut === 'paye' ? 'bg-green-100 text-green-800' :
                      p.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                      p.statut === 'partiel' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {p.statut === 'paye' ? 'Payé' : p.statut === 'en_attente' ? 'En attente' : p.statut === 'partiel' ? 'Partiel' : 'Annulé'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => setSelectedPaiement(selectedPaiement?.id === p.id ? null : p)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Voir détails">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Enregistrer un paiement</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Élève *</label>
                <input type="number" value={form.eleveId} onChange={e => setForm(f => ({ ...f, eleveId: e.target.value }))} className="input-field w-full" placeholder="ID de l'élève" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) *</label>
                <input type="number" min="0" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} className="input-field w-full" placeholder="Ex: 50000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de paiement</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field w-full">
                  <option value="frais_scolarite">Frais scolarité</option>
                  <option value="inscription">Inscription</option>
                  <option value="minerval">Minerval</option>
                  <option value="transport">Transport</option>
                  <option value="cantine">Cantine</option>
                  <option value="uniforme">Uniforme</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field w-full" placeholder="Note optionnelle" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Annuler</button>
              <button onClick={handleAdd} disabled={saving} className="bg-benin-green text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPaiement && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPaiement(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Détails du paiement</h2>
                <button onClick={() => setSelectedPaiement(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Élève</span>
                <span className="text-sm font-medium text-gray-900">{selectedPaiement.prenom || selectedPaiement.elevePrenom || ''} {selectedPaiement.nom || selectedPaiement.eleveNom || ''}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Type</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTypeColor(selectedPaiement.type)}`}>{getTypeLabel(selectedPaiement.type)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Montant</span>
                <span className="text-sm font-bold text-gray-900">{parseFloat(selectedPaiement.montant || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm text-gray-900">{selectedPaiement.date ? new Date(selectedPaiement.date).toLocaleDateString('fr-FR') : '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Statut</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  selectedPaiement.statut === 'paye' ? 'bg-green-100 text-green-800' :
                  selectedPaiement.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedPaiement.statut === 'paye' ? 'Payé' : selectedPaiement.statut === 'en_attente' ? 'En attente' : selectedPaiement.statut}
                </span>
              </div>
              {selectedPaiement.description && (
                <div className="py-2">
                  <span className="text-sm text-gray-500">Description</span>
                  <p className="text-sm text-gray-900 mt-1">{selectedPaiement.description}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button onClick={() => setSelectedPaiement(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
