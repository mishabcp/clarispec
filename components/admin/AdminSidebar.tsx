'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SidebarSlidingPill, useSlidingNavHighlight } from '@/components/navigation/sidebar-sliding-highlight'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  LogOut,
  Sparkles,
  FileText,
  MessageSquare,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/admin/projects', icon: FolderOpen },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Documents', href: '/admin/documents', icon: FileText },
  { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { name: 'Doc selections', href: '/admin/document-selections', icon: ClipboardList },
]

function navItemIsActive(pathname: string, href: string) {
  if (href === '/admin/dashboard') {
    return pathname === '/admin/dashboard'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const activeIndex = navigation.findIndex((item) => navItemIsActive(pathname, item.href))
  const { navRef, setLinkRef, metrics, hasActive } = useSlidingNavHighlight(activeIndex)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setIsMobileOpen(false)
    })
    return () => cancelAnimationFrame(id)
  }, [pathname])

  async function handleSignOut() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const renderNavLink = (
    item: { name: string; href: string; icon: typeof LayoutDashboard },
    index: number
  ) => {
    const isActive = navItemIsActive(pathname, item.href)
    return (
      <Link
        key={item.href}
        ref={setLinkRef(index)}
        href={item.href}
        className={cn(
          'group relative z-10 flex min-h-[44px] items-center gap-3 overflow-hidden rounded-none px-3 py-3 transition-colors duration-500',
          isActive ? 'text-white' : 'text-white/30 hover:text-white/70'
        )}
      >
        <item.icon
          className={cn(
            'relative z-10 h-[18px] w-[18px] shrink-0 transition-colors duration-500',
            isActive ? 'text-white' : 'text-white/40 group-hover:text-white/60'
          )}
        />
        <span className="relative z-10 mt-0.5 text-[11px] font-bold uppercase tracking-widest transition-colors duration-500">
          {item.name}
        </span>
      </Link>
    )
  }

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-white/[0.08] bg-[#0a0a0b]/80 backdrop-blur-[64px] z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-white" />
          <span className="text-sm font-light font-heading text-white tracking-widest uppercase mt-0.5">
            Clarispec
          </span>
          <span className="rounded-none border border-danger/40 bg-danger/15 px-1.5 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-widest">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="text-white/60 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-screen w-[300px] flex-col border-r border-white/[0.08] bg-[#0a0a0b]/80 md:bg-[#0a0a0b]/40 backdrop-blur-[64px] z-[60] shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:translate-x-0 flex',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-20 flex-shrink-0 items-center justify-between px-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-none bg-white/[0.05] border border-white/[0.1] shadow-inner shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xl font-light font-heading text-white tracking-widest uppercase mt-1 truncate">
                Clarispec
              </span>
              <span className="text-[9px] font-bold text-red-400/90 uppercase tracking-[0.2em] mt-0.5">
                Admin console
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-white/40 hover:text-white transition-colors shrink-0"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          ref={navRef}
          className="relative flex-1 space-y-1 overflow-y-auto px-6 py-6 scrollbar-thin"
        >
          <SidebarSlidingPill
            top={metrics.top}
            height={metrics.height}
            visible={hasActive}
          />
          {navigation.map((item, index) => renderNavLink(item, index))}
        </nav>

        <div className="p-6 border-t border-white/[0.08] bg-black/20 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white text-black font-bold text-[10px] tracking-widest uppercase shadow-[0_0_24px_rgba(255,255,255,0.2)]">
                AD
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-[13px] font-bold text-white uppercase tracking-widest truncate">
                  Administrator
                </p>
                <p className="text-[9px] uppercase tracking-widest text-white/40 mt-1">Admin session</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex-shrink-0 text-white/20 hover:text-white transition-colors duration-300 group ml-2"
              title="Sign out"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
