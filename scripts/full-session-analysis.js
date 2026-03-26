/**
 * Full session analysis: fetches project, all messages (with metadata),
 * requirement areas, documents, and document selections.
 * Run: node scripts/full-session-analysis.js
 */

const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  })
}

const PROJECT_ID = '12ca0380-a049-4c27-bc4f-10f34390f242'
const OUT_PATH = path.join(__dirname, '..', 'docs', 'full-session-dump.json')

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing env vars')
    process.exit(1)
  }

  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(url, key)

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', PROJECT_ID)
    .single()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', PROJECT_ID)
    .order('created_at', { ascending: true })

  const { data: areas } = await supabase
    .from('requirement_areas')
    .select('*')
    .eq('project_id', PROJECT_ID)
    .order('area_name')

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', PROJECT_ID)
    .order('generated_at', { ascending: true })

  const { data: selections } = await supabase
    .from('document_selections')
    .select('*')
    .eq('project_id', PROJECT_ID)

  const result = { project, messages, areas, documents, selections }
  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), 'utf8')
  console.log('Wrote', OUT_PATH)
  console.log('Messages:', (messages || []).length)
  console.log('Documents:', (documents || []).length)
  console.log('Score:', project?.requirement_score)
}

main()
