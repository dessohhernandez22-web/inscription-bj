import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getClasses, getMatieres, getEleves, getNotes, saveNotes } from '../../data/api-director'

export default function Notes() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [matieres, setMatieres] = useState([])
  const [eleves, setEleves] = useState([])
  const [, setNotesList] = useState([])
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedMatiere, setSelectedMatiere] = useState('')
  const [trimestre, setTrimestre] = useState('1')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notesMap, setNotesMap] = useState({})
  const [activeTab, setActiveTab] = useState('saisie')

  const fetchMeta = useCallback(async () => {
    try {
      const ecoleId = user?.ecoleId
      const [c, m] = await Promise.all([
        getClasses({ ecoleId }),
        getMatieres({ ecoleId }),
      ])
      setClasses(Array.isArray(c) ? c : c.data || [])
      setMatieres(Array.isArray(m) ? m : m.data || [])
    } catch {
      toast.error('Erreur chargement des données')
    }
  }, [user])

  useEffect(() => { fetchMeta() }, [fetchMeta])

  useEffect(() => {
    async function loadNotes() {
      if (!selectedClasse || !selectedMatiere) { setNotesList([]); return }
      setLoading(true)
      try {
        const data = await getNotes({ ecoleId: user?.ecoleId, classeId: selectedClasse, matiereId: selectedMatiere, trimestre })
        const list = Array.isArray(data) ? data : data.data || []
        setNotesList(list)
        const map = {}
        list.forEach(n => { map[n.eleveId || n.id] = n.valeur || '' })
        setNotesMap(map)
      } catch {
        setNotesList([])
      } finally {
        setLoading(false)
      }
    }
    loadNotes()
  }, [selectedClasse, selectedMatiere, trimestre, user])

  useEffect(() => {
    async function loadEleves() {
      if (!selectedClasse) { setEleves([]); return }
      try {
        const data = await getEleves({ ecoleId: user?.ecoleId, classeId: selectedClasse })
        setEleves(Array.isArray(data) ? data : data.data || [])
      } catch {
        setEleves([])
      }
    }
    loadEleves()
  }, [selectedClasse, user])

  const handleSave = async () => {
    if (!selectedClasse || !selectedMatiere) {
      toast.error('Sélectionnez une classe et une matière')
      return
    }
    setSaving(true)
    try {
      const payload = eleves.map(e => ({
        eleveId: e.id,
        classeId: parseInt(selectedClasse),
        matiereId: parseInt(selectedMatiere),
        trimestre: parseInt(trimestre),
        valeur: parseFloat(notesMap[e.id]) || 0,
        ecoleId: user?.ecoleId,
      }))
      await saveNotes({ notes: payload, ecoleId: user?.ecoleId })
      toast.success('Notes enregistrées avec succès')
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const getNoteColor = (val) => {
    if (val === '' || val === undefined) return 'text-gray-400'
    const v = parseFloat(val)
    if (v >= 16) return 'text-green-600 font-bold'
    if (v >= 14) return 'text-green-500'
    if (v >= 10) return 'text-yellow-600'
    if (v >= 8) return 'text-orange-500'
    return 'text-red-600 font-bold'
  }

  const notesValues = Object.values(notesMap).filter(v => v !== '').map(Number)
  const moyenne = notesValues.length ? (notesValues.reduce((a, b) => a + b, 0) / notesValues.length).toFixed(1) : '—'
  const maxNote = notesValues.length ? Math.max(...notesValues).toFixed(1) : '—'
  const minNote = notesValues.length ? Math.min(...notesValues).toFixed(1) : '—'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>Notes – Direction – eInscription.bj</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Gestion des notes</h1>
          <p className="text-gray-500 mt-1">Saisie et consultation des notes</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6">
        <button onClick={() => setActiveTab('saisie')} className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'saisie' ? 'bg-benin-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Saisie des notes
        </button>
        <button onClick={() => setActiveTab('bulletins')} className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'bulletins' ? 'bg-benin-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Aperçu bulletins
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={selectedClasse} onChange={e => setSelectedClasse(e.target.value)} className="input-field flex-1">
            <option value="">Classe</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <select value={selectedMatiere} onChange={e => setSelectedMatiere(e.target.value)} className="input-field flex-1">
            <option value="">Matière</option>
            {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
          <select value={trimestre} onChange={e => setTrimestre(e.target.value)} className="input-field">
            <option value="1">Trimestre 1</option>
            <option value="2">Trimestre 2</option>
            <option value="3">Trimestre 3</option>
          </select>
        </div>
      </div>

      {activeTab === 'saisie' && (
        <>
          {!selectedClasse || !selectedMatiere ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700">Sélectionnez une classe et une matière</h3>
              <p className="text-gray-500 mt-1">Choisissez les filtres pour commencer la saisie.</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-benin-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : eleves.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold text-gray-700">Aucun élève dans cette classe</h3>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="card text-center">
                  <p className="text-2xl font-extrabold text-gray-900">{moyenne}</p>
                  <p className="text-xs text-gray-500">Moyenne</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-extrabold text-green-600">{maxNote}</p>
                  <p className="text-xs text-gray-500">Note max</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-extrabold text-red-600">{minNote}</p>
                  <p className="text-xs text-gray-500">Note min</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-extrabold text-blue-600">{eleves.length}</p>
                  <p className="text-xs text-gray-500">Élèves</p>
                </div>
              </div>

              <div className="space-y-2">
                {eleves.map(el => (
                  <div key={el.id} className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                        {el.prenom?.[0]}{el.nom?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{el.prenom} {el.nom}</p>
                        <p className="text-xs text-gray-500">{el.matricule || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={notesMap[el.id] || ''}
                        onChange={ev => setNotesMap(prev => ({ ...prev, [el.id]: ev.target.value }))}
                        className="input-field w-24 text-center text-lg font-bold"
                        placeholder="—"
                      />
                      <span className={`text-sm font-medium ${getNoteColor(notesMap[el.id])}`}>
                        {notesMap[el.id] !== '' && notesMap[el.id] !== undefined
                          ? parseFloat(notesMap[el.id]) >= 10 ? 'Admis' : 'Non admis'
                          : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={saving} className="bg-benin-green text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  {saving ? 'Enregistrement...' : 'Enregistrer les notes'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'bulletins' && (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">Génération des bulletins</h3>
          <p className="text-gray-500 mt-1">Sélectionnez une classe et un trimestre pour générer les bulletins.</p>
          <p className="text-xs text-gray-400 mt-4">La génération complète des bulletins est disponible dans l&apos;onglet Bulletins de la sidebar.</p>
        </div>
      )}
    </div>
  )
}
