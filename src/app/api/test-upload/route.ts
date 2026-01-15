import { NextResponse } from 'next/server'
import { github, getRepoConfig } from '@/lib/github'

// GET - Test GitHub upload functionality
export async function GET() {
  const results: string[] = []

  try {
    // Step 1: Check repo config
    const { owner, repo } = await getRepoConfig()
    results.push(`1. Repo config: owner=${owner}, repo=${repo}`)

    if (!owner || !repo) {
      return NextResponse.json({
        success: false,
        error: 'Owner/repo not configured',
        results
      })
    }

    // Step 2: Test GitHub connection
    try {
      const repoInfo = await github.getRepoInfo()
      results.push(`2. GitHub connection OK: ${repoInfo.full_name}, branch: ${repoInfo.default_branch}`)
    } catch (e) {
      results.push(`2. GitHub connection FAILED: ${e}`)
      return NextResponse.json({ success: false, error: 'GitHub connection failed', results })
    }

    // Step 3: Test file upload with a small test file
    const testFilename = `test-${Date.now()}.txt`
    const testContent = Buffer.from('Test upload ' + new Date().toISOString()).toString('base64')

    try {
      const url = await github.uploadImage(testFilename, testContent)
      results.push(`3. Upload OK: ${url}`)
    } catch (e) {
      results.push(`3. Upload FAILED: ${e}`)
      return NextResponse.json({ success: false, error: 'Upload failed', results })
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    results.push(`Error: ${error}`)
    return NextResponse.json({ success: false, error: String(error), results })
  }
}
