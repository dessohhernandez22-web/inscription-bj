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
    let sql = 'SELECT * FROM matieres WHERE 1=1'
    const params = []
    if (req.query.ecoleId) { sql += ' AND ecoleId = ?'; params.push(parseInt(req.query.ecoleId)) }
    if (req.query.niveau) { sql += ' AND niveau = ?'; params.push(req.query.niveau) }
    sql += ' ORDER BY nom'
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) results.push(stmt.getAsObject())
    stmt.free()
    res.json(results)
  } catch (e) {
    console.error('Matieres list error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const db = await getDb()
    const { ecoleId, nom, coefficient, niveau, enseignantId } = req.body
    if (!ecoleId || !nom || !niveau) {
      return res.status(400).json({ error: 'Champs requis : ecoleId, nom, niveau' })
    }
    const nEcoleId = parseInt(ecoleId)
    if (isNaN(nEcoleId)) return res.status(400).json({ error: 'ecoleId invalide' })
    const nCoeff = coefficient ? parseInt(coefficient) : 1
    const nEnsId = enseignantId ? parseInt(enseignantId) : null

    db.run(
      'INSERT INTO matieres (ecoleId, nom, coefficient, niveau, enseignantId) VALUES (?, ?, ?, ?, ?)',
      [nEcoleId, nom, nCoeff, niveau, nEnsId]
    )
    saveDb()
    const rows = db.exec('SELECT * FROM matieres ORDER BY id DESC LIMIT 1')
    const obj = rows.length ? parseRow(rows[0].columns, rows[0].values[0]) : {}
    res.status(201).json(obj)
  } catch (e) {
    console.error('Matiere create error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })
    const stmt = db.prepare('SELECT id FROM matieres WHERE id = ?')
    stmt.bind([id])
    if (!stmt.step()) { stmt.free(); return res.status(404).json({ error: 'Matière introuvable' }) }
    stmt.free()

    const { nom, coefficient, niveau, enseignantId } = req.body
    const nCoeff = coefficient ? parseInt(coefficient) : 1
    const nEnsId = enseignantId ? parseInt(enseignantId) : null

    db.run(
      `UPDATE matieres SET nom = ?, coefficient = ?, niveau = ?, enseignantId = ? WHERE id = ?`,
      [nom, nCoeff, niveau, nEnsId, id]
    )
    saveDb()
    const row = db.exec(`SELECT * FROM matieres WHERE id = ${id}`)
    const obj = row.length ? parseRow(row[0].columns, row[0].values[0]) : {}
    res.json(obj)
  } catch (e) {
    console.error('Matiere update error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })
    db.run('DELETE FROM matieres WHERE id = ?', [id])
    saveDb()
    res.json({ success: true })
  } catch (e) {
    console.error('Matiere delete error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
