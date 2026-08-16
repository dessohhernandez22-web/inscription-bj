/**
 * Routes administrateur (toutes nécessitent JWT + rôle admin).
 *
 * POST /api/admin/generate-compte    — Créer un compte directeur
 * GET  /api/admin/comptes            — Liste des comptes directeurs
 * POST /api/admin/reset-compte/:id   — Réinitialiser mot de passe directeur
 * POST /api/admin/toggle-status/:id  — Activer/désactiver un compte
 * GET  /api/admin/stats              — Statistiques globales
 * GET  /api/admin/ecoles             — Liste des écoles (depuis schools.json)
 * POST /api/admin/edit-ecole         — Modifier les informations d'une école
 */

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getDb, saveDb } from '../db.js'
import { adminMiddleware } from './auth.js'

const router = Router()
router.use(adminMiddleware)

function parseRow(cols, vals) {
  const obj = {}
  cols.forEach((col, i) => { obj[col] = vals[i] })
  return obj
}

/**
 * Crée un compte directeur avec un mot de passe provisoire.
 * Vérifie qu'il n'y a pas déjà un directeur pour cette école.
 */
router.post('/generate-compte', async (req, res) => {
  try {
    const { email, nom, prenom, telephone, ecoleId } = req.body
    if (!email || !nom || !prenom || !ecoleId) {
      return res.status(400).json({ error: 'Champs requis : email, nom, prenom, ecoleId' })
    }
    const db = await getDb()
    const existing = db.exec(`SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}'`)
    if (existing.length && existing[0].values.length) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' })
    }
    const existingSchool = db.exec(`SELECT id, nom, prenom FROM users WHERE role = 'directeur' AND ecoleId = ${parseInt(ecoleId)}`)
    if (existingSchool.length && existingSchool[0].values.length) {
      const d = parseRow(existingSchool[0].columns, existingSchool[0].values[0])
      return res.status(409).json({ error: `Cette école a déjà un directeur : ${d.prenom} ${d.nom}` })
    }
    const tempPassword = Math.random().toString(36).slice(2, 8).toUpperCase() + '@' + Math.random().toString(36).slice(2, 4).toUpperCase()
    const hashed = await bcrypt.hash(tempPassword, 10)
    const esc = s => (s != null ? String(s).replace(/'/g, "''") : '')
    db.exec(`INSERT INTO users (email, password, nom, prenom, telephone, role, ecoleId, tempPassword, generatedById) VALUES ('${esc(email)}', '${esc(hashed)}', '${esc(nom)}', '${esc(prenom)}', '${esc(telephone)}', 'directeur', ${parseInt(ecoleId)}, '${esc(tempPassword)}', ${req.user.id})`)
    saveDb()
    const rows = db.exec('SELECT * FROM users ORDER BY id DESC LIMIT 1')
    const obj = rows.length ? parseRow(rows[0].columns, rows[0].values[0]) : {}
    res.status(201).json({
      message: 'Compte directeur créé',
      compte: { id: obj.id, email: obj.email, nom: obj.nom, prenom: obj.prenom, telephone: obj.telephone, ecoleId: obj.ecoleId },
      tempPassword,
    })
  } catch (e) {
    console.error('Generate compte error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/** Liste tous les comptes directeurs avec leur statut */
router.get('/comptes', async (req, res) => {
  try {
    const db = await getDb()
    const rows = db.exec("SELECT id, email, nom, prenom, telephone, ecoleId, role, status, createdAt FROM users WHERE role = 'directeur' ORDER BY createdAt DESC")
    if (!rows.length) return res.json([])
    const comptes = rows[0].values.map(v => {
      const obj = {}
      rows[0].columns.forEach((col, i) => { obj[col] = v[i] })
      return obj
    })
    res.json(comptes)
  } catch (e) {
    console.error('Comptes error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/** Réinitialise le mot de passe d'un compte directeur (nouveau mot de passe provisoire) */
router.post('/reset-compte/:id', async (req, res) => {
  try {
    const db = await getDb()
    const rows = db.exec(`SELECT id, role FROM users WHERE id = ${parseInt(req.params.id)}`)
    if (!rows.length || !rows[0].values.length) {
      return res.status(404).json({ error: 'Compte introuvable' })
    }
    const obj = parseRow(rows[0].columns, rows[0].values[0])
    if (obj.role !== 'directeur') {
      return res.status(400).json({ error: 'Ce n\'est pas un compte directeur' })
    }
    const tempPassword = Math.random().toString(36).slice(2, 8).toUpperCase() + '@' + Math.random().toString(36).slice(2, 4).toUpperCase()
    const hashed = await bcrypt.hash(tempPassword, 10)
    const esc = s => String(s).replace(/'/g, "''")
    db.exec(`UPDATE users SET password = '${esc(hashed)}', tempPassword = '${esc(tempPassword)}' WHERE id = ${obj.id}`)
    saveDb()
    const userRow = db.exec(`SELECT id, email, nom, prenom, telephone, ecoleId FROM users WHERE id = ${obj.id}`)
    const compte = userRow.length ? parseRow(userRow[0].columns, userRow[0].values[0]) : {}
    res.json({ message: 'Mot de passe réinitialisé', compte, tempPassword })
  } catch (e) {
    console.error('Reset error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/** Active ou désactive un compte (statut 'active' ↔ 'blocked') */
router.post('/toggle-status/:id', async (req, res) => {
  try {
    const db = await getDb()
    const rows = db.exec(`SELECT id, role, status FROM users WHERE id = ${parseInt(req.params.id)}`)
    if (!rows.length || !rows[0].values.length) {
      return res.status(404).json({ error: 'Compte introuvable' })
    }
    const obj = parseRow(rows[0].columns, rows[0].values[0])
    if (obj.role !== 'directeur') {
      return res.status(400).json({ error: 'Action non autorisée' })
    }
    const newStatus = obj.status === 'blocked' ? 'active' : 'blocked'
    db.exec(`UPDATE users SET status = '${newStatus}' WHERE id = ${obj.id}`)
    saveDb()
    res.json({ message: newStatus === 'active' ? 'Compte activé' : 'Compte désactivé', status: newStatus })
  } catch (e) {
    console.error('Toggle status error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/** Statistiques globales (directeurs, parents, demandes, écoles actives) */
router.get('/stats', async (req, res) => {
  try {
    const db = await getDb()
    const directeurs = db.exec("SELECT COUNT(*) as c FROM users WHERE role = 'directeur'")
    const parents = db.exec("SELECT COUNT(*) as c FROM users WHERE role = 'parent'")
    const demandes = db.exec("SELECT COUNT(*) as c FROM demandes")
    const ecoles = db.exec("SELECT COUNT(DISTINCT ecoleId) as c FROM demandes")
    res.json({
      directeurs: directeurs[0]?.values[0]?.[0] || 0,
      parents: parents[0]?.values[0]?.[0] || 0,
      demandes: demandes[0]?.values[0]?.[0] || 0,
      ecolesAvecDemandes: ecoles[0]?.values[0]?.[0] || 0,
    })
  } catch (e) {
    console.error('Stats error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/** Modifie les informations d'une école dans schools.json */
router.post('/edit-ecole', async (req, res) => {
  try {
    const { id, nom, ville, adresse, telephone, email } = req.body
    if (!id || !nom || !ville) {
      return res.status(400).json({ error: 'Champs requis : id, nom, ville' })
    }
    const fs = await import('fs')
    const path = await import('path')
    const { fileURLToPath } = await import('url')
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const schoolsPath = path.join(__dirname, '../../src/data/schools.json')
    const raw = fs.readFileSync(schoolsPath, 'utf8')
    const data = JSON.parse(raw)
    const index = data.ecoles.findIndex(e => e.id === parseInt(id))
    if (index === -1) return res.status(404).json({ error: 'École introuvable' })
    data.ecoles[index] = { ...data.ecoles[index], nom, ville, adresse: adresse || '', telephone: telephone || '', email: email || '' }
    fs.writeFileSync(schoolsPath, JSON.stringify(data, null, 2))
    res.json({ message: 'École modifiée', ecole: data.ecoles[index] })
  } catch (e) {
    console.error('Edit ecole error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/** Liste toutes les écoles depuis schools.json */
router.get('/ecoles', async (req, res) => {
  try {
    const fs = await import('fs')
    const path = await import('path')
    const { fileURLToPath } = await import('url')
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const raw = fs.readFileSync(path.join(__dirname, '../../src/data/schools.json'), 'utf8')
    res.json(JSON.parse(raw).ecoles)
  } catch (e) {
    console.error('Ecoles list error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
