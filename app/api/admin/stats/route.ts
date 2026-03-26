import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
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
    ] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('projects').select('*', { count: 'exact', head: true }),
      admin.from('projects').select('status'),
      admin.from('messages').select('*', { count: 'exact', head: true }),
      admin.from('messages').select('*', { count: 'exact', head: true }).eq('role', 'assistant'),
      admin.from('messages').select('*', { count: 'exact', head: true }).eq('role', 'user'),
      admin.from('documents').select('*', { count: 'exact', head: true }),
      admin.from('projects').select('requirement_score'),
      admin.from('projects').select('id, name, client_name, status, requirement_score, created_at, user_id').order('created_at', { ascending: false }).limit(5),
      admin.from('projects').select('created_at'),
    ])

    const statusCounts = { gathering: 0, completed: 0, archived: 0 }
    projectsByStatus?.forEach((p) => {
      const s = p.status as keyof typeof statusCounts
      if (s in statusCounts) statusCounts[s]++
    })

    const avgScore = allProjects && allProjects.length > 0
      ? Math.round(allProjects.reduce((sum, p) => sum + (p.requirement_score || 0), 0) / allProjects.length)
      : 0

    // Projects per day (last 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dailyCounts: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
      dailyCounts[d.toISOString().split('T')[0]] = 0
    }
    dailyProjects?.forEach((p) => {
      const day = new Date(p.created_at).toISOString().split('T')[0]
      if (day in dailyCounts) dailyCounts[day]++
    })

    // Enrich recent projects with owner names
    const ownerIds = (recentProjects?.map(p => p.user_id) || []).filter((id, index, arr) => arr.indexOf(id) === index)
    const { data: owners } = ownerIds.length > 0
      ? await admin.from('profiles').select('id, full_name').in('id', ownerIds)
      : { data: [] }
    const ownerMap = Object.fromEntries((owners || []).map(o => [o.id, o.full_name]))

    const enrichedRecent = recentProjects?.map(p => ({
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
      dailyProjectCounts: dailyCounts,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
