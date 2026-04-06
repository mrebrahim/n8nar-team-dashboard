import { useState } from 'react'

// SECURE: No hardcoded passwords - auth via Supabase Edge Function
const SUPABASE_URL = 'https://ylcvizcapupiszqpslpv.supabase.co'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/auth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })
      const result = await res.json()
      if (!res.ok || result.error) {
        setError(result.error || 'البريد الإلكتروني أو كلمة المرور غلط')
        setLoading(false)
        return
      }
      onLogin(result.data)
    } catch {
      setError('حدث خطأ في الاتصال، حاول مرة أخرى')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg0)', padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: .04,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74,144,217,.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div className="fade-in-up" style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #1B3A6B, #4A90D9)',
            marginBottom: 16, fontSize: 20, fontWeight: 900, color: '#fff',
            boxShadow: '0 0 30px rgba(74,144,217,.3)'
          }}>n</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text1)', letterSpacing: 1 }}>n8nar.com</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>لوحة متابعة الفريق</div>
        </div>
        <div style={{ background: 'var(--bg1)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>تسجيل الدخول</div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>البريد الإلكتروني</div>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@n8nar.com" required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>كلمة المرور</div>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && (
              <div style={{ background: 'rgba(231,76,60,.1)', border: '0.5px solid rgba(231,76,60,.3)', color: '#E74C3C', borderRadius: 8, padding: '9px 12px', fontSize: 12, marginBottom: 14 }}>
                {error}
              </div>
            )}
            <button className="primary-btn" type="submit" disabled={loading}>
              {loading
                ? <span style={{ display:'inline-flex',alignItems:'center',gap:8,justifyContent:'center' }}>
                    <span style={{width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block'}}/>
                    جاري الدخول...
                  </span>
                : 'دخول'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
