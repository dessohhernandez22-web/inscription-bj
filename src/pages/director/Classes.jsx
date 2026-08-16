import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getClasses, saveClasse, updateClasse, deleteClasse, getEnseignants } from '../../data/api-director'

const EMPTY_FORM = {
  nom: '', niveau: '', section: '', salle: '', capacite: '', professeurPrincipalId: '',
}

export default function Classes() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [enseignants, setEnseignants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const ecoleId = user?.ecoleId
      const [c, en] = await Promise.all([
        getClasses({ ecoleId }),
        getEnseignants({ ecoleId }),
      ])
      setClasses(Array.isArray(c) ? c : c.data || [])
      setEnseignants(Array.isArray(en) ? en : en.data || [])
    } catch (e) {
      toast.error('Erreur chargement des données')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true) }
  const openEdit = (c) => {
    setForm({
      nom: c.nom || '', niveau: c.niveau || '', section: c.section || '',
      salle: c.salle || '', capacite: c.capacite || '',
      professeurPrincipalId: c.professeurPrincipalId || c.professeur_principal_id || '',
    })
    setEditId(c.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.nom.trim()) {
      toast.error('Le nom de la classe est obligatoire')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, ecoleId: user?.ecoleId }
      if (editId) {
        await updateClasse(editId, payload)
        toast.success('Classe modifiée avec succès')
      } else {
        await saveClasse(payload)
        toast.success('Classe ajoutée avec succès')
      }
      setShowModal(false)
      fetchData()
    } catch (e) {
      toast.error(e.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteClasse(id)
      toast.success('Classe supprimée')
      setDeleteConfirm(null)
      fetchData()
    } catch (e) {
      toast.error(e.message || 'Erreur suppression')
    }
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const getCapacityColor = (effectif, capacite) => {
    if (!capacite) return 'bg-gray-300'
    const pct = (effectif || 0) / capacite
    if (pct > 0.95) return 'bg-red-500'
    if (pct >= 0.8) return 'bg-yellow-500'
    return 'bg-benin-green'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>Gestion des classes – Direction – eInscription.bj</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">{classes.length} classe(s)</p>
        </div>
        <button onClick={openAdd} className="bg-benin-green text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une classe
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-benin-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">Aucune classe trouvée</h3>
          <p className="text-gray-500 mt-1">Ajoutez une classe pour commencer.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Nom</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Niveau</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Section</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Salle</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Prof. Principal</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Effectif / Capacité</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(c => {
                const effectif = c.effectif || 0
                const capacite = c.capacite || 0
                const pct = capacite ? Math.round((effectif / capacite) * 100) : 0
                return (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{c.nom}</td>
                    <td className="py-3 px-4 text-gray-600">{c.niveau || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{c.section || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{c.salle || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{c.nomProfesseur || c.professeurPrincipal || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[120px]">
                          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getCapacityColor(effectif, capacite)}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{effectif}/{capacite}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Modifier">
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(c)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
                          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Modifier la classe' : 'Ajouter une classe'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input value={form.nom} onChange={e => setField('nom', e.target.value)} className="input-field w-full" placeholder="Ex: 6ème A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                  <input value={form.niveau} onChange={e => setField('niveau', e.target.value)} className="input-field w-full" placeholder="Ex: 6ème" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input value={form.section} onChange={e => setField('section', e.target.value)} className="input-field w-full" placeholder="Ex: A" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
                  <input value={form.salle} onChange={e => setField('salle', e.target.value)} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
                  <input type="number" value={form.capacite} onChange={e => setField('capacite', e.target.value)} className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professeur principal</label>
                <select value={form.professeurPrincipalId} onChange={e => setField('professeurPrincipalId', e.target.value)} className="input-field w-full">
                  <option value="">Sélectionner</option>
                  {enseignants.map(en => (
                    <option key={en.id} value={en.id}>{en.prenom} {en.nom}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="bg-benin-green text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
                {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-gray-500 mb-4">
              Voulez-vous vraiment supprimer la classe <strong>{deleteConfirm.nom}</strong> ?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Annuler</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-600 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
