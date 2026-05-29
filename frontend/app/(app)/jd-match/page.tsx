'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { triggerJDMatch } from '@/lib/n8n'
import Link from 'next/link'

export default function JDMatchPage() {
  const router = useRouter()
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!jdText.trim() || jdText.length < 50) {
      setError('Please paste a full job description (at least 50 characters)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/login')
        return
      }

      // Trigger JD workflow non-blocking
      triggerJDMatch(user.id, jdText).catch(console.error)

      // Go to dashboard with generating state
      router.push('/dashboard?generating=true')

    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  const charCount = jdText.length
  const isReady = charCount >= 50

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>

      {/* Navbar */}
      <nav className="navbar">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>Tailor for Job</span>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }} className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>Tailor resume for a job</h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Paste the full job description below. AI will analyse it and create a tailored resume
            optimised to match the role — boosting your ATS score.
          </p>
        </div>

        {/* How it works */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }} className="animate-fade-in">
          {[
            { step: '1', text: 'Paste job description' },
            { step: '2', text: 'AI analyses keywords' },
            { step: '3', text: 'Get tailored resume' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 150px', minWidth: 140 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {step}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="card animate-fade-in" style={{ padding: '28px' }}>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" htmlFor="jd-textarea">Job description</label>
              <span style={{ fontSize: '0.7rem', color: isReady ? 'var(--green)' : 'var(--text-muted)', fontWeight: 500 }}>
                {charCount} chars {isReady ? '✓ Ready' : `· need ${50 - charCount} more`}
              </span>
            </div>
            <textarea
              id="jd-textarea"
              rows={14}
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste the full job description here — including requirements, responsibilities, and preferred skills..."
              className="input-base"
              style={{ resize: 'vertical', lineHeight: 1.7 }}
            />
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min((charCount / 200) * 100, 100)}%`,
              background: isReady ? 'linear-gradient(90deg, var(--green), #34d399)' : 'linear-gradient(90deg, var(--accent), var(--accent-light))',
              borderRadius: 2,
              transition: 'width 0.3s ease'
            }} />
          </div>

          {error && (
            <div className="error-box" style={{ marginBottom: 20 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !isReady}
            className="btn-green"
            style={{ width: '100%', padding: '13px 20px' }}
          >
            {loading ? (
              <><span className="spinner" /> Analysing job description...</>
            ) : (
              'Generate tailored resume →'
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 14, lineHeight: 1.6 }}>
            Takes 30–60 seconds · You'll be redirected to the dashboard automatically
          </p>
        </div>

        {/* Tips */}
        <div className="card animate-fade-in" style={{ padding: '20px 24px', marginTop: 16 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>💡 Tips for best results</p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 0, listStyle: 'none', margin: 0 }}>
            {[
              'Include the full JD — requirements, responsibilities, and preferred qualifications',
              'More detail = better keyword matching = higher ATS score',
              'Works best when your profile is fully filled out',
            ].map(tip => (
              <li key={tip} style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" style={{ marginTop: 2, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                {tip}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}