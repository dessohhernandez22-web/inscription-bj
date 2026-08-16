const API = '/api'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...authHeaders() }
}

async function handle(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Erreur serveur')
  }
  return res.json()
}

// ─── Élèves ───────────────────────────────────────────────
export async function getEleves(params = {}) {
  const qs = new URLSearchParams()
  if (params.ecoleId) qs.set('ecoleId', params.ecoleId)
  if (params.classeId) qs.set('classeId', params.classeId)
  if (params.statut) qs.set('statut', params.statut)
  if (params.search) qs.set('search', params.search)
  const q = qs.toString()
  const res = await fetch(`${API}/eleves${q ? `?${q}` : ''}`, { headers: authHeaders() })
  return handle(res)
}

export async function saveEleve(data) {
  const res = await fetch(`${API}/eleves`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function updateEleve(id, data) {
  const res = await fetch(`${API}/eleves/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function deleteEleve(id) {
  const res = await fetch(`${API}/eleves/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handle(res)
}

export async function getElevesStats(ecoleId) {
  const qs = ecoleId ? `?ecoleId=${ecoleId}` : ''
  const res = await fetch(`${API}/eleves/stats${qs}`, { headers: authHeaders() })
  return handle(res)
}

// ─── Enseignants ──────────────────────────────────────────
export async function getEnseignants(params = {}) {
  const qs = new URLSearchParams()
  if (params.ecoleId) qs.set('ecoleId', params.ecoleId)
  if (params.search) qs.set('search', params.search)
  const q = qs.toString()
  const res = await fetch(`${API}/enseignants${q ? `?${q}` : ''}`, { headers: authHeaders() })
  return handle(res)
}

export async function saveEnseignant(data) {
  const res = await fetch(`${API}/enseignants`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function updateEnseignant(id, data) {
  const res = await fetch(`${API}/enseignants/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function deleteEnseignant(id) {
  const res = await fetch(`${API}/enseignants/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handle(res)
}

// ─── Classes ──────────────────────────────────────────────
export async function getClasses(params = {}) {
  const qs = new URLSearchParams()
  if (params.ecoleId) qs.set('ecoleId', params.ecoleId)
  const q = qs.toString()
  const res = await fetch(`${API}/classes${q ? `?${q}` : ''}`, { headers: authHeaders() })
  return handle(res)
}

export async function saveClasse(data) {
  const res = await fetch(`${API}/classes`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function updateClasse(id, data) {
  const res = await fetch(`${API}/classes/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function deleteClasse(id) {
  const res = await fetch(`${API}/classes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handle(res)
}

export async function getClassesStats(ecoleId) {
  const qs = ecoleId ? `?ecoleId=${ecoleId}` : ''
  const res = await fetch(`${API}/classes/stats${qs}`, { headers: authHeaders() })
  return handle(res)
}

// ─── Matières ─────────────────────────────────────────────
export async function getMatieres(params = {}) {
  const qs = new URLSearchParams()
  if (params.ecoleId) qs.set('ecoleId', params.ecoleId)
  const q = qs.toString()
  const res = await fetch(`${API}/matieres${q ? `?${q}` : ''}`, { headers: authHeaders() })
  return handle(res)
}

export async function saveMatiere(data) {
  const res = await fetch(`${API}/matieres`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function updateMatiere(id, data) {
  const res = await fetch(`${API}/matieres/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function deleteMatiere(id) {
  const res = await fetch(`${API}/matieres/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handle(res)
}

// ─── Emploi du temps ──────────────────────────────────────
export async function getEmploiTemps(params = {}) {
  const qs = new URLSearchParams()
  if (params.classeId) qs.set('classeId', params.classeId)
  if (params.ecoleId) qs.set('ecoleId', params.ecoleId)
  const q = qs.toString()
  const res = await fetch(`${API}/emploi-temps${q ? `?${q}` : ''}`, { headers: authHeaders() })
  return handle(res)
}

export async function saveEmploiTemps(data) {
  const res = await fetch(`${API}/emploi-temps`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function deleteEmploiTemps(id) {
  const res = await fetch(`${API}/emploi-temps/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handle(res)
}

// ─── Présences ────────────────────────────────────────────
export async function getPresences(params = {}) {
  const qs = new URLSearchParams()
  if (params.classeId) qs.set('classeId', params.classeId)
  if (params.date) qs.set('date', params.date)
  const q = qs.toString()
  const res = await fetch(`${API}/presences${q ? `?${q}` : ''}`, { headers: authHeaders() })
  return handle(res)
}

export async function savePresences(data) {
  const res = await fetch(`${API}/presences`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function getPresencesStats(ecoleId) {
  const qs = ecoleId ? `?ecoleId=${ecoleId}` : ''
  const res = await fetch(`${API}/presences/stats${qs}`, { headers: authHeaders() })
  return handle(res)
}

// ─── Paiements ────────────────────────────────────────────
export async function getPaiements(params = {}) {
  const qs = new URLSearchParams()
  if (params.ecoleId) qs.set('ecoleId', params.ecoleId)
  const q = qs.toString()
  const res = await fetch(`${API}/paiements${q ? `?${q}` : ''}`, { headers: authHeaders() })
  return handle(res)
}

export async function savePaiement(data) {
  const res = await fetch(`${API}/paiements`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function getPaiementsStats(ecoleId) {
  const qs = ecoleId ? `?ecoleId=${ecoleId}` : ''
  const res = await fetch(`${API}/paiements/stats${qs}`, { headers: authHeaders() })
  return handle(res)
}

// ─── Communications ───────────────────────────────────────
export async function sendAnnouncement(data) {
  const res = await fetch(`${API}/annonces`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function getAnnouncements(params = {}) {
  const qs = new URLSearchParams()
  if (params.ecoleId) qs.set('ecoleId', params.ecoleId)
  const q = qs.toString()
  const res = await fetch(`${API}/annonces${q ? `?${q}` : ''}`, { headers: authHeaders() })
  return handle(res)
}

// ─── Notes ──────────────────────────────────────────────
export async function getNotes(params = {}) {
  const qs = new URLSearchParams()
  if (params.ecoleId) qs.set('ecoleId', params.ecoleId)
  if (params.classeId) qs.set('classeId', params.classeId)
  if (params.matiereId) qs.set('matiereId', params.matiereId)
  if (params.trimestre) qs.set('trimestre', params.trimestre)
  if (params.eleveId) qs.set('eleveId', params.eleveId)
  const q = qs.toString()
  const res = await fetch(`${API}/notes${q ? `?${q}` : ''}`, { headers: authHeaders() })
  return handle(res)
}

export async function saveNotes(data) {
  const res = await fetch(`${API}/notes`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function updateNote(id, data) {
  const res = await fetch(`${API}/notes/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function deleteNote(id) {
  const res = await fetch(`${API}/notes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handle(res)
}

// ─── Bulletins ──────────────────────────────────────────
export async function getBulletins(params = {}) {
  const qs = new URLSearchParams()
  if (params.ecoleId) qs.set('ecoleId', params.ecoleId)
  if (params.classeId) qs.set('classeId', params.classeId)
  if (params.trimestre) qs.set('trimestre', params.trimestre)
  if (params.eleveId) qs.set('eleveId', params.eleveId)
  const q = qs.toString()
  const res = await fetch(`${API}/bulletins${q ? `?${q}` : ''}`, { headers: authHeaders() })
  return handle(res)
}

export async function generateBulletin(data) {
  const res = await fetch(`${API}/bulletins/generate`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function getBulletin(eleveId, trimestre) {
  const res = await fetch(`${API}/bulletins/${eleveId}?trimestre=${trimestre}`, { headers: authHeaders() })
  return handle(res)
}

// ─── École info ───────────────────────────────────────────
export async function updateEcoleInfo(ecoleId, data) {
  const res = await fetch(`${API}/ecoles/${ecoleId}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  })
  return handle(res)
}
