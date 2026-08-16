/**
 * Base de données SQLite — Initialisation et migrations.
 *
 * Utilise sql.js (SQLite compilé en WebAssembly) pour stocker
 * toutes les données dans un fichier local `server/data.db`.
 *
 * Schéma :
 *   users          → Comptes (admin, directeur, parent)
 *   demandes       → Demandes d'inscription
 *   notes          → Notes scolaires avec coefficients
 *   bulletins      → Bulletins trimestriels
 *   notifications  → Notifications parents
 *   messages       → Messagerie parent ↔ école
 */

import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'data.db')

let db = null

/** @returns {Promise<import('sql.js').Database>} */
export async function getDb() {
  if (db) return db

  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA journal_mode=WAL')
  db.run('PRAGMA foreign_keys=ON')

  db.run(`
    CREATE TABLE IF NOT EXISTS demandes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ecoleId INTEGER NOT NULL,
      ecoleNom TEXT NOT NULL,
      niveau TEXT,
      filiere TEXT DEFAULT '',
      classe TEXT NOT NULL,
      nomEnfant TEXT NOT NULL,
      prenomEnfant TEXT NOT NULL,
      dateNaissance TEXT,
      lieuNaissance TEXT,
      sexe TEXT,
      nomParent TEXT,
      prenomParent TEXT,
      email TEXT,
      telephone TEXT,
      adresse TEXT,
      documents TEXT DEFAULT '[]',
      modePaiement TEXT,
      statut TEXT NOT NULL DEFAULT 'reçu',
      groupId INTEGER,
      userId INTEGER,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      telephone TEXT,
      role TEXT NOT NULL DEFAULT 'parent',
      ecoleId INTEGER,
      tempPassword TEXT,
      generatedById INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ecoleId INTEGER NOT NULL,
      eleveId INTEGER NOT NULL,
      classe TEXT NOT NULL,
      matiere TEXT NOT NULL,
      note REAL NOT NULL,
      trimestre INTEGER NOT NULL,
      annee TEXT NOT NULL,
      coeff INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS bulletins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ecoleId INTEGER NOT NULL,
      eleveId INTEGER NOT NULL,
      classe TEXT NOT NULL,
      trimestre INTEGER NOT NULL,
      annee TEXT NOT NULL,
      moyenne REAL DEFAULT 0,
      decision TEXT DEFAULT 'en_cours',
      datePublication TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // === Nouvelles tables: gestion scolaire ===

  db.run(`
    CREATE TABLE IF NOT EXISTS eleves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricule TEXT UNIQUE NOT NULL,
      ecoleId INTEGER NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      sexe TEXT,
      dateNaissance TEXT,
      lieuNaissance TEXT,
      classe TEXT NOT NULL,
      photo TEXT,
      statut TEXT NOT NULL DEFAULT 'actif',
      adresse TEXT,
      nomParent TEXT,
      telephoneParent TEXT,
      emailParent TEXT,
      historiqueScolaire TEXT DEFAULT '',
      annee TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS enseignants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ecoleId INTEGER NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      sexe TEXT,
      email TEXT,
      telephone TEXT,
      adresse TEXT,
      matieres TEXT DEFAULT '[]',
      classes TEXT DEFAULT '[]',
      photo TEXT,
      statut TEXT NOT NULL DEFAULT 'actif',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ecoleId INTEGER NOT NULL,
      nom TEXT NOT NULL,
      niveau TEXT NOT NULL,
      section TEXT DEFAULT '',
      salle TEXT DEFAULT '',
      capacite INTEGER DEFAULT 40,
      professeurPrincipalId INTEGER,
      annee TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS matieres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ecoleId INTEGER NOT NULL,
      nom TEXT NOT NULL,
      coefficient INTEGER DEFAULT 1,
      niveau TEXT NOT NULL,
      enseignantId INTEGER,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS emploi_temps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ecoleId INTEGER NOT NULL,
      classeId INTEGER NOT NULL,
      jour TEXT NOT NULL,
      heureDebut TEXT NOT NULL,
      heureFin TEXT NOT NULL,
      matiere TEXT NOT NULL,
      enseignantId INTEGER,
      salle TEXT DEFAULT '',
      annee TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS presences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ecoleId INTEGER NOT NULL,
      eleveId INTEGER NOT NULL,
      classeId INTEGER NOT NULL,
      date TEXT NOT NULL,
      statut TEXT NOT NULL DEFAULT 'present',
      justifie INTEGER DEFAULT 0,
      annee TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS paiements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ecoleId INTEGER NOT NULL,
      eleveId INTEGER NOT NULL,
      type TEXT NOT NULL,
      montant REAL NOT NULL,
      date TEXT NOT NULL,
      mode TEXT DEFAULT '',
      reference TEXT,
      statut TEXT NOT NULL DEFAULT 'paye',
      annee TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Migrations rétrocompatibles (colonnes ajoutées après création)
  try { db.run('ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT \'active\'') } catch (_) {}
  try { db.run('ALTER TABLE users ADD COLUMN tempPassword TEXT') } catch (_) {}
  try { db.run('ALTER TABLE users ADD COLUMN generatedById INTEGER') } catch (_) {}
  try { db.run('ALTER TABLE demandes ADD COLUMN notes TEXT') } catch (_) {}
  try { db.run('ALTER TABLE demandes ADD COLUMN paiementReference TEXT') } catch (_) {}
  try { db.run('ALTER TABLE demandes ADD COLUMN paiementDate TEXT') } catch (_) {}
  try { db.run('ALTER TABLE demandes ADD COLUMN paiementMontant REAL DEFAULT 0') } catch (_) {}
  try { db.run('ALTER TABLE demandes ADD COLUMN modePaiement TEXT') } catch (_) {}
  try { db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    lu INTEGER DEFAULT 0,
    demandeId INTEGER,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`) } catch (_) {}
  try { db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    demandeId INTEGER NOT NULL,
    senderId INTEGER NOT NULL,
    senderRole TEXT NOT NULL,
    message TEXT NOT NULL,
    lu INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`) } catch (_) {}

  return db
}

/** Sauvegarde la base de données sur le disque */
export function saveDb() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}
