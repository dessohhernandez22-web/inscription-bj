import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <Helmet>
        <title>404 – Page introuvable – eInscription.bj</title>
        <meta name="description" content="La page que vous cherchez n'existe pas." />
      </Helmet>
      <p className="text-7xl font-extrabold text-benin-green mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page introuvable</h1>
      <p className="text-gray-500 mb-8">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <Link to="/" className="btn-primary inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Retour à l'accueil
      </Link>
    </div>
  )
}
