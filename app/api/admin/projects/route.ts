import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const ALLOWED_SORT_FIELDS = new Set([
  'created_at',
  'updated_at',
  'name',
  'status',
  'requirement_score',
])

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
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortRaw = searchParams.get('sort') || 'created_at'
    const orderRaw = searchParams.get('order') || 'desc'
    const userId = searchParams.get('userId')
    const sort = ALLOWED_SORT_FIELDS.has(sortRaw) ? sortRaw : 'created_at'
    const order = orderRaw === 'asc' ? 'asc' : 'desc'

    let query = admin.from('projects').select('*')

    if (status) query = query.eq('status', status)
    if (userId) query = query.eq('user_id', userId)
    if (search) {
      const cleanedSearch = sanitizeSearch(search)
      if (cleanedSearch) {
        query = query.or(`name.ilike.%${cleanedSearch}%,client_name.ilike.%${cleanedSearch}%,client_industry.ilike.%${cleanedSearch}%`)
      }
    }

    query = query.order(sort, { ascending: order === 'asc' })

    const { data: projects, error } = await query
    if (error) throw error

    const projectIds = projects?.map(p => p.id) || []
    const ownerIds = (projects?.map(p => p.user_id) || []).filter((id, index, arr) => arr.indexOf(id) === index)

    const [{ data: owners }, { data: messageCounts }, { data: docCounts }] = await Promise.all([
      ownerIds.length > 0
        ? admin.from('profiles').select('id, full_name, company_name').in('id', ownerIds)
        : Promise.resolve({ data: [] }),
      projectIds.length > 0
        ? admin.from('messages').select('project_id')
            .in('project_id', projectIds)
        : Promise.resolve({ data: [] }),
      projectIds.length > 0
        ? admin.from('documents').select('project_id')
            .in('project_id', projectIds)
        : Promise.resolve({ data: [] }),
    ])

    const ownerMap = Object.fromEntries((owners || []).map(o => [o.id, o]))
    const msgCountMap: Record<string, number> = {}
    messageCounts?.forEach(m => { msgCountMap[m.project_id] = (msgCountMap[m.project_id] || 0) + 1 })
    const docCountMap: Record<string, number> = {}
    docCounts?.forEach(d => { docCountMap[d.project_id] = (docCountMap[d.project_id] || 0) + 1 })

    const enriched = projects?.map(p => ({
      ...p,
      owner: ownerMap[p.user_id] || null,
      messageCount: msgCountMap[p.id] || 0,
      documentCount: docCountMap[p.id] || 0,
    })) || []

    return NextResponse.json(enriched)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
