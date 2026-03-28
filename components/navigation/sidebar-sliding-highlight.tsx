'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function useSlidingNavHighlight(activeIndex: number) {
  const navRef = useRef<HTMLElement>(null)
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const [metrics, setMetrics] = useState({ top: 0, height: 0 })

  const measure = useCallback(() => {
    if (activeIndex < 0) {
      setMetrics({ top: 0, height: 0 })
      return
    }
    const nav = navRef.current
    if (!nav) return
    const link = linkRefs.current[activeIndex]
    if (!link) return
    const navRect = nav.getBoundingClientRect()
    const linkRect = link.getBoundingClientRect()
    setMetrics({
      top: linkRect.top - navRect.top + nav.scrollTop,
      height: linkRect.height,
    })
  }, [activeIndex])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(nav)
    const onScroll = () => measure()
    nav.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      nav.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  const setLinkRef = (index: number) => (el: HTMLAnchorElement | null) => {
    linkRefs.current[index] = el
  }

  return { navRef, setLinkRef, metrics, hasActive: activeIndex >= 0 }
}

type SidebarSlidingPillProps = {
  top: number
  height: number
  visible: boolean
  className?: string
}

export function SidebarSlidingPill({ top, height, visible, className }: SidebarSlidingPillProps) {
  return (
    <motion.div
      aria-hidden
      className={cn(
        'pointer-events-none absolute left-0 right-0 z-0 overflow-hidden rounded-[1px]',
        'border-l border-white/25',
        'bg-gradient-to-br from-white/[0.11] via-white/[0.045] to-white/[0.015]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.11),inset_0_-1px_0_rgba(0,0,0,0.28),0_0_28px_-10px_rgba(255,255,255,0.12)]',
        className
      )}
      initial={false}
      animate={{
        top,
        height,
        opacity: visible && height > 0 ? 1 : 0,
      }}
      transition={{
        type: 'spring',
        damping: 34,
        stiffness: 210,
        mass: 1,
      }}
      style={{ position: 'absolute' }}
    >
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/35 via-white/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent opacity-80" />
        <div className="absolute bottom-0 left-0 top-0 w-11 bg-gradient-to-r from-white/[0.14] to-transparent" />
        <div className="absolute bottom-0 left-0 top-0 w-px bg-gradient-to-b from-white/55 via-white/25 to-white/[0.08]" />
        <div className="absolute left-0 top-1/2 h-[58%] w-[2px] -translate-y-1/2 bg-white/35 blur-[6px]" />
        <div className="animate-sidebar-nav-sheen absolute -inset-y-1 -left-[55%] w-[210%] bg-gradient-to-r from-transparent via-white/[0.055] to-transparent opacity-70" />
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/[0.22] to-transparent" />
      </div>
    </motion.div>
  )
}
