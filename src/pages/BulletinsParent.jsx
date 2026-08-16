import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ecoles, niveaux } from '../data/schools'
import { getNotes, getBulletins } from '../data/api'
import { getDemandes } from '../data/demandes'
import { Helmet } from 'react-helmet-async'

const matieresList = [
  'Mathématiques', 'Français', 'Anglais', 'Histoire-Géo', 'Sciences',
  'EPS', 'Arts', 'Musique', 'Physique', 'Chimie', 'SVT',
]

export default function BulletinsParent() {
  const { user } = useAuth()
  const [demandes, setDemandes] = useState([])
  const [selected, setSelected] = useState(null)
  const [trimestre, setTrimestre] = useState(1)
  const [annee, setAnnee] = useState(new Date().getFullYear().toString())
  const [notes, setNotes] = useState([])
  const [bulletins, setBulletins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getDemandes({ userId: user.id, statut: 'accepté' })
      .then(setDemandes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!selected) return
    Promise.all([
      getNotes({ eleveId: selected.id, trimestre, annee }),
      getBulletins({ eleveId: selected.id, annee }),
    ]).then(([n, b]) => {
      setNotes(n)
      setBulletins(b)
    }).catch(() => {})
  }, [selected, trimestre, annee])

  const ecole = selected ? ecoles.find(e => e.id === selected.ecoleId) : null

  const notesByMatiere = {}
  notes.forEach(n => {
    if (!notesByMatiere[n.matiere]) notesByMatiere[n.matiere] = []
    notesByMatiere[n.matiere].push(n)
  })

  const bulletin = bulletins.find(b => b.trimestre === trimestre)
  const moyennes = matieresList.map(m => {
    const ns = notesByMatiere[m] || []
    if (!ns.length) return null
    const totalCoeff = ns.reduce((s, n) => s + (n.coeff || 1), 0)
    const pondere = ns.reduce((s, n) => s + n.note * (n.coeff || 1), 0)
    return { matiere: m, moyenne: pondere / totalCoeff }
  }).filter(Boolean)

  const totalNotesPondere = notes.reduce((s, n) => s + n.note * (n.coeff || 1), 0)
  const totalCoeffNotes = notes.reduce((s, n) => s + (n.coeff || 1), 0)
  const moyenneGenerale = totalCoeffNotes > 0 ? totalNotesPondere / totalCoeffNotes : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Helmet><title>Résultats – eInscription.bj</title></Helmet>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Résultats scolaires</h1>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Chargement...</div>
      ) : demandes.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">Aucun enfant accepté trouvé</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            {demandes.map(d => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selected?.id === d.id
                    ? 'bg-benin-green text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d.prenomEnfant} {d.nomEnfant}
              </button>
            ))}
          </div>

          {selected && (
            <>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900">{selected.prenomEnfant} {selected.nomEnfant}</h2>
                  <p className="text-sm text-gray-500">{ecole?.nom} · {selected.classe}</p>
                </div>
                <select value={trimestre} onChange={e => setTrimestre(parseInt(e.target.value))} className="input-field text-sm w-auto">
                  {[1, 2, 3].map(t => <option key={t} value={t}>Trimestre {t}</option>)}
                </select>
                <select value={annee} onChange={e => setAnnee(e.target.value)} className="input-field text-sm w-auto">
                  {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}-{a + 1}</option>)}
                </select>
              </div>

              {notes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                  <p className="text-gray-500">Aucune note pour ce trimestre</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Matière</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-700">Note</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-700">Coeff.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matieresList.map(m => {
                        const ns = notesByMatiere[m]
                        if (!ns || !ns.length) return null
                        const totalCoeff = ns.reduce((s, n) => s + (n.coeff || 1), 0)
                        const moy = ns.reduce((s, n) => s + n.note * (n.coeff || 1), 0) / totalCoeff
                        return (
                          <tr key={m} className="border-b border-gray-100">
                            <td className="px-4 py-3 font-medium text-gray-900">{m}</td>
                            <td className={`text-center px-4 py-3 font-bold ${moy >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                              {moy.toFixed(2)}
                            </td>
                            <td className="text-center px-4 py-3 text-gray-500">{ns[0]?.coeff || 1}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    {moyenneGenerale !== null && (
                      <tfoot>
                        <tr className="bg-gray-50 font-bold">
                          <td className="px-4 py-3 text-gray-700">Moyenne générale</td>
                          <td className={`text-center px-4 py-3 ${moyenneGenerale >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                            {moyenneGenerale.toFixed(2)}
                          </td>
                          <td className="text-center px-4 py-3">
                            {bulletin && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                bulletin.decision === 'admis' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {bulletin.decision === 'admis' ? 'Admis' : 'Redouble'}
                              </span>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
