import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getMatieres, saveMatiere, updateMatiere, deleteMatiere, getEnseignants } from '../../data/api-director'

const EMPTY_FORM = {
  nom: '', coefficient: '', niveau: '', enseignantId: '',
}

export default function Matieres() {
  const { user } = useAuth()
  const [matieres, setMatieres] = useState([])
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
      const [m, en] = await Promise.all([
        getMatieres({ ecoleId }),
        getEnseignants({ ecoleId }),
      ])
      setMatieres(Array.isArray(m) ? m : m.data || [])
      setEnseignants(Array.isArray(en) ? en : en.data || [])
    } catch (e) {
      toast.error('Erreur chargement des données')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true) }
  const openEdit = (m) => {
    setForm({
      nom: m.nom || '', coefficient: m.coefficient || '',
      niveau: m.niveau || '', enseignantId: m.enseignantId || m.enseignant_id || '',
    })
    setEditId(m.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.nom.trim()) {
      toast.error('Le nom de la matière est obligatoire')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, ecoleId: user?.ecoleId }
      if (editId) {
        await updateMatiere(editId, payload)
        toast.success('Matière modifiée avec succès')
      } else {
        await saveMatiere(payload)
        toast.success('Matière ajoutée avec succès')
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
      await deleteMatiere(id)
      toast.success('Matière supprimée')
      setDeleteConfirm(null)
      fetchData()
    } catch (e) {
      toast.error(e.message || 'Erreur suppression')
    }
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>Gestion des matières – Direction – eInscription.bj</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Matières</h1>
          <p className="text-gray-500 mt-1">{matieres.length} matière(s)</p>
        </div>
        <button onClick={openAdd} className="bg-benin-green text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une matière
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-benin-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : matieres.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">Aucune matière trouvée</h3>
          <p className="text-gray-500 mt-1">Ajoutez une matière pour commencer.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Nom</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Coefficient</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Niveau</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Enseignant</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {matieres.map(m => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900">{m.nom}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                      {m.coefficient || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{m.niveau || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{m.nomEnseignant || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Modifier">
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteConfirm(m)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Modifier la matière' : 'Ajouter une matière'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input value={form.nom} onChange={e => setField('nom', e.target.value)} className="input-field w-full" placeholder="Ex: Mathématiques" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient</label>
                  <input type="number" step="0.5" value={form.coefficient} onChange={e => setField('coefficient', e.target.value)} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                  <input value={form.niveau} onChange={e => setField('niveau', e.target.value)} className="input-field w-full" placeholder="Ex: 6ème" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant responsable</label>
                <select value={form.enseignantId} onChange={e => setField('enseignantId', e.target.value)} className="input-field w-full">
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
              Voulez-vous vraiment supprimer la matière <strong>{deleteConfirm.nom}</strong> ?
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
