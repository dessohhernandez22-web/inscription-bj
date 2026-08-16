/**
 * Point d'entrée du serveur Express.
 *
 * - Sert l'API REST sur /api/*
 * - Sert le frontend build (dist/) en production
 * - SPA fallback : toutes les routes non-API servent index.html
 */

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDb } from './db.js'
import ecolesRouter from './routes/ecoles.js'
import demandesRouter from './routes/demandes.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import notesRouter from './routes/notes.js'
import notificationsRouter from './routes/notifications.js'
import messagesRouter from './routes/messages.js'
import elevesRouter from './routes/eleves.js'
import enseignantsRouter from './routes/enseignants.js'
import classesRouter from './routes/classes.js'
import matieresRouter from './routes/matieres.js'
import emploiTempsRouter from './routes/emploi-temps.js'
import presencesRouter from './routes/presences.js'
import paiementsRouter from './routes/paiements.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes API
app.use('/api/ecoles', ecolesRouter)
app.use('/api/demandes', demandesRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/notes', notesRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/eleves', elevesRouter)
app.use('/api/enseignants', enseignantsRouter)
app.use('/api/classes', classesRouter)
app.use('/api/matieres', matieresRouter)
app.use('/api/emploi-temps', emploiTempsRouter)
app.use('/api/presences', presencesRouter)
app.use('/api/paiements', paiementsRouter)

// Frontend build (production)
app.use(express.static(path.resolve(__dirname, '../dist')))

// SPA fallback — toutes les routes non-API → index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.resolve(__dirname, '../dist/index.html'))
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Erreur serveur' })
})

async function start() {
  await getDb()
  app.listen(PORT, () => {
    console.log(`eInscription API running on http://localhost:${PORT}`)
  })
}

start()
