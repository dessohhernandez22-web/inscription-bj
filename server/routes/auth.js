/**
 * Routes d'authentification.
 *
 * POST /api/auth/register            — Création compte parent
 * POST /api/auth/login               — Connexion (retourne JWT)
 * POST /api/auth/change-password     — Changement mot de passe (JWT requis)
 * POST /api/auth/mot-de-passe-oublie — Réinitialisation mot de passe directeur
 * GET  /api/auth/check-email/:email  — Vérifie si un email existe
 * GET  /api/auth/me                  — Profil de l'utilisateur connecté (JWT requis)
 *
 * Middlewares exportés :
 *   authMiddleware  — Vérifie le JWT
 *   adminMiddleware — Vérifie JWT + rôle admin
 */

import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getDb, saveDb } from '../db.js'

const router = Router()
const SECRET = process.env.JWT_SECRET || 'einscription-secret-key-2024'

router.post('/register', async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone, role, ecoleId } = req.body
    if (!email || !password || !nom || !prenom) {
      return res.status(400).json({ error: 'Champs requis : email, password, nom, prenom' })
    }
    // Inscription publique désactivée — les comptes sont créés par l'admin ou un directeur
    return res.status(403).json({ error: 'L\'inscription publique est désactivée. Contactez un administrateur ou votre établissement.' })
  } catch (e) {
    console.error('Register error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/**
 * Connexion. Retourne un JWT et les infos utilisateur.
 *
 * Champs supplémentaires de la réponse :
 *   mustChangePassword (bool) — true si le compte a un mot de passe provisoire
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }
    const db = await getDb()
    const rows = db.exec(`SELECT * FROM users WHERE email = '${email.replace(/'/g, "''")}'`)
    if (!rows.length || !rows[0].values.length) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }
    const row = rows[0]
    const obj = {}
    row.columns.forEach((col, i) => { obj[col] = row.values[0][i] })
    const valid = await bcrypt.compare(password, obj.password)
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }
    // Vérifier si le compte est bloqué
    if (obj.status === 'blocked') {
      return res.status(403).json({ error: 'Ce compte est désactivé. Contactez l\'administration.' })
    }
    const mustChangePassword = !!obj.tempPassword
    const token = jwt.sign({ id: obj.id, email: obj.email, role: obj.role, ecoleId: obj.ecoleId }, SECRET, { expiresIn: '7d' })
    const ecoleNom = await getEcoleInfo(obj.ecoleId)
    res.json({ token, user: { id: obj.id, email: obj.email, nom: obj.nom, prenom: obj.prenom, role: obj.role, ecoleId: obj.ecoleId, ecoleNom }, mustChangePassword })
  } catch (e) {
    console.error('Login error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/**
 * Change le mot de passe de l'utilisateur connecté.
 * Nettoie le champ tempPassword (le mot de passe provisoire n'est plus valide).
 */
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 6 caractères' })
    }
    const db = await getDb()
    const rows = db.exec(`SELECT * FROM users WHERE id = ${req.user.id}`)
    if (!rows.length || !rows[0].values.length) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }
    const row = rows[0]
    const obj = {}
    row.columns.forEach((col, i) => { obj[col] = row.values[0][i] })
    const valid = await bcrypt.compare(currentPassword, obj.password)
    if (!valid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' })
    }
    const hashed = await bcrypt.hash(newPassword, 10)
    db.run(`UPDATE users SET password = '${hashed.replace(/'/g, "''")}', tempPassword = NULL WHERE id = ${req.user.id}`)
    saveDb()
    res.json({ message: 'Mot de passe modifié avec succès' })
  } catch (e) {
    console.error('Change password error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/mot-de-passe-oublie', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email requis' })
    const db = await getDb()
    const rows = db.exec(`SELECT id, role, email FROM users WHERE email = '${email.replace(/'/g, "''")}'`)
    if (!rows.length || !rows[0].values.length) {
      return res.status(404).json({ error: 'Aucun compte avec cet email' })
    }
    const row = rows[0]
    const obj = {}
    row.columns.forEach((col, i) => { obj[col] = row.values[0][i] })
    if (obj.role !== 'directeur') {
      return res.status(403).json({ error: 'Fonction réservée aux directeurs' })
    }
    const tempPassword = Math.random().toString(36).slice(2, 8).toUpperCase() + '123'
    const hashed = await bcrypt.hash(tempPassword, 10)
    const esc = s => String(s).replace(/'/g, "''")
    db.exec(`UPDATE users SET password = '${esc(hashed)}', tempPassword = '${esc(tempPassword)}' WHERE id = ${obj.id}`)
    saveDb()
    console.log(`Password reset for ${email}: new temp password = ${tempPassword}`)
    res.json({ message: 'Un nouveau mot de passe provisoire a été généré.', tempPassword })
  } catch (e) {
    console.error('Password reset error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/**
 * Vérifie que le header Authorization contient un JWT valide.
 * Ajoute req.user avec { id, email, role, ecoleId }.
 */
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non authentifié' })
  }
  try {
    const decoded = jwt.verify(header.slice(7), SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide' })
  }
}

/**
 * Vérifie que l'utilisateur est admin (JWT + rôle 'admin').
 */
export function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé à l\'administration' })
    }
    next()
  })
}

router.get('/check-email/:email', async (req, res) => {
  try {
    const db = await getDb()
    const rows = db.exec(`SELECT id, email, nom, prenom, role FROM users WHERE email = '${req.params.email.replace(/'/g, "''")}'`)
    if (!rows.length || !rows[0].values.length) {
      return res.json({ exists: false })
    }
    const cols = rows[0].columns
    const vals = rows[0].values[0]
    const user = {}
    cols.forEach((col, i) => { user[col] = vals[i] })
    res.json({ exists: true, user })
  } catch (e) {
    console.error('Check email error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = await getDb()
    const rows = db.exec(`SELECT id, email, nom, prenom, telephone, role, ecoleId, status, tempPassword FROM users WHERE id = ${req.user.id}`)
    if (!rows.length || !rows[0].values.length) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }
    const row = rows[0]
    const obj = {}
    row.columns.forEach((col, i) => { obj[col] = row.values[0][i] })
    res.json(obj)
  } catch (e) {
    console.error('Me error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

async function getEcoleInfo(ecoleId) {
  if (!ecoleId) return null
  try {
    const { readFileSync } = await import('fs')
    const path = await import('path')
    const { fileURLToPath } = await import('url')
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const raw = readFileSync(path.join(__dirname, '../../src/data/schools.json'), 'utf8')
    const data = JSON.parse(raw)
    const ecole = data.ecoles.find(e => e.id === ecoleId)
    return ecole ? `${ecole.nom} - ${ecole.ville}` : null
  } catch {
    return null
  }
}

export default router
