/**
 * Updates password_hash for an existing superadmin row (same algorithm as app + create-superadmin).
 *
 * Usage:
 *   node scripts/reset-superadmin-password.js <email> [password]
 *
 * Example:
 *   node scripts/reset-superadmin-password.js admin@example.com mynewpassword
 *
 * If password is omitted, it is read from the terminal (hidden).
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
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
    process.stderr.write(
      'Refusing to run in production. Set ALLOW_PROD_ADMIN_SCRIPTS=true if you intend to proceed.\n'
    )
    process.exit(1)
  }

  const [,, email, passwordArg] = process.argv

  if (!email) {
    process.stderr.write('Usage: node scripts/reset-superadmin-password.js <email> [password]\n')
    process.exit(1)
  }

  const password = passwordArg || (await readHidden('New password: '))
  if (!password) {
    process.stderr.write('Password is required\n')
    process.exit(1)
  }

  require('dotenv').config({ path: '.env.local' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    process.stderr.write(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n'
    )
    process.exit(1)
  }

  const emailNorm = email.toLowerCase().trim()
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex')
  const passwordHash = `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${derived}`

  const filter = `email=eq.${encodeURIComponent(emailNorm)}`
  const response = await fetch(`${supabaseUrl}/rest/v1/superadmins?${filter}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ password_hash: passwordHash }),
  })

  if (!response.ok) {
    const err = await response.text()
    process.stderr.write(`Failed to update password: ${err}\n`)
    process.exit(1)
  }

  const rows = await response.json()
  if (!Array.isArray(rows) || rows.length === 0) {
    process.stderr.write(`No superadmin found with email: ${emailNorm}\n`)
    process.stderr.write('Create one with: node scripts/create-superadmin.js <email> <password>\n')
    process.exit(1)
  }

  process.stdout.write('Password updated successfully.\n')
  process.stdout.write(`  Email: ${rows[0].email}\n`)
  process.stdout.write('\n')
  process.stdout.write('Log in at: /admin/login\n')
}

main()
