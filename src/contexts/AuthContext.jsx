/**
 * Contexte d'authentification.
 *
 * Fournit à toute l'application :
 *   user   — Objet utilisateur connecté (ou null)
 *   loading — État de chargement du contexte
 *   login(email, password)          → { user, mustChangePassword }
 *   register(info)                  → user
 *   logout()                        → Déconnexion + redirection
 *   signOut()                       → Déconnexion sans redirection
 *   token()                         → JWT actuel
 *   refreshMe()                     → Recharge le profil depuis l'API
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : (localStorage.removeItem('token'), null))
        .then(u => { if (u) setUser(u) })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password, directeurCode) => {
    const body = { email, password }
    if (directeurCode) body.directeurCode = directeurCode
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erreur connexion')
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return { user: data.user, mustChangePassword: data.mustChangePassword }
  }

  const refreshMe = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const u = await res.json()
        setUser(u)
      }
    } catch {}
  }

  const register = async (info) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Erreur d'inscription")
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Déconnecté')
    navigate('/')
  }

  const signOut = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const token = () => localStorage.getItem('token')

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, signOut, token, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
