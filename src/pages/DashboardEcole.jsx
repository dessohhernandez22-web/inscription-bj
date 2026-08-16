import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { useAuth } from '../contexts/AuthContext'
import { ecoles } from '../data/schools'
import { refreshDemandes, updateDemandeStatus, statutLabels } from '../data/demandes'
import ChatBox from '../components/ChatBox'

const statsCards = [
  { label: 'Nouvelles demandes', getValue: d => d.filter(x => x.statut === 'reçu').length, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'En cours', getValue: d => d.filter(x => x.statut === 'en_cours_validation').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { label: 'Acceptés', getValue: d => d.filter(x => x.statut === 'accepté').length, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Places restantes', getValue: d => 0, color: 'text-purple-600', bg: 'bg-purple-50' },
]

const filters = [
  { value: '', label: 'Tous' },
  { value: 'reçu', label: 'Reçus' },
  { value: 'en_cours_validation', label: 'En cours' },
  { value: 'accepté', label: 'Acceptés' },
  { value: 'refusé', label: 'Refusés' },
]

const ActionButtons = ({ demande, onRefresh }) => {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const handleAction = async (newStatus, notes = '') => {
    try {
      await updateDemandeStatus(demande.id, newStatus, notes)
      toast.success(`Demande ${statutLabels[newStatus].toLowerCase()}`)
      onRefresh()
    } catch (e) {
      toast.error(e.message || 'Erreur lors de l\'action')
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Veuillez saisir le motif du rejet')
      return
    }
    setRejecting(true)
    try {
      await handleAction('refusé', rejectReason.trim())
      setShowRejectModal(false)
      setRejectReason('')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setRejecting(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {demande.statut === 'reçu' && (
          <>
            <button
              onClick={() => handleAction('en_cours_validation')}
              className="bg-yellow-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Prendre en charge
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
            >
              Refuser
            </button>
          </>
        )}
        {demande.statut === 'en_cours_validation' && (
          <>
            <button
              onClick={() => handleAction('accepté')}
              className="bg-benin-green text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-900 transition-colors"
            >
              Accepter
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
            >
              Refuser
            </button>
            <button
              onClick={() => handleAction('liste_attente')}
              className="bg-orange-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Liste d'attente
            </button>
          </>
        )}
        {(demande.statut === 'accepté' || demande.statut === 'refusé' || demande.statut === 'liste_attente') && (
          <button
            onClick={() => handleAction('reçu')}
            className="btn-outline text-xs"
          >
            Rouvrir
          </button>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">Motif du rejet</h3>
            <p className="text-sm text-gray-500 mb-4">Veuillez expliquer pourquoi cette demande est rejetée.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="input-field text-sm w-full min-h-[100px]"
              placeholder="Ex: Documents incomplets, classe complète..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button onClick={handleReject} disabled={rejecting} className="bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
                {rejecting ? 'Traitement...' : 'Confirmer le rejet'}
              </button>
              <button onClick={() => { setShowRejectModal(false); setRejectReason('') }} className="btn-outline text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function DashboardEcole() {
  const { user } = useAuth()
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [ecoleId, setEcoleId] = useState(user?.role === 'directeur' ? user?.ecoleId || '' : '')
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [chatDemande, setChatDemande] = useState(null)

  const refresh = useCallback(async () => {
    if (!ecoleId) { setLoading(false); return }
    setLoading(true)
    const data = await refreshDemandes(ecoleId)
    setDemandes(data)
    setLoading(false)
  }, [ecoleId])

  useEffect(() => { refresh() }, [refresh])

  const demandeEcole = ecoleId ? ecoles.find(e => e.id === parseInt(ecoleId)) : null

  const demandesEcole = demandes

  const filtered = demandesEcole.filter(d => {
    if (filter && d.statut !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!d.nomEnfant?.toLowerCase()?.includes(q) &&
          !d.prenomEnfant?.toLowerCase()?.includes(q) &&
          !d.telephone?.includes(q)) return false
    }
    return true
  })

  const placesTotal = demandeEcole
    ? Object.values(demandeEcole.places || {}).reduce((a, b) => a + b, 0)
    : 0
  const placesRestantes = Math.max(0, placesTotal - demandesEcole.filter(d => d.statut === 'accepté').length)
  const stats = statsCards.map(s => ({
    ...s,
    value: s.label === 'Places restantes' ? placesRestantes : s.getValue(demandesEcole),
  }))

  const exporterPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(demandeEcole?.nom || 'Tableau de bord', 14, 20)
    doc.setFontSize(10)
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28)
    doc.autoTable({
      startY: 34,
      head: [['N°', 'Enfant', 'Classe', 'Parent', 'Téléphone', 'Statut']],
      body: filtered.map((d, i) => [
        i + 1,
        `${d.prenomEnfant} ${d.nomEnfant}`,
        d.classe,
        `${d.prenomParent} ${d.nomParent}`,
        d.telephone,
        statutLabels[d.statut],
      ]),
    })
    doc.save(`inscriptions-${ecoleId || 'dashboard'}.pdf`)
    toast.success('PDF exporté avec succès')
  }

  const exporterExcel = () => {
    const data = filtered.map(d => ({
      Enfant: `${d.prenomEnfant} ${d.nomEnfant}`,
      Classe: d.classe,
      Parent: `${d.prenomParent} ${d.nomParent}`,
      Téléphone: d.telephone,
      Email: d.email || '',
      Statut: statutLabels[d.statut],
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inscriptions')
    XLSX.writeFile(wb, `inscriptions-${ecoleId || 'dashboard'}.xlsx`)
    toast.success('Excel exporté avec succès')
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Accès réservé</h3>
          <p className="text-gray-500 mb-6">Connectez-vous en tant que directeur d'école pour accéder à ce tableau de bord.</p>
          <Link to="/ecole/connexion" className="btn-primary">Connexion directeur</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>{demandeEcole ? `${demandeEcole.nom} – Dashboard` : 'Tableau de bord'} – eInscription.bj</title>
        <meta name="description" content="Gérez les demandes d'inscription de votre école." />
      </Helmet>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            {demandeEcole ? demandeEcole.nom : 'Tableau de bord'}
          </h1>
          <p className="text-gray-500 mt-1">
            {demandeEcole
              ? `${demandeEcole.quartier}, ${demandeEcole.ville}`
              : 'Sélectionnez une école pour gérer ses inscriptions'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {user?.role !== 'directeur' && (
          <select
            value={ecoleId}
            onChange={e => setEcoleId(e.target.value)}
            className="input-field text-sm"
          >
            <option value="">Choisir une école</option>
            {ecoles.map(e => (
              <option key={e.id} value={e.id}>{e.nom}</option>
            ))}
          </select>
          )}
        <button
          onClick={refresh}
          className="btn-outline text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>
      </div>

      {!ecoleId ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">Sélectionnez une école</h3>
          <p className="text-gray-500 mt-1">Choisissez un établissement dans le menu déroulant pour voir ses demandes d'inscription.</p>
        </div>
      ) : (
      <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="card">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & search */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`text-sm px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  filter === f.value
                    ? 'bg-benin-green text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Rechercher un élève..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field sm:w-64"
          />
        </div>
      </div>

      {/* Demandes list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">Aucune demande</h3>
          <p className="text-gray-500 mt-1">
            {demandes.length === 0
              ? 'Les inscriptions des parents apparaîtront ici.'
              : 'Aucune demande ne correspond à vos filtres.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(d => (
            <div key={d.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                      {d.prenomEnfant?.[0]}{d.nomEnfant?.[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {d.prenomEnfant} {d.nomEnfant}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {d.classe} · N° <span className="font-mono">#{d.id.toString().slice(-6)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm mt-3">
                    <div>
                      <span className="text-gray-400 text-xs">Parent</span>
                      <p className="font-medium">{d.prenomParent} {d.nomParent}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Téléphone</span>
                      <p className="font-medium">{d.telephone}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Email</span>
                      <p className="font-medium">{d.email || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Date de naissance</span>
                      <p className="font-medium">{d.dateNaissance ? new Date(d.dateNaissance).toLocaleDateString('fr-FR') : '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Sexe</span>
                      <p className="font-medium">{d.sexe || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Documents</span>
                      <p className="font-medium">{d.documents?.length || 0} fichier(s)</p>
                    </div>
                  </div>

                  <ActionButtons demande={d} onRefresh={refresh} />
                  <button onClick={() => setChatDemande(d)} className="btn-outline text-xs mt-2">
                    Discuter
                  </button>
                </div>

                <span className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-semibold ${
                  d.statut === 'accepté' ? 'bg-green-100 text-green-800' :
                  d.statut === 'refusé' ? 'bg-red-100 text-red-800' :
                  d.statut === 'en_cours_validation' ? 'bg-yellow-100 text-yellow-800' :
                  d.statut === 'liste_attente' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {statutLabels[d.statut]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export section */}
      <div className="card mt-8">
        <h3 className="font-semibold text-gray-900 mb-3">Export des données</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={exporterPDF} className="btn-outline text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter en PDF
          </button>
          <button onClick={exporterExcel} className="btn-outline text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter en Excel
          </button>
        </div>
      </div>
      </>
      )}
      {chatDemande && <ChatBox demandeId={chatDemande.id} onClose={() => setChatDemande(null)} />}
    </div>
  )
}
