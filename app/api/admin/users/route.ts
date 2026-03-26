import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

function sanitizeSearch(value: string): string {
  return value.replace(/[%*,()]/g, '').trim()
}

export async function GET(request: Request) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const cleanedSearch = search ? sanitizeSearch(search) : ''

    let query = admin.from('profiles').select('*').order('created_at', { ascending: false })
    if (cleanedSearch) {
      query = query.or(`full_name.ilike.%${cleanedSearch}%,company_name.ilike.%${cleanedSearch}%`)
    }

    const { data: profiles, error } = await query
    if (error) throw error

    // Get auth user data for emails and last sign-in
    let authUsers: Array<{ id: string; email?: string; last_sign_in_at?: string }> = []
    try {
      const { data: { users } } = await admin.auth.admin.listUsers()
      authUsers = users
    } catch { /* ignore */ }
    const authMap = Object.fromEntries(authUsers.map(u => [u.id, u]))

    // Get project counts per user
    const userIds = profiles?.map(p => p.id) || []
    const { data: projectRows } = userIds.length > 0
      ? await admin.from('projects').select('user_id').in('user_id', userIds)
      : { data: [] }
    const projectCountMap: Record<string, number> = {}
    projectRows?.forEach(p => { projectCountMap[p.user_id] = (projectCountMap[p.user_id] || 0) + 1 })

    // Filter by email if search term and no profile match
    const enriched = profiles?.map(p => {
      const authUser = authMap[p.id]
      return {
        ...p,
        email: authUser?.email || '',
        lastSignIn: authUser?.last_sign_in_at || null,
        projectCount: projectCountMap[p.id] || 0,
      }
    }) || []

    // If searching, also filter by email match
    const filtered = cleanedSearch
      ? enriched.filter(u =>
          u.full_name?.toLowerCase().includes(cleanedSearch.toLowerCase()) ||
          u.company_name?.toLowerCase().includes(cleanedSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(cleanedSearch.toLowerCase())
        )
      : enriched

    return NextResponse.json(filtered)
  } catch {
    console.error('Admin users error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
