import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getEnseignants, saveEnseignant, updateEnseignant, deleteEnseignant } from '../../data/api-director'

const EMPTY_FORM = {
  prenom: '', nom: '', sexe: 'M', email: '', telephone: '',
  adresse: '', matieres: '', classes: '',
}

export default function Enseignants() {
  const { user } = useAuth()
  const [enseignants, setEnseignants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEnseignants({ ecoleId: user?.ecoleId, search })
      setEnseignants(Array.isArray(data) ? data : data.data || [])
    } catch (e) {
      toast.error('Erreur chargement des enseignants')
    } finally {
      setLoading(false)
    }
  }, [user, search])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(t)
  }, [search])

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true) }
  const openEdit = (e) => {
    setForm({
      prenom: e.prenom || '', nom: e.nom || '', sexe: e.sexe || 'M',
      email: e.email || '', telephone: e.telephone || '',
      adresse: e.adresse || '',
      matieres: Array.isArray(e.matieres) ? e.matieres.join(', ') : (e.matieres || ''),
      classes: Array.isArray(e.classes) ? e.classes.join(', ') : (e.classes || ''),
    })
    setEditId(e.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.prenom.trim() || !form.nom.trim()) {
      toast.error('Prénom et nom sont obligatoires')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        matieres: form.matieres.split(',').map(s => s.trim()).filter(Boolean),
        classes: form.classes.split(',').map(s => s.trim()).filter(Boolean),
        ecoleId: user?.ecoleId,
      }
      if (editId) {
        await updateEnseignant(editId, payload)
        toast.success('Enseignant modifié avec succès')
      } else {
        await saveEnseignant(payload)
        toast.success('Enseignant ajouté avec succès')
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
      await deleteEnseignant(id)
      toast.success('Enseignant supprimé')
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
        <title>Gestion des enseignants – Direction – eInscription.bj</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Enseignants</h1>
          <p className="text-gray-500 mt-1">{enseignants.length} enseignant(s)</p>
        </div>
        <button onClick={openAdd} className="bg-benin-green text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un enseignant
        </button>
      </div>

      <div className="card mb-6">
        <input
          type="text"
          placeholder="Rechercher un enseignant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field w-full"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-benin-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : enseignants.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">Aucun enseignant trouvé</h3>
          <p className="text-gray-500 mt-1">Ajoutez un enseignant pour commencer.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Nom complet</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Téléphone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Matières</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Classes</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enseignants.map(e => (
                <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                        {e.prenom?.[0]}{e.nom?.[0]}
                      </div>
                      <span className="font-medium text-gray-900">{e.prenom} {e.nom}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{e.email || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{e.telephone || '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(e.matieres) ? e.matieres : (e.matieres || '').split(',').filter(Boolean)).map((m, i) => (
                        <span key={i} className="inline-flex px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">{m}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {(Array.isArray(e.classes) ? e.classes : (e.classes || '').split(',').filter(Boolean)).join(', ') || '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Modifier">
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteConfirm(e)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
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
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Modifier l\'enseignant' : 'Ajouter un enseignant'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input value={form.prenom} onChange={e => setField('prenom', e.target.value)} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input value={form.nom} onChange={e => setField('nom', e.target.value)} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                  <select value={form.sexe} onChange={e => setField('sexe', e.target.value)} className="input-field w-full">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input value={form.telephone} onChange={e => setField('telephone', e.target.value)} className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input value={form.adresse} onChange={e => setField('adresse', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matières (séparées par des virgules)</label>
                <input value={form.matieres} onChange={e => setField('matieres', e.target.value)} className="input-field w-full" placeholder="Ex: Mathématiques, Physique" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classes (séparées par des virgules)</label>
                <input value={form.classes} onChange={e => setField('classes', e.target.value)} className="input-field w-full" placeholder="Ex: 6ème A, 5ème B" />
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
              Voulez-vous vraiment supprimer l'enseignant <strong>{deleteConfirm.prenom} {deleteConfirm.nom}</strong> ?
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
