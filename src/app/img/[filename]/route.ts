import { NextRequest, NextResponse } from 'next/server'
import { getRepoConfig } from '@/lib/github'

// GET - Redirect to GitHub raw image
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const { owner, repo } = await getRepoConfig()

  // Redirect to GitHub raw URL
  const githubUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/.github/images/${filename}`

  return NextResponse.redirect(githubUrl)
}
