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

function generateMatricule() {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `ELV-${num}`
}

router.get('/', async (req, res) => {
  try {
    const db = await getDb()
    let sql = 'SELECT * FROM eleves WHERE 1=1'
    const params = []
    if (req.query.ecoleId) { sql += ' AND ecoleId = ?'; params.push(parseInt(req.query.ecoleId)) }
    if (req.query.classe) { sql += ' AND classe = ?'; params.push(req.query.classe) }
    if (req.query.statut) { sql += ' AND statut = ?'; params.push(req.query.statut) }
    if (req.query.annee) { sql += ' AND annee = ?'; params.push(req.query.annee) }
    if (req.query.search) {
      sql += ' AND (nom LIKE ? OR prenom LIKE ? OR matricule LIKE ?)'
      const s = `%${req.query.search}%`
      params.push(s, s, s)
    }
    sql += ' ORDER BY nom, prenom'
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) results.push(stmt.getAsObject())
    stmt.free()
    res.json(results)
  } catch (e) {
    console.error('Eleves list error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', async (req, res) => {
  try {
    const db = await getDb()
    const { ecoleId, nom, prenom, sexe, dateNaissance, lieuNaissance, classe, photo, statut, adresse, nomParent, telephoneParent, emailParent, historiqueScolaire, annee } = req.body
    if (!ecoleId || !nom || !prenom || !classe || !annee) {
      return res.status(400).json({ error: 'Champs requis : ecoleId, nom, prenom, classe, annee' })
    }
    const nEcoleId = parseInt(ecoleId)
    if (isNaN(nEcoleId)) return res.status(400).json({ error: 'ecoleId invalide' })

    let matricule = generateMatricule()
    let tries = 0
    while (tries < 10) {
      const existing = db.prepare('SELECT id FROM eleves WHERE matricule = ?')
      existing.bind([matricule])
      if (!existing.step()) { existing.free(); break }
      existing.free()
      matricule = generateMatricule()
      tries++
    }

    db.run(
      'INSERT INTO eleves (matricule, ecoleId, nom, prenom, sexe, dateNaissance, lieuNaissance, classe, photo, statut, adresse, nomParent, telephoneParent, emailParent, historiqueScolaire, annee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [matricule, nEcoleId, nom, prenom, sexe || '', dateNaissance || '', lieuNaissance || '', classe, photo || '', statut || 'actif', adresse || '', nomParent || '', telephoneParent || '', emailParent || '', historiqueScolaire || '', annee]
    )
    saveDb()
    const rows = db.exec('SELECT * FROM eleves ORDER BY id DESC LIMIT 1')
    const obj = rows.length ? parseRow(rows[0].columns, rows[0].values[0]) : {}
    res.status(201).json(obj)
  } catch (e) {
    console.error('Eleve create error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })
    const stmt = db.prepare('SELECT id FROM eleves WHERE id = ?')
    stmt.bind([id])
    if (!stmt.step()) { stmt.free(); return res.status(404).json({ error: 'Élève introuvable' }) }
    stmt.free()

    const { nom, prenom, sexe, dateNaissance, lieuNaissance, classe, photo, statut, adresse, nomParent, telephoneParent, emailParent, historiqueScolaire, annee } = req.body
    db.run(
      `UPDATE eleves SET nom = ?, prenom = ?, sexe = ?, dateNaissance = ?, lieuNaissance = ?, classe = ?, photo = ?, statut = ?, adresse = ?, nomParent = ?, telephoneParent = ?, emailParent = ?, historiqueScolaire = ?, annee = ? WHERE id = ?`,
      [nom, prenom, sexe || '', dateNaissance || '', lieuNaissance || '', classe, photo || '', statut || 'actif', adresse || '', nomParent || '', telephoneParent || '', emailParent || '', historiqueScolaire || '', annee || '', id]
    )
    saveDb()
    const row = db.exec(`SELECT * FROM eleves WHERE id = ${id}`)
    const obj = row.length ? parseRow(row[0].columns, row[0].values[0]) : {}
    res.json(obj)
  } catch (e) {
    console.error('Eleve update error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })
    db.run('DELETE FROM eleves WHERE id = ?', [id])
    saveDb()
    res.json({ success: true })
  } catch (e) {
    console.error('Eleve delete error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/stats/:ecoleId', async (req, res) => {
  try {
    const db = await getDb()
    const ecoleId = parseInt(req.params.ecoleId)
    if (isNaN(ecoleId)) return res.status(400).json({ error: 'ecoleId invalide' })

    const total = db.prepare('SELECT COUNT(*) as c FROM eleves WHERE ecoleId = ?')
    total.bind([ecoleId])
    total.step()
    const totalRows = total.getAsObject()
    total.free()

    const parClasse = db.prepare('SELECT classe, COUNT(*) as c FROM eleves WHERE ecoleId = ? GROUP BY classe ORDER BY classe')
    parClasse.bind([ecoleId])
    const classes = []
    while (parClasse.step()) classes.push(parClasse.getAsObject())
    parClasse.free()

    const parSexe = db.prepare('SELECT sexe, COUNT(*) as c FROM eleves WHERE ecoleId = ? GROUP BY sexe')
    parSexe.bind([ecoleId])
    const sexes = []
    while (parSexe.step()) sexes.push(parSexe.getAsObject())
    parSexe.free()

    const actifs = db.prepare("SELECT COUNT(*) as c FROM eleves WHERE ecoleId = ? AND statut = 'actif'")
    actifs.bind([ecoleId])
    actifs.step()
    const actifsRows = actifs.getAsObject()
    actifs.free()

    const inactifs = db.prepare("SELECT COUNT(*) as c FROM eleves WHERE ecoleId = ? AND statut != 'actif'")
    inactifs.bind([ecoleId])
    inactifs.step()
    const inactifsRows = inactifs.getAsObject()
    inactifs.free()

    res.json({
      total: totalRows.c || 0,
      parClasse: classes,
      parSexe: sexes,
      actifs: actifsRows.c || 0,
      inactifs: inactifsRows.c || 0
    })
  } catch (e) {
    console.error('Eleves stats error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
