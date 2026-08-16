import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getDemandes, statutLabels } from '../data/demandes'
import { ecoles } from '../data/schools'
import { jsPDF } from 'jspdf'
import ChatBox from '../components/ChatBox'
import PaymentModal from '../components/PaymentModal'

const statutColors = {
  'reçu': 'bg-blue-100 text-blue-700',
  'en_cours_validation': 'bg-yellow-100 text-yellow-700',
  'accepté': 'bg-green-100 text-green-700',
  'refusé': 'bg-red-100 text-red-700',
  'liste_attente': 'bg-orange-100 text-orange-700',
}

const timelineSteps = ['reçu', 'en_cours_validation', 'accepté']

function generateReceipt(d) {
  const ecole = ecoles.find(e => e.id === d.ecoleId)
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFillColor(0, 135, 81)
  doc.rect(0, 0, pageW, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text('eInscription.bj', pageW / 2, 8, { align: 'center' })

  doc.setTextColor(0, 135, 81)
  doc.setFontSize(18)
  doc.text('REÇU D\'INSCRIPTION', pageW / 2, 28, { align: 'center' })

  doc.setDrawColor(0, 135, 81)
  doc.setLineWidth(0.5)
  doc.line(20, 33, pageW - 20, 33)

  doc.setTextColor(51, 51, 51)
  doc.setFontSize(11)
  const leftX = 20
  let y = 46
  const lineH = 9

  const fields = [
    ['Établissement', ecole?.nom || d.ecoleNom || '—'],
    ['Adresse', ecole ? `${ecole.quartier}, ${ecole.ville}` : '—'],
    ['Élève', `${d.prenomEnfant} ${d.nomEnfant}`],
    ['Date de naissance', d.dateNaissance || '—'],
    ['Classe', d.classe],
    ['Niveau', d.niveau || '—'],
    ['Filière', d.filiere || '—'],
    ['Parent', `${d.prenomParent} ${d.nomParent}`],
    ['Email', d.email || '—'],
    ['Téléphone', d.telephone || '—'],
    ['Date d\'inscription', new Date(d.createdAt).toLocaleDateString('fr-FR')],
  ]

  fields.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold')
    doc.text(`${label} :`, leftX, y)
    const labelW = doc.getTextWidth(`${label} :`)
    doc.setFont(undefined, 'normal')
    doc.text(value, leftX + labelW + 2, y)
    y += lineH
  })

  y += 6
  doc.setFillColor(240, 249, 235)
  doc.roundedRect(leftX, y, pageW - 40, 14, 2, 2, 'F')
  doc.setTextColor(0, 100, 50)
  doc.setFontSize(10)
  doc.text('✓ Demande acceptée — Statut confirmé', pageW / 2, y + 10, { align: 'center' })

  y += 28
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, pageW / 2, y, { align: 'center' })
  doc.text('Ce document est délivré par eInscription.bj', pageW / 2, y + 5, { align: 'center' })

  doc.save(`recu-${d.prenomEnfant.toLowerCase()}-${d.nomEnfant.toLowerCase()}.pdf`)
}

export default function DashboardParent() {
  const { user, token } = useAuth()
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [chatDemande, setChatDemande] = useState(null)
  const [payDemande, setPayDemande] = useState(null)

  const handlePaymentDone = data => {
    setPayDemande(null)
    load()
  }

  const load = useCallback(async () => {
    if (!user) return
    try {
      let data = await getDemandes({ userId: user.id })
      if (data.length === 0 && user.telephone) {
        data = await getDemandes({ telephone: user.telephone })
      }
      setDemandes(data)
    } catch {}
  }, [user])

  useEffect(() => {
    load().finally(() => setLoading(false))
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load])

  if (loading) return <div className="text-center py-16 text-gray-500">Chargement...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes inscriptions</h1>
          <p className="text-gray-500 mt-1">Bienvenue, {user?.prenom} {user?.nom}</p>
        </div>
      </div>

      {demandes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mb-4">Vous n'avez pas encore d'inscriptions</p>
          <Link to="/" className="btn-primary inline-block">Rechercher une école</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {demandes.map(d => {
            const currentStep = timelineSteps.indexOf(d.statut)
            const isRejected = d.statut === 'refusé'
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">{d.prenomEnfant} {d.nomEnfant}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{d.ecoleNom}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{d.niveau}</span>
                      {d.filiere && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{d.filiere}</span>}
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{d.classe}</span>
                    </div>

                    {isRejected && d.notes && (
                      <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3">
                        <span className="text-xs font-medium text-red-700">Motif du rejet :</span>
                        <p className="text-xs text-red-600 mt-0.5">{d.notes}</p>
                      </div>
                    )}

                    {/* Timeline */}
                    {!isRejected && (
                      <div className="mt-4 flex items-center gap-1">
                        {timelineSteps.map((step, i) => {
                          const done = currentStep >= i
                          const active = currentStep === i
                          return (
                            <div key={step} className="flex items-center gap-1 flex-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? 'bg-benin-green text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {done ? '✓' : i + 1}
                              </div>
                              <span className={`text-[10px] ${active ? 'text-benin-green font-medium' : done ? 'text-green-600' : 'text-gray-400'}`}>
                                {statutLabels[step]}
                              </span>
                              {i < timelineSteps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${done && i < currentStep ? 'bg-benin-green' : 'bg-gray-200'}`} />}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full ${statutColors[d.statut] || 'bg-gray-100 text-gray-600'}`}>
                      {statutLabels[d.statut] || d.statut}
                    </span>
                    <button onClick={() => setChatDemande(d)} className="btn-outline text-[10px] px-2.5 py-1">
                      Discuter
                    </button>
                    {d.statut === 'accepté' && !d.paiementReference && (
                      <button onClick={() => setPayDemande(d)} className="btn-primary text-[10px] px-2.5 py-1">
                        Payer en ligne
                      </button>
                    )}
                    {d.paiementReference && (
                      <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                        Payé
                      </span>
                    )}
                    {d.statut === 'accepté' && (
                      <button onClick={() => generateReceipt(d)} className="btn-outline text-[10px] px-2.5 py-1">
                        Reçu PDF
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>Inscrit le {new Date(d.createdAt).toLocaleDateString('fr-FR')}</span>
                  <Link to={`/ecole/${d.ecoleId}`} className="text-benin-green hover:underline">Voir l'école</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {chatDemande && <ChatBox demandeId={chatDemande.id} onClose={() => setChatDemande(null)} />}
      {payDemande && (
        <PaymentModal
          demande={payDemande}
          montant={payDemande.montantPaiement || ecoles.find(e => e.id === payDemande.ecoleId)?.fraisInscription || 15000}
          onClose={() => setPayDemande(null)}
          onSuccess={handlePaymentDone}
        />
      )}
    </div>
  )
}
