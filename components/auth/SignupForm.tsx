'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        router.refresh()
        router.replace('/dashboard')
      }
    })
  }, [supabase, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        company_name: companyName,
      }, { onConflict: 'id' })
    }

    router.refresh()
    router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-light text-white tracking-tight leading-none opacity-0 animate-auth-heading">
          Create account
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div
            role="alert"
            className="border-l-[1.5px] border-red-500 bg-red-500/[0.05] px-4 py-3 text-[11px] text-red-400 tracking-wide font-medium rounded-sm mb-4 animate-fade-in"
          >
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <div className="space-y-1 group relative">
              <Label htmlFor="fullName" className="text-[9px] font-bold text-white/40 uppercase tracking-widest transition-colors duration-300 group-focus-within:text-white/90">
                Full name
              </Label>
              <div className="relative">
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="off"
                  className="h-10 border-0 border-b border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] focus:bg-white/[0.04] ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 rounded-none text-white text-[15px] font-light pl-3 placeholder:text-white/10 shadow-none outline-none"
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/40 transition-all duration-500 group-focus-within:w-full" />
              </div>
            </div>

            <div className="space-y-1 group relative">
              <Label htmlFor="companyName" className="text-[9px] font-bold text-white/40 uppercase tracking-widest transition-colors duration-300 group-focus-within:text-white/90">
                Company
              </Label>
              <div className="relative">
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  autoComplete="off"
                  className="h-10 border-0 border-b border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] focus:bg-white/[0.04] ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 rounded-none text-white text-[15px] font-light pl-3 placeholder:text-white/10 shadow-none outline-none"
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/40 transition-all duration-500 group-focus-within:w-full" />
              </div>
            </div>
          </div>

          <div className="space-y-1 group relative">
            <Label htmlFor="email" className="text-[9px] font-bold text-white/40 uppercase tracking-widest transition-colors duration-300 group-focus-within:text-white/90">
              Email address
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                className="h-10 border-0 border-b border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] focus:bg-white/[0.04] ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 rounded-none text-white text-[15px] font-light pl-3 placeholder:text-white/10 shadow-none outline-none"
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/40 transition-all duration-500 group-focus-within:w-full" />
            </div>
          </div>

          <div className="space-y-1 group relative">
            <Label htmlFor="password" className="text-[9px] font-bold text-white/40 uppercase tracking-widest transition-colors duration-300 group-focus-within:text-white/90">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="h-10 border-0 border-b border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] focus:bg-white/[0.04] ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 rounded-none text-white text-[15px] font-light pl-3 placeholder:text-white/10 shadow-none outline-none"
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/40 transition-all duration-500 group-focus-within:w-full" />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            className="group relative w-full h-11 bg-white text-black hover:bg-white/95 transition-all duration-300 font-bold text-[10px] uppercase tracking-widest rounded-none shadow-[0_4px_24px_rgba(255,255,255,0.08)] active:scale-[0.985] overflow-hidden"
            disabled={loading}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </span>
          </Button>
        </div>

        <div className="pt-2 text-center">
          <p className="text-[10px] tracking-normal text-white/40 uppercase">
            Registered?{' '}
            <Link prefetch={false} href="/login" className="text-white/60 hover:text-white transition-all duration-300 ml-2 font-bold border-b border-white/10 hover:border-white/30 pb-0.5">
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}




