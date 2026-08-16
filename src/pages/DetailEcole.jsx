import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../contexts/AuthContext'
import { ecoles, villes, niveaux, typesEcole, getPlacesDisponibles } from '../data/schools'

const StarIcon = () => (
  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

const MapPinIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

const MailIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

export default function DetailEcole() {
  const { user } = useAuth()
  const { ecoleId } = useParams()
  const navigate = useNavigate()
  const ecole = ecoles.find(e => e.id === parseInt(ecoleId))

  if (!ecole) {
    return (
      <>
        <Helmet><title>eInscription.bj – École introuvable</title></Helmet>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-700 mb-2">École introuvable</h2>
          <p className="text-gray-500 mb-6">Cette école n'existe pas ou a été retirée.</p>
          <Link to="/" className="btn-primary">Retour à l'accueil</Link>
        </div>
      </>
    )
  }

  const typeLabel = typesEcole.find(t => t.id === ecole.type)?.label || ecole.type
  const typeColor = ecole.type === 'public' ? 'bg-green-100 text-green-800' : ecole.type === 'prive' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>{ecole.nom} – eInscription.bj</title>
        <meta name="description" content={`${ecole.nom} · ${typeLabel} · ${ecole.ville}, ${ecole.quartier}. Inscrivez votre enfant en ligne.`} />
        <meta property="og:title" content={`${ecole.nom} – eInscription.bj`} />
        <meta property="og:description" content={`${ecole.nom} · ${typeLabel} · ${ecole.ville}, ${ecole.quartier}. Note : ${ecole.notes}/5.`} />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-benin-green">Accueil</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{ecole.nom}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero card */}
          <div className="card">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-benin-green/20 to-benin-yellow/20 rounded-2xl flex items-center justify-center shrink-0">
                <svg className="w-8 h-8 text-benin-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{ecole.nom}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      ecole.type === 'public' ? 'bg-green-500' : ecole.type === 'prive' ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    {typeLabel}
                    {ecole.confession && ` · ${ecole.confession}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <StarIcon />
                    <span className="font-semibold text-gray-900">{ecole.notes}</span>
                    <span className="text-gray-400">({ecole.avis} avis)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center gap-1.5">
                <MapPinIcon />
                {ecole.quartier}, {ecole.ville}
              </span>
              {ecole.phone && (
                <a href={`tel:${ecole.phone}`} className="flex items-center gap-1.5 hover:text-benin-green">
                  <PhoneIcon />
                  {ecole.phone}
                </a>
              )}
              {ecole.email && (
                <a href={`mailto:${ecole.email}`} className="flex items-center gap-1.5 hover:text-benin-green truncate">
                  <MailIcon />
                  {ecole.email}
                </a>
              )}
            </div>

            {/* Niveau tags */}
            <div className="flex flex-wrap gap-2">
              {ecole.niveau.map(n => {
                const lvl = niveaux.find(x => x.id === n)
                return lvl ? (
                  <span key={n} className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl font-medium">{lvl.label}</span>
                ) : null
              })}
            </div>
          </div>

          {/* Description */}
          {ecole.description && (
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-2">À propos</h2>
              <p className="text-gray-600 leading-relaxed">{ecole.description}</p>
            </div>
          )}

          {/* Places disponibles */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Places disponibles</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {ecole.niveau.map(n => {
                const lvl = niveaux.find(x => x.id === n)
                if (!lvl) return null
                return lvl.sous.map(cls => {
                  const dispo = getPlacesDisponibles(ecole, cls)
                  return (
                    <div key={cls} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium text-gray-700">{cls}</span>
                      <span className={`text-sm font-semibold ${dispo > 5 ? 'text-green-600' : dispo > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                        {dispo > 0 ? `${dispo} place${dispo > 1 ? 's' : ''}` : 'Complet'}
                      </span>
                    </div>
                  )
                })
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Frais de scolarité</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frais d'inscription</span>
                <span className="font-semibold">
                  {ecole.fraisInscription === 0 ? 'Gratuit' : `${ecole.fraisInscription.toLocaleString()} F`}
                </span>
              </div>
              {ecole.fraisScolarite.min > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Scolarité annuelle</span>
                  <span className="font-semibold">
                    {ecole.fraisScolarite.min.toLocaleString()} - {ecole.fraisScolarite.max.toLocaleString()} F
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <Link
                  to={user ? `/inscription/${ecole.id}` : '/connexion'}
                  className="w-full btn-primary text-center block"
                >
                  {user ? 'Inscrire mon enfant' : 'Connectez-vous pour inscrire'}
                </Link>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full btn-outline mt-2 text-center"
                >
                  Retour
                </button>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">En bref</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <UsersIcon />
                <span>{ecole.avis > 0 ? `${ecole.avis} avis` : 'Aucun avis'}</span>
              </div>
              {ecole.niveau.some(n => n === 'maternelle') && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Niveau maternelle</span>
                </div>
              )}
              {ecole.niveau.some(n => n === 'primaire') && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Niveau primaire</span>
                </div>
              )}
              {ecole.niveau.some(n => n === 'secondaire') && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Niveau secondaire</span>
                </div>
              )}
              {ecole.niveau.some(n => n === 'technique') && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Niveau technique</span>
                </div>
              )}
            </div>
          </div>

          {ecole.filieres && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Filières</h3>
              <div className="flex flex-wrap gap-2">
                {ecole.filieres.map(f => (
                  <span key={f} className="text-xs bg-benin-green/10 text-benin-green px-3 py-1.5 rounded-lg font-medium">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
