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

router.get('/', async (req, res) => {
  try {
    const db = await getDb()
    let sql = 'SELECT * FROM paiements WHERE 1=1'
    const params = []
    if (req.query.ecoleId) { sql += ' AND ecoleId = ?'; params.push(parseInt(req.query.ecoleId)) }
    if (req.query.eleveId) { sql += ' AND eleveId = ?'; params.push(parseInt(req.query.eleveId)) }
    if (req.query.type) { sql += ' AND type = ?'; params.push(req.query.type) }
    if (req.query.statut) { sql += ' AND statut = ?'; params.push(req.query.statut) }
    if (req.query.annee) { sql += ' AND annee = ?'; params.push(req.query.annee) }
    sql += ' ORDER BY date DESC'
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) results.push(stmt.getAsObject())
    stmt.free()
    res.json(results)
  } catch (e) {
    console.error('Paiements list error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const db = await getDb()
    const { ecoleId, eleveId, type, montant, date, mode, reference, statut, annee } = req.body
    if (!ecoleId || !eleveId || !type || montant === undefined || !date || !annee) {
      return res.status(400).json({ error: 'Champs requis : ecoleId, eleveId, type, montant, date, annee' })
    }
    const nEcoleId = parseInt(ecoleId)
    const nEleveId = parseInt(eleveId)
    const nMontant = parseFloat(montant)
    if (isNaN(nEcoleId) || isNaN(nEleveId) || isNaN(nMontant)) {
      return res.status(400).json({ error: 'Valeurs numériques invalides' })
    }

    const ref = reference || ('PAY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase())

    db.run(
      'INSERT INTO paiements (ecoleId, eleveId, type, montant, date, mode, reference, statut, annee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nEcoleId, nEleveId, type, nMontant, date, mode || '', ref, statut || 'paye', annee]
    )
    saveDb()
    const rows = db.exec('SELECT * FROM paiements ORDER BY id DESC LIMIT 1')
    const obj = rows.length ? parseRow(rows[0].columns, rows[0].values[0]) : {}
    res.status(201).json(obj)
  } catch (e) {
    console.error('Paiement create error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/stats/:ecoleId', async (req, res) => {
  try {
    const db = await getDb()
    const ecoleId = parseInt(req.params.ecoleId)
    if (isNaN(ecoleId)) return res.status(400).json({ error: 'ecoleId invalide' })

    const today = new Date().toISOString().split('T')[0]
    const stmtToday = db.prepare(
      'SELECT COALESCE(SUM(montant), 0) as total FROM paiements WHERE ecoleId = ? AND date = ? AND statut = ?'
    )
    stmtToday.bind([ecoleId, today, 'paye'])
    stmtToday.step()
    const todayStats = stmtToday.getAsObject()
    stmtToday.free()

    const monthStart = today.slice(0, 7) + '-01'
    const stmtMonth = db.prepare(
      'SELECT COALESCE(SUM(montant), 0) as total FROM paiements WHERE ecoleId = ? AND date >= ? AND statut = ?'
    )
    stmtMonth.bind([ecoleId, monthStart, 'paye'])
    stmtMonth.step()
    const monthStats = stmtMonth.getAsObject()
    stmtMonth.free()

    const stmtType = db.prepare(
      'SELECT type, COALESCE(SUM(montant), 0) as total, COUNT(*) as count FROM paiements WHERE ecoleId = ? AND statut = ? GROUP BY type'
    )
    stmtType.bind([ecoleId, 'paye'])
    const parType = []
    while (stmtType.step()) parType.push(stmtType.getAsObject())
    stmtType.free()

    res.json({
      aujourd: { total: todayStats.total || 0 },
      mois: { total: monthStats.total || 0 },
      parType
    })
  } catch (e) {
    console.error('Paiements stats error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
