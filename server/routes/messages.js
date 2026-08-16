/**
 * Routes de messagerie parent ↔ école.
 *
 * GET  /api/messages/:demandeId  — Liste des messages d'une demande (JWT requis)
 * POST /api/messages/:demandeId  — Envoyer un message (JWT requis)
 *
 * Sécurité : chaque rôle ne peut voir que les messages des demandes
 * auxquelles il a accès. Les parents voient leurs propres demandes,
 * les directeurs voient les demandes de leur école.
 */

import { Router } from 'express'
import { getDb, saveDb } from '../db.js'
import { authMiddleware } from './auth.js'

const router = Router()
router.use(authMiddleware)

function parseRow(cols, vals) {
  const obj = {}
  cols.forEach((col, i) => { obj[col] = vals[i] })
  return obj
}

/** Vérifie que l'utilisateur a accès à la demande */
function checkAccess(user, demande) {
  if (user.role === 'parent' && demande.userId !== user.id) return false
  return true
}

/** Récupère tous les messages d'une demande (ordre chronologique) */
router.get('/:demandeId', async (req, res) => {
  try {
    const db = await getDb()
    const demandeRows = db.exec(`SELECT id, userId FROM demandes WHERE id = ${parseInt(req.params.demandeId)}`)
    if (!demandeRows.length || !demandeRows[0].values.length) return res.status(404).json({ error: 'Demande introuvable' })
    const demande = parseRow(demandeRows[0].columns, demandeRows[0].values[0])
    if (!checkAccess(req.user, demande)) return res.status(403).json({ error: 'Accès refusé' })
    if (req.user.role === 'directeur') {
      const userRows = db.exec(`SELECT ecoleId FROM users WHERE id = ${req.user.id}`)
      if (userRows.length && userRows[0].values.length) {
        const u = parseRow(userRows[0].columns, userRows[0].values[0])
        const ecoleRows = db.exec(`SELECT id FROM demandes WHERE id = ${parseInt(req.params.demandeId)} AND ecoleId = ${u.ecoleId}`)
        if (!ecoleRows.length) return res.status(403).json({ error: 'Accès refusé' })
      }
    }
    const rows = db.exec(`SELECT * FROM messages WHERE demandeId = ${parseInt(req.params.demandeId)} ORDER BY createdAt ASC`)
    if (!rows.length) return res.json([])
    const messages = rows[0].values.map(v => parseRow(rows[0].columns, v))
    res.json(messages)
  } catch (e) {
    console.error('Messages get error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/** Envoie un message dans le fil de discussion d'une demande */
router.post('/:demandeId', async (req, res) => {
  try {
    const { message } = req.body
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message requis' })
    const db = await getDb()
    const demandeRows = db.exec(`SELECT id, userId FROM demandes WHERE id = ${parseInt(req.params.demandeId)}`)
    if (!demandeRows.length || !demandeRows[0].values.length) return res.status(404).json({ error: 'Demande introuvable' })
    const demande = parseRow(demandeRows[0].columns, demandeRows[0].values[0])
    if (!checkAccess(req.user, demande)) return res.status(403).json({ error: 'Accès refusé' })
    if (req.user.role === 'directeur') {
      const userRows = db.exec(`SELECT ecoleId FROM users WHERE id = ${req.user.id}`)
      if (userRows.length && userRows[0].values.length) {
        const u = parseRow(userRows[0].columns, userRows[0].values[0])
        const ecoleRows = db.exec(`SELECT id FROM demandes WHERE id = ${parseInt(req.params.demandeId)} AND ecoleId = ${u.ecoleId}`)
        if (!ecoleRows.length) return res.status(403).json({ error: 'Accès refusé' })
      }
    }
    const esc = s => (s != null ? String(s).replace(/'/g, "''") : '')
    db.exec(`INSERT INTO messages (demandeId, senderId, senderRole, message) VALUES (${parseInt(req.params.demandeId)}, ${req.user.id}, '${esc(req.user.role)}', '${esc(message.trim())}')`)
    saveDb()
    const rows = db.exec('SELECT * FROM messages ORDER BY id DESC LIMIT 1')
    const msg = rows.length ? parseRow(rows[0].columns, rows[0].values[0]) : {}
    res.status(201).json(msg)
  } catch (e) {
    console.error('Messages post error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
