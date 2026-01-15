import { NextResponse } from 'next/server'
import { github } from '@/lib/github'

export async function GET() {
  try {
    const connected = await github.validateConnection()
    return NextResponse.json({ connected })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
