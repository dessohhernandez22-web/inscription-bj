import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { ecoles, niveaux, getPlacesDisponibles } from '../data/schools'
import { saveDemande } from '../data/demandes'
import { useAuth } from '../contexts/AuthContext'

const MAX_ENFANTS = 20

const steps = [
  { id: 1, label: 'Niveau' },
  { id: 2, label: 'Enfants' },
  { id: 3, label: 'Parent' },
  { id: 4, label: 'Documents' },
  { id: 5, label: 'Paiement' },
  { id: 6, label: 'Confirmation' },
]

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center gap-1 mb-8">
    {steps.map((step, i) => (
      <div key={step.id} className="flex items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
          step.id === current
            ? 'bg-benin-green text-white ring-4 ring-benin-green/20'
            : step.id < current
            ? 'bg-benin-green text-white'
            : 'bg-gray-200 text-gray-400'
        }`}>
          {step.id < current ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : step.id}
        </div>
        {i < steps.length - 1 && (
          <div className={`w-8 md:w-16 h-0.5 mx-1 ${
            step.id < current ? 'bg-benin-green' : 'bg-gray-200'
          }`} />
        )}
      </div>
    ))}
  </div>
)

const ClasseSelect = ({ niveauxDispo, value, onChange, ecole }) => (
  <div className="grid grid-cols-3 gap-2">
    {niveauxDispo.map(n => {
      const dispo = getPlacesDisponibles(ecole, n)
      const full = dispo <= 0
      return (
        <button
          key={n}
          type="button"
          onClick={() => !full && onChange(n)}
          disabled={full}
          className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
            value === n
              ? 'bg-benin-green text-white border-benin-green'
              : full
              ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
              : 'bg-white text-gray-700 border-gray-200 hover:border-benin-green'
          }`}
        >
          <span>{n}</span>
          <span className={`block text-xs mt-0.5 ${value === n ? 'text-white/80' : full ? 'text-red-400' : 'text-gray-400'}`}>
            {full ? 'Complet' : `${dispo} place${dispo > 1 ? 's' : ''}`}
          </span>
        </button>
      )
    })}
  </div>
)

const enfantVide = () => ({
  classe: '',
  nom: '',
  prenom: '',
  dateNaissance: '',
  lieuNaissance: '',
  sexe: '',
})

