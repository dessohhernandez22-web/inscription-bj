import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getEleves, saveEleve, updateEleve, deleteEleve, getClasses } from '../../data/api-director'

const EMPTY_FORM = {
  prenom: '', nom: '', sexe: 'M', dateNaissance: '', lieuNaissance: '',
  classeId: '', photo: '', statut: 'actif', adresse: '',
  nomParent: '', telephoneParent: '', emailParent: '',
}

export default function Eleves() {
  const { user } = useAuth()
  const [eleves, setEleves] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterClasse, setFilterClasse] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const ecoleId = user?.ecoleId
      const [e, c] = await Promise.all([
        getEleves({ ecoleId, search, classeId: filterClasse, statut: filterStatut }),
        getClasses({ ecoleId }),
      ])
      setEleves(Array.isArray(e) ? e : e.data || [])
      setClasses(Array.isArray(c) ? c : c.data || [])
    } catch (e) {
      toast.error('Erreur chargement des données')
    } finally {
      setLoading(false)
    }
  }, [user, search, filterClasse, filterStatut])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(t)
  }, [search, filterClasse, filterStatut])

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true) }
  const openEdit = (e) => {
    setForm({
      prenom: e.prenom || '', nom: e.nom || '', sexe: e.sexe || 'M',
      dateNaissance: e.dateNaissance ? e.dateNaissance.split('T')[0] : '',
      lieuNaissance: e.lieuNaissance || '', classeId: e.classeId || e.classe_id || '',
      photo: e.photo || '', statut: e.statut || 'actif', adresse: e.adresse || '',
      nomParent: e.nomParent || '', telephoneParent: e.telephoneParent || '',
      emailParent: e.emailParent || '',
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
      if (editId) {
        await updateEleve(editId, form)
        toast.success('Élève modifié avec succès')
      } else {
        await saveEleve({ ...form, ecoleId: user?.ecoleId })
        toast.success('Élève ajouté avec succès')
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
      await deleteEleve(id)
      toast.success('Élève supprimé')
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
        <title>Gestion des élèves – Direction – eInscription.bj</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Élèves</h1>
          <p className="text-gray-500 mt-1">{eleves.length} élève(s) inscrit(s)</p>
        </div>
        <button onClick={openAdd} className="bg-benin-green text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un élève
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Rechercher un élève..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field flex-1"
          />
          <select value={filterClasse} onChange={e => setFilterClasse(e.target.value)} className="input-field">
            <option value="">Toutes les classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="input-field">
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="transfere">Transféré</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-benin-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : eleves.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">Aucun élève trouvé</h3>
          <p className="text-gray-500 mt-1">Ajoutez un élève pour commencer.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Matricule</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Nom complet</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Sexe</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Classe</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Parent</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Téléphone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Statut</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {eleves.map(e => (
                <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-gray-500">{e.matricule || '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                        {e.prenom?.[0]}{e.nom?.[0]}
                      </div>
                      <span className="font-medium text-gray-900">{e.prenom} {e.nom}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{e.sexe === 'M' ? 'Masculin' : 'Féminin'}</td>
                  <td className="py-3 px-4 text-gray-600">{e.nomClasse || e.classe || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{e.nomParent || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{e.telephoneParent || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      e.statut === 'actif' ? 'bg-green-100 text-green-800' :
                      e.statut === 'inactif' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {e.statut === 'actif' ? 'Actif' : e.statut === 'inactif' ? 'Inactif' : 'Transféré'}
                    </span>
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
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Modifier l\'élève' : 'Ajouter un élève'}</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                  <input type="date" value={form.dateNaissance} onChange={e => setField('dateNaissance', e.target.value)} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label>
                  <input value={form.lieuNaissance} onChange={e => setField('lieuNaissance', e.target.value)} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                  <select value={form.classeId} onChange={e => setField('classeId', e.target.value)} className="input-field w-full">
                    <option value="">Sélectionner</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select value={form.statut} onChange={e => setField('statut', e.target.value)} className="input-field w-full">
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="transfere">Transféré</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo (URL)</label>
                  <input value={form.photo} onChange={e => setField('photo', e.target.value)} className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input value={form.adresse} onChange={e => setField('adresse', e.target.value)} className="input-field w-full" />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Informations du parent</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du parent</label>
                    <input value={form.nomParent} onChange={e => setField('nomParent', e.target.value)} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input value={form.telephoneParent} onChange={e => setField('telephoneParent', e.target.value)} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={form.emailParent} onChange={e => setField('emailParent', e.target.value)} className="input-field w-full" />
                  </div>
                </div>
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
              Voulez-vous vraiment supprimer l'élève <strong>{deleteConfirm.prenom} {deleteConfirm.nom}</strong> ? Cette action est irréversible.
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
