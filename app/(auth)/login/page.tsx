import { LoginForm } from '@/components/auth/LoginForm'

const LOG = '[clarispec/login][server]'

export default function LoginPage() {
  console.info(LOG, 'LoginPage render', {
    time: new Date().toISOString(),
  })
  return <LoginForm />
}
