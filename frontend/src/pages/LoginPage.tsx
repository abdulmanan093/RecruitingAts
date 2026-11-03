import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/shared'

const demoAccounts = [
  { email: 'admin@demo.local', label: 'Admin' },
  { email: 'recruiter@demo.local', label: 'Recruiter' },
  { email: 'manager@demo.local', label: 'Hiring Manager' },
  { email: 'interviewer@demo.local', label: 'Interviewer' },
]

/** Owner: Tayyab — auth kickstart (login / register). */
export function LoginPage() {
  const { user, loading, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('recruiter@demo.local')
  const [password, setPassword] = useState('Pass123!')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('Demo Recruiter')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, fullName)
      navigate(from, { replace: true })
    } catch {
      setError(mode === 'login' ? 'Login failed.' : 'Register failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <h1 className="brand">
          Recruiting ATS
          <small>Sign in</small>
        </h1>

        <div className="tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <div className="demo-accounts">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email)
                  setPassword('Pass123!')
                }}
              >
                {account.label}
              </button>
            ))}
          </div>
        ) : null}

        <form className="stack" onSubmit={onSubmit}>
          {mode === 'register' ? (
            <label className="field">
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </label>
          ) : null}
          <label className="field">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <div className="login-password">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
              />
              <button
                type="button"
                className="login-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="m3 3 18 18" />}
                </svg>
              </button>
            </div>
          </div>
          {error ? <p className="error">{error}</p> : null}
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </Button>
        </form>
      </section>
    </main>
  )
}
