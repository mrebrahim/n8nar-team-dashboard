import { useState, useEffect } from 'react'
import Login from './pages/Login'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import './index.css'

// Version stamp - bump this to force all users to re-login
const AUTH_VERSION = '2'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('n8nar_user')
    const savedVersion = localStorage.getItem('n8nar_auth_version')
    
    // If auth version mismatch, clear old session and force re-login
    if (savedVersion !== AUTH_VERSION) {
      localStorage.removeItem('n8nar_user')
      localStorage.removeItem('n8nar_auth_version')
      setLoading(false)
      return
    }
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Validate required fields from new auth system
        if (parsed && parsed.id && parsed.email && parsed.name) {
          setUser(parsed)
        } else {
          localStorage.removeItem('n8nar_user')
          localStorage.removeItem('n8nar_auth_version')
        }
      } catch {
        localStorage.removeItem('n8nar_user')
        localStorage.removeItem('n8nar_auth_version')
      }
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    localStorage.setItem('n8nar_user', JSON.stringify(userData))
    localStorage.setItem('n8nar_auth_version', AUTH_VERSION)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('n8nar_user')
    localStorage.removeItem('n8nar_auth_version')
    setUser(null)
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#050A14'}}>
      <div style={{color:'#4A90D9',fontFamily:'Cairo,sans-serif',fontSize:14,letterSpacing:6,animation:'fadeIn 1s ease'}}>N8NAR</div>
    </div>
  )

  if (!user) return <Login onLogin={login} />
  if (user.is_manager) return <ManagerDashboard user={user} onLogout={logout} />
  return <EmployeeDashboard user={user} onLogout={logout} />
}