export default function Inscription() {
  const { ecoleId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const ecole = ecoles.find(e => e.id === parseInt(ecoleId))

  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [niveau, setNiveau] = useState('')
  const [filiere, setFiliere] = useState('')
  const [enfants, setEnfants] = useState([enfantVide()])
  const groupIdRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nomParent: '',
    prenomParent: '',
    email: '',
    telephone: '',
    adresse: '',
    documents: [],
    modePaiement: '',
  })

  useEffect(() => {
    if (!ecole) navigate('/')
  }, [ecole, navigate])

  if (!ecole) return null

  const niveauxDispo = niveaux.filter(n => ecole.niveau.includes(n.id))
  const classesDispo = niveauxDispo.find(n => n.id === niveau)?.sous || []

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const updateEnfant = (idx, field, value) => {
    setEnfants(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
    setError('')
  }

  const ajouterEnfant = () => {
    if (enfants.length >= MAX_ENFANTS) return
    setEnfants(prev => [...prev, enfantVide()])
  }

  const retirerEnfant = idx => {
    if (enfants.length <= 1) return
    setEnfants(prev => prev.filter((_, i) => i !== idx))
  }

  const validerEtape = () => {
    switch (step) {
      case 1:
        if (!niveau) return 'Sélectionnez un niveau scolaire'
        if (ecole.filieres && !filiere) return 'Sélectionnez une filière'
        for (const e of enfants) {
          if (!e.classe) return 'Sélectionnez une classe pour chaque enfant'
          if (getPlacesDisponibles(ecole, e.classe) <= 0) return `Aucune place disponible en ${e.classe}`
        }
        return ''
      case 2:
        for (let i = 0; i < enfants.length; i++) {
          const e = enfants[i]
          if (!e.nom || !e.prenom) return `Prénom et nom requis pour l'enfant ${i + 1}`
          if (!e.dateNaissance) return `Date de naissance requise pour l'enfant ${i + 1}`
          if (!e.sexe) return `Sélectionnez le sexe pour l'enfant ${i + 1}`
        }
        return ''
      case 3:
        if (!form.nomParent || !form.prenomParent) return 'Nom et prénom du parent requis'
        if (!form.telephone) return 'Numéro de téléphone requis'
        if (form.telephone.length < 8) return 'Numéro de téléphone invalide'
        return ''
      default:
        return ''
    }
  }

  const next = () => {
    const err = validerEtape()
    if (err) { setError(err); return }
    setStep(s => Math.min(s + 1, 6))
    setError('')
  }

  const prev = () => {
    setStep(s => Math.max(s - 1, 1))
    setError('')
  }

  const submit = async () => {
    setLoading(true)
    try {
      groupIdRef.current = Date.now()
      for (const enfant of enfants) {
        await saveDemande({
          niveau,
          filiere: ecole.filieres ? filiere : '',
          classe: enfant.classe,
          nomEnfant: enfant.nom,
          prenomEnfant: enfant.prenom,
          dateNaissance: enfant.dateNaissance,
          lieuNaissance: enfant.lieuNaissance,
          sexe: enfant.sexe,
          nomParent: form.nomParent,
          prenomParent: form.prenomParent,
          email: form.email,
          telephone: form.telephone,
          adresse: form.adresse,
          documents: form.documents,
          modePaiement: form.modePaiement,
          ecoleId: ecole.id,
          ecoleNom: ecole.nom,
          statut: 'reçu',
          userId: user?.id,
          groupId: groupIdRef.current,
        })
      }
      toast.success(`${enfants.length} inscription${enfants.length > 1 ? 's' : ''} soumise${enfants.length > 1 ? 's' : ''} avec succès`)
      setStep(6)
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  const totalFrais = ecole.fraisInscription + (ecole.fraisScolarite.min)

  const inputClass = "input-field"
  const labelClass = "label"

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>Inscription – {ecole.nom} – eInscription.bj</title>
        <meta name="description" content={`Inscrivez vos enfants à ${ecole.nom} (${ecole.ville}). Formulaire d'inscription en ligne.`} />
      </Helmet>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M15 19l-7-7 7-7" />
        </svg>
        Retour à la recherche
      </Link>

      {/* École info */}
      <div className="card mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-benin-green/20 to-benin-yellow/20 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-benin-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-lg text-gray-900">{ecole.nom}</h2>
            <p className="text-sm text-gray-500">{ecole.quartier}, {ecole.ville}</p>
          </div>
        </div>
      </div>

      <StepIndicator current={step} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Étape 1: Niveau */}
      {step === 1 && (
        <div className="card space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Niveau scolaire</h3>

          <div>
            <label className={labelClass}>Niveau scolaire</label>
            <div className="grid grid-cols-3 gap-2">
              {niveauxDispo.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { setNiveau(n.id); setEnfants([enfantVide()]) }}
                  className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                    niveau === n.id
                      ? 'bg-benin-green text-white border-benin-green'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-benin-green'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          {niveau && (
            <>
              {ecole.filieres && niveau === 'technique' && (
                <div>
                  <label className={labelClass}>Filière</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ecole.filieres.map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => { setFiliere(f); setEnfants([enfantVide()]) }}
                        className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                          filiere === f
                            ? 'bg-benin-green text-white border-benin-green'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-benin-green'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(!ecole.filieres || filiere) && enfants.map((enfant, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-sm text-gray-700">Enfant {idx + 1}</label>
                    {enfants.length > 1 && (
                      <button type="button" onClick={() => retirerEnfant(idx)} className="text-xs text-red-500 hover:text-red-700">
                        Retirer
                      </button>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Classe</label>
                    <ClasseSelect
                      niveauxDispo={classesDispo}
                      value={enfant.classe}
                      onChange={v => updateEnfant(idx, 'classe', v)}
                      ecole={ecole}
                    />
                    {enfant.classe && (
                      <p className="text-sm text-gray-500 mt-2">
                        {getPlacesDisponibles(ecole, enfant.classe)} place{getPlacesDisponibles(ecole, enfant.classe) > 1 ? 's' : ''} restante{getPlacesDisponibles(ecole, enfant.classe) > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {(!ecole.filieres || filiere) && enfants.length < MAX_ENFANTS && (
                <button type="button" onClick={ajouterEnfant} className="btn-outline text-sm w-full flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un enfant
                </button>
              )}

              {(!ecole.filieres || filiere) && enfants.length >= MAX_ENFANTS && (
                <p className="text-xs text-gray-400 text-center">Maximum {MAX_ENFANTS} enfants par inscription</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Étape 2: Enfants info */}
      {step === 2 && (
        <div className="space-y-6">
          {enfants.map((enfant, idx) => (
            <div key={idx} className="card space-y-4">
              <h3 className="text-lg font-bold text-gray-900">
                Enfant {idx + 1}
                {filiere && <span className="text-sm font-normal text-gray-500 ml-2">· {filiere}</span>}
                {enfant.classe && <span className="text-sm font-normal text-gray-500 ml-2">· {enfant.classe}</span>}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nom</label>
                  <input className={inputClass} value={enfant.nom} onChange={e => updateEnfant(idx, 'nom', e.target.value)} placeholder="NOM" />
                </div>
                <div>
                  <label className={labelClass}>Prénom</label>
                  <input className={inputClass} value={enfant.prenom} onChange={e => updateEnfant(idx, 'prenom', e.target.value)} placeholder="Prénom" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Date de naissance</label>
                  <input type="date" className={inputClass} value={enfant.dateNaissance} onChange={e => updateEnfant(idx, 'dateNaissance', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Lieu de naissance</label>
                  <input className={inputClass} value={enfant.lieuNaissance} onChange={e => updateEnfant(idx, 'lieuNaissance', e.target.value)} placeholder="Ville" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Sexe</label>
                <div className="flex gap-3">
                  {['Masculin', 'Féminin'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateEnfant(idx, 'sexe', s)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                        enfant.sexe === s
                          ? 'bg-benin-green text-white border-benin-green'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Étape 3: Parent */}
      {step === 3 && (
        <div className="card space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Informations du parent / tuteur</h3>
          <p className="text-sm text-gray-500">Ces informations seront partagées pour tous les enfants inscrits.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nom</label>
              <input className={inputClass} value={form.nomParent} onChange={e => updateForm('nomParent', e.target.value)} placeholder="NOM" />
            </div>
            <div>
              <label className={labelClass}>Prénom</label>
              <input className={inputClass} value={form.prenomParent} onChange={e => updateForm('prenomParent', e.target.value)} placeholder="Prénom" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Numéro de téléphone</label>
            <input type="tel" className={inputClass} value={form.telephone} onChange={e => updateForm('telephone', e.target.value)} placeholder="+229 61 00 00 00" />
            <p className="text-xs text-gray-400 mt-1">Recevrez les notifications par SMS et WhatsApp</p>
          </div>
          <div>
            <label className={labelClass}>Email (optionnel)</label>
            <input type="email" className={inputClass} value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="exemple@email.com" />
          </div>
          <div>
            <label className={labelClass}>Adresse</label>
            <input className={inputClass} value={form.adresse} onChange={e => updateForm('adresse', e.target.value)} placeholder="Ville, quartier" />
          </div>
        </div>
      )}

      {/* Étape 4: Documents */}
      {step === 4 && (
        <div className="card space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Documents à fournir</h3>
          <p className="text-sm text-gray-500">Vous pouvez prendre une photo claire de chaque document avec votre téléphone.</p>
          {[
            { id: 'extrait', label: 'Extrait de naissance', required: true },
            { id: 'bulletin', label: 'Bulletin / relevé de notes précédent', required: false },
            { id: 'photo', label: 'Photo d\'identité de l\'enfant', required: true },
          ].map(doc => (
            <div key={doc.id} className="border border-dashed border-gray-300 rounded-xl p-4 hover:border-benin-green transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900">{doc.label}</p>
                  {doc.required && <span className="text-xs text-red-500">Requis</span>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!form.documents.includes(doc.id)) {
                      updateForm('documents', [...form.documents, doc.id])
                    } else {
                      updateForm('documents', form.documents.filter(d => d !== doc.id))
                    }
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    form.documents.includes(doc.id)
                      ? 'bg-benin-green text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {form.documents.includes(doc.id) ? '✓ Ajouté' : 'Ajouter'}
                </button>
              </div>
            </div>
          ))}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700">Accepté : photo (JPEG, PNG) ou PDF. Taille max : 5 Mo par fichier.</p>
            </div>
          </div>
        </div>
      )}

      {/* Étape 5: Paiement */}
      {step === 5 && (
        <div className="card space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Paiement</h3>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Frais d'inscription</span>
              <span className="font-semibold">{ecole.fraisInscription.toLocaleString()} F</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Scolarité annuelle (à partir de)</span>
              <span className="font-semibold">{ecole.fraisScolarite.min.toLocaleString()} F</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
              <span>Total à payer aujourd'hui</span>
              <span className="text-benin-green">{totalFrais.toLocaleString()} F</span>
            </div>
            {enfants.length > 1 && (
              <p className="text-xs text-gray-400 text-center pt-1">{enfants.length} enfant{enfants.length > 1 ? 's' : ''} · Les frais d'inscription s'appliquent par enfant.</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Mode de paiement</label>
            <div className="space-y-3">
              {[
                { id: 'mtn', label: 'MTN Mobile Money', icon: 'M' },
                { id: 'moov', label: 'Moov Money', icon: 'M' },
                { id: 'card', label: 'Carte bancaire (Visa/MasterCard)', icon: 'C' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateForm('modePaiement', m.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    form.modePaiement === m.id
                      ? 'border-benin-green bg-benin-green/5 ring-1 ring-benin-green'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-10 h-10 bg-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                    {m.icon}
                  </div>
                  <span className="font-medium text-sm text-gray-900">{m.label}</span>
                  {form.modePaiement === m.id && (
                    <svg className="w-5 h-5 text-benin-green ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Étape 6: Confirmation */}
      {step === 6 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription soumise !</h2>
          <p className="text-gray-600 mb-6">
            {enfants.length > 1
              ? `Vos ${enfants.length} demandes d'inscription à ${ecole.nom} ont bien été reçues.`
              : `Votre demande d'inscription à ${ecole.nom} a bien été reçue.`}
            {' '}Vous recevrez une notification par SMS dès qu'elles seront traitées.
          </p>
          <div className="card inline-block text-left mb-8 max-w-sm mx-auto">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-8"><span className="text-gray-500">N° dossier</span><span className="font-mono font-medium">#{String(groupIdRef.current).slice(-6)}</span></div>
              <div className="flex justify-between gap-8"><span className="text-gray-500">École</span><span>{ecole.nom}</span></div>
              <div className="flex justify-between gap-8"><span className="text-gray-500">Enfant(s)</span><span>{enfants.map(e => e.prenom).join(', ')}</span></div>
              <div className="flex justify-between gap-8"><span className="text-gray-500">Statut</span><span className="badge-info">Reçu</span></div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/suivi" className="btn-primary">Suivre mon dossier</Link>
            <Link to="/" className="btn-secondary">Nouvelle inscription</Link>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      {step < 6 && (
        <div className="flex justify-between mt-6">
          <div>
            {step > 1 ? (
              <button onClick={prev} className="btn-outline">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                  Retour
                </span>
              </button>
            ) : <div />}
          </div>
          <button
            onClick={step === 5 ? submit : next}
            disabled={loading}
            className="btn-primary"
          >
            {step === 5 ? (loading ? 'Envoi en cours...' : 'Confirmer et payer') : 'Suivant'}
            {step < 5 && (
              <svg className="w-4 h-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
