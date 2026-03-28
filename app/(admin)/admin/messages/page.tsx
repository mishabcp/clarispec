'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Loader2, ShieldAlert } from 'lucide-react'

const API_DEFAULT_LIMIT = 150

const glassPanel =
  'rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] shadow-[0_8px_32px_rgba(0,0,0,0.35)]'

interface AdminMessageRow {
  id: string
  project_id: string
  role: string
  message_type: string
  created_at: string
  projectName: string
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<AdminMessageRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    params.set('limit', String(API_DEFAULT_LIMIT))
    fetch(`/api/admin/messages?${params}`)
      .then(async (res) => {
        if (cancelled) return
        if (res.ok) setMessages(await res.json())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const thClass =
    'sticky top-0 z-20 bg-[#0a0a0b]/90 backdrop-blur-md text-left px-5 py-3 font-bold text-[9px] uppercase tracking-widest text-white/45 border-b border-white/[0.08]'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Messages</h1>
        <p className="text-text-secondary mt-1 max-w-3xl">
          Recent message metadata for support and auditing (newest first, up to{' '}
          <strong className="text-text-primary font-medium">{API_DEFAULT_LIMIT}</strong> per request).{' '}
          <strong className="text-text-primary font-medium">Body text is not loaded</strong> here to reduce PII
          exposure; open the project for full conversation.
        </p>
      </div>

      <div
        id="admin-messages-metadata-notice"
        className="flex items-start gap-2 rounded-[1px] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95"
      >
        <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" aria-hidden />
        <span>
          This table lists <span className="font-medium text-amber-50">metadata only</span>—message id, project, role,
          type, and time. No bodies.
        </span>
      </div>

      <div className={`${glassPanel} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              aria-describedby="admin-messages-metadata-notice"
            >
              <thead>
                <tr className="text-white/40">
                  <th className={thClass}>Time</th>
                  <th className={thClass}>Project</th>
                  <th className={thClass}>Role</th>
                  <th className={thClass}>Type</th>
                  <th className={thClass}>Message id</th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-white/35 text-sm">
                      No messages found
                    </td>
                  </tr>
                ) : (
                  messages.map((m, i) => (
                    <tr
                      key={m.id}
                      className={`border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.05] ${i % 2 === 1 ? 'bg-white/[0.02]' : ''}`}
                    >
                      <td className="px-5 py-3 text-white/40 whitespace-nowrap tabular-nums text-xs">
                        {formatDate(m.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/projects/${m.project_id}`}
                          className="text-white font-medium hover:text-cyan-300/90 transition-colors truncate block max-w-[200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b] rounded-sm"
                        >
                          {m.projectName}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={m.role === 'user' ? 'secondary' : 'outline'}
                          className="capitalize border-white/20 text-white/85"
                        >
                          {m.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-white/55">{m.message_type}</td>
                      <td className="px-5 py-3 font-mono text-[11px] md:text-[13px] text-white/45 break-all max-w-[min(100vw,280px)]">
                        {m.id}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
