export async function triggerBaseResume(userId: string, profile: object) {
  const res = await fetch('/api/webhook/resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, profile })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to trigger resume generation')
  }

  return res.json()
}

export async function triggerJDMatch(userId: string, jdText: string) {
  const res = await fetch('/api/webhook/jd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, jd_text: jdText })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to trigger JD analysis')
  }

  return res.json()
}