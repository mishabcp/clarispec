import { NextResponse } from 'next/server'
import { validateAdminCredentials, setAdminSession } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const admin = await validateAdminCredentials(email, password)
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    setAdminSession(admin.id)

    return NextResponse.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name } })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
