import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.user_id || !body.profile) {
      return NextResponse.json(
        { error: 'Missing user_id or profile' },
        { status: 400 }
      )
    }

    const n8nUrl = `${process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL}/webhook/base-resume`

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: 'n8n workflow failed', details: data },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}