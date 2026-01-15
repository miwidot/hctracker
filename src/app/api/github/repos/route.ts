import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { github, getRepoConfig } from '@/lib/github'

// GET - List repos and orgs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const org = searchParams.get('org')

    // Get current config
    const currentConfig = await getRepoConfig()

    // Get user info
    const user = await github.getAuthenticatedUser()

    // Get orgs
    const orgs = await github.listOrgs()

    // Get repos (either user's or org's)
    let repos
    if (org) {
      repos = await github.listOrgRepos(org)
    } else {
      repos = await github.listUserRepos()
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          login: user.login,
          avatar_url: user.avatar_url,
          type: user.type,
        },
        orgs: orgs.map((o) => ({
          login: o.login,
          avatar_url: o.avatar_url,
        })),
        repos,
        currentConfig,
      },
    })
  } catch (error) {
    console.error('Error fetching GitHub data:', error)
    return NextResponse.json({ error: 'Failed to fetch GitHub data' }, { status: 500 })
  }
}

// POST - Set active repo
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { owner, repo } = await req.json()

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Owner and repo are required' }, { status: 400 })
    }

    // Save to database
    await github.saveRepoConfig(owner, repo)

    return NextResponse.json({
      success: true,
      data: { owner, repo },
    })
  } catch (error) {
    console.error('Error saving repo config:', error)
    return NextResponse.json({ error: 'Failed to save repo config' }, { status: 500 })
  }
}
