'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false)
      return
    }

    async function checkAccess() {
      try {
        const res = await fetch('/api/admin/auth/session')
        if (!res.ok) {
          router.replace('/admin/login')
          return
        }
        setAuthorized(true)
      } catch {
        router.replace('/admin/login')
      } finally {
        setLoading(false)
      }
    }
    checkAccess()
  }, [isLoginPage, router])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading || !authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0 md:pl-[300px] relative z-10 overflow-y-auto">
        <div className="p-6 lg:p-8 pt-20 md:pt-8 w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
