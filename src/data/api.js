/**
 * Fonctions API génériques — points d'accès au backend Express.
 *
 * Tous les appels sont relatifs à l'API (/api/...) car le frontend
 * est servi par le même serveur Express en production.
 */

const API = '/api'

/** Récupère la liste des écoles */
export async function getEcoles() {
  const res = await fetch(`${API}/ecoles`)
  return res.json()
}

/** Récupère la liste des demandes avec filtres optionnels */
export async function getDemandes(params = {}) {
  const qs = new URLSearchParams()
  if (params.ecoleId) qs.set('ecoleId', params.ecoleId)
  if (params.userId) qs.set('userId', params.userId)
  if (params.telephone) qs.set('telephone', params.telephone)
  if (params.email) qs.set('email', params.email)
  if (params.statut) qs.set('statut', params.statut)
  const q = qs.toString()
  const res = await fetch(`${API}/demandes${q ? `?${q}` : ''}`)
  if (!res.ok) throw new Error('Erreur chargement')
  return res.json()
}

/** Crée une nouvelle demande */
export async function saveDemande(data) {
  const res = await fetch(`${API}/demandes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erreur enregistrement')
  return res.json()
}

/**
 * Met à jour le statut d'une demande.
 * @param {number} id
 * @param {string} statut
 * @param {string} [notes=''] — Motif de rejet (obligatoire si statut='refusé')
 */
export async function getBulletins(params = {}) {
  const qs = new URLSearchParams()
  if (params.ecoleId) qs.set('ecoleId', params.ecoleId)
  if (params.eleveId) qs.set('eleveId', params.eleveId)
  if (params.annee) qs.set('annee', params.annee)
  const q = qs.toString()
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}/notes/bulletins${q ? `?${q}` : ''}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Erreur chargement bulletins')
  return res.json()
}

export async function getNotes(params = {}) {
  const qs = new URLSearchParams()
  if (params.ecoleId) qs.set('ecoleId', params.ecoleId)
  if (params.eleveId) qs.set('eleveId', params.eleveId)
  if (params.classe) qs.set('classe', params.classe)
  if (params.trimestre) qs.set('trimestre', params.trimestre)
  if (params.annee) qs.set('annee', params.annee)
  const q = qs.toString()
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}/notes${q ? `?${q}` : ''}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Erreur chargement notes')
  return res.json()
}

export async function saveNote(data) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erreur enregistrement note')
  return res.json()
}

export async function deleteNote(id) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}/notes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Erreur suppression note')
  return res.json()
}

export async function updateNote(id, data) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('note')
  return res.json()
}

export async function generateBulletin(data) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}/notes/bulletins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erreur génération bulletin')
  return res.json()
}

export async function updateDemandeStatus(id, statut, notes = '') {
  const res = await fetch(`${API}/demandes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statut, notes }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Erreur mise à jour')
  }
  return res.json()
}
