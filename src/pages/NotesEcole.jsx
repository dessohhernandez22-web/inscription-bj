import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ecoles, niveaux } from '../data/schools'
import { getNotes, saveNote, updateNote, deleteNote, generateBulletin } from '../data/api'
import { getDemandes } from '../data/demandes'
import toast from 'react-hot-toast'
import { Helmet } from 'react-helmet-async'

const defaultCoeffs = {
  'Mathématiques': 4,
  'Français': 3,
  'Anglais': 2,
  'Histoire-Géo': 2,
  'Sciences': 2,
  'EPS': 1,
  'Arts': 1,
  'Musique': 1,
  'Physique': 2,
  'Chimie': 2,
  'SVT': 2,
}

const matieresList = Object.keys(defaultCoeffs)

export default function NotesEcole() {
  const { user } = useAuth()
  const [ecoleId, setEcoleId] = useState(user?.role === 'directeur' ? user.ecoleId : '')
  const [classe, setClasse] = useState('')
  const [trimestre, setTrimestre] = useState(1)
  const [annee, setAnnee] = useState(new Date().getFullYear().toString())
  const [eleves, setEleves] = useState([])
  const [notes, setNotes] = useState({})
  const [coeffs, setCoeffs] = useState({ ...defaultCoeffs })
  const [editing, setEditing] = useState({})
  const [editingCoeff, setEditingCoeff] = useState(null)
  const [loading, setLoading] = useState(false)

  const ecole = ecoles.find(e => e.id === parseInt(ecoleId))
  const classes = ecole
    ? ecole.niveau.flatMap(n => {
        const lvl = niveaux.find(x => x.id === n)
        return lvl ? lvl.sous : []
      })
    : []

  useEffect(() => {
    if (!ecoleId || !classe) return
    loadData()
  }, [ecoleId, classe, trimestre, annee])

  const loadData = async () => {
    setLoading(true)
    try {
      const [notesData, demandesData] = await Promise.all([
        getNotes({ ecoleId, classe, trimestre, annee }),
        getDemandes({ ecoleId, statut: 'accepté', force: true }),
      ])
      const elevesList = Array.isArray(demandesData) ? demandesData
        .filter(d => d.classe === classe)
        .map(d => ({ id: d.id, nom: `${d.prenomEnfant} ${d.nomEnfant}`, eleveId: d.id }))
      : []
      setEleves(elevesList)
      const notesMap = {}
      notesData.forEach(n => {
        const key = `${n.eleveId}-${n.matiere}`
        notesMap[key] = n
      })
      setNotes(notesMap)
    } catch (e) {
      toast.error('Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleNoteChange = (eleveId, matiere, value) => {
    setEditing(prev => ({ ...prev, [`${eleveId}-${matiere}`]: value }))
  }

  const handleSaveNote = async (eleveId, matiere) => {
    const key = `${eleveId}-${matiere}`
    const value = parseFloat(editing[key])
    if (isNaN(value) || value < 0 || value > 20) {
      toast.error('Note invalide (0-20)')
      return
    }
    try {
      const existing = notes[key]
      const coeff = coeffs[matiere] || 1
      if (existing) {
        await updateNote(existing.id, { note: value, coeff })
      } else {
        await saveNote({
          ecoleId: parseInt(ecoleId), eleveId, classe, matiere,
          note: value, trimestre: parseInt(trimestre), annee, coeff,
        })
      }
      toast.success('Note enregistrée')
      setEditing(prev => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      loadData()
    } catch (e) {
      toast.error('Erreur sauvegarde')
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Supprimer cette note ?')) return
    try {
      await deleteNote(noteId)
      toast.success('Note supprimée')
      loadData()
    } catch {
      toast.error('Erreur suppression')
    }
  }

  const [bulletinsGen, setBulletinsGen] = useState(0)
  const [pubDate, setPubDate] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [showBulletins, setShowBulletins] = useState(false)
  const [generatedBulletins, setGeneratedBulletins] = useState([])

  const handleGenerateBulletin = async () => {
    if (!eleves.length) {
      toast.error('Aucun élève dans cette classe')
      return
    }
    let ok = 0
    for (const eleve of eleves) {
      try {
        await generateBulletin({
          ecoleId: parseInt(ecoleId), eleveId: eleve.eleveId,
          classe, trimestre: parseInt(trimestre), annee,
        })
        ok++
      } catch { /* skip */ }
    }
    setBulletinsGen(ok)
    if (ok > 0) {
      toast.success(`${ok} bulletins générés`)
      // Set default publication date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setPubDate(tomorrow.toISOString().split('T')[0])
    }
    loadData()
  }

  const handlePublish = async () => {
    if (!pubDate) {
      toast.error('Choisissez une date de publication')
      return
    }
    setPublishing(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/notes/publication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ecoleId: parseInt(ecoleId), classe, trimestre: parseInt(trimestre), annee,
          datePublication: `${pubDate} 00:00:00`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      toast.success(`Publication prévue au ${pubDate}`)
      setBulletinsGen(0)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setPublishing(false)
    }
  }

  const toggleBulletins = async () => {
    if (showBulletins) { setShowBulletins(false); return }
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/notes/bulletins?ecoleId=${ecoleId}&annee=${annee}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      const filtered = data.filter(b => b.classe === classe && b.trimestre === parseInt(trimestre))
      setGeneratedBulletins(filtered)
      setShowBulletins(true)
    } catch { toast.error('Erreur chargement bulletins') }
  }

  const getWeightedAverage = (eleveId) => {
    let totalPoints = 0
    let totalCoeff = 0
    for (const m of matieresList) {
      const note = notes[`${eleveId}-${m}`]
      const coeff = coeffs[m] || 1
      if (note) {
        totalPoints += note.note * coeff
        totalCoeff += coeff
      }
    }
    return totalCoeff > 0 ? (totalPoints / totalCoeff) : null
  }

  if (!user || user.role !== 'directeur') return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Helmet><title>Notes – eInscription.bj</title></Helmet>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestion des notes</h1>

      <div className="card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">École</label>
            <select value={ecoleId} onChange={e => { setEcoleId(e.target.value); setClasse('') }} className="input-field text-sm" disabled={user?.role === 'directeur'}>
              <option value="">Sélectionner</option>
              {ecoles.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Classe</label>
            <select value={classe} onChange={e => setClasse(e.target.value)} className="input-field text-sm">
              <option value="">Sélectionner</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Trimestre</label>
            <select value={trimestre} onChange={e => setTrimestre(parseInt(e.target.value))} className="input-field text-sm">
              {[1, 2, 3].map(t => <option key={t} value={t}>Trimestre {t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Année</label>
            <select value={annee} onChange={e => setAnnee(e.target.value)} className="input-field text-sm">
              {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}-{a + 1}</option>)}
            </select>
          </div>
        </div>
      </div>

      {ecoleId && classe && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{eleves.length} élève(s) – Classe de {classe}</p>
            <div className="flex items-center gap-3">
              {bulletinsGen > 0 && (
                <div className="flex items-center gap-2">
                  <button onClick={toggleBulletins} className="btn-outline text-xs">
                    {showBulletins ? 'Masquer' : 'Voir les bulletins'}
                  </button>
                  <span className="text-xs text-gray-500">Publier le :</span>
                  <input type="date" value={pubDate} onChange={e => setPubDate(e.target.value)} className="input-field text-xs w-auto" />
                  <button onClick={handlePublish} disabled={publishing} className="bg-benin-green text-white text-xs font-medium px-4 py-2 rounded-xl hover:bg-blue-900 transition-colors">
                    {publishing ? 'Publication...' : 'Publier'}
                  </button>
                </div>
              )}
              <button onClick={handleGenerateBulletin} className="btn-outline text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Générer les bulletins
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500">Chargement...</div>
          ) : eleves.length === 0 ? (
            <div className="text-center py-16 text-gray-500">Aucun élève accepté dans cette classe</div>
          ) : (
            <div className="overflow-x-auto card p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 w-48">Élève</th>
                    {matieresList.map(m => {
                      const coeff = coeffs[m] || 1
                      const isEditing = editingCoeff === m
                      return (
                        <th key={m} className="text-center px-2 py-3 font-semibold text-gray-700 min-w-[100px]">
                          <div className="flex items-center justify-center gap-1">
                            <span>{m}</span>
                            {isEditing ? (
                              <input
                                type="number" min="1" max="10"
                                value={coeff}
                                onChange={e => setCoeffs(prev => ({ ...prev, [m]: parseInt(e.target.value) || 1 }))}
                                onBlur={() => setEditingCoeff(null)}
                                onKeyDown={e => { if (e.key === 'Enter') setEditingCoeff(null) }}
                                className="w-8 text-center text-xs border border-gray-300 rounded py-0.5"
                                autoFocus
                              />
                            ) : (
                              <button
                                onClick={() => setEditingCoeff(m)}
                                className="text-[10px] text-gray-400 bg-gray-100 rounded px-1 hover:bg-gray-200"
                                title="Modifier coefficient"
                              >
                                C{coeff}
                              </button>
                            )}
                          </div>
                        </th>
                      )
                    })}
                    <th className="text-center px-2 py-3 font-semibold text-gray-700">Moy.</th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.map(eleve => {
                    const moyenne = getWeightedAverage(eleve.eleveId)
                    return (
                      <tr key={eleve.eleveId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">{eleve.nom}</td>
                        {matieresList.map(m => {
                          const key = `${eleve.eleveId}-${m}`
                          const note = notes[key]
                          const editVal = editing[key] !== undefined ? editing[key] : (note ? note.note : '')
                          const isEditing = editing[key] !== undefined
                          return (
                            <td key={m} className="text-center px-2 py-2">
                              {isEditing || !note ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number" step="0.5" min="0" max="20"
                                    value={editVal}
                                    onChange={e => handleNoteChange(eleve.eleveId, m, e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveNote(eleve.eleveId, m) }}
                                    className="w-14 text-center text-xs border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-benin-green"
                                    placeholder="0-20"
                                  />
                                  <button onClick={() => handleSaveNote(eleve.eleveId, m)} className="text-benin-green hover:text-green-700">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <span className={`font-semibold ${note.note >= 10 ? 'text-green-600' : 'text-red-500'}`}>{note.note}</span>
                                  <button onClick={() => setEditing(prev => ({ ...prev, [key]: note.note }))} className="text-gray-300 hover:text-gray-500">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  {note.id && (
                                    <button onClick={() => handleDeleteNote(note.id)} className="text-gray-300 hover:text-red-500">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          )
                        })}
                        <td className={`text-center px-2 py-2 font-bold ${moyenne !== null && moyenne >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                          {moyenne !== null ? moyenne.toFixed(2) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {showBulletins && generatedBulletins.length > 0 && (
            <div className="mt-6">
              <h2 className="font-bold text-gray-900 mb-3">Aperçu des bulletins ({generatedBulletins.length})</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedBulletins.map(b => {
                  const eleve = eleves.find(e => e.eleveId === b.eleveId)
                  return (
                    <div key={b.id} className="card border border-gray-200">
                      <div className="text-sm font-semibold text-gray-900 mb-1">{eleve?.nom || `Élève #${b.eleveId}`}</div>
                      <div className="text-xs text-gray-500 mb-2">Classe: {b.classe} · T{b.trimestre} · {b.annee}</div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold">{b.moyenne.toFixed(2)}</span>
                          <span className="text-xs text-gray-400 ml-1">/20</span>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          b.decision === 'admis' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {b.decision === 'admis' ? 'Admis' : 'Redouble'}
                        </span>
                      </div>
                      {b.datePublication ? (
                        <p className="text-[10px] text-green-600 mt-2">Publié le {new Date(b.datePublication).toLocaleDateString('fr-FR')}</p>
                      ) : (
                        <p className="text-[10px] text-orange-500 mt-2">Non publié</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
