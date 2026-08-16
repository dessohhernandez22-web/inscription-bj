import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../contexts/AuthContext'
import { getDemandes, statutLabels, statutColors } from '../data/demandes'
import { ecoles } from '../data/schools'

const EmptyState = ({ icon, title, desc }) => (
  <div className="text-center py-16">
    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path d={icon} />
    </svg>
    <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
    <p className="text-gray-500 mt-1 max-w-sm mx-auto">{desc}</p>
  </div>
)

const statusSteps = [
  { key: 'reçu', label: 'Reçu' },
  { key: 'en_cours_validation', label: 'En cours' },
  { key: 'accepté', label: 'Accepté' },
]

const StatusTimeline = ({ statut }) => {
  const currentIdx = statusSteps.findIndex(s => s.key === statut)
  return (
    <div className="flex items-center gap-2 my-4">
      {statusSteps.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            i <= currentIdx ? 'bg-benin-green text-white' : 'bg-gray-200 text-gray-400'
          }`}>
            {i < currentIdx ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : i + 1}
          </div>
          {i < statusSteps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 ${i < currentIdx ? 'bg-benin-green' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function SuiviDossier() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    getDemandes({ email: user.email, force: true })
      .then(data => setDemandes(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Helmet><title>Suivi de dossier – eInscription.bj</title></Helmet>
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Suivi de dossier</h1>
          <p className="text-gray-600 mt-2">Connectez-vous pour suivre l'état de vos inscriptions</p>
        </div>
        <div className="card border-2 border-blue-300 bg-blue-50 text-center py-12">
          <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-xl font-semibold text-blue-800 mb-2">Connectez-vous</h3>
          <p className="text-sm text-blue-600 mb-6 max-w-md mx-auto">Pour consulter l'état de vos demandes d'inscription, veuillez vous connecter à votre compte parent.</p>
          <button onClick={() => navigate('/connexion')} className="btn-primary">Se connecter</button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  const hasResult = demandes.length > 0

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Helmet><title>Suivi de dossier – eInscription.bj</title></Helmet>
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Mes inscriptions</h1>
        <p className="text-gray-600 mt-2">Suivez l'état de vos demandes en temps réel</p>
      </div>

      {!hasResult ? (
        <EmptyState
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          title="Aucune inscription"
          desc="Vous n'avez pas encore de demande d'inscription."
        />
      ) : (
        <div className="space-y-4">
          {demandes.map(d => {
            const ecole = ecoles.find(e => e.id === d.ecoleId)
            return (
              <div key={d.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-benin-green/20 to-benin-yellow/20 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-benin-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{ecole?.nom || d.ecoleNom}</h3>
                        <p className="text-xs text-gray-500">{d.prenomEnfant} {d.nomEnfant} · {d.classe}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`${statutColors[d.statut]} text-xs`}>
                    {statutLabels[d.statut]}
                  </span>
                </div>

                <StatusTimeline statut={d.statut} />

                {d.statut === 'refusé' && d.notes && (
                  <div className="mt-2 mb-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
                    <span className="font-medium text-red-700">Motif du rejet :</span>
                    <p className="text-red-600 mt-0.5">{d.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
                  <div className="text-gray-400">
                    N° <span className="font-mono">#{d.id.toString().slice(-6)}</span>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
