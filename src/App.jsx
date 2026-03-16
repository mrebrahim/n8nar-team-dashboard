import { useState, useEffect } from 'react'
import Login from './pages/Login'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import './index.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('n8nar_user')
    if (saved) setUser(JSON.parse(saved))
    setLoading(false)
  }, [])

  const login = (userData) => {
    localStorage.setItem('n8nar_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('n8nar_user')
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
