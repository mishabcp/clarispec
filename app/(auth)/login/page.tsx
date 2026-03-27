'use client'

import { useEffect } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  useEffect(() => {
    console.log('we are now in login page')
  }, [])

  return <LoginForm />
}
