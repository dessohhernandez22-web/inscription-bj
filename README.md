# eInscription.bj

Plateforme d'inscription scolaire en ligne au Bénin — MERN-like (React + Express + SQLite).

## Architecture

```
inscription-bj/
├── server/              # Backend Express (API REST)
│   ├── index.js         # Point d'entrée du serveur
│   ├── db.js            # SQLite (sql.js) — schéma + migrations
│   ├── seed.js          # Données de démo
│   ├── package.json     # Dépendances backend
│   └── routes/          # Routes API
│       ├── auth.js      # POST /login, /register, /change-password, /mot-de-passe-oublie
│       ├── admin.js     # CRUD comptes directeurs, stats, toggle-status, edit-ecole
│       ├── demandes.js  # CRUD demandes d'inscription, PATCH statut, POST /payer
│       ├── ecoles.js    # GET écoles
│       ├── notes.js     # CRUD notes, bulletins, publication
│       ├── notifications.js # GET notifications, marquer lu
│       └── messages.js  # GET/POST messages parent ↔ école
│
├── src/                 # Frontend React (Vite)
│   ├── main.jsx         # Entry point + service worker registration
│   ├── App.jsx          # Routes
│   ├── index.css        # Tailwind + classes customs
│   ├── contexts/
│   │   └── AuthContext.jsx  # Contexte auth (login, logout, JWT)
│   ├── components/
│   │   ├── Layout.jsx       # Header, nav, footer responsive
│   │   ├── ChatBox.jsx      # Messagerie parent-école (modal)
│   │   └── NotificationBell.jsx # Cloche notifications parent
│   ├── data/
│   │   ├── schools.json     # Données des écoles
│   │   ├── schools.js       # Helpers écoles
│   │   ├── demandes.js      # Helpers demandes (cache + refresh)
│   │   └── api.js           # Fonctions fetch génériques
│   └── pages/
│       ├── Home.jsx              # Accueil + recherche
│       ├── DetailEcole.jsx       # Fiche école
│       ├── Inscription.jsx       # Formulaire d'inscription
│       ├── Login.jsx             # Connexion
│       ├── Register.jsx          # Inscription parent
│       ├── ConnexionEcole.jsx    # Page connexion école
│       ├── SuiviDossier.jsx      # Suivi sans compte (par tel/email)
│       ├── DashboardParent.jsx   # Tableau de bord parent
│       ├── DashboardEcole.jsx    # Tableau de bord directeur
│       ├── NotesEcole.jsx        # Saisie notes + bulletins
│       ├── BulletinsParent.jsx   # Consultation bulletins
│       ├── AdminDashboard.jsx    # Admin (comptes, écoles)
│       ├── ChangePassword.jsx    # Changement mot de passe forcé
│       └── NotFound.jsx          # 404
│
├── public/
│   ├── logo.png          # Icône PWA
│   ├── manifest.json     # Manifest PWA
│   └── sw.js             # Service worker (cache-first)
│
├── index.html            # HTML entry + PWA meta tags
├── package.json          # Dépendances frontend + scripts
├── vite.config.js        # Configuration Vite
├── tailwind.config.js    # Configuration Tailwind
└── postcss.config.js     # Configuration PostCSS
```

## Prérequis

- Node.js ≥ 18
- npm

## Installation

```bash
# 1. Installer les dépendances frontend
npm install

# 2. Installer les dépendances backend
cd server && npm install && cd ..

# 3. Démarrer en développement (API + frontend)
npm run dev:all

# 4. Build production
npm run build
node server/index.js
```

L'API tourne sur `http://localhost:3001`. En production, Express sert aussi le frontend build (`dist/`).

## API REST

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/login` | — | Connexion |
| POST | `/api/auth/register` | — | Inscription parent |
| POST | `/api/auth/change-password` | JWT | Changer mot de passe |
| POST | `/api/auth/mot-de-passe-oublie` | — | Réinit mot de passe directeur |
| GET | `/api/auth/me` | JWT | Profil utilisateur |
| GET | `/api/ecoles` | — | Liste écoles |
| GET | `/api/demandes` | — | Liste demandes (filtres: ecoleId, userId, telephone, email) |
| POST | `/api/demandes` | — | Créer une demande |
| PATCH | `/api/demandes/:id` | — | Changer statut (+ motif rejet) |
| POST | `/api/demandes/:id/payer` | — | Simuler un paiement |
| GET/POST | `/api/messages/:demandeId` | JWT | Messagerie |
| GET | `/api/notifications` | JWT | Notifications |
| POST | `/api/notifications/read/:id` | JWT | Marquer lue |
| POST | `/api/notifications/read-all` | JWT | Tout marquer lu |
| GET/POST/PUT/DELETE | `/api/notes/*` | JWT | Notes et bulletins |
| GET/POST | `/api/admin/stats` | Admin | Statistiques |
| GET/POST | `/api/admin/comptes` | Admin | Gestion comptes directeurs |
| POST | `/api/admin/generate-compte` | Admin | Créer compte directeur |
| POST | `/api/admin/reset-compte/:id` | Admin | Réinit mot de passe |
| POST | `/api/admin/toggle-status/:id` | Admin | Bloquer/activer |
| POST | `/api/admin/edit-ecole` | Admin | Modifier école |
| GET | `/api/admin/ecoles` | Admin | Liste écoles |

## Rôles

- **admin** — Gère les comptes directeurs et les écoles
- **directeur** — Gère les demandes, les notes, les bulletins de son école
- **parent** — Inscrit ses enfants, suit les dossiers, paye

## Comptes par défaut

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@einscription.bj | admin123 |
| Parent | parent@test.com | test123 |
| Directeur | (créé par admin) | (provisoire, changement forcé) |

## Base de données

SQLite via `sql.js`. Fichier : `server/data.db`. Schéma créé automatiquement au démarrage.

### Tables

- **users** — Comptes (admin, directeur, parent)
- **demandes** — Demandes d'inscription
- **notes** — Notes scolaires
- **bulletins** — Bulletins trimestriels
- **notifications** — Notifications parents
- **messages** — Messages parent ↔ école

## PWA

- Manifeste : `/manifest.json`
- Service worker : `/sw.js` (cache-first pour les assets statiques)
- Icône : `/logo.png`

## Technologies

- **Frontend** : React 18, Vite, Tailwind CSS 3, React Router 7, jsPDF, xlsx
- **Backend** : Express 4, sql.js, bcryptjs, jsonwebtoken
- **Base de données** : SQLite (sql.js)
