import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAllDocuments } from '@/lib/documents/generator'
import { formatConversationHistory } from '@/lib/ai/conversation'
import type { DocumentType, Message } from '@/types'

export async function POST(request: Request) {
  try {
    const { projectId, selectedDocs } = await request.json() as {
      projectId: string
      selectedDocs: DocumentType[]
    }

    if (!projectId || !selectedDocs?.length) {
      return NextResponse.json(
        { error: 'projectId and selectedDocs are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const conversationHistory = formatConversationHistory((messages || []) as Message[], Infinity)

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
      console.warn('Document generation rate-limited:', message.substring(0, 200))
      return NextResponse.json(
        { error: 'AI is at capacity. Please try again in a minute.' },
        { status: 429 }
      )
    }
    console.error('Document generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
