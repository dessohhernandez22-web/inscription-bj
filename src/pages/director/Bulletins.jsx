import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getClasses, getBulletins, generateBulletin } from '../../data/api-director'

export default function Bulletins() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [bulletins, setBulletins] = useState([])
  const [selectedClasse, setSelectedClasse] = useState('')
  const [trimestre, setTrimestre] = useState('1')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedBulletin, setSelectedBulletin] = useState(null)

  const fetchClasses = useCallback(async () => {
    try {
      const c = await getClasses({ ecoleId: user?.ecoleId })
      setClasses(Array.isArray(c) ? c : c.data || [])
    } catch {
      toast.error('Erreur chargement des classes')
    }
  }, [user])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  useEffect(() => {
    async function loadBulletins() {
      if (!selectedClasse) { setBulletins([]); return }
      setLoading(true)
      try {
        const data = await getBulletins({ ecoleId: user?.ecoleId, classeId: selectedClasse, trimestre })
        setBulletins(Array.isArray(data) ? data : data.data || [])
      } catch {
        setBulletins([])
      } finally {
        setLoading(false)
      }
    }
    loadBulletins()
  }, [selectedClasse, trimestre, user])

  const handleGenerate = async () => {
    if (!selectedClasse) {
      toast.error('Sélectionnez une classe')
      return
    }
    setGenerating(true)
    try {
      await generateBulletin({ ecoleId: user?.ecoleId, classeId: parseInt(selectedClasse), trimestre: parseInt(trimestre) })
      toast.success('Bulletins générés avec succès')
      const data = await getBulletins({ ecoleId: user?.ecoleId, classeId: selectedClasse, trimestre })
      setBulletins(Array.isArray(data) ? data : data.data || [])
    } catch (e) {
      toast.error(e.message || 'Erreur lors de la génération')
    } finally {
      setGenerating(false)
    }
  }

  const getMention = (moyenne) => {
    if (moyenne >= 16) return { label: 'Très Bien', color: 'bg-green-100 text-green-800' }
    if (moyenne >= 14) return { label: 'Bien', color: 'bg-blue-100 text-blue-800' }
    if (moyenne >= 12) return { label: 'Assez Bien', color: 'bg-purple-100 text-purple-800' }
    if (moyenne >= 10) return { label: 'Passable', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Insuffisant', color: 'bg-red-100 text-red-800' }
  }

  const trimestreLabel = { '1': 'Premier trimestre', '2': 'Deuxième trimestre', '3': 'Troisième trimestre' }
  const admis = bulletins.filter(b => (b.moyenne || 0) >= 10).length
  const taux = bulletins.length ? Math.round((admis / bulletins.length) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>Bulletins – Direction – eInscription.bj</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Bulletins scolaires</h1>
          <p className="text-gray-500 mt-1">Génération et consultation des bulletins</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={selectedClasse} onChange={e => setSelectedClasse(e.target.value)} className="input-field flex-1">
            <option value="">Sélectionner une classe</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <select value={trimestre} onChange={e => setTrimestre(e.target.value)} className="input-field">
            <option value="1">Trimestre 1</option>
            <option value="2">Trimestre 2</option>
            <option value="3">Trimestre 3</option>
          </select>
          <button onClick={handleGenerate} disabled={generating || !selectedClasse} className="bg-benin-green text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {generating ? 'Génération...' : 'Générer les bulletins'}
          </button>
        </div>
      </div>

      {selectedClasse && bulletins.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-extrabold text-gray-900">{bulletins.length}</p>
            <p className="text-xs text-gray-500">Bulletins</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-extrabold text-green-600">{admis}</p>
            <p className="text-xs text-gray-500">Admis</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-extrabold text-red-600">{bulletins.length - admis}</p>
            <p className="text-xs text-gray-500">Non admis</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-extrabold text-blue-600">{taux}%</p>
            <p className="text-xs text-gray-500">Taux de réussite</p>
          </div>
        </div>
      )}

      {!selectedClasse ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">Sélectionnez une classe</h3>
          <p className="text-gray-500 mt-1">Choisissez une classe pour voir les bulletins.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-benin-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bulletins.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">Aucun bulletin</h3>
          <p className="text-gray-500 mt-1">Générez les bulletins pour ce trimestre.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bulletins.sort((a, b) => (b.moyenne || 0) - (a.moyenne || 0)).map((b, i) => {
            const mention = getMention(b.moyenne || 0)
            return (
              <div key={b.id || i} className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4 px-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedBulletin(selectedBulletin?.id === b.id ? null : b)}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{b.prenom} {b.nom}</p>
                    <p className="text-xs text-gray-500">{b.matricule || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${mention.color}`}>
                    {mention.label}
                  </span>
                  <div className="text-right">
                    <p className={`text-xl font-extrabold ${(b.moyenne || 0) >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                      {(b.moyenne || 0).toFixed(1)}/20
                    </p>
                    <p className="text-[10px] text-gray-400">{trimestreLabel[trimestre]}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedBulletin && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBulletin(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Bulletin – {trimestreLabel[trimestre]}</h2>
                <button onClick={() => setSelectedBulletin(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-benin-green rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                  {selectedBulletin.prenom?.[0]}{selectedBulletin.nom?.[0]}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedBulletin.prenom} {selectedBulletin.nom}</h3>
                <p className="text-sm text-gray-500">{selectedBulletin.matricule || ''}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-extrabold text-gray-900">{(selectedBulletin.moyenne || 0).toFixed(1)}</p>
                  <p className="text-xs text-gray-500">Moyenne générale</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-extrabold text-gray-900">{selectedBulletin.rang || '—'}</p>
                  <p className="text-xs text-gray-500">Rang</p>
                </div>
              </div>

              {selectedBulletin.matieres && selectedBulletin.matieres.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Détail par matière</h4>
                  <div className="space-y-2">
                    {selectedBulletin.matieres.map((m, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-700">{m.nom}</span>
                        <span className={`text-sm font-bold ${m.moyenne >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                          {m.moyenne?.toFixed(1) || '—'}/20
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBulletin.appreciation && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                  <p className="text-sm font-medium text-blue-900">Appréciation</p>
                  <p className="text-sm text-blue-700 mt-1">{selectedBulletin.appreciation}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setSelectedBulletin(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Fermer</button>
              <button className="bg-benin-green text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
