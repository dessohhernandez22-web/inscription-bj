/**
 * Routes des demandes d'inscription.
 *
 * GET  /api/demandes           — Liste (filtres: ecoleId, userId, telephone, email, statut)
 * POST /api/demandes           — Créer une demande
 * PATCH /api/demandes/:id      — Modifier le statut (+ motif de rejet si refusé)
 * POST /api/demandes/:id/payer — Simuler un paiement
 */

import { Router } from 'express'
import { getDb, saveDb } from '../db.js'
import { createNotification } from './notifications.js'

const router = Router()

function parseDemande(d) {
  return { ...d, documents: JSON.parse(d.documents || '[]') }
}

/** Liste les demandes avec filtres optionnels */
router.get('/', async (req, res) => {
  try {
    const db = await getDb()
    let sql = 'SELECT * FROM demandes WHERE 1=1'
    const params = []

    if (req.query.ecoleId) {
      sql += ' AND ecoleId = ?'
      params.push(parseInt(req.query.ecoleId))
    }
    if (req.query.userId) {
      sql += ' AND userId = ?'
      params.push(parseInt(req.query.userId))
    }
    if (req.query.telephone) {
      sql += ' AND telephone = ?'
      params.push(req.query.telephone)
    }
    if (req.query.email) {
      sql += ' AND email = ?'
      params.push(req.query.email)
    }
    if (req.query.statut) {
      sql += ' AND statut = ?'
      params.push(req.query.statut)
    }

    sql += ' ORDER BY createdAt DESC'

    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) results.push(parseDemande(stmt.getAsObject()))
    stmt.free()
    res.json(results)
  } catch (e) {
    console.error('Demandes list error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/** Crée une nouvelle demande d'inscription */
router.post('/', async (req, res) => {
  try {
    const db = await getDb()
    const data = req.body
    const esc = s => (s != null ? String(s).replace(/'/g, "''") : '')
    const docs = JSON.stringify(data.documents || [])
    const toInt = v => (v != null && !isNaN(parseInt(v))) ? parseInt(v) : 'NULL'
    db.exec(`INSERT INTO demandes (ecoleId, ecoleNom, niveau, filiere, classe, nomEnfant, prenomEnfant, dateNaissance, lieuNaissance, sexe, nomParent, prenomParent, email, telephone, adresse, documents, modePaiement, statut, groupId, userId) VALUES (${toInt(data.ecoleId)}, '${esc(data.ecoleNom)}', '${esc(data.niveau)}', '${esc(data.filiere || '')}', '${esc(data.classe)}', '${esc(data.nomEnfant)}', '${esc(data.prenomEnfant)}', '${esc(data.dateNaissance)}', '${esc(data.lieuNaissance)}', '${esc(data.sexe)}', '${esc(data.nomParent)}', '${esc(data.prenomParent)}', '${esc(data.email)}', '${esc(data.telephone)}', '${esc(data.adresse)}', '${esc(docs)}', '${esc(data.modePaiement)}', 'reçu', ${toInt(data.groupId)}, ${toInt(data.userId)})`)
    saveDb()

    const rows = db.exec('SELECT * FROM demandes ORDER BY id DESC LIMIT 1')
    if (!rows.length || !rows[0].values.length) {
      return res.status(500).json({ error: 'Erreur création' })
    }
    const row = rows[0]
    const obj = {}
    row.columns.forEach((col, i) => { obj[col] = row.values[0][i] })
    res.status(201).json(parseDemande(obj))
  } catch (e) {
    console.error('Demande create error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/**
 * Met à jour le statut d'une demande.
 * Si le nouveau statut est 'refusé', le champ `notes` (motif) est obligatoire.
 * Crée une notification pour le parent si le statut change.
 */
router.patch('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const { statut, notes } = req.body
    if (!statut) return res.status(400).json({ error: 'Statut requis' })
    if (statut === 'refusé' && !notes) return res.status(400).json({ error: 'Motif de rejet obligatoire' })

    const stmt = db.prepare('SELECT * FROM demandes WHERE id = ?')
    stmt.bind([parseInt(req.params.id)])
    if (!stmt.step()) {
      stmt.free()
      return res.status(404).json({ error: 'Demande introuvable' })
    }
    const old = parseDemande(stmt.getAsObject())
    stmt.free()

    if (notes) {
      db.run('UPDATE demandes SET statut = ?, notes = ?, updatedAt = datetime(\'now\') WHERE id = ?', [statut, notes, parseInt(req.params.id)])
    } else {
      db.run('UPDATE demandes SET statut = ?, updatedAt = datetime(\'now\') WHERE id = ?', [statut, parseInt(req.params.id)])
    }
    saveDb()

    if (old.userId && statut !== old.statut) {
      const labels = { 'reçu': 'Reçue', 'en_cours_validation': 'En cours de validation', 'accepté': 'Acceptée', 'refusé': 'Refusée', 'liste_attente': 'Liste d\'attente' }
      const msg = statut === 'refusé' ? `motif : ${notes}` : ''
      createNotification(old.userId, 'Mise à jour de votre dossier', `Votre demande pour ${old.prenomEnfant} ${old.nomEnfant} est maintenant : ${labels[statut] || statut}. ${msg}`, 'statut', old.id)
    }

    const stmt2 = db.prepare('SELECT * FROM demandes WHERE id = ?')
    stmt2.bind([parseInt(req.params.id)])
    stmt2.step()
    const demande = parseDemande(stmt2.getAsObject())
    stmt2.free()
    res.json(demande)
  } catch (e) {
    console.error('Demande patch error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/**
 * Simule un paiement pour une demande acceptée.
 * Génère une référence unique et enregistre la transaction.
 */
router.post('/:id/payer', async (req, res) => {
  try {
    const db = await getDb()
    const stmt = db.prepare('SELECT * FROM demandes WHERE id = ?')
    stmt.bind([req.params.id])
    if (!stmt.step()) {
      stmt.free()
      return res.status(404).json({ error: 'Demande introuvable' })
    }
    const demande = parseDemande(stmt.getAsObject())
    stmt.free()
    if (demande.statut !== 'accepté') {
      return res.status(400).json({ error: 'La demande doit être acceptée pour effectuer un paiement' })
    }
    if (demande.paiementReference) {
      return res.status(400).json({ error: 'Cette demande a déjà été payée' })
    }
    const montant = req.body.montant || 15000
    const reseau = req.body.reseau || 'mobile_money'
    const reference = 'PAY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    db.run(`UPDATE demandes SET modePaiement = '${reseau.replace(/'/g, "''")}', paiementReference = '${reference.replace(/'/g, "''")}', paiementMontant = ${parseFloat(montant) || 0}, paiementDate = datetime('now') WHERE id = ${parseInt(req.params.id)}`)
    saveDb()
    if (demande.userId) {
      createNotification(demande.userId, 'Paiement confirmé', `Votre paiement de ${parseFloat(montant).toLocaleString()} F pour ${demande.prenomEnfant} ${demande.nomEnfant} a été reçu. Réf: ${reference}`, 'paiement', demande.id)
    }
    res.json({ message: 'Paiement effectué avec succès', reference, montant })
  } catch (e) {
    console.error('Payment error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
