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

async function main() {
  const [,, email, password, name] = process.argv

  if (!email || !password) {
    console.error('Usage: node scripts/create-superadmin.js <email> <password> [name]')
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

  const passwordHash = crypto.createHash('sha256').update(password).digest('hex')

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
