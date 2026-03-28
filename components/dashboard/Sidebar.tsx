'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  LogOut,
  Sparkles,
  Files,
  BookOpen,
  Menu,
  X
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Recent Documents', href: '/documents', icon: Files },
  { name: 'User Guide', href: '/guide', icon: BookOpen },
  { name: 'Preferences', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [userName, setUserName] = useState('')
  const [userInitials, setUserInitials] = useState('U')
  const [userRole, setUserRole] = useState('Analyst')
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

      if (profile?.full_name) {
        setUserName(profile.full_name)
        const parts = profile.full_name.split(' ')
        setUserInitials(parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase())
      } else {
        setUserName(user.email || 'User')
        setUserInitials(user.email?.substring(0, 2).toUpperCase() || 'U')
      }
      if (profile?.role) setUserRole(profile.role)
    }
    loadUser()
  }, [supabase])

  // Close sidebar on path change (mobile)
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-white/[0.08] bg-[#0a0a0b]/80 backdrop-blur-[64px] z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-white" />
          <span className="text-sm font-light font-heading text-white tracking-widest uppercase mt-0.5">Clarispec</span>
        </div>
        <button onClick={() => setIsMobileOpen(true)} className="text-white/60 hover:text-white transition-colors">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Dark Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Actual Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen w-[300px] flex-col border-r border-white/[0.08] bg-[#0a0a0b]/80 md:bg-[#0a0a0b]/40 backdrop-blur-[64px] z-[60] shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:translate-x-0 flex",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Header */}
        <div className="flex h-[88px] flex-shrink-0 items-center justify-between px-8 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-none bg-white/[0.05] border border-white/[0.1] shadow-inner">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-light font-heading text-white tracking-widest uppercase mt-1">
              Clarispec
            </span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-8 px-8 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-4 rounded-none px-4 py-3.5 transition-all duration-500 relative overflow-hidden',
                  isActive ? 'text-white' : 'text-white/30 hover:text-white/70'
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px] transition-colors duration-500 relative z-10", isActive ? "text-white" : "text-white/40 group-hover:text-white/60")} />
                <span className="text-[11px] uppercase tracking-widest font-bold mt-0.5 relative z-10 transition-colors duration-500">
                  {item.name}
                </span>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="absolute inset-0 bg-white/[0.06] border-l-2 border-white z-0"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/[0.05] to-transparent" />
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-1/2 bg-white blur-[4px] opacity-50" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-8 border-t border-white/[0.08] bg-black/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white text-black font-bold text-[11px] tracking-widest uppercase shadow-[0_0_24px_rgba(255,255,255,0.2)]">
                {userInitials}
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-[13px] font-bold text-white uppercase tracking-widest truncate">{userName || 'Loading...'}</p>
                <p className="text-[9px] uppercase tracking-widest text-white/40 mt-1">{userRole}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex-shrink-0 text-white/20 hover:text-white transition-colors duration-300 group ml-2"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
