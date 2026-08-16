# Architecture du projet

## Stack technique

```
Frontend : React 18 + Vite 5 + Tailwind CSS 3 + React Router 7
Backend  : Express 4 + sql.js (SQLite) + JWT
PWA      : Manifest + Service Worker (cache-first)
Export   : jsPDF / jspdf-autotable / xlsx
```

## Flux de données

```
Parents                              Écoles
    |                                   |
    ▼                                   ▼
  [Home/Recherche]               [DashboardEcole]
    |                                   |
    ▼                                   ▼
  [DetailEcole]                  Voir demandes reçues
    |                                   |
    ▼                                   ▼
  [Inscription]                  [Valider / Refuser]
    |                                (avec motif si refus)
    ▼                                   |
  Demande créée (statut: reçu)          ▼
    |                              Statut changé
    ▼                                   |
  [DashboardParent]              Notification parent
    |                                   |
    ├─ Timeline statut                  ▼
    ├─ Chat avec l'école         [NotesEcole / Bulletins]
    ├─ Paiement (mock)               Saisie notes
    └─ Reçu PDF                     Génération bulletins
                                       Publication
                                           |
                                           ▼
                                    Parent voit bulletins
```

## Rôles et permissions

### Admin
- Créer/modifier/supprimer des comptes directeurs
- Voir les stats globales
- Bloquer/activer des comptes
- Modifier les infos des écoles
- Accès à tous les dashboards écoles

### Directeur
- Voir uniquement les demandes de son école (filtré par `ecoleId`)
- Gérer le statut des demandes (prendre en charge, accepter, refuser avec motif, liste attente)
- Saisir les notes avec coefficients
- Générer et publier les bulletins
- Discuter avec les parents

### Parent
- Rechercher une école
- Inscrire un enfant (formulaire multi-étapes)
- Suivre le statut de ses demandes
- Voir les bulletins (après publication)
- Payer en ligne (mock)
- Télécharger un reçu PDF
- Discuter avec l'école
- Recevoir des notifications

## Sécurité

- **JWT** : Token stocké dans localStorage, envoyé en header `Authorization: Bearer`
- **Mots de passe** : Hashés avec bcryptjs (10 rounds)
- **Mots de passe provisoires** : Comptes directeurs créés avec `tempPassword`, changement forcé à la 1ère connexion
- **Blocage** : Les comptes peuvent être désactivés par l'admin (statut `blocked`)
- **Filtrage écoles** : Les directeurs ne voient que leur école (`ecoleId` dans le JWT)

## Points d'attention

### SQLite concurrent
sql.js n'est pas conçu pour la concurrence. Toutes les opérations sont synchronisées via `saveDb()`.
Ne pas utiliser en production avec plusieurs processus.

### PWA
Le service worker (`public/sw.js`) utilise une stratégie cache-first pour les assets statiques.
Les appels API (`/api/`) ne sont pas mis en cache.

### Coefficients des notes
- Maths: 4, Français: 3, Anglais: 2, PC: 2, SVT: 2, HG: 1, EM: 1
- Moyenne = somme(note × coeff) / somme(coeff)
- Configurable par le directeur

### Bulletins
- Générés par le directeur, stockés avec `datePublication = NULL`
- Visibles par les parents seulement après que le directeur a défini une date de publication
- La visibilité est vérifiée côté serveur (requête `bulletins` filtre par `datePublication`)
