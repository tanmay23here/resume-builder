'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { triggerBaseResume } from '@/lib/n8n'

const STEPS = ['Personal', 'Education', 'Experience', 'Skills', 'Projects', 'Achievements', 'Certifications']
const STEP_ICONS = ['👤', '🎓', '💼', '⚡', '🚀', '🏆', '📜']

const emptyEdu = () => ({ institution: '', degree: '', field: '', start_year: '', end_year: '', grade: '' })
const emptyExp = () => ({ company: '', role: '', start_date: '', end_date: '', current: false, description: '' })
const emptyProj = () => ({ name: '', description: '', tech_stack: '', github_url: '', live_url: '' })
const emptyAchievement = () => ({ title: '', description: '', year: '' })
const emptyCertification = () => ({ name: '', issuer: '', year: '', credential_url: '' })

export default function ProfilePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  const [profile, setProfile] = useState({
    full_name: '', email: '', phone: '', location: '', linkedin: '', github: '',
    education: [emptyEdu()],
    experience: [emptyExp()],
    skills: [] as string[],
    projects: [emptyProj()],
    achievements: [emptyAchievement()],
    certifications: [emptyCertification()]
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
        if (data && !error) {
          setProfile({
            full_name: data.full_name || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            linkedin: data.linkedin || '',
            github: data.github || '',
            education: data.education?.length > 0 ? data.education : [emptyEdu()],
            experience: data.experience?.length > 0 ? data.experience : [emptyExp()],
            skills: data.skills || [],
            projects: data.projects?.length > 0 ? data.projects : [emptyProj()],
            achievements: data.achievements?.length > 0 ? data.achievements : [emptyAchievement()],
            certifications: data.certifications?.length > 0 ? data.certifications : [emptyCertification()]
          })
        }
      } catch(e) {
        // No profile yet
      } finally {
        setFetching(false)
      }
    }
    loadProfile()
  }, [])

  const update = (key: string, value: any) => setProfile(prev => ({ ...prev, [key]: value }))

  const updateArray = (key: string, index: number, field: string, value: any) => {
    const arr = [...(profile as any)[key]]
    arr[index] = { ...arr[index], [field]: value }
    update(key, arr)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) { router.push('/login'); return }
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        linkedin: profile.linkedin,
        github: profile.github,
        education: profile.education,
        experience: profile.experience,
        skills: profile.skills,
        projects: profile.projects,
        achievements: profile.achievements,
        certifications: profile.certifications,
        updated_at: new Date().toISOString()
      })
      if (profileError) throw new Error('Failed to save profile: ' + profileError.message)
      triggerBaseResume(user.id, profile).catch(console.error)
      router.push('/dashboard?generating=true')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="page-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner-indigo" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>

      {/* Navbar */}
      <nav className="navbar">
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>R</div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>ResumeAI</span>
          </div>
          <button onClick={() => router.push('/dashboard')} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            ← Dashboard
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 24px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }} className="animate-fade-in">
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            {profile.full_name ? 'Update your profile' : 'Complete your profile'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            The more detail you provide, the better your AI-generated resume will be
          </p>
        </div>

        {/* Step progress */}
        <div className="animate-fade-in" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                <button
                  onClick={() => setStep(i)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <div className={`step-dot ${i < step ? 'step-dot-done' : i === step ? 'step-dot-active' : 'step-dot-inactive'}`}>
                    {i < step ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <span style={{ fontSize: '0.65rem' }}>{i + 1}</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: i === step ? 'var(--accent-light)' : i < step ? 'var(--green)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {s}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="step-track" style={{ margin: '0 4px', marginBottom: 20 }}>
                    <div className="step-track-fill" style={{ width: i < step ? '100%' : '0%' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div className="card animate-fade-in" style={{ padding: '32px' }}>

          {/* Step header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 24 }}>{STEP_ICONS[step]}</span>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {step === 0 && 'Personal details'}
                {step === 1 && 'Education'}
                {step === 2 && 'Work experience'}
                {step === 3 && 'Skills'}
                {step === 4 && 'Projects'}
                {step === 5 && 'Achievements'}
                {step === 6 && 'Certifications'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>

          {/* ── Step 0 Personal ── */}
          {step === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {([
                ['full_name', 'Full name', 'text', 'Jane Doe'],
                ['email', 'Email address', 'email', 'jane@example.com'],
                ['phone', 'Phone number', 'text', '+1 234 567 8900'],
                ['location', 'Location', 'text', 'San Francisco, CA'],
                ['linkedin', 'LinkedIn URL (optional)', 'text', 'linkedin.com/in/...'],
                ['github', 'GitHub URL (optional)', 'text', 'github.com/...'],
              ] as [string, string, string, string][]).map(([key, label, type, placeholder]) => (
                <div key={key}>
                  <label className="form-label" htmlFor={`p-${key}`}>{label}</label>
                  <input
                    id={`p-${key}`}
                    type={type}
                    value={(profile as any)[key]}
                    onChange={e => update(key, e.target.value)}
                    placeholder={placeholder}
                    className="input-base"
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Step 1 Education ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {profile.education.map((edu, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', background: 'var(--bg-input)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span className="badge badge-indigo">Education #{i + 1}</span>
                    {profile.education.length > 1 && (
                      <button
                        onClick={() => update('education', profile.education.filter((_, idx) => idx !== i))}
                        title="Remove"
                        style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', fontSize: '0.7rem', fontWeight: 600, transition: 'background 0.15s' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {([
                      ['institution', 'Institution / University', 'MIT, Stanford...'],
                      ['degree', 'Degree', 'B.Tech, B.E., M.S....'],
                      ['field', 'Field of study', 'Computer Science'],
                      ['start_year', 'Start year', '2019'],
                      ['end_year', 'End year', '2023'],
                      ['grade', 'Grade / CGPA (optional)', '3.8 / 4.0'],
                    ] as [string, string, string][]).map(([key, label, placeholder]) => (
                      <div key={key}>
                        <label className="form-label">{label}</label>
                        <input
                          value={(edu as any)[key] || ''}
                          onChange={e => updateArray('education', i, key, e.target.value)}
                          placeholder={placeholder}
                          className="input-base"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => update('education', [...profile.education, emptyEdu()])} className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
                + Add education
              </button>
            </div>
          )}

          {/* ── Step 2 Experience ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {profile.experience.map((exp, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', background: 'var(--bg-input)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span className="badge badge-green">Experience #{i + 1}</span>
                    {profile.experience.length > 1 && (
                      <button
                        onClick={() => update('experience', profile.experience.filter((_, idx) => idx !== i))}
                        title="Remove"
                        style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', fontSize: '0.7rem', fontWeight: 600, transition: 'background 0.15s' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                    {([
                      ['company', 'Company name', 'Acme Corp'],
                      ['role', 'Job title / Role', 'Software Engineer'],
                      ['start_date', 'Start date', '2022-06'],
                      ['end_date', 'End date (blank if current)', '2024-01'],
                    ] as [string, string, string][]).map(([key, label, placeholder]) => (
                      <div key={key}>
                        <label className="form-label">{label}</label>
                        <input
                          value={(exp as any)[key] || ''}
                          onChange={e => updateArray('experience', i, key, e.target.value)}
                          placeholder={placeholder}
                          className="input-base"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="form-label">What did you do? Be detailed — AI will refine this</label>
                    <textarea
                      rows={4}
                      value={exp.description || ''}
                      onChange={e => updateArray('experience', i, 'description', e.target.value)}
                      placeholder="Describe your responsibilities, achievements, and impact. More detail = better AI output."
                      className="input-base"
                      style={{ resize: 'vertical', lineHeight: 1.7 }}
                    />
                  </div>
                </div>
              ))}
              <button onClick={() => update('experience', [...profile.experience, emptyExp()])} className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
                + Add experience
              </button>
            </div>
          )}

          {/* ── Step 3 Skills ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label" htmlFor="skills-input">Skills (comma-separated)</label>
                <textarea
                  id="skills-input"
                  rows={4}
                  value={profile.skills.join(', ')}
                  onChange={e => update('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="React, TypeScript, Node.js, Python, AWS, Docker..."
                  className="input-base"
                  style={{ resize: 'vertical', lineHeight: 1.7 }}
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Add languages, frameworks, tools, and soft skills
                </p>
              </div>
              {profile.skills.length > 0 && (
                <div>
                  <p className="form-label" style={{ marginBottom: 10 }}>Preview</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {profile.skills.map(skill => (
                      <span key={skill} className="skill-chip">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4 Projects ── */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {profile.projects.map((proj, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', background: 'var(--bg-input)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span className="badge badge-purple">Project #{i + 1}</span>
                    {profile.projects.length > 1 && (
                      <button
                        onClick={() => update('projects', profile.projects.filter((_, idx) => idx !== i))}
                        title="Remove"
                        style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', fontSize: '0.7rem', fontWeight: 600, transition: 'background 0.15s' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                    {([
                      ['name', 'Project name', 'My Awesome App'],
                      ['tech_stack', 'Tech stack used', 'React, Node.js, MongoDB'],
                      ['github_url', 'GitHub URL (optional)', 'github.com/user/repo'],
                      ['live_url', 'Live URL (optional)', 'myapp.com'],
                    ] as [string, string, string][]).map(([key, label, placeholder]) => (
                      <div key={key}>
                        <label className="form-label">{label}</label>
                        <input
                          value={(proj as any)[key] || ''}
                          onChange={e => updateArray('projects', i, key, e.target.value)}
                          placeholder={placeholder}
                          className="input-base"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="form-label">What does it do? What problem does it solve?</label>
                    <textarea
                      rows={3}
                      value={proj.description || ''}
                      onChange={e => updateArray('projects', i, 'description', e.target.value)}
                      placeholder="Describe the project, your contributions, and the impact or outcome."
                      className="input-base"
                      style={{ resize: 'vertical', lineHeight: 1.7 }}
                    />
                  </div>
                </div>
              ))}
              <button onClick={() => update('projects', [...profile.projects, emptyProj()])} className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
                + Add project
              </button>
            </div>
          )}

          {/* ── Step 5 Achievements ── */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {profile.achievements.map((ach, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', background: 'var(--bg-input)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span className="badge badge-indigo">Achievement #{i + 1}</span>
                    {profile.achievements.length > 1 && (
                      <button
                        onClick={() => update('achievements', profile.achievements.filter((_, idx) => idx !== i))}
                        title="Remove"
                        style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', fontSize: '0.7rem', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                    {([
                      ['title', 'Achievement title', 'Hackathon winner, Top performer...'],
                      ['year', 'Year', '2023'],
                    ] as [string, string, string][]).map(([key, label, placeholder]) => (
                      <div key={key}>
                        <label className="form-label">{label}</label>
                        <input
                          value={(ach as any)[key] || ''}
                          onChange={e => updateArray('achievements', i, key, e.target.value)}
                          placeholder={placeholder}
                          className="input-base"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="form-label">Description (optional)</label>
                    <textarea
                      rows={2}
                      value={ach.description || ''}
                      onChange={e => updateArray('achievements', i, 'description', e.target.value)}
                      placeholder="Briefly describe the achievement and its impact."
                      className="input-base"
                      style={{ resize: 'vertical', lineHeight: 1.7 }}
                    />
                  </div>
                </div>
              ))}
              <button onClick={() => update('achievements', [...profile.achievements, emptyAchievement()])} className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
                + Add achievement
              </button>
            </div>
          )}

          {/* ── Step 6 Certifications ── */}
          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {profile.certifications.map((cert, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', background: 'var(--bg-input)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span className="badge badge-green">Certification #{i + 1}</span>
                    {profile.certifications.length > 1 && (
                      <button
                        onClick={() => update('certifications', profile.certifications.filter((_, idx) => idx !== i))}
                        title="Remove"
                        style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', fontSize: '0.7rem', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {([
                      ['name', 'Certification name', 'AWS Certified Solutions Architect'],
                      ['issuer', 'Issuing organization', 'Amazon Web Services'],
                      ['year', 'Year', '2023'],
                      ['credential_url', 'Credential URL (optional)', 'credly.com/badges/...'],
                    ] as [string, string, string][]).map(([key, label, placeholder]) => (
                      <div key={key}>
                        <label className="form-label">{label}</label>
                        <input
                          value={(cert as any)[key] || ''}
                          onChange={e => updateArray('certifications', i, key, e.target.value)}
                          placeholder={placeholder}
                          className="input-base"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => update('certifications', [...profile.certifications, emptyCertification()])} className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
                + Add certification
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-box" style={{ marginTop: 20 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="btn-secondary"
            >
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary">
                Next: {STEPS[step + 1]} →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-green" style={{ padding: '10px 24px' }}>
                {loading ? <><span className="spinner" /> Saving...</> : '🚀 Generate my resume →'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}