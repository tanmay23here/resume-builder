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

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4">

        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to dashboard
          </Link>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Tailor resume for a job</h1>
          <p className="text-sm text-gray-500 mb-6">
            Paste the full job description below. AI will analyse it and create a tailored resume that matches the role.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job description
            </label>
            <textarea
              rows={12}
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste the full job description here — including requirements, responsibilities, and preferred skills..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{jdText.length} characters</p>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || jdText.length < 50}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting analysis...' : 'Generate tailored resume →'}
          </button>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Takes 30–60 seconds. You will be redirected to dashboard automatically.
          </p>
        </div>

      </div>
    </div>
  )
}