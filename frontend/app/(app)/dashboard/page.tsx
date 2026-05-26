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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Resumes</h1>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          </div>
          <Link href="/profile"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Update profile
          </Link>
        </div>

        {generating && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
            <div>
              <p className="text-sm font-medium text-blue-800">Generating your resume...</p>
              <p className="text-xs text-blue-600 mt-0.5">AI is optimizing for ATS. Takes 30–60 seconds. Page updates automatically.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Tailor for a job</h2>
              <p className="text-sm text-gray-500 mt-1">Paste a job description and get a resume tailored to that role</p>
            </div>
            <Link href="/jd-match"
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 whitespace-nowrap ml-4">
              Paste JD →
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Generated resumes</h2>

          {resumes.length === 0 && !generating && (
            <div className="bg-white rounded-xl border p-10 text-center">
              <p className="text-gray-400 text-sm">No resumes yet.</p>
              <Link href="/profile" className="inline-block mt-3 text-sm text-blue-600 hover:underline">
                Fill your profile to generate your first resume →
              </Link>
            </div>
          )}

          {resumes.map(resume => (
            <div key={resume.id} className="bg-white rounded-xl border shadow-sm p-5">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      resume.type === 'base'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {resume.type === 'base' ? 'Base resume' : 'JD tailored'}
                    </span>
                    {resume.ats_score && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        ATS {resume.ats_score}/100
                      </span>
                    )}
                    {resume.match_score && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                        Match {resume.match_score}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
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
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline ml-4 whitespace-nowrap"
                >
                  Download PDF →
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}