/**
 * Route écoles — retourne la liste des écoles depuis schools.json.
 *
 * GET /api/ecoles
 */

import { Router } from 'express'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const fs = await import('fs')
    const path = await import('path')
    const { fileURLToPath } = await import('url')
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const raw = fs.readFileSync(path.join(__dirname, '../../src/data/schools.json'), 'utf8')
    res.json(JSON.parse(raw).ecoles)
  } catch (e) {
    console.error('Ecoles error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
