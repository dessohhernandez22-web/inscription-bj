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
    let sql = 'SELECT * FROM enseignants WHERE 1=1'
    const params = []
    if (req.query.ecoleId) { sql += ' AND ecoleId = ?'; params.push(parseInt(req.query.ecoleId)) }
    if (req.query.statut) { sql += ' AND statut = ?'; params.push(req.query.statut) }
    sql += ' ORDER BY nom, prenom'
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) results.push(stmt.getAsObject())
    stmt.free()
    res.json(results)
  } catch (e) {
    console.error('Enseignants list error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const db = await getDb()
    const { ecoleId, nom, prenom, sexe, email, telephone, adresse, matieres, classes, photo, statut } = req.body
    if (!ecoleId || !nom || !prenom) {
      return res.status(400).json({ error: 'Champs requis : ecoleId, nom, prenom' })
    }
    const nEcoleId = parseInt(ecoleId)
    if (isNaN(nEcoleId)) return res.status(400).json({ error: 'ecoleId invalide' })

    const matieresJson = JSON.stringify(matieres || [])
    const classesJson = JSON.stringify(classes || [])

    db.run(
      'INSERT INTO enseignants (ecoleId, nom, prenom, sexe, email, telephone, adresse, matieres, classes, photo, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nEcoleId, nom, prenom, sexe || '', email || '', telephone || '', adresse || '', matieresJson, classesJson, photo || '', statut || 'actif']
    )
    saveDb()
    const rows = db.exec('SELECT * FROM enseignants ORDER BY id DESC LIMIT 1')
    const obj = rows.length ? parseRow(rows[0].columns, rows[0].values[0]) : {}
    res.status(201).json(obj)
  } catch (e) {
    console.error('Enseignant create error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })
    const stmt = db.prepare('SELECT id FROM enseignants WHERE id = ?')
    stmt.bind([id])
    if (!stmt.step()) { stmt.free(); return res.status(404).json({ error: 'Enseignant introuvable' }) }
    stmt.free()

    const { nom, prenom, sexe, email, telephone, adresse, matieres, classes, photo, statut } = req.body
    const matieresJson = JSON.stringify(matieres || [])
    const classesJson = JSON.stringify(classes || [])

    db.run(
      `UPDATE enseignants SET nom = ?, prenom = ?, sexe = ?, email = ?, telephone = ?, adresse = ?, matieres = ?, classes = ?, photo = ?, statut = ? WHERE id = ?`,
      [nom, prenom, sexe || '', email || '', telephone || '', adresse || '', matieresJson, classesJson, photo || '', statut || 'actif', id]
    )
    saveDb()
    const row = db.exec(`SELECT * FROM enseignants WHERE id = ${id}`)
    const obj = row.length ? parseRow(row[0].columns, row[0].values[0]) : {}
    res.json(obj)
  } catch (e) {
    console.error('Enseignant update error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })
    db.run('DELETE FROM enseignants WHERE id = ?', [id])
    saveDb()
    res.json({ success: true })
  } catch (e) {
    console.error('Enseignant delete error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
