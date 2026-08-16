/**
 * Script de seed — crée les comptes par défaut dans la base de données.
 *
 * Exécution : node server/seed.js
 *
 * Comptes créés :
 *   - admin@einscription.bj / admin123 (admin)
 *   - parent@test.com / test123 (parent)
 *   - directeur@test.com / admin123 (directeur)
 */

import bcrypt from 'bcryptjs'
import { getDb, saveDb } from './db.js'

async function seed() {
  const db = await getDb()

  const hash = await bcrypt.hash

  const adminEmail = 'admin@einscription.bj'
  const checkAdmin = db.exec(`SELECT id FROM users WHERE email = '${adminEmail}'`)
  if (!checkAdmin.length || !checkAdmin[0].values.length) {
    const pwd = await bcrypt.hash('admin123', 10)
    db.exec(`INSERT INTO users (email, password, nom, prenom, role) VALUES ('${adminEmail}', '${pwd}', 'Admin', 'Super', 'admin')`)
    console.log('✓ Compte admin créé')
  }

  const parentEmail = 'parent@test.com'
  const checkParent = db.exec(`SELECT id FROM users WHERE email = '${parentEmail}'`)
  if (!checkParent.length || !checkParent[0].values.length) {
    const pwd = await bcrypt.hash('test123', 10)
    db.exec(`INSERT INTO users (email, password, nom, prenom, telephone, role) VALUES ('${parentEmail}', '${pwd}', 'Parent', 'Test', '0100000000', 'parent')`)
    console.log('✓ Compte parent créé')
  }

  const directeurEmail = 'directeur@test.com'
  const checkDirecteur = db.exec(`SELECT id FROM users WHERE email = '${directeurEmail}'`)
  if (!checkDirecteur.length || !checkDirecteur[0].values.length) {
    const pwd = await bcrypt.hash('admin123', 10)
    db.exec(`INSERT INTO users (email, password, nom, prenom, telephone, role, ecoleId) VALUES ('${directeurEmail}', '${pwd}', 'DONALD', 'DESSOH', '0149167833', 'directeur', 871)`)
    console.log('✓ Compte directeur créé')
  }

  saveDb()
  console.log('✓ Base de données initialisée')
}

seed().catch(console.error)
