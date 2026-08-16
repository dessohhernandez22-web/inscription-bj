import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getEmploiTemps, saveEmploiTemps, deleteEmploiTemps, getClasses, getMatieres, getEnseignants } from '../../data/api-director'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const HEURES = []
for (let h = 7; h <= 17; h++) HEURES.push(`${h}:00`)

const SUBJECT_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-cyan-100 border-cyan-300 text-cyan-800',
  'bg-red-100 border-red-300 text-red-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
]

function getColorForMatiere(name, cache) {
  if (cache[name] !== undefined) return cache[name]
  const idx = Object.keys(cache).length % SUBJECT_COLORS.length
  cache[name] = idx
  return idx
}

export default function EmploiDuTemps() {
  const { user } = useAuth()
  const [emploi, setEmploi] = useState([])
  const [classes, setClasses] = useState([])
  const [matieres, setMatieres] = useState([])
  const [enseignants, setEnseignants] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterClasse, setFilterClasse] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    jour: 'Lundi', heureDebut: '07:00', heureFin: '08:00',
    matiereId: '', enseignantId: '', salle: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const colorCache = {}

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const ecoleId = user?.ecoleId
      const [e, c, m, en] = await Promise.all([
        getEmploiTemps({ ecoleId, classeId: filterClasse }),
        getClasses({ ecoleId }),
        getMatieres({ ecoleId }),
        getEnseignants({ ecoleId }),
      ])
      setEmploi(Array.isArray(e) ? e : e.data || [])
      setClasses(Array.isArray(c) ? c : c.data || [])
      setMatieres(Array.isArray(m) ? m : m.data || [])
      setEnseignants(Array.isArray(en) ? en : en.data || [])
    } catch (e) {
      toast.error('Erreur chargement des données')
    } finally {
      setLoading(false)
    }
  }, [user, filterClasse])

  useEffect(() => { fetchData() }, [fetchData])

  const getEntriesForCell = (jour, heure) => {
    return emploi.filter(e => {
      if (e.jour !== jour) return false
      const start = e.heureDebut || ''
      const end = e.heureFin || ''
      const h = parseInt(heure.split(':')[0])
      const s = parseInt(start.split(':')[0])
      const f = parseInt(end.split(':')[0])
      return h >= s && h < f
    })
  }

  const handleCellClick = (jour, heure) => {
    setForm(f => ({ ...f, jour, heureDebut: heure, heureFin: `${parseInt(heure.split(':')[0]) + 1}:00` }))
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.matiereId) {
      toast.error('Veuillez sélectionner une matière')
      return
    }
    setSaving(true)
    try {
      await saveEmploiTemps({ ...form, ecoleId: user?.ecoleId, classeId: filterClasse })
      toast.success('Créneau ajouté avec succès')
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
      await deleteEmploiTemps(id)
      toast.success('Créneau supprimé')
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
        <title>Emploi du temps – Direction – eInscription.bj</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Emploi du temps</h1>
          <p className="text-gray-500 mt-1">Planning hebdomadaire</p>
        </div>
        <select value={filterClasse} onChange={e => setFilterClasse(e.target.value)} className="input-field">
          <option value="">Toutes les classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-benin-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[80px_repeat(6,1fr)] border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 p-2 border-b border-r border-gray-200" />
              {JOURS.map(j => (
                <div key={j} className="bg-gray-50 p-2 border-b border-r border-gray-200 text-center text-sm font-semibold text-gray-700 last:border-r-0">
                  {j}
                </div>
              ))}

              {HEURES.map(h => (
                <div key={h} className="contents">
                  <div className="p-2 border-b border-r border-gray-200 text-xs font-medium text-gray-500 flex items-center justify-center bg-gray-50">
                    {h}
                  </div>
                  {JOURS.map(j => {
                    const entries = getEntriesForCell(j, h)
                    return (
                      <div
                        key={`${j}-${h}`}
                        className="border-b border-r border-gray-100 p-1 min-h-[48px] cursor-pointer hover:bg-gray-50 transition-colors last:border-r-0"
                        onClick={() => entries.length === 0 && handleCellClick(j, h)}
                      >
                        {entries.map((e, i) => {
                          const colorIdx = getColorForMatiere(e.nomMatiere || e.matiere || '', colorCache)
                          return (
                            <div
                              key={i}
                              className={`${SUBJECT_COLORS[colorIdx]} border rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight mb-0.5 cursor-pointer`}
                              onClick={ev => { ev.stopPropagation(); setDeleteConfirm(e) }}
                              title={`${e.nomMatiere || ''} - ${e.salle || ''}`}
                            >
                              <div className="truncate">{e.nomMatiere || e.matiere || '?'}</div>
                              <div className="text-[9px] opacity-70">{e.salle || ''}</div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Ajouter un créneau</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jour</label>
                  <select value={form.jour} onChange={e => setField('jour', e.target.value)} className="input-field w-full">
                    {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
                  <input value={form.salle} onChange={e => setField('salle', e.target.value)} className="input-field w-full" placeholder="Ex: Salle 101" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure début</label>
                  <input type="time" value={form.heureDebut} onChange={e => setField('heureDebut', e.target.value)} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label>
                  <input type="time" value={form.heureFin} onChange={e => setField('heureFin', e.target.value)} className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                <select value={form.matiereId} onChange={e => setField('matiereId', e.target.value)} className="input-field w-full">
                  <option value="">Sélectionner</option>
                  {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant</label>
                <select value={form.enseignantId} onChange={e => setField('enseignantId', e.target.value)} className="input-field w-full">
                  <option value="">Sélectionner</option>
                  {enseignants.map(en => <option key={en.id} value={en.id}>{en.prenom} {en.nom}</option>)}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="bg-benin-green text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-2">Supprimer ce créneau ?</h3>
            <p className="text-sm text-gray-500 mb-4">
              {deleteConfirm.nomMatiere || deleteConfirm.matiere || ''} — {deleteConfirm.jour} {deleteConfirm.heureDebut}-{deleteConfirm.heureFin}
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
