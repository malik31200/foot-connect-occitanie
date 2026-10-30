import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clubs from './pages/Clubs'
import Teams from './pages/Teams'
import Matches from './pages/Matches'
import Standings from './pages/Standings'
import Moderation from './pages/Moderation'
import Stats from './pages/Stats'

function Nav({ onLogout }) {
  return (
    <nav className="admin-nav">
      <Link to="/" className="admin-nav-link">Dashboard</Link>
      <Link to="/clubs" className="admin-nav-link">Clubs</Link>
      <Link to="/teams" className="admin-nav-link">Équipes</Link>
      <Link to="/matches" className="admin-nav-link">Matchs</Link>
      <Link to="/standings" className="admin-nav-link">Classements</Link>
      <Link to="/moderation" className="admin-nav-link">Modération</Link>
      <Link to="/stats" className="admin-nav-link">Stats</Link>
      <button onClick={onLogout} className="admin-nav-logout">
        Déconnexion
      </button>
    </nav>
  )
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) setIsLoggedIn(true)
  }, [])

  const handleLogin = () => {
    setIsLoggedIn(true)
    navigate('/')
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsLoggedIn(false)
    navigate('/login')
  }

  if (!isLoggedIn) return <Login onLogin={handleLogin} />

  return (
    <>
    <Nav onLogout={handleLogout} />
    <Routes>
      <Route path="/" element={<Dashboard/>} />
      <Route path="/clubs" element={<Clubs/>} />
      <Route path="/teams" element={<Teams />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/standings" element={<Standings />} />
      <Route path="/moderation" element={<Moderation />} />
      <Route path="/stats" element={<Stats />} />
    </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
