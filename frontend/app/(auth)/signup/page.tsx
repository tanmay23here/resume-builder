'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/profile')
  }

  return (
    <div className="page-bg auth-layout">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              fontSize: 18, fontWeight: 800, color: '#fff'
            }}>R</div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>ResumeAI</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Build an ATS-ready resume in minutes, for free
          </p>
        </div>

        {/* Feature highlights */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '✦', text: 'AI writes your bullets' },
            { icon: '✦', text: 'ATS score included' },
            { icon: '✦', text: 'JD tailoring' },
          ].map(f => (
            <span key={f.text} style={{
              fontSize: '0.7rem', fontWeight: 500, color: 'var(--accent-light)',
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)',
              padding: '4px 12px', borderRadius: 20
            }}>
              {f.icon} {f.text}
            </span>
          ))}
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div>
              <label className="form-label" htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-base"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base"
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 5 }}>At least 8 characters</p>
            </div>

            {error && (
              <div className="error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '12px 20px', marginTop: 4 }}>
              {loading ? <><span className="spinner" /> Creating account...</> : 'Get started free →'}
            </button>

          </form>

          <div className="divider" />

          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-light)', fontWeight: 600, textDecoration: 'none' }}>
              Log in
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 16 }}>
          By signing up you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}