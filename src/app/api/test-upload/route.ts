import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { getRepoConfig } from '@/lib/github'

// GET - Test GitHub upload functionality with direct API call
export async function GET() {
  const results: string[] = []

  try {
    // Step 1: Check repo config
    const { owner, repo } = await getRepoConfig()
    results.push(`1. Repo config: owner=${owner}, repo=${repo}`)

    if (!owner || !repo) {
      return NextResponse.json({ success: false, error: 'Owner/repo not configured', results })
    }

    // Step 2: Check token
    const token = process.env.GITHUB_TOKEN
    results.push(`2. Token exists: ${!!token}, length: ${token?.length || 0}`)

    if (!token) {
      return NextResponse.json({ success: false, error: 'No GitHub token', results })
    }

    // Step 3: Create Octokit and test auth
    const octokit = new Octokit({ auth: token })

    try {
      const user = await octokit.users.getAuthenticated()
      results.push(`3. Authenticated as: ${user.data.login}`)
    } catch (e) {
      results.push(`3. Auth FAILED: ${e}`)
      return NextResponse.json({ success: false, error: 'Auth failed', results })
    }

    // Step 4: Check repo access
    try {
      const repoData = await octokit.repos.get({ owner, repo })
      results.push(`4. Repo access OK: ${repoData.data.full_name}, permissions: ${JSON.stringify(repoData.data.permissions)}`)
    } catch (e) {
      results.push(`4. Repo access FAILED: ${e}`)
      return NextResponse.json({ success: false, error: 'Repo access failed', results })
    }

    // Step 5: Direct upload test
    const testFilename = `test-${Date.now()}.txt`
    const testContent = Buffer.from('Test ' + new Date().toISOString()).toString('base64')
    const path = `.github/images/${testFilename}`

    try {
      const response = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Test upload: ${testFilename}`,
        content: testContent,
        branch: 'main',
      })
      results.push(`5. Upload response status: ${response.status}`)
      results.push(`   SHA: ${response.data.content?.sha}`)
      results.push(`   URL: ${response.data.content?.download_url}`)
    } catch (e: unknown) {
      const err = e as Error & { status?: number; message?: string }
      results.push(`5. Upload FAILED: ${err.message}`)
      results.push(`   Status: ${err.status}`)
      return NextResponse.json({ success: false, error: 'Upload failed', results })
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    results.push(`Error: ${error}`)
    return NextResponse.json({ success: false, error: String(error), results })
  }
}
