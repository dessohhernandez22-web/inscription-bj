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
    let sql = 'SELECT * FROM presences WHERE 1=1'
    const params = []
    if (req.query.ecoleId) { sql += ' AND ecoleId = ?'; params.push(parseInt(req.query.ecoleId)) }
    if (req.query.classeId) { sql += ' AND classeId = ?'; params.push(parseInt(req.query.classeId)) }
    if (req.query.date) { sql += ' AND date = ?'; params.push(req.query.date) }
    if (req.query.eleveId) { sql += ' AND eleveId = ?'; params.push(parseInt(req.query.eleveId)) }
    sql += ' ORDER BY date DESC'
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) results.push(stmt.getAsObject())
    stmt.free()
    res.json(results)
  } catch (e) {
    console.error('Presences list error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const db = await getDb()
    const { ecoleId, classeId, date, annee, presences } = req.body
    if (!ecoleId || !classeId || !date || !annee || !Array.isArray(presences)) {
      return res.status(400).json({ error: 'Champs requis : ecoleId, classeId, date, annee, presences (array)' })
    }
    const nEcoleId = parseInt(ecoleId)
    const nClasseId = parseInt(classeId)
    if (isNaN(nEcoleId) || isNaN(nClasseId)) return res.status(400).json({ error: 'Valeurs numériques invalides' })

    const stmtInsert = db.prepare(
      'INSERT INTO presences (ecoleId, eleveId, classeId, date, statut, justifie, annee) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    for (const p of presences) {
      const nEleveId = parseInt(p.eleveId)
      if (isNaN(nEleveId)) continue
      stmtInsert.bind([nEcoleId, nEleveId, nClasseId, date, p.statut || 'present', p.justifie ? 1 : 0, annee])
      stmtInsert.step()
      stmtInsert.reset()
    }
    stmtInsert.free()
    saveDb()
    res.status(201).json({ message: 'Présences enregistrées', count: presences.length })
  } catch (e) {
    console.error('Presences bulk create error:', e)
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
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) as presents
       FROM presences WHERE ecoleId = ? AND date = ?`
    )
    stmtToday.bind([ecoleId, today])
    stmtToday.step()
    const todayStats = stmtToday.getAsObject()
    stmtToday.free()

    const dayOfWeek = new Date().getDay()
    const monday = new Date()
    monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const mondayStr = monday.toISOString().split('T')[0]
    const stmtWeek = db.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) as presents
       FROM presences WHERE ecoleId = ? AND date >= ? AND date <= ?`
    )
    stmtWeek.bind([ecoleId, mondayStr, today])
    stmtWeek.step()
    const weekStats = stmtWeek.getAsObject()
    stmtWeek.free()

    res.json({
      aujourd: {
        total: todayStats.total || 0,
        presents: todayStats.presents || 0,
        taux: todayStats.total ? Math.round((todayStats.presents / todayStats.total) * 100) : 0
      },
      semaine: {
        total: weekStats.total || 0,
        presents: weekStats.presents || 0,
        taux: weekStats.total ? Math.round((weekStats.presents / weekStats.total) * 100) : 0
      }
    })
  } catch (e) {
    console.error('Presences stats error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
