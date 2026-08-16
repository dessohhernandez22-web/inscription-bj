import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ecoles } from '../data/schools'
import toast from 'react-hot-toast'
import { Helmet } from 'react-helmet-async'

export default function AdminDashboard() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState(null)
  const [comptes, setComptes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', nom: '', prenom: '', telephone: '', ecoleId: '' })
  const [loading, setLoading] = useState(false)
  const [createdCompte, setCreatedCompte] = useState(null)
  const [tab, setTab] = useState('comptes')
  const [editEcole, setEditEcole] = useState(null)
  const [editForm, setEditForm] = useState({ nom: '', ville: '', adresse: '', telephone: '', email: '' })

  const loadData = async () => {
    const headers = { Authorization: `Bearer ${token()}` }
    const [statsRes, comptesRes] = await Promise.all([
      fetch('/api/admin/stats', { headers }),
      fetch('/api/admin/comptes', { headers }),
    ])
    if (statsRes.ok) setStats(await statsRes.json())
    if (comptesRes.ok) setComptes(await comptesRes.json())
  }

  useEffect(() => { loadData() }, [])

  const handleGenerate = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/generate-compte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...form, ecoleId: parseInt(form.ecoleId) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setForm({ email: '', nom: '', prenom: '', telephone: '', ecoleId: '' })
      setShowForm(false)
      setCreatedCompte(data)
      loadData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async id => {
    if (!confirm('Réinitialiser le mot de passe de ce compte ?')) return
    try {
      const res = await fetch(`/api/admin/reset-compte/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setCreatedCompte(data)
      loadData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleToggleStatus = async id => {
    try {
      const res = await fetch(`/api/admin/toggle-status/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      toast.success(data.message)
      loadData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleEditEcole = async e => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/edit-ecole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...editForm, id: editEcole.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      toast.success('École modifiée')
      setEditEcole(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (!user || user.role !== 'admin') return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Helmet><title>Administration – eInscription.bj</title></Helmet>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-500 mt-1">Gestion des comptes établissements</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('comptes')} className={`btn-sm ${tab === 'comptes' ? 'btn-primary' : 'btn-outline'}`}>Comptes</button>
          <button onClick={() => setTab('ecoles')} className={`btn-sm ${tab === 'ecoles' ? 'btn-primary' : 'btn-outline'}`}>Écoles</button>
        </div>
      </div>

      {tab === 'comptes' && (
        <>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm mb-6">
            {showForm ? 'Annuler' : 'Générer un compte'}
          </button>

          {showForm && (
            <div className="card mb-8">
              <h2 className="font-bold text-gray-900 mb-4">Génération de compte établissement</h2>
              <form onSubmit={handleGenerate} className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prénom du directeur</label>
                  <input type="text" required value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nom du directeur</label>
                  <input type="text" required value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
                  <input type="tel" value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} className="input-field text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Établissement</label>
                  <select required value={form.ecoleId} onChange={e => setForm(p => ({ ...p, ecoleId: e.target.value }))} className="input-field text-sm">
                    <option value="">Sélectionner une école</option>
                    {ecoles.map(e => {
                      const hasCompte = comptes.some(c => c.ecoleId === e.id)
                      return <option key={e.id} value={e.id} className={hasCompte ? 'text-gray-400' : ''}>
                        {e.nom} — {e.ville}{hasCompte ? ' (déjà un compte)' : ''}
                      </option>
                    })}
                  </select>
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Génération...' : 'Générer le compte'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Annuler</button>
                </div>
              </form>
            </div>
          )}

          {createdCompte && (() => {
            const fullText = `Identifiants eInscription.bj\n\nÉcole: ${ecoles.find(e => e.id === createdCompte.compte.ecoleId)?.nom || '—'}\nDirecteur: ${createdCompte.compte.prenom} ${createdCompte.compte.nom}\nEmail: ${createdCompte.compte.email}\nMot de passe: ${createdCompte.tempPassword}\n\nConnectez-vous sur: ${window.location.origin}/ecole/connexion`
            const copyToClipboard = text => {
              const ta = document.createElement('textarea')
              ta.value = text
              ta.style.position = 'fixed'
              ta.style.opacity = '0'
              document.body.appendChild(ta)
              ta.select()
              document.execCommand('copy')
              document.body.removeChild(ta)
              toast('Copié')
            }
            return (
            <div className="card mb-8 border-2 border-green-400 bg-green-50">
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-bold text-green-800 text-lg">✓ Compte créé avec succès</h2>
                <button onClick={() => setCreatedCompte(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
              <p className="text-sm text-green-700 mb-3">Transmettez ces identifiants au directeur de l'établissement.</p>
              <div className="bg-white rounded-lg p-4 border border-green-200 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 w-20">Directeur :</span>
                  <span>{createdCompte.compte.prenom} {createdCompte.compte.nom}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 w-20">École :</span>
                  <span>{ecoles.find(e => e.id === createdCompte.compte.ecoleId)?.nom || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 w-20">Email :</span>
                  <input readOnly value={createdCompte.compte.email} onClick={e => e.target.select()} className="font-mono text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-0.5 text-sm flex-1 min-w-0" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 w-20">Mot de passe :</span>
                  <input readOnly value={createdCompte.tempPassword} onClick={e => e.target.select()} className="font-mono text-red-600 font-bold bg-red-50 border border-red-100 rounded px-2 py-0.5 text-base flex-1 min-w-0" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { copyToClipboard(fullText) }} className="btn-primary text-xs">Copier tout</button>
                <button onClick={() => setCreatedCompte(null)} className="btn-outline text-xs">Fermer</button>
              </div>
            </div>
            )
          })()}

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card"><p className="text-sm text-gray-500">Directeurs</p><p className="text-2xl font-bold text-benin-green">{stats.directeurs}</p></div>
              <div className="card"><p className="text-sm text-gray-500">Parents</p><p className="text-2xl font-bold text-blue-600">{stats.parents}</p></div>
              <div className="card"><p className="text-sm text-gray-500">Demandes</p><p className="text-2xl font-bold text-purple-600">{stats.demandes}</p></div>
              <div className="card"><p className="text-sm text-gray-500">Écoles actives</p><p className="text-2xl font-bold text-orange-600">{stats.ecolesAvecDemandes}</p></div>
            </div>
          )}

          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">Comptes directeurs ({comptes.length})</h2>
            {comptes.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun compte directeur créé pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-2 font-semibold text-gray-700">Directeur</th>
                      <th className="pb-2 font-semibold text-gray-700">Email</th>
                      <th className="pb-2 font-semibold text-gray-700">Téléphone</th>
                      <th className="pb-2 font-semibold text-gray-700">École</th>
                      <th className="pb-2 font-semibold text-gray-700">Statut</th>
                      <th className="pb-2 font-semibold text-gray-700">Créé le</th>
                      <th className="pb-2 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comptes.map(c => {
                      const ecole = ecoles.find(e => e.id === c.ecoleId)
                      const isBlocked = c.status === 'blocked'
                      return (
                        <tr key={c.id} className="border-b border-gray-100">
                          <td className="py-2.5 font-medium">{c.prenom} {c.nom}</td>
                          <td className="py-2.5 text-gray-600">{c.email}</td>
                          <td className="py-2.5 text-gray-600">{c.telephone || '—'}</td>
                          <td className="py-2.5 text-gray-600">{ecole?.nom || `ID: ${c.ecoleId}`}</td>
                          <td className="py-2.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {isBlocked ? 'Désactivé' : 'Actif'}
                            </span>
                          </td>
                          <td className="py-2.5 text-gray-500">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                          <td className="py-2.5 flex gap-2">
                            <button onClick={() => handleReset(c.id)} className="text-xs text-red-500 hover:underline">Réinit.</button>
                            <button onClick={() => handleToggleStatus(c.id)} className={`text-xs hover:underline ${isBlocked ? 'text-green-500' : 'text-orange-500'}`}>
                              {isBlocked ? 'Activer' : 'Désactiver'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'ecoles' && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Gestion des écoles</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-2 font-semibold text-gray-700">École</th>
                  <th className="pb-2 font-semibold text-gray-700">Ville</th>
                  <th className="pb-2 font-semibold text-gray-700">Téléphone</th>
                  <th className="pb-2 font-semibold text-gray-700">Email</th>
                  <th className="pb-2 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ecoles.map(e => (
                  <tr key={e.id} className="border-b border-gray-100">
                    <td className="py-2.5 font-medium">{e.nom}</td>
                    <td className="py-2.5 text-gray-600">{e.ville}</td>
                    <td className="py-2.5 text-gray-600">{e.telephone || '—'}</td>
                    <td className="py-2.5 text-gray-600">{e.email || '—'}</td>
                    <td className="py-2.5">
                      <button onClick={() => { setEditEcole(e); setEditForm({ nom: e.nom, ville: e.ville, adresse: e.adresse || '', telephone: e.telephone || '', email: e.email || '' }) }}
                        className="text-xs text-blue-500 hover:underline">Modifier</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editEcole && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditEcole(null)}>
              <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-gray-900 mb-1">Modifier l'école</h3>
                <p className="text-sm text-gray-500 mb-4">{editEcole.nom} — {editEcole.ville}</p>
                <form onSubmit={handleEditEcole} className="space-y-3">
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Nom</label><input required value={editForm.nom} onChange={e => setEditForm(p => ({ ...p, nom: e.target.value }))} className="input-field text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Ville</label><input required value={editForm.ville} onChange={e => setEditForm(p => ({ ...p, ville: e.target.value }))} className="input-field text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label><input value={editForm.adresse} onChange={e => setEditForm(p => ({ ...p, adresse: e.target.value }))} className="input-field text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label><input value={editForm.telephone} onChange={e => setEditForm(p => ({ ...p, telephone: e.target.value }))} className="input-field text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Email</label><input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="input-field text-sm" /></div>
                  <div className="flex gap-3 mt-4">
                    <button type="submit" className="btn-primary text-sm">Enregistrer</button>
                    <button type="button" onClick={() => setEditEcole(null)} className="btn-outline text-sm">Annuler</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}