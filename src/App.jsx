/**
 * Configuration des routes de l'application.
 *
 * Organisation :
 *   /                                → Accueil + recherche
 *   /ecole/:ecoleId                  → Fiche détaillée d'une école
 *   /inscription/:ecoleId            → Formulaire d'inscription enfant
 *   /ecole/connexion                 → Page connexion école
 *   /suivi                           → Suivi de dossier (sans compte)
 *   /connexion                       → Connexion
 *   /changer-mot-de-passe            → Changement MDP forcé (hors Layout)
 *   /ecole/gestion/*                 → Direction (sidebar complète)
 *   /admin/*                         → Administration (sidebar)
 *   /parent/*                        → Dashboard parent
 *
 * Note : L'inscription publique de comptes parent est désactivée.
 *        Les comptes sont créés par l'administration ou les directeurs.
 */

import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import DirectorLayout from './components/DirectorLayout'

import Home from './pages/Home'
import DetailEcole from './pages/DetailEcole'
import Inscription from './pages/Inscription'
import SuiviDossier from './pages/SuiviDossier'
import Login from './pages/Login'

import ConnexionEcole from './pages/ConnexionEcole'
import AdminDashboard from './pages/AdminDashboard'
import ChangePassword from './pages/ChangePassword'
import NotFound from './pages/NotFound'
import DashboardParent from './pages/DashboardParent'
import BulletinsParent from './pages/BulletinsParent'

import DirectorDashboard from './pages/director/Dashboard'
import DirectorEleves from './pages/director/Eleves'
import DirectorEnseignants from './pages/director/Enseignants'
import DirectorClasses from './pages/director/Classes'
import DirectorMatieres from './pages/director/Matieres'
import DirectorEmploiDuTemps from './pages/director/EmploiDuTemps'
import DirectorPresences from './pages/director/Presences'
import DirectorNotes from './pages/director/Notes'
import DirectorBulletins from './pages/director/Bulletins'
import DirectorPaiements from './pages/director/PaiementsList'
import DirectorCommunication from './pages/director/Communication'
import DirectorParametres from './pages/director/Parametres'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Hors Layout : pas de nav/footer */}
        <Route path="/changer-mot-de-passe" element={<ChangePassword />} />

        {/* Layout principal : nav + footer (public + admin) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/ecole/:ecoleId" element={<DetailEcole />} />
          <Route path="/inscription/:ecoleId" element={<Inscription />} />
          <Route path="/ecole/connexion" element={<ConnexionEcole />} />
          <Route path="/suivi" element={<SuiviDossier />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/parent" element={<DashboardParent />} />
          <Route path="/parent/resultats" element={<BulletinsParent />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Direction : sidebar complète */}
        <Route element={<DirectorLayout />}>
          <Route path="/ecole/gestion" element={<DirectorDashboard />} />
          <Route path="/ecole/gestion/eleves" element={<DirectorEleves />} />
          <Route path="/ecole/gestion/enseignants" element={<DirectorEnseignants />} />
          <Route path="/ecole/gestion/classes" element={<DirectorClasses />} />
          <Route path="/ecole/gestion/matieres" element={<DirectorMatieres />} />
          <Route path="/ecole/gestion/emploi-du-temps" element={<DirectorEmploiDuTemps />} />
          <Route path="/ecole/gestion/presences" element={<DirectorPresences />} />
          <Route path="/ecole/gestion/notes" element={<DirectorNotes />} />
          <Route path="/ecole/gestion/bulletins" element={<DirectorBulletins />} />
          <Route path="/ecole/gestion/paiements" element={<DirectorPaiements />} />
          <Route path="/ecole/gestion/communication" element={<DirectorCommunication />} />
          <Route path="/ecole/gestion/parametres" element={<DirectorParametres />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
