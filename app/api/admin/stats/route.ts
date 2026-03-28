import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { perfStubRequest, runTimedApiRoute } from '@/lib/perf-log/timed-api'

export const dynamic = 'force-dynamic'

function buildLast30DayKeys(): Record<string, number> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const dailyCounts: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
    dailyCounts[d.toISOString().split('T')[0]] = 0
  }
  return dailyCounts
}

function fillDailyFromDates(
  template: Record<string, number>,
  rows: { created_at?: string | null }[] | null
): Record<string, number> {
  const out = { ...template }
  rows?.forEach((row) => {
    if (!row.created_at) return
    const day = new Date(row.created_at).toISOString().split('T')[0]
    if (day in out) out[day]++
  })
  return out
}

function fillDailyFromGenerated(
  template: Record<string, number>,
  rows: { generated_at?: string | null }[] | null
): Record<string, number> {
  const out = { ...template }
  rows?.forEach((row) => {
    if (!row.generated_at) return
    const day = new Date(row.generated_at).toISOString().split('T')[0]
    if (day in out) out[day]++
  })
  return out
}

function buildScoreBuckets(scores: { requirement_score: number | null }[] | null) {
  const out = [
    { range: '0–25', count: 0 },
    { range: '26–50', count: 0 },
    { range: '51–75', count: 0 },
    { range: '76–100', count: 0 },
  ]
  scores?.forEach((p) => {
    const s = p.requirement_score ?? 0
    if (s <= 25) out[0].count++
    else if (s <= 50) out[1].count++
    else if (s <= 75) out[2].count++
    else out[3].count++
  })
  return out
}

export async function GET() {
  const stub = perfStubRequest('/api/admin/stats', 'GET')
  return runTimedApiRoute('GET /api/admin/stats', 'GET', stub, async () => {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()

    const [
      { count: totalUsers },
      { count: totalProjects },
      { data: projectsByStatus },
      { count: totalMessages },
      { count: aiMessages },
      { count: userMessages },
      { count: totalDocuments },
      { data: allProjects },
      { data: recentProjects },
      { data: dailyProjects },
      { data: docMeta },
      { data: msgTimes },
    ] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('projects').select('*', { count: 'exact', head: true }),
      admin.from('projects').select('status'),
      admin.from('messages').select('*', { count: 'exact', head: true }),
      admin.from('messages').select('*', { count: 'exact', head: true }).eq('role', 'assistant'),
      admin.from('messages').select('*', { count: 'exact', head: true }).eq('role', 'user'),
      admin.from('documents').select('*', { count: 'exact', head: true }),
      admin.from('projects').select('requirement_score, depth_level'),
      admin
        .from('projects')
        .select('id, name, client_name, status, requirement_score, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5),
      admin.from('projects').select('created_at'),
      admin.from('documents').select('generated_at, doc_type'),
      admin.from('messages').select('created_at'),
    ])

    const statusCounts = { gathering: 0, completed: 0, archived: 0 }
    projectsByStatus?.forEach((p) => {
      const s = p.status as keyof typeof statusCounts
      if (s in statusCounts) statusCounts[s]++
    })

    const avgScore =
      allProjects && allProjects.length > 0
        ? Math.round(
            allProjects.reduce((sum, p) => sum + (p.requirement_score || 0), 0) / allProjects.length
          )
        : 0

    const depthLevelCounts = { quick: 0, standard: 0, deep: 0 }
    allProjects?.forEach((p) => {
      const d = p.depth_level as keyof typeof depthLevelCounts
      if (d in depthLevelCounts) depthLevelCounts[d]++
    })

    const scoreBuckets = buildScoreBuckets(allProjects)

    const dayTemplate = buildLast30DayKeys()
    const dailyProjectCounts = fillDailyFromDates(dayTemplate, dailyProjects)
    const dailyDocumentCounts = fillDailyFromGenerated({ ...dayTemplate }, docMeta)
    const dailyMessageCounts = fillDailyFromDates({ ...dayTemplate }, msgTimes)

    const typeAgg: Record<string, number> = {}
    docMeta?.forEach((r) => {
      const t = r.doc_type || 'unknown'
      typeAgg[t] = (typeAgg[t] || 0) + 1
    })
    const documentsByType = Object.entries(typeAgg)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    const ownerIds = (recentProjects?.map((p) => p.user_id) || []).filter(
      (id, index, arr) => arr.indexOf(id) === index
    )
    const { data: owners } =
      ownerIds.length > 0
        ? await admin.from('profiles').select('id, full_name').in('id', ownerIds)
        : { data: [] }
    const ownerMap = Object.fromEntries((owners || []).map((o) => [o.id, o.full_name]))

    const enrichedRecent =
      recentProjects?.map((p) => ({
        ...p,
        ownerName: ownerMap[p.user_id] || 'Unknown',
      })) || []

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalProjects: totalProjects || 0,
      statusCounts,
      totalMessages: totalMessages || 0,
      aiMessages: aiMessages || 0,
      userMessages: userMessages || 0,
      totalDocuments: totalDocuments || 0,
      avgScore,
      recentProjects: enrichedRecent,
      dailyProjectCounts,
      dailyDocumentCounts,
      dailyMessageCounts,
      documentsByType,
      depthLevelCounts,
      scoreBuckets,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
  })
}
