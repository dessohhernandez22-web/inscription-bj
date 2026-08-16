import { useState } from 'react'

const networks = [
  { id: 'mtn', label: 'MTN Mobile Money', color: 'bg-yellow-400', textColor: 'text-yellow-800', icon: 'M' },
  { id: 'moov', label: 'Moov Money', color: 'bg-blue-500', textColor: 'text-blue-800', icon: 'Mv' },
  { id: 'celpaid', label: 'Celpaid', color: 'bg-green-500', textColor: 'text-green-800', icon: 'Cp' },
]

const steps = [
  { id: 'network', label: 'Réseau' },
  { id: 'confirm', label: 'Confirmer' },
  { id: 'processing', label: 'Paiement' },
  { id: 'done', label: 'Terminé' },
]

export default function PaymentModal({ demande, montant, onClose, onSuccess }) {
  const [step, setStep] = useState('network')
  const [selectedNetwork, setSelectedNetwork] = useState(null)
  const [phone, setPhone] = useState(demande.telephone || '')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = () => {
    if (!phone) return
    setCodeSent(true)
  }

  const handleConfirmCode = async () => {
    if (!code) return
    setStep('processing')
    // Simulate payment processing
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/demandes/${demande.id}/payer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ montant, reseau: selectedNetwork.id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setStep('done')
        setTimeout(() => onSuccess(data), 2000)
      } catch (err) {
        setError(err.message || 'Erreur de paiement')
        setStep('error')
      }
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl sm:mb-0 sm:mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Paiement inscription</h3>
            <p className="text-xs text-gray-500">{demande.prenomEnfant} {demande.nomEnfant} — {demande.classe}</p>
          </div>
          {step !== 'processing' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          )}
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-1 px-4 py-3 bg-gray-50 border-b border-gray-100">
          {steps.map((s, i) => {
            const idx = steps.findIndex(x => x.id === step)
            const done = i < idx || (step === 'done' && s.id === 'done')
            const active = s.id === step
            return (
              <div key={s.id} className="flex items-center gap-1 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  done ? 'bg-benin-green text-white' : active ? 'bg-benin-green text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] hidden sm:inline ${active ? 'text-benin-green font-medium' : done ? 'text-green-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${(done || (step === 'done' && i < steps.length - 1)) ? 'bg-benin-green' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>

        {/* Amount */}
        <div className="text-center py-4 bg-gradient-to-r from-benin-green/5 to-benin-yellow/5 border-b border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Montant à payer</p>
          <p className="text-3xl font-bold text-gray-900">{montant.toLocaleString()} <span className="text-lg font-medium">F</span></p>
        </div>

        {/* Step: Network Selection */}
        {step === 'network' && (
          <div className="p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Choisissez votre réseau Mobile Money</p>
            {networks.map(n => (
              <button
                key={n.id}
                onClick={() => { setSelectedNetwork(n.id); setStep('confirm') }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                  selectedNetwork === n.id ? 'border-benin-green bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 ${n.color} rounded-xl flex items-center justify-center text-white font-bold text-sm`}>
                  {n.icon}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">{n.label}</p>
                  <p className="text-xs text-gray-500">Paiement instantané</p>
                </div>
                <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Step: Confirm + Phone */}
        {step === 'confirm' && (
          <div className="p-4 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-blue-700 text-xs">
                  Un code de confirmation vous sera envoyé par SMS sur votre numéro Mobile Money.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Mobile Money</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ex: 97000000"
                className="input-field text-sm"
                disabled={codeSent}
              />
            </div>

            {codeSent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code de confirmation</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Entrez le code reçu par SMS"
                  className="input-field text-sm text-center text-lg tracking-widest"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Code simulé : 123456</p>
              </div>
            )}

            <div className="flex gap-3">
              {!codeSent ? (
                <button onClick={handleSendCode} className="btn-primary flex-1 text-sm">
                  Envoyer le code
                </button>
              ) : (
                <button
                  onClick={handleConfirmCode}
                  disabled={code.length < 4}
                  className="btn-primary flex-1 text-sm disabled:opacity-50"
                >
                  Confirmer le paiement
                </button>
              )}
              <button onClick={() => { setStep('network'); setCodeSent(false); setCode('') }} className="btn-outline text-sm">
                Modifier
              </button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-benin-green border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-900 font-semibold">Paiement en cours...</p>
            <p className="text-sm text-gray-500">Veuillez ne pas fermer cette page.</p>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-left space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Réseau</span><span className="font-medium">{networks.find(n => n.id === selectedNetwork)?.label}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Numéro</span><span className="font-medium">{phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Montant</span><span className="font-medium">{montant.toLocaleString()} F</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Référence</span><span className="font-medium text-xs">Génération en cours...</span></div>
            </div>
          </div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-900">Paiement échoué</p>
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => { setStep('network'); setError('') }} className="btn-primary w-full text-sm">
              Réessayer
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-900">Paiement effectué !</p>
            <p className="text-sm text-gray-500">
              Votre inscription pour <strong>{demande.prenomEnfant} {demande.nomEnfant}</strong> est confirmée.
            </p>
            <div className="bg-green-50 rounded-xl p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Montant</span><span className="font-medium text-green-700">{montant.toLocaleString()} F</span></div>
            </div>
            <button onClick={() => onSuccess()} className="btn-primary w-full text-sm">
              Terminé
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
