import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import NotificationBell from './NotificationBell'

const navItems = [
  { path: '/', label: 'Rechercher une école', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { path: '/suivi', label: 'Suivre mon dossier', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: '/ecole/connexion', label: 'Espace école', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { path: '/connexion', label: 'Administration', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
]

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const authNavItems = user
    ? [
        { path: '/', label: 'Rechercher', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
        ...(user.role === 'admin'
          ? [
              { path: '/admin', label: 'Admin', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
            ]
          : user.role === 'directeur'
            ? [
                { path: '/ecole/gestion', label: 'Gestion', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
              ]
            : []),
        { path: '/suivi', label: 'Suivre dossier', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      ]
    : navItems

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-benin-green rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">
                <span className="text-benin-green">eInscription</span><span className="text-benin-red">.bj</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {(user ? authNavItems : navItems).map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path))
                      ? 'bg-benin-green/10 text-benin-green'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              ))}
              {user ? (
                <div className="flex items-center gap-2 ml-3 pl-3 border-l border-gray-200">
                  <NotificationBell />
                  <Link to="/profil" className="text-sm text-gray-600 hover:text-benin-green font-medium">
                    {user.prenom} {user.nom}
                  </Link>
                  <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500 transition-colors" title="Déconnexion">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              ) : (
                <Link to="/connexion" className="btn-primary text-sm ml-3">
                  Connexion
                </Link>
              )}
            </nav>

            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen
                  ? <path d="M6 18L18 6M6 6l12 12" />
                  : <path d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>

          {menuOpen && (
            <div className="md:hidden pb-4 space-y-1">
              {(user ? authNavItems : navItems).map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path))
                      ? 'bg-benin-green/10 text-benin-green'
                      : 'text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              ))}
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-500">{user.prenom} {user.nom}</div>
                  <button onClick={() => { setMenuOpen(false); logout() }} className="w-full text-left px-4 py-3 text-sm text-red-500 font-medium">
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link to="/connexion" onClick={() => setMenuOpen(false)} className="btn-primary text-sm text-center block mt-3">
                  Connexion
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' } }} />
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-benin-green rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">eInscription.bj</span>
              </div>
              <p className="text-sm">La première plateforme d'inscription scolaire en ligne au Bénin.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Parents</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">Rechercher une école</Link></li>
                <li><Link to="/suivi" className="hover:text-white transition-colors">Suivre mon dossier</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Écoles</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/ecole/connexion" className="hover:text-white transition-colors">Tableau de bord</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Devenir partenaire</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>contact@einscription.bj</li>
                <li>+229 01 00 00 00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
            &copy; {new Date().getFullYear()} eInscription.bj — Tous droits réservés
          </div>
        </div>
      </footer>
    </div>
  )
}
