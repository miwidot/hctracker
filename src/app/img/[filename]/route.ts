import { NextRequest, NextResponse } from 'next/server'
import { getRepoConfig } from '@/lib/github'

// Helper to fetch with retry
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 500): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options)
    if (response.ok) return response
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return fetch(url, options) // Final attempt
}

// GET - Proxy image from GitHub (works for private repos)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const { owner, repo } = await getRepoConfig()
  const token = process.env.GITHUB_TOKEN

  // Fetch from GitHub API with authentication (with retry for newly uploaded files)
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/.github/images/${filename}`

  const response = await fetchWithRetry(apiUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.raw',
    },
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  // Get the image data
  const imageData = await response.arrayBuffer()

  // Determine content type from filename
  const ext = filename.split('.').pop()?.toLowerCase()
  const contentTypes: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
  }
  const contentType = contentTypes[ext || ''] || 'application/octet-stream'

  return new NextResponse(imageData, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    },
  })
}
