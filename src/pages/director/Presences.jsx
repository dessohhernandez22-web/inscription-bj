import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getClasses, getPresences, savePresences, getPresencesStats } from '../../data/api-director'

export default function Presences() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [selectedClasse, setSelectedClasse] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [eleves, setEleves] = useState([])
  const [presencesMap, setPresencesMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState(null)

  const fetchClasses = useCallback(async () => {
    try {
      const c = await getClasses({ ecoleId: user?.ecoleId })
      setClasses(Array.isArray(c) ? c : c.data || [])
    } catch (e) {
      toast.error('Erreur chargement des classes')
    }
  }, [user])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  useEffect(() => {
    async function loadStats() {
      try {
        const s = await getPresencesStats(user?.ecoleId)
        setStats(s)
      } catch {}
    }
    loadStats()
  }, [user])

  const fetchPresences = useCallback(async () => {
    if (!selectedClasse) { setEleves([]); return }
    setLoading(true)
    try {
      const data = await getPresences({ classeId: selectedClasse, date })
      const list = Array.isArray(data) ? data : data.data || data.eleves || []
      setEleves(list)
      const map = {}
      list.forEach(e => {
        map[e.eleveId || e.id] = e.statut || 'absent'
      })
      setPresencesMap(map)
    } catch (e) {
      toast.error('Erreur chargement des présences')
    } finally {
      setLoading(false)
    }
  }, [selectedClasse, date, user])

  useEffect(() => { fetchPresences() }, [fetchPresences])

  const toggleStatut = (eleveId) => {
    setPresencesMap(prev => {
      const current = prev[eleveId] || 'absent'
      const next = current === 'present' ? 'retard' : current === 'retard' ? 'absent' : 'present'
      return { ...prev, [eleveId]: next }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const presences = Object.entries(presencesMap).map(([eleveId, statut]) => ({
        eleveId: parseInt(eleveId),
        statut,
        date,
        classeId: parseInt(selectedClasse),
        ecoleId: user?.ecoleId,
      }))
      await savePresences({ presences, date, classeId: selectedClasse, ecoleId: user?.ecoleId })
      toast.success('Présences enregistrées avec succès')
    } catch (e) {
      toast.error(e.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'present': return 'bg-green-500 text-white'
      case 'absent': return 'bg-red-100 text-red-700 border border-red-300'
      case 'retard': return 'bg-yellow-400 text-white'
      default: return 'bg-gray-100 text-gray-500 border border-gray-300'
    }
  }

  const presentCount = Object.values(presencesMap).filter(s => s === 'present').length
  const absentCount = Object.values(presencesMap).filter(s => s === 'absent').length
  const retardCount = Object.values(presencesMap).filter(s => s === 'retard').length
  const total = Object.keys(presencesMap).length
  const pctPresence = total ? Math.round((presentCount / total) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>Présences – Direction – eInscription.bj</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Présences</h1>
          <p className="text-gray-500 mt-1">Gestion des présences journalières</p>
        </div>
      </div>

      {stats && (
        <div className="card mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-benin-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Présence moyenne aujourd'hui</p>
              <p className="text-2xl font-extrabold text-benin-green">{stats.pctPresenceAujourdhui || pctPresence}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={selectedClasse} onChange={e => setSelectedClasse(e.target.value)} className="input-field flex-1">
            <option value="">Sélectionner une classe</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
        </div>
      </div>

      {!selectedClasse ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">Sélectionnez une classe</h3>
          <p className="text-gray-500 mt-1">Choisissez une classe pour commencer l'appel.</p>
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
              <p className="text-2xl font-extrabold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-extrabold text-green-600">{presentCount}</p>
              <p className="text-xs text-gray-500">Présents</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-extrabold text-red-600">{absentCount}</p>
              <p className="text-xs text-gray-500">Absents</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-extrabold text-yellow-600">{retardCount}</p>
              <p className="text-xs text-gray-500">Retards</p>
            </div>
          </div>

          <div className="space-y-2">
            {eleves.map(e => {
              const eid = e.eleveId || e.id
              const statut = presencesMap[eid] || 'absent'
              return (
                <div key={eid} className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                      {e.prenom?.[0]}{e.nom?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{e.prenom} {e.nom}</p>
                      <p className="text-xs text-gray-500">{e.matricule || ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPresencesMap(prev => ({ ...prev, [eid]: 'present' }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        statut === 'present' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      Présent
                    </button>
                    <button
                      onClick={() => setPresencesMap(prev => ({ ...prev, [eid]: 'retard' }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        statut === 'retard' ? 'bg-yellow-400 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                      }`}
                    >
                      Retard
                    </button>
                    <button
                      onClick={() => setPresencesMap(prev => ({ ...prev, [eid]: 'absent' }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        statut === 'absent' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-benin-green text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M5 13l4 4L19 7" />
              </svg>
              {saving ? 'Enregistrement...' : 'Enregistrer les présences'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
