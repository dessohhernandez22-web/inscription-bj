import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../contexts/AuthContext'
import { ecoles, villes, niveaux, typesEcole, departements, abrevDepartements, getPlacesDisponibles, promos } from '../data/schools'

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

const MapPinIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const StarIcon = () => (
  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path d="M5 13l4 4L19 7" />
  </svg>
)

const SchoolCard = ({ ecole, user }) => {
  const typeLabel = typesEcole.find(t => t.id === ecole.type)?.label || ecole.type

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-benin-green/20 to-benin-yellow/20 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-benin-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <Link to={`/ecole/${ecole.id}`} className="font-semibold text-gray-900 leading-tight hover:text-benin-green transition-colors">{ecole.nom}</Link>
            <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${
                ecole.type === 'public' ? 'bg-green-500' : ecole.type === 'prive' ? 'bg-blue-500' : 'bg-purple-500'
              }`} />
              {typeLabel}
              {ecole.confession && ` · ${ecole.confession}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <StarIcon />
          <span className="font-semibold">{ecole.notes}</span>
          <span className="text-gray-400">({ecole.avis})</span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
        <MapPinIcon />
        <span>{ecole.quartier}, {ecole.ville}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {ecole.niveau.map(n => {
          const lvl = niveaux.find(x => x.id === n)
          return lvl ? (
            <span key={n} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">{lvl.label}</span>
          ) : null
        })}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          {ecole.fraisInscription === 0 ? (
            <span className="text-sm font-semibold text-green-600">Gratuit</span>
          ) : (
            <div className="text-sm">
              <span className="font-semibold">{ecole.fraisInscription.toLocaleString()} F</span>
              <span className="text-gray-400 ml-1">inscription</span>
              {ecole.fraisScolarite.min > 0 && (
                <p className="text-gray-500 text-xs">{ecole.fraisScolarite.min.toLocaleString()} - {ecole.fraisScolarite.max.toLocaleString()} F/an</p>
              )}
            </div>
          )}
        </div>
        <Link
          to={user ? `/inscription/${ecole.id}` : '/connexion'}
          className="bg-benin-green text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-blue-900 transition-colors active:scale-95"
        >
          {user ? 'Inscrire' : 'Connectez-vous'}
        </Link>
      </div>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    ville: '',
    niveau: '',
    type: '',
    fraisMax: '',
    departement: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('ville')
  const [pendingSearch, setPendingSearch] = useState('')
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  const deptList = useMemo(() => {
    const depts = [...new Set(Object.values(departements))].sort()
    return depts
  }, [])

  const filtered = useMemo(() => {
    let result = ecoles.filter(e => {
      if (search) {
        const q = search.toLowerCase()
        if (!e.nom.toLowerCase().includes(q) && !e.ville.toLowerCase().includes(q) && !e.quartier.toLowerCase().includes(q)) {
          return false
        }
      }
      if (filters.departement && departements[e.ville] !== filters.departement) return false
      if (filters.ville && e.ville !== filters.ville) return false
      if (filters.niveau && !e.niveau.includes(filters.niveau)) return false
      if (filters.type && e.type !== filters.type) return false
      if (filters.fraisMax) {
        const max = parseInt(filters.fraisMax)
        if (e.fraisScolarite.min > max) return false
      }
        return true
    })
    if (sortBy === 'note') {
      result = [...result].sort((a, b) => b.notes - a.notes)
    } else if (sortBy === 'prix-croissant') {
      result = [...result].sort((a, b) => (a.fraisScolarite.min || 0) - (b.fraisScolarite.min || 0))
    } else if (sortBy === 'prix-decroissant') {
      result = [...result].sort((a, b) => (b.fraisScolarite.min || 0) - (a.fraisScolarite.min || 0))
    } else if (sortBy === 'nom') {
      result = [...result].sort((a, b) => a.nom.localeCompare(b.nom))
    } else if (sortBy === 'ville') {
      result = [...result].sort((a, b) => a.ville.localeCompare(b.ville) || a.nom.localeCompare(b.nom))
    }
    return result
  }, [search, filters, sortBy])

  const resetFilters = () => {
    setFilters({ ville: '', niveau: '', type: '', fraisMax: '', departement: '' })
    setSearch('')
    setPendingSearch('')
    setSortBy('ville')
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div>
      <Helmet>
        <title>eInscription.bj – Trouvez la meilleure école pour votre enfant au Bénin</title>
        <meta name="description" content="Comparez les écoles au Bénin : écoles maternelles, primaires et secondaires. Inscrivez votre enfant en ligne facilement." />
        <meta property="og:title" content="eInscription.bj – Trouvez la meilleure école pour votre enfant" />
        <meta property="og:description" content="Comparez les écoles au Bénin et inscrivez votre enfant en ligne." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://einscription.bj" />
        <meta property="og:site_name" content="eInscription.bj" />
      </Helmet>
      {/* Hero section */}
      <section className="bg-gradient-to-br from-benin-green/[0.08] via-white to-benin-yellow/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-benin-green/10 text-benin-green text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <CheckIcon />
              <span>Première plateforme d'inscription scolaire en ligne au Bénin</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Inscrivez vos enfants à l'école
              <span className="text-benin-green"> sans vous déplacer</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Trouvez la meilleure école pour votre enfant parmi des centaines d'établissements
              à Cotonou, Porto-Novo, Abomey-Calavi, Parakou et partout au Bénin.
            </p>

            {/* Search bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="🔍 Tapez le nom de l'école, une ville ou un quartier..."
                  value={pendingSearch}
                  onKeyDown={e => { if (e.key === 'Enter') setSearch(pendingSearch) }}
                  onChange={e => setPendingSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 shadow-lg shadow-black/5 text-base focus:outline-none focus:ring-2 focus:ring-benin-green"
                  style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' class=\'w-5 h-5 text-gray-400\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\' stroke-width=\'2\'%3E%3Cpath d=\'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: '16px center', backgroundSize: '20px'}}
                />
              </div>
              <button
                onClick={() => setSearch(pendingSearch)}
                className="bg-benin-green text-white font-medium px-6 py-4 rounded-2xl hover:bg-blue-900 transition-colors active:scale-95 shadow-lg"
              >
                🔍 Trouver
              </button>
            </div>

            {/* Popular cities */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['Cotonou', 'Porto-Novo', 'Abomey-Calavi', 'Parakou', 'Bohicon', 'Lokossa'].map(v => (
                <button
                  key={v}
                  onClick={() => { setFilters(prev => ({ ...prev, ville: prev.ville === v ? '' : v })); setSearch(''); setPendingSearch('') }}
                  className={`text-sm px-4 py-2 rounded-xl font-medium transition-all ${
                    filters.ville === v ? 'bg-benin-green text-white shadow-md' : 'bg-white/80 text-gray-600 hover:bg-white hover:shadow-sm border border-gray-200'
                  }`}
                >
                  📍 {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Geolocation suggestions */}
      {user && userLocation && !search && !activeFilterCount && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            <svg className="w-5 h-5 inline-block mr-1.5 text-benin-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Écoles à proximité
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[...ecoles]
              .filter(e => e.lat && e.lng)
              .sort((a, b) => {
                const dist = (la, lo) => {
                  const R = 6371
                  const dLat = (la - userLocation.lat) * Math.PI / 180
                  const dLon = (lo - userLocation.lng) * Math.PI / 180
                  const a2 = Math.sin(dLat/2)**2 + Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(la * Math.PI / 180) * Math.sin(dLon/2)**2
                  return R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1-a2))
                }
                return dist(a.lat, a.lng) - dist(b.lat, b.lng)
              })
              .slice(0, 4)
              .map(ecole => (
                <SchoolCard key={ecole.id} ecole={ecole} user={user} />
              ))}
          </div>
        </section>
      )}

      {/* Personalized suggestions for logged-in users */}
      {user && !userLocation && !search && !activeFilterCount && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Suggestions pour vous</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {ecoles.slice(0, 4).map(ecole => (
              <SchoolCard key={ecole.id} ecole={ecole} user={user} />
            ))}
          </div>
        </section>
      )}

      {/* Filters bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 btn-outline text-sm"
            >
              <FilterIcon />
              Filtres{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </button>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{filtered.length}</span> école{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}
              </p>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="input-field text-sm py-1.5 w-auto"
              >
                <option value="ville">Par ville (A-Z)</option>
                <option value="note">Meilleure note</option>
                <option value="prix-croissant">Prix croissant</option>
                <option value="prix-decroissant">Prix décroissant</option>
                <option value="nom">Ordre alphabétique (école)</option>
              </select>
            {(search || activeFilterCount > 0) && (
              <button onClick={resetFilters} className="text-sm text-benin-green font-medium hover:underline ml-auto">
                Réinitialiser
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 pb-3">
              <select
                value={filters.departement}
                onChange={e => {
                  const dept = e.target.value
                  setFilters(prev => ({
                    ...prev,
                    departement: dept,
                    ville: dept ? (villes.find(v => departements[v] === dept) || '') : '',
                  }))
                }}
                className="input-field text-sm"
              >
                <option value="">Tous les départements</option>
                {deptList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={filters.ville}
                onChange={e => setFilters(prev => ({ ...prev, ville: e.target.value, departement: '' }))}
                className="input-field text-sm"
              >
                <option value="">Toutes les villes</option>
                {villes.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select
                value={filters.niveau}
                onChange={e => setFilters(prev => ({ ...prev, niveau: e.target.value }))}
                className="input-field text-sm"
              >
                <option value="">Tous les niveaux</option>
                {niveaux.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
              <select
                value={filters.type}
                onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="input-field text-sm"
              >
                <option value="">Tous les types</option>
                {typesEcole.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <select
                value={filters.fraisMax}
                onChange={e => setFilters(prev => ({ ...prev, fraisMax: e.target.value }))}
                className="input-field text-sm"
              >
                <option value="">Tous les prix</option>
                <option value="100000">Jusqu'à 100 000 F/an</option>
                <option value="250000">Jusqu'à 250 000 F/an</option>
                <option value="500000">Jusqu'à 500 000 F/an</option>
                <option value="1000000">Jusqu'à 1 000 000 F/an</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* School results */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700">Aucune école trouvée</h3>
            <p className="text-gray-500 mt-1">Essayez de modifier vos filtres ou votre recherche.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(ecole => (
              <SchoolCard key={ecole.id} ecole={ecole} user={user} />
            ))}
          </div>
        )}
      </section>

      {/* Promoted schools */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">Écoles en vedette</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {promos.map(id => {
              const ecole = ecoles.find(e => e.id === id)
              return ecole ? <SchoolCard key={ecole.id} ecole={ecole} user={user} /> : null
            })}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-white py-16 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-12">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Recherchez', desc: 'Trouvez l\'école idéale par ville, quartier, niveau ou budget.' },
              { step: '2', title: 'Inscrivez-vous', desc: 'Remplissez le formulaire en ligne et téléchargez les documents.' },
              { step: '3', title: 'Suivez votre dossier', desc: 'Recevez les notifications et suivez l\'évolution en temps réel.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-benin-green rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
