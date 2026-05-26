'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { triggerBaseResume } from '@/lib/n8n'

const STEPS = ['Personal', 'Education', 'Experience', 'Skills', 'Projects']

const emptyEdu = () => ({ institution: '', degree: '', field: '', start_year: '', end_year: '', grade: '' })
const emptyExp = () => ({ company: '', role: '', start_date: '', end_date: '', current: false, description: '' })
const emptyProj = () => ({ name: '', description: '', tech_stack: '', github_url: '', live_url: '' })

export default function ProfilePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [profile, setProfile] = useState({
    full_name: '', email: '', phone: '', location: '', linkedin: '', github: '',
    education: [emptyEdu()],
    experience: [emptyExp()],
    skills: [] as string[],
    projects: [emptyProj()]
  })

  const update = (key: string, value: any) =>
    setProfile(prev => ({ ...prev, [key]: value }))

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

      if (authError || !user) {
        router.push('/login')
        return
      }

      // Save profile to Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
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
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        throw new Error('Failed to save profile: ' + profileError.message)
      }

      // Trigger n8n workflow — non-blocking, don't await
      triggerBaseResume(user.id, profile).catch(console.error)

      // Redirect to dashboard immediately
      router.push('/dashboard?generating=true')

    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4">

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-xs font-medium ${
                i === step ? 'text-blue-600' : i < step ? 'text-green-600' : 'text-gray-400'
              }`}>{s}</span>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">

          {/* Step 0 — Personal */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Personal details</h2>
              {[
                ['full_name', 'Full name', 'text'],
                ['email', 'Email', 'email'],
                ['phone', 'Phone', 'text'],
                ['location', 'Location (City, Country)', 'text'],
                ['linkedin', 'LinkedIn URL (optional)', 'text'],
                ['github', 'GitHub URL (optional)', 'text'],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={(profile as any)[key]}
                    onChange={e => update(key, e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 1 — Education */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Education</h2>
              {profile.education.map((edu, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-600">Education #{i + 1}</p>
                  {[
                    ['institution', 'Institution / University'],
                    ['degree', 'Degree (e.g. B.Tech, B.E.)'],
                    ['field', 'Field of study'],
                    ['start_year', 'Start year'],
                    ['end_year', 'End year'],
                    ['grade', 'Grade / CGPA (optional)'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <input
                        value={(edu as any)[key]}
                        onChange={e => updateArray('education', i, key, e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              ))}
              <button
                onClick={() => update('education', [...profile.education, emptyEdu()])}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add another education
              </button>
            </div>
          )}

          {/* Step 2 — Experience */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Work experience</h2>
              {profile.experience.map((exp, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-600">Experience #{i + 1}</p>
                  {[
                    ['company', 'Company name'],
                    ['role', 'Job title / Role'],
                    ['start_date', 'Start date (e.g. 2022-06)'],
                    ['end_date', 'End date (or leave blank if current)'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <input
                        value={(exp as any)[key]}
                        onChange={e => updateArray('experience', i, key, e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      What did you do? Be detailed — AI will refine and quantify this
                    </label>
                    <textarea
                      rows={4}
                      value={exp.description}
                      onChange={e => updateArray('experience', i, 'description', e.target.value)}
                      placeholder="e.g. Managed Kubernetes clusters, built CI/CD pipelines, automated infrastructure with Terraform..."
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => update('experience', [...profile.experience, emptyExp()])}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add another experience
              </button>
            </div>
          )}

          {/* Step 3 — Skills */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Skills</h2>
              <p className="text-sm text-gray-500">
                Add skills separated by commas — e.g. Docker, Kubernetes, AWS, Terraform, CI/CD
              </p>
              <textarea
                rows={4}
                value={profile.skills.join(', ')}
                onChange={e => update('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Docker, Kubernetes, AWS, Terraform, Jenkins, GitHub Actions, Linux, Python..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map(skill => (
                    <span key={skill} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Projects */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Projects</h2>
              {profile.projects.map((proj, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-600">Project #{i + 1}</p>
                  {[
                    ['name', 'Project name'],
                    ['tech_stack', 'Tech stack used'],
                    ['github_url', 'GitHub URL (optional)'],
                    ['live_url', 'Live URL (optional)'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <input
                        value={(proj as any)[key]}
                        onChange={e => updateArray('projects', i, key, e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      What does it do? What problem does it solve?
                    </label>
                    <textarea
                      rows={3}
                      value={proj.description}
                      onChange={e => updateArray('projects', i, 'description', e.target.value)}
                      placeholder="e.g. Built a Kubernetes-based deployment pipeline that reduced deployment time by 60%..."
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => update('projects', [...profile.projects, emptyProj()])}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add another project
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm mt-4">{error}</p>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Generate my resume →'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}