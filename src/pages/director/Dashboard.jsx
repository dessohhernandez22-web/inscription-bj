import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getElevesStats, getClassesStats, getPresencesStats, getPaiementsStats } from '../../data/api-director'

const COLORS = ['#008751', '#eab308', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4']

export default function DirectorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const ecoleId = user?.ecoleId
        const [eleves, classes, presences, paiements] = await Promise.all([
          getElevesStats(ecoleId).catch(() => ({})),
          getClassesStats(ecoleId).catch(() => ({})),
          getPresencesStats(ecoleId).catch(() => ({})),
          getPaiementsStats(ecoleId).catch(() => ({})),
        ])
        setStats({ eleves, classes, presences, paiements })
      } catch (e) {
        toast.error('Erreur chargement des statistiques')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-benin-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const totalEleves = stats?.eleves?.total || 0
  const totalEnseignants = stats?.eleves?.enseignants || 0
  const totalClasses = stats?.classes?.total || 0
  const absentsAujourdhui = stats?.presences?.absentsAujourdhui || 0
  const paiementsJour = stats?.paiements?.aujourdhui || 0
  const revenusMois = stats?.paiements?.revenusMois || 0

  const statCards = [
    { label: 'Total élèves', value: totalEleves, color: 'text-benin-green', bg: 'bg-green-50', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { label: 'Enseignants', value: totalEnseignants, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Classes', value: totalClasses, color: 'text-purple-600', bg: 'bg-purple-50', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Absents aujourd\'hui', value: absentsAujourdhui, color: 'text-red-600', bg: 'bg-red-50', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
    { label: 'Paiements du jour', value: `${paiementsJour.toLocaleString('fr-FR')} FCFA`, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Revenus du mois', value: `${revenusMois.toLocaleString('fr-FR')} FCFA`, color: 'text-benin-green', bg: 'bg-green-50', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ]

  const classStats = stats?.classes?.parClasse || []
  const maxEffectif = Math.max(...classStats.map(c => c.effectif || 0), 1)
  const maxCapacite = Math.max(...classStats.map(c => c.capacite || 1), 1)

  const recentActivity = stats?.eleves?.recentActivity || []
  const quickLinks = [
    { to: '/directeur/eleves', label: 'Gérer les élèves', color: 'bg-benin-green' },
    { to: '/directeur/classes', label: 'Gérer les classes', color: 'bg-blue-600' },
    { to: '/directeur/presences', label: 'Présences', color: 'bg-yellow-500' },
    { to: '/directeur/emploi-du-temps', label: 'Emploi du temps', color: 'bg-purple-600' },
    { to: '/directeur/communication', label: 'Communiquer', color: 'bg-pink-600' },
    { to: '/directeur/parametres', label: 'Paramètres', color: 'bg-gray-600' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>Tableau de bord – Direction – eInscription.bj</title>
        <meta name="description" content="Tableau de bord de direction pour la gestion scolaire." />
      </Helmet>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">Vue d'ensemble de votre établissement</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((s, i) => (
          <div key={i} className="card">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <svg className={`w-5 h-5 ${s.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d={s.icon} />
              </svg>
            </div>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Effectifs par classe</h3>
          {classStats.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-3">
              {classStats.map((c, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{c.nom || c.nomClasse}</span>
                    <span className="text-gray-500">{c.effectif || 0}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(((c.effectif || 0) / maxEffectif) * 100, 100)}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Capacité utilisée</h3>
          {classStats.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-3">
              {classStats.map((c, i) => {
                const pct = c.capacite ? Math.round(((c.effectif || 0) / c.capacite) * 100) : 0
                const barColor = pct > 95 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-benin-green'
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{c.nom || c.nomClasse}</span>
                      <span className="text-gray-500">{c.effectif || 0}/{c.capacite || '?'} ({pct}%)</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-gray-900 mb-4">Activité récente</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune activité récente</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-benin-green/10 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-benin-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700">{a.message || a.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{a.date ? new Date(a.date).toLocaleDateString('fr-FR') : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div className="space-y-2">
            {quickLinks.map((link, i) => (
              <Link
                key={i}
                to={link.to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className={`w-8 h-8 ${link.color} rounded-lg flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
