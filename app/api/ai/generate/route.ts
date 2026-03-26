import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAllDocuments } from '@/lib/documents/generator'
import { formatConversationHistory } from '@/lib/ai/conversation'
import type { DocumentType, Message } from '@/types'
import { checkRateLimit, getClientIp, isSameOrigin } from '@/lib/security'
import { asDocumentType, asObject, asString } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
    const raw = await request.json()
    const body = asObject(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const projectId = asString(body.projectId, 80, true)
    const selectedDocsRaw = Array.isArray(body.selectedDocs) ? body.selectedDocs : []
    const selectedDocs = selectedDocsRaw
      .map((d) => asDocumentType(d))
      .filter((d): d is DocumentType => Boolean(d))

    if (!projectId || selectedDocs.length === 0) {
      return NextResponse.json(
        { error: 'projectId and selectedDocs are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const ip = getClientIp(request)
    if (!(await checkRateLimit(`ai-generate:${user.id}:${ip}`, 10, 60 * 1000))) {
      return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 })
    }

    // Get project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    const conversationHistory = formatConversationHistory((messages || []) as Message[], 20000)

    const projectInfo = {
      name: project.name,
      clientName: project.client_name || 'Not specified',
      industry: project.client_industry || 'Not specified',
      initialBrief: project.initial_brief || '',
    }

    const results = await generateAllDocuments(selectedDocs, projectInfo, conversationHistory)

    // Save documents to database
    for (const doc of results) {
      await supabase.from('documents').insert({
        project_id: projectId,
        doc_type: doc.docType,
        title: doc.title,
        content: doc.content,
        version: 1,
      })
    }

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({ success: true, count: results.length })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const isRateLimit =
      (error instanceof Error && /429|quota|rate limit/i.test(message)) ||
      (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 429)
    if (isRateLimit) {
      console.warn('Document generation rate-limited')
      return NextResponse.json(
        { error: 'AI is at capacity. Please try again in a minute.' },
        { status: 429 }
      )
    }
    console.error('Document generation error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
