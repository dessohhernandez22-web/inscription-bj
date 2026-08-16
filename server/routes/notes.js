/**
 * Routes des notes et bulletins scolaires.
 *
 * Notes :
 *   GET    /api/notes           — Liste des notes (filtres: ecoleId, eleveId, classe, trimestre, annee)
 *   POST   /api/notes           — Ajouter une note
 *   DELETE /api/notes/:id       — Supprimer une note
 *
 * Bulletins :
 *   GET    /api/notes/bulletins       — Liste des bulletins (filtrés par datePublication pour les parents)
 *   POST   /api/notes/bulletins       — Générer/mettre à jour un bulletin
 *   POST   /api/notes/publication     — Définir la date de publication des bulletins d'une classe
 *   GET    /api/notes/moyennes/:eleveId — Calculer les moyennes d'un élève
 */

import { Router } from 'express'
import { getDb, saveDb } from '../db.js'
import { authMiddleware } from './auth.js'
import { createNotification } from './notifications.js'

const router = Router()
router.use(authMiddleware)

function parseRow(cols, vals) {
  const obj = {}
  cols.forEach((col, i) => { obj[col] = vals[i] })
  return obj
}

/** Liste des notes avec filtres */
router.get('/', async (req, res) => {
  try {
    const db = await getDb()
    let sql = 'SELECT * FROM notes WHERE 1=1'
    const params = []
    if (req.query.ecoleId) { sql += ' AND ecoleId = ?'; params.push(parseInt(req.query.ecoleId)) }
    if (req.query.eleveId) { sql += ' AND eleveId = ?'; params.push(parseInt(req.query.eleveId)) }
    if (req.query.classe) { sql += ' AND classe = ?'; params.push(req.query.classe) }
    if (req.query.trimestre) { sql += ' AND trimestre = ?'; params.push(parseInt(req.query.trimestre)) }
    if (req.query.annee) { sql += ' AND annee = ?'; params.push(req.query.annee) }
    sql += ' ORDER BY matiere'
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) results.push(parseRow(stmt.getAsObject()))
    stmt.free()
    res.json(results)
  } catch (e) {
    console.error('Notes list error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/** Ajoute une note */
router.post('/', async (req, res) => {
  try {
    const db = await getDb()
    if (req.user.role !== 'directeur') return res.status(403).json({ error: 'Accès réservé aux directeurs' })
    const { ecoleId, eleveId, classe, matiere, note, trimestre, annee, coeff } = req.body
    if (!ecoleId || !eleveId || !classe || !matiere || note === undefined || !trimestre || !annee) {
      return res.status(400).json({ error: 'Champs requis : ecoleId, eleveId, classe, matiere, note, trimestre, annee' })
    }
    const nEcoleId = parseInt(ecoleId)
    const nEleveId = parseInt(eleveId)
    const nNote = parseFloat(note)
    const nTrimestre = parseInt(trimestre)
    const nCoeff = parseInt(coeff || 1)
    if (isNaN(nEcoleId) || isNaN(nEleveId) || isNaN(nNote) || isNaN(nTrimestre) || isNaN(nCoeff)) {
      return res.status(400).json({ error: 'Valeurs numériques invalides' })
    }
    const esc = s => (s != null ? String(s).replace(/'/g, "''") : '')
    db.exec(`INSERT INTO notes (ecoleId, eleveId, classe, matiere, note, trimestre, annee, coeff) VALUES (${nEcoleId}, ${nEleveId}, '${esc(classe)}', '${esc(matiere)}', ${nNote}, ${nTrimestre}, '${esc(annee)}', ${nCoeff})`)
    saveDb()
    const rows = db.exec('SELECT * FROM notes ORDER BY id DESC LIMIT 1')
    const obj = rows.length ? parseRow(rows[0].columns, rows[0].values[0]) : {}
    res.status(201).json(obj)
  } catch (e) {
    console.error('Note create error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/** Supprime une note */
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb()
    if (req.user.role !== 'directeur') return res.status(403).json({ error: 'Accès réservé aux directeurs' })
    const noteId = parseInt(req.params.id)
    if (isNaN(noteId)) return res.status(400).json({ error: 'ID invalide' })
    db.run('DELETE FROM notes WHERE id = ?', [noteId])
    saveDb()
    res.json({ success: true })
  } catch (e) {
    console.error('Note delete error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/**
 * Génère ou met à jour le bulletin d'un élève.
 * Moyenne = somme(note × coeff) / somme(coeff)
 * Le bulletin est stocké avec datePublication=NULL, donc invisible aux parents.
 */
router.post('/bulletins', async (req, res) => {
  try {
    const db = await getDb()
    if (req.user.role !== 'directeur') return res.status(403).json({ error: 'Accès réservé aux directeurs' })
    const { ecoleId, eleveId, classe, trimestre, annee } = req.body
    if (!ecoleId || !eleveId || !classe || !trimestre || !annee) {
      return res.status(400).json({ error: 'Champs requis : ecoleId, eleveId, classe, trimestre, annee' })
    }
    const nEcoleId = parseInt(ecoleId)
    const nEleveId = parseInt(eleveId)
    const nTrimestre = parseInt(trimestre)
    if (isNaN(nEcoleId) || isNaN(nEleveId) || isNaN(nTrimestre)) {
      return res.status(400).json({ error: 'Valeurs numériques invalides' })
    }
    const esc = s => (s != null ? String(s).replace(/'/g, "''") : '')
    const notesRows = db.exec(`SELECT note, coeff FROM notes WHERE ecoleId = ${nEcoleId} AND eleveId = ${nEleveId} AND classe = '${esc(classe)}' AND trimestre = ${nTrimestre} AND annee = '${esc(annee)}'`)
    let totalCoef = 0, totalNote = 0
    if (notesRows.length) {
      notesRows[0].values.forEach(v => {
        const note = v[0], coeff = v[1] || 1
        totalNote += note * coeff
        totalCoef += coeff
      })
    }
    const moyenne = totalCoef > 0 ? Math.round((totalNote / totalCoef) * 100) / 100 : 0
    const decision = moyenne >= 10 ? 'admis' : 'ajourné'
    const existing = db.exec(`SELECT id FROM bulletins WHERE ecoleId = ${nEcoleId} AND eleveId = ${nEleveId} AND trimestre = ${nTrimestre} AND annee = '${esc(annee)}'`)
    if (existing.length && existing[0].values.length) {
      db.exec(`UPDATE bulletins SET moyenne = ${moyenne}, decision = '${esc(decision)}' WHERE id = ${existing[0].values[0][0]}`)
    } else {
      db.exec(`INSERT INTO bulletins (ecoleId, eleveId, classe, trimestre, annee, moyenne, decision) VALUES (${nEcoleId}, ${nEleveId}, '${esc(classe)}', ${nTrimestre}, '${esc(annee)}', ${moyenne}, '${esc(decision)}')`)
    }
    saveDb()
    const rows = db.exec(`SELECT * FROM bulletins WHERE ecoleId = ${nEcoleId} AND eleveId = ${nEleveId} AND trimestre = ${nTrimestre} AND annee = '${esc(annee)}'`)
    const bulletin = rows.length ? parseRow(rows[0].columns, rows[0].values[0]) : {}
    res.json(bulletin)
  } catch (e) {
    console.error('Bulletin generate error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/**
 * Définit la date de publication pour tous les bulletins d'une classe/trimestre.
 * Une fois la date passée, les parents pourront voir leurs bulletins.
 */
router.post('/publication', async (req, res) => {
  try {
    const db = await getDb()
    if (req.user.role !== 'directeur') return res.status(403).json({ error: 'Accès réservé aux directeurs' })
    const { ecoleId, classe, trimestre, annee, datePublication } = req.body
    if (!ecoleId || !classe || !trimestre || !annee || !datePublication) {
      return res.status(400).json({ error: 'Champs requis : ecoleId, classe, trimestre, annee, datePublication' })
    }
    const nEcoleId = parseInt(ecoleId)
    const nTrimestre = parseInt(trimestre)
    if (isNaN(nEcoleId) || isNaN(nTrimestre)) {
      return res.status(400).json({ error: 'Valeurs numériques invalides' })
    }
    const esc = s => (s != null ? String(s).replace(/'/g, "''") : '')
    db.exec(`UPDATE bulletins SET datePublication = '${esc(datePublication)}' WHERE ecoleId = ${nEcoleId} AND classe = '${esc(classe)}' AND trimestre = ${nTrimestre} AND annee = '${esc(annee)}'`)
    saveDb()
    const count = db.exec(`SELECT COUNT(*) as c FROM bulletins WHERE ecoleId = ${nEcoleId} AND classe = '${esc(classe)}' AND trimestre = ${nTrimestre} AND annee = '${esc(annee)}'`)
    const total = count.length ? count[0].values[0][0] : 0
    // Notifier les parents concernés via demandes.userId
    const eleves = db.exec(`SELECT DISTINCT d.userId FROM demandes d WHERE d.ecoleId = ${nEcoleId} AND d.classe = '${esc(classe)}' AND d.userId IS NOT NULL AND d.statut = 'accepté'`)
    if (eleves.length) {
      eleves[0].values.forEach(v => {
        const userId = v[0]
        if (userId) createNotification(userId, 'Bulletin disponible', `Le bulletin du trimestre ${trimestre} de la classe ${classe} est maintenant disponible.`, 'bulletin')
      })
    }
    res.json({ message: 'Date de publication définie', bulletinsMisAJour: total, datePublication })
  } catch (e) {
    console.error('Publication error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/**
 * Liste les bulletins.
 * Les parents ne voient que les bulletins dont la date de publication est passée.
 */
router.get('/bulletins', async (req, res) => {
  try {
    const db = await getDb()
    const { ecoleId, eleveId, annee } = req.query
    let sql = 'SELECT * FROM bulletins WHERE 1=1'
    const params = []
    if (ecoleId) { sql += ' AND ecoleId = ?'; params.push(parseInt(ecoleId)) }
    if (eleveId) { sql += ' AND eleveId = ?'; params.push(parseInt(eleveId)) }
    if (annee) { sql += ' AND annee = ?'; params.push(annee) }
    // Filtrer les bulletins non publiés pour les non-directeurs
    if (req.user.role !== 'directeur') {
      sql += " AND datePublication IS NOT NULL AND datePublication <= datetime('now')"
    }
    sql += ' ORDER BY trimestre'
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) results.push(parseRow(stmt.getAsObject()))
    stmt.free()
    res.json(results)
  } catch (e) {
    console.error('Bulletins list error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
