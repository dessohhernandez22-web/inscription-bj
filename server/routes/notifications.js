/**
 * Routes des notifications parent.
 *
 * GET  /api/notifications             — Liste des notifications (JWT requis)
 * POST /api/notifications/read/:id    — Marquer une notification comme lue
 * POST /api/notifications/read-all    — Tout marquer comme lu
 *
 * Exporte aussi :
 *   createNotification() — Fonction utilitaire pour créer une notification
 */

import { Router } from 'express'
import { getDb, saveDb } from '../db.js'
import { authMiddleware } from './auth.js'

const router = Router()
router.use(authMiddleware)

/** Liste les 50 dernières notifications de l'utilisateur connecté */
router.get('/', async (req, res) => {
  try {
    const db = await getDb()
    const rows = db.exec(`SELECT * FROM notifications WHERE userId = ${req.user.id} ORDER BY createdAt DESC LIMIT 50`)
    if (!rows.length) return res.json([])
    const notifications = rows[0].values.map(v => {
      const obj = {}
      rows[0].columns.forEach((col, i) => { obj[col] = v[i] })
      return obj
    })
    res.json(notifications)
  } catch (e) {
    console.error('Notifications error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/** Marque une notification comme lue */
router.post('/read/:id', async (req, res) => {
  try {
    const db = await getDb()
    db.run(`UPDATE notifications SET lu = 1 WHERE id = ${parseInt(req.params.id)} AND userId = ${req.user.id}`)
    saveDb()
    res.json({ success: true })
  } catch (e) {
    console.error('Read notification error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/** Marque toutes les notifications de l'utilisateur comme lues */
router.post('/read-all', async (req, res) => {
  try {
    const db = await getDb()
    db.run(`UPDATE notifications SET lu = 1 WHERE userId = ${req.user.id}`)
    saveDb()
    res.json({ success: true })
  } catch (e) {
    console.error('Read all error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/**
 * Crée une notification pour un utilisateur.
 * @param {number} userId - ID du destinataire
 * @param {string} title - Titre de la notification
 * @param {string} message - Corps du message
 * @param {string} [type='info'] - Type (statut, bulletin, paiement, info)
 * @param {number|null} [demandeId=null] - ID de la demande associée
 */
export async function createNotification(userId, title, message, type = 'info', demandeId = null) {
  try {
    const db = await getDb()
    const esc = s => (s != null ? String(s).replace(/'/g, "''") : '')
    const demandePart = demandeId ? `, ${parseInt(demandeId)}` : ', NULL'
    db.exec(`INSERT INTO notifications (userId, title, message, type, demandeId) VALUES (${parseInt(userId)}, '${esc(title)}', '${esc(message)}', '${esc(type)}' ${demandePart})`)
    saveDb()
  } catch (e) {
    console.error('Create notification error:', e)
  }
}

export default router
