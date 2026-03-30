import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PlayerDashboard from './components/Dashboard'
import AuthPage from './components/AuthPage'
import type { AuthUser } from './types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const AUTH_STORAGE_KEY = 'pickleball-online-auth-user-id'

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const storedUserId = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!storedUserId) return

    const loadCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me/${storedUserId}`)
        if (!response.ok) {
          throw new Error(`Failed to load current user: ${response.status}`)
        }

        const user = (await response.json()) as AuthUser
        setCurrentUser(user)
      } catch (error) {
        console.error('Failed to restore auth session:', error)
        window.localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }

    void loadCurrentUser()
  }, [])

  const handleAuthenticated = (user: AuthUser) => {
    setCurrentUser(user)
    window.localStorage.setItem(AUTH_STORAGE_KEY, String(user.userId))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlayerDashboard currentUser={currentUser} onLogout={handleLogout} />} />
        <Route path="/dashboard/player" element={<PlayerDashboard currentUser={currentUser} onLogout={handleLogout} />} />
        <Route path="/auth/login" element={<AuthPage mode="login" onAuthenticated={handleAuthenticated} />} />
        <Route path="/auth/signup" element={<AuthPage mode="signup" onAuthenticated={handleAuthenticated} />} />
        {/*future role-based dashboards go here, e.g.:
            <Route path="/dashboard/organizer" element={<OrganizerDashboard />} />
        */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
