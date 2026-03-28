'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { SidebarSlidingPill, useSlidingNavHighlight } from '@/components/navigation/sidebar-sliding-highlight'
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

function navItemIsActive(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [userName, setUserName] = useState('')
  const [userInitials, setUserInitials] = useState('U')
  const [userRole, setUserRole] = useState('Analyst')
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const activeIndex = navigation.findIndex((item) => navItemIsActive(pathname, item.href))
  const { navRef, setLinkRef, metrics, hasActive } = useSlidingNavHighlight(activeIndex)

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
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-white/[0.08] bg-[#0a0a0b]/80 backdrop-blur-[64px] z-50 flex items-center justify-between px-4">
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
        <div className="flex h-20 flex-shrink-0 items-center justify-between px-6 border-b border-white/[0.08]">
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
        <nav
          ref={navRef}
          className="relative flex-1 space-y-1 overflow-y-auto px-6 py-6 scrollbar-thin"
        >
          <SidebarSlidingPill
            top={metrics.top}
            height={metrics.height}
            visible={hasActive}
          />
          {navigation.map((item, index) => {
            const isActive = navItemIsActive(pathname, item.href)
            return (
              <Link
                key={item.name}
                ref={setLinkRef(index)}
                href={item.href}
                className={cn(
                  'group relative z-10 flex min-h-[44px] items-center gap-3 overflow-hidden rounded-none px-3 py-3 transition-colors duration-500',
                  isActive ? 'text-white' : 'text-white/30 hover:text-white/70'
                )}
              >
                <item.icon
                  className={cn(
                    'relative z-10 h-[18px] w-[18px] transition-colors duration-500',
                    isActive ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                  )}
                />
                <span className="relative z-10 mt-0.5 text-[11px] font-bold uppercase tracking-widest transition-colors duration-500">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-6 border-t border-white/[0.08] bg-black/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
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
