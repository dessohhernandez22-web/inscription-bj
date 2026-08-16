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
    let sql = 'SELECT * FROM emploi_temps WHERE 1=1'
    const params = []
    if (req.query.ecoleId) { sql += ' AND ecoleId = ?'; params.push(parseInt(req.query.ecoleId)) }
    if (req.query.classeId) { sql += ' AND classeId = ?'; params.push(parseInt(req.query.classeId)) }
    if (req.query.jour) { sql += ' AND jour = ?'; params.push(req.query.jour) }
    sql += ' ORDER BY jour, heureDebut'
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) results.push(stmt.getAsObject())
    stmt.free()
    res.json(results)
  } catch (e) {
    console.error('Emploi temps list error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const db = await getDb()
    const { ecoleId, classeId, jour, heureDebut, heureFin, matiere, enseignantId, salle, annee } = req.body
    if (!ecoleId || !classeId || !jour || !heureDebut || !heureFin || !matiere || !annee) {
      return res.status(400).json({ error: 'Champs requis : ecoleId, classeId, jour, heureDebut, heureFin, matiere, annee' })
    }
    const nEcoleId = parseInt(ecoleId)
    const nClasseId = parseInt(classeId)
    if (isNaN(nEcoleId) || isNaN(nClasseId)) return res.status(400).json({ error: 'Valeurs numériques invalides' })
    const nEnsId = enseignantId ? parseInt(enseignantId) : null

    db.run(
      'INSERT INTO emploi_temps (ecoleId, classeId, jour, heureDebut, heureFin, matiere, enseignantId, salle, annee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nEcoleId, nClasseId, jour, heureDebut, heureFin, matiere, nEnsId, salle || '', annee]
    )
    saveDb()
    const rows = db.exec('SELECT * FROM emploi_temps ORDER BY id DESC LIMIT 1')
    const obj = rows.length ? parseRow(rows[0].columns, rows[0].values[0]) : {}
    res.status(201).json(obj)
  } catch (e) {
    console.error('Emploi temps create error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })
    const stmt = db.prepare('SELECT id FROM emploi_temps WHERE id = ?')
    stmt.bind([id])
    if (!stmt.step()) { stmt.free(); return res.status(404).json({ error: 'Entrée introuvable' }) }
    stmt.free()

    const { jour, heureDebut, heureFin, matiere, enseignantId, salle } = req.body
    const nEnsId = enseignantId ? parseInt(enseignantId) : null

    db.run(
      `UPDATE emploi_temps SET jour = ?, heureDebut = ?, heureFin = ?, matiere = ?, enseignantId = ?, salle = ? WHERE id = ?`,
      [jour, heureDebut, heureFin, matiere, nEnsId, salle || '', id]
    )
    saveDb()
    const row = db.exec(`SELECT * FROM emploi_temps WHERE id = ${id}`)
    const obj = row.length ? parseRow(row[0].columns, row[0].values[0]) : {}
    res.json(obj)
  } catch (e) {
    console.error('Emploi temps update error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })
    db.run('DELETE FROM emploi_temps WHERE id = ?', [id])
    saveDb()
    res.json({ success: true })
  } catch (e) {
    console.error('Emploi temps delete error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
