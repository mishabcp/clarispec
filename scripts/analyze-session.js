/**
 * Connects to Supabase and fetches session data for a project.
 * Run from project root: node scripts/analyze-session.js
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
}

const PROJECT_ID = '12ca0380-a049-4c27-bc4f-10f34390f242'
const OUT_PATH = path.join(__dirname, '..', 'docs', 'session-analysis-results.json')

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_ADMIN_SCRIPTS !== 'true') {
    console.error('Refusing to run in production. Set ALLOW_PROD_ADMIN_SCRIPTS=true if you intend to proceed.')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(url, key)

  const results = {
    projectId: PROJECT_ID,
    fetchedAt: new Date().toISOString(),
    project: null,
    messages: [],
    requirementAreas: [],
    counts: { userMessages: 0, aiQuestions: 0, aiMessages: 0 },
    error: null,
  }

  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, client_name, client_industry, status, depth_level, requirement_score, created_at, updated_at')
      .eq('id', PROJECT_ID)
      .single()

    if (projectError) {
      results.error = `Project: ${projectError.message}`
      console.error('Project error:', projectError)
    } else {
      results.project = project
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, role, message_type, content, created_at')
      .eq('project_id', PROJECT_ID)
      .order('created_at', { ascending: true })

    if (messagesError) {
      results.error = (results.error || '') + ` Messages: ${messagesError.message}`
      console.error('Messages error:', messagesError)
    } else {
      results.messages = messages || []
    }

    const { data: areas, error: areasError } = await supabase
      .from('requirement_areas')
      .select('area_name, is_covered, coverage_score, notes, updated_at')
      .eq('project_id', PROJECT_ID)
      .order('area_name')

    if (areasError) {
      results.error = (results.error || '') + ` Areas: ${areasError.message}`
      console.error('Areas error:', areasError)
    } else {
      results.requirementAreas = areas || []
    }

    results.counts.userMessages = (results.messages || []).filter((m) => m.role === 'user').length
    results.counts.aiQuestions = (results.messages || []).filter(
      (m) => m.role === 'assistant' && m.message_type === 'question'
    ).length
    results.counts.aiMessages = (results.messages || []).filter((m) => m.role === 'assistant').length
  } catch (err) {
    results.error = (results.error || '') + ` ${err.message}`
    console.error(err)
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2), 'utf8')
  console.log('Wrote', OUT_PATH)
  console.log('Counts:', results.counts)
  if (results.project) {
    console.log('Project:', results.project.name, '| score:', results.project.requirement_score, '| depth:', results.project.depth_level)
  }
}

main()
