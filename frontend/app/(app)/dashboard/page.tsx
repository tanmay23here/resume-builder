'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Resume {
  id: string
  type: 'base' | 'jd_tailored'
  s3_url: string
  ats_score: number
  match_score?: number
  created_at: string
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isGenerating = searchParams.get('generating') === 'true'

  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(isGenerating)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!generating) return
    const interval = setInterval(() => {
      loadResumes()
    }, 10000)
    return () => clearInterval(interval)
  }, [generating])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    await loadResumes()
    setLoading(false)
  }

  async function loadResumes() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data && data.length > 0) {
      setResumes(data)
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="page-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner-indigo" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>

      {/* Navbar */}
      <nav className="navbar">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff', boxShadow: '0 2px 10px rgba(99,102,241,0.35)'
            }}>R</div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>ResumeAI</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</span>
            <Link href="/profile" className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.8rem' }}>
              Edit Profile
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }} className="animate-fade-in">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            My Resumes
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            AI-generated, ATS-optimized resumes tailored to your profile
          </p>
        </div>

        {/* Generating banner */}
        {generating && (
          <div className="info-banner animate-fade-in" style={{ marginBottom: 24 }}>
            <div className="spinner-indigo" />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-light)', marginBottom: 2 }}>
                AI is crafting your resume...
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Optimizing for ATS systems · Takes 30–60 seconds · Page updates automatically
              </p>
            </div>
          </div>
        )}

        {/* Action card — Tailor for JD */}
        <div className="card card-hover animate-fade-in" style={{ marginBottom: 28, padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Tailor for a job</h2>
                <span className="badge badge-green">Recommended</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Paste a job description — AI analyses it and rewrites your resume to match the role perfectly
              </p>
            </div>
            <Link href="/jd-match" className="btn-green" style={{ whiteSpace: 'nowrap' }}>
              Paste JD →
            </Link>
          </div>
        </div>

        {/* Resumes section */}
        <div>
          <p className="section-title" style={{ marginBottom: 16 }}>Generated resumes</p>

          {resumes.length === 0 && !generating && (
            <div className="card animate-fade-in" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No resumes yet</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>Fill out your profile and let AI generate your first resume</p>
              <Link href="/profile" className="btn-primary" style={{ display: 'inline-flex' }}>
                Complete your profile →
              </Link>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resumes.map((resume, idx) => (
              <div
                key={resume.id}
                className="card card-hover animate-fade-in"
                style={{ padding: '20px 24px', animationDelay: `${idx * 0.05}s` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span className={`badge ${resume.type === 'base' ? 'badge-indigo' : 'badge-green'}`}>
                        {resume.type === 'base' ? '◆ Base resume' : '◈ JD tailored'}
                      </span>
                      {resume.ats_score && (
                        <span className="badge badge-purple">
                          ATS {resume.ats_score}/100
                        </span>
                      )}
                      {resume.match_score && (
                        <span className="badge badge-orange">
                          Match {resume.match_score}%
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(resume.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <a
                    href={resume.s3_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ whiteSpace: 'nowrap', padding: '8px 16px', fontSize: '0.8rem' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="page-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-indigo" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}