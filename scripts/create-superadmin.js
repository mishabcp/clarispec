/**
 * Creates a superadmin record in the superadmins table.
 * 
 * Usage:
 *   node scripts/create-superadmin.js <email> <password> [name]
 * 
 * Example:
 *   node scripts/create-superadmin.js admin@example.com mysecurepassword "Admin User"
 * 
 * Prerequisites:
 *   1. Run the superadmins table migration in Supabase SQL Editor first:
 *
 *      CREATE TABLE superadmins (
 *        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
 *        email TEXT NOT NULL UNIQUE,
 *        password_hash TEXT NOT NULL,
 *        name TEXT,
 *        created_at TIMESTAMPTZ DEFAULT NOW()
 *      );
 *
 *   2. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local
 */

const crypto = require('crypto')
const readline = require('readline')
const PBKDF2_ITERATIONS = 210000
const PBKDF2_KEYLEN = 32
const PBKDF2_DIGEST = 'sha256'

function readHidden(promptText) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    })
    const stdin = process.stdin
    const onData = (char) => {
      const c = char.toString()
      if (c === '\n' || c === '\r' || c === '\u0004') return
      readline.cursorTo(process.stdout, 0)
      process.stdout.write(promptText + '*'.repeat(rl.line.length))
    }
    process.stdout.write(promptText)
    stdin.on('data', onData)
    rl.question('', (value) => {
      stdin.removeListener('data', onData)
      rl.close()
      process.stdout.write('\n')
      resolve(value)
    })
  })
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_ADMIN_SCRIPTS !== 'true') {
    console.error('Refusing to run in production. Set ALLOW_PROD_ADMIN_SCRIPTS=true if you intend to proceed.')
    process.exit(1)
  }

  const [,, email, passwordArg, name] = process.argv

  if (!email) {
    console.error('Usage: node scripts/create-superadmin.js <email> [password] [name]')
    process.exit(1)
  }
  const password = passwordArg || await readHidden('Password: ')
  if (!password) {
    console.error('Password is required')
    process.exit(1)
  }

  // Load env
  require('dotenv').config({ path: '.env.local' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex')
  const passwordHash = `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${derived}`

  const response = await fetch(`${supabaseUrl}/rest/v1/superadmins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      name: name || null,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Failed to create superadmin:', err)
    process.exit(1)
  }

  const [record] = await response.json()
  console.log('Superadmin created successfully!')
  console.log(`  ID:    ${record.id}`)
  console.log(`  Email: ${record.email}`)
  console.log(`  Name:  ${record.name || '(none)'}`)
  console.log('')
  console.log(`Login at: /admin/login`)
}

main()
