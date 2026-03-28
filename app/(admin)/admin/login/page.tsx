'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      router.push('/admin/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-8 sm:p-12 overflow-hidden font-sans">
      <div className="w-full max-w-[440px] relative z-10 opacity-0 animate-auth-shell">
        <div className="mb-16 text-center">
          <h1 className="text-[42px] font-extralight text-white uppercase font-heading leading-none opacity-0 animate-auth-title">
            Clarispec
          </h1>
        </div>

        <div className="relative bg-[#0a0a0b]/90 border border-white/[0.08] shadow-[0_48px_100px_-32px_rgba(0,0,0,0.9)] backdrop-blur-[64px] rounded-[1px]">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent shadow-[0_1px_4px_rgba(255,255,255,0.05)]" />

          <div className="p-10 sm:p-14">
            <div className="space-y-10">
              <div className="space-y-2">
                <h2 className="text-2xl font-light text-white tracking-tight leading-none opacity-0 animate-auth-heading">
                  Admin <span className="text-white/40">access</span>
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {error && (
                  <div
                    role="alert"
                    className="border-l-[1.5px] border-red-500 bg-red-500/[0.05] px-4 py-3 text-[11px] text-red-400 tracking-wide font-medium rounded-sm mb-4 animate-fade-in"
                  >
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1 group relative">
                    <Label htmlFor="admin-email" className="text-[9px] font-bold text-white/40 uppercase tracking-widest transition-colors duration-300 group-focus-within:text-white/90">
                      Admin email
                    </Label>
                    <div className="relative">
                      <Input
                        id="admin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="off"
                        className="h-10 border-0 border-b border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] focus:bg-white/[0.04] ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-300 rounded-none text-white caret-white text-[15px] font-light pl-3 placeholder:text-white/10 shadow-none outline-none"
                      />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/40 transition-all duration-500 group-focus-within:w-full" />
                    </div>
                  </div>

                  <div className="space-y-1 group relative">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="admin-password" className="text-[9px] font-bold text-white/40 uppercase tracking-widest transition-colors duration-300 group-focus-within:text-white/90">
                        Password
                      </Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="h-10 border-0 border-b border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] focus:bg-white/[0.04] ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-300 rounded-none text-white caret-white text-[15px] font-light pl-3 placeholder:text-white/10 shadow-none outline-none"
                      />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/40 transition-all duration-500 group-focus-within:w-full" />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="group relative w-full h-11 bg-white text-black hover:bg-white/95 transition-all duration-300 font-bold text-[10px] uppercase tracking-widest rounded-none shadow-[0_4px_24px_rgba(255,255,255,0.08)] active:scale-[0.985] overflow-hidden"
                    disabled={loading}
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Access Admin
                    </span>
                  </Button>
                </div>
                
                <div className="pt-2 text-center">
                  <p className="text-[10px] tracking-normal text-white/40 uppercase">
                    Back to{' '}
                    <Link prefetch={false} href="/login" className="text-white/60 hover:text-white transition-all duration-300 ml-2 font-bold border-b border-white/10 hover:border-white/30 pb-0.5">
                      User Login
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
