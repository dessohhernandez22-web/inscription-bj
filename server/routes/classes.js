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
    let sql = 'SELECT * FROM classes WHERE 1=1'
    const params = []
    if (req.query.ecoleId) { sql += ' AND ecoleId = ?'; params.push(parseInt(req.query.ecoleId)) }
    if (req.query.niveau) { sql += ' AND niveau = ?'; params.push(req.query.niveau) }
    if (req.query.annee) { sql += ' AND annee = ?'; params.push(req.query.annee) }
    sql += ' ORDER BY niveau, nom'
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) results.push(stmt.getAsObject())
    stmt.free()
    res.json(results)
  } catch (e) {
    console.error('Classes list error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const db = await getDb()
    const { ecoleId, nom, niveau, section, salle, capacite, professeurPrincipalId, annee } = req.body
    if (!ecoleId || !nom || !niveau || !annee) {
      return res.status(400).json({ error: 'Champs requis : ecoleId, nom, niveau, annee' })
    }
    const nEcoleId = parseInt(ecoleId)
    if (isNaN(nEcoleId)) return res.status(400).json({ error: 'ecoleId invalide' })
    const nCapacite = capacite ? parseInt(capacite) : 40
    const nProfId = professeurPrincipalId ? parseInt(professeurPrincipalId) : null

    db.run(
      'INSERT INTO classes (ecoleId, nom, niveau, section, salle, capacite, professeurPrincipalId, annee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nEcoleId, nom, niveau, section || '', salle || '', nCapacite, nProfId, annee]
    )
    saveDb()
    const rows = db.exec('SELECT * FROM classes ORDER BY id DESC LIMIT 1')
    const obj = rows.length ? parseRow(rows[0].columns, rows[0].values[0]) : {}
    res.status(201).json(obj)
  } catch (e) {
    console.error('Classe create error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })
    const stmt = db.prepare('SELECT id FROM classes WHERE id = ?')
    stmt.bind([id])
    if (!stmt.step()) { stmt.free(); return res.status(404).json({ error: 'Classe introuvable' }) }
    stmt.free()

    const { nom, niveau, section, salle, capacite, professeurPrincipalId, annee } = req.body
    const nCapacite = capacite ? parseInt(capacite) : 40
    const nProfId = professeurPrincipalId ? parseInt(professeurPrincipalId) : null

    db.run(
      `UPDATE classes SET nom = ?, niveau = ?, section = ?, salle = ?, capacite = ?, professeurPrincipalId = ?, annee = ? WHERE id = ?`,
      [nom, niveau, section || '', salle || '', nCapacite, nProfId, annee || '', id]
    )
    saveDb()
    const row = db.exec(`SELECT * FROM classes WHERE id = ${id}`)
    const obj = row.length ? parseRow(row[0].columns, row[0].values[0]) : {}
    res.json(obj)
  } catch (e) {
    console.error('Classe update error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })
    db.run('DELETE FROM classes WHERE id = ?', [id])
    saveDb()
    res.json({ success: true })
  } catch (e) {
    console.error('Classe delete error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/stats/:ecoleId', async (req, res) => {
  try {
    const db = await getDb()
    const ecoleId = parseInt(req.params.ecoleId)
    if (isNaN(ecoleId)) return res.status(400).json({ error: 'ecoleId invalide' })

    const stmt = db.prepare(
      `SELECT c.id, c.nom, c.niveau, c.section, c.capacite,
        (SELECT COUNT(*) FROM eleves e WHERE e.classe = c.nom AND e.ecoleId = c.ecoleId AND e.annee = c.annee) as effectif
       FROM classes c WHERE c.ecoleId = ? ORDER BY c.niveau, c.nom`
    )
    stmt.bind([ecoleId])
    const results = []
    while (stmt.step()) results.push(stmt.getAsObject())
    stmt.free()
    res.json(results)
  } catch (e) {
    console.error('Classes stats error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
