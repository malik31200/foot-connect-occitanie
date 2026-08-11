import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clubs from './pages/Clubs'
import Teams from './pages/Teams'
import Matches from './pages/Matches'
import Standings from './pages/Standings'
import Moderation from './pages/Moderation'

function Nav({ onLogout }) {
  return (
    <nav style={{ padding: '12px 24px', background: '#1f1f1f', display: 'flex', gap: 24 }}>
      <Link to="/" style={{ color: 'white' }}>Dashboard</Link>
      <Link to="/clubs" style={{ color: 'white' }}>Clubs</Link>
      <Link to="/teams" style={{ color: 'white' }}>Équipes</Link>
      <Link to="/matches" style={{ color: 'white' }}>Matchs</Link>
      <Link to="/standings" style={{ color: 'white' }}>Classements</Link>
      <Link to="/moderation" style={{ color: 'white' }}>Modération</Link>
    <button onClick={onLogout} style={{ marginLeft: 'auto', color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
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
