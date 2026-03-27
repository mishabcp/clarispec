import { LoginForm } from '@/components/auth/LoginForm'
import { writeAppLogServer } from '@/lib/app-log-write-server'

export default async function LoginPage() {
  await writeAppLogServer(
    'info',
    'login:LoginPage render',
    { ts: new Date().toISOString() },
    '/login'
  )
  return <LoginForm />
}
