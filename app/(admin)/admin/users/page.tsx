'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate, cn } from '@/lib/utils'
import { Search, Loader2 } from 'lucide-react'

const glassPanel =
  'rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] shadow-[0_8px_32px_rgba(0,0,0,0.35)]'

const thBase =
  'sticky top-0 z-20 bg-[#0a0a0b]/90 backdrop-blur-md text-left px-5 py-3 font-bold text-[9px] uppercase tracking-widest text-white/45 border-b border-white/[0.08]'

interface AdminUser {
  id: string
  full_name: string | null
  company_name: string | null
  role: string
  email: string
  lastSignIn: string | null
  projectCount: number
  created_at: string
}

function roleBadgeVariant(role: string): 'danger' | 'secondary' | 'outline' {
  if (role === 'superadmin') return 'danger'
  if (role === 'admin') return 'secondary'
  return 'outline'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)

    const res = await fetch(`/api/admin/users?${params}`)
    if (res.ok) {
      setUsers(await res.json())
    } else {
      setUsers([])
    }
    setLoading(false)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300)
    return () => clearTimeout(timer)
  }, [fetchUsers])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">All Users</h1>
        <p className="text-text-secondary mt-1">
          Manage and view registered users. Project counts link to a filtered project list.
        </p>
      </div>

      <div className={`${glassPanel} p-5 space-y-4`}>
        <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Filters</h2>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
          <Input
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search users by name, email, or company"
          />
        </div>
      </div>

      <div className={`${glassPanel} overflow-hidden`}>
        <div className="px-5 py-3 border-b border-white/[0.08]">
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Accounts</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th scope="col" className={thBase}>
                    Name
                  </th>
                  <th scope="col" className={thBase}>
                    Email
                  </th>
                  <th scope="col" className={thBase}>
                    Company
                  </th>
                  <th scope="col" className={thBase}>
                    Role
                  </th>
                  <th scope="col" className={thBase}>
                    Projects
                  </th>
                  <th scope="col" className={thBase}>
                    Last Sign-In
                  </th>
                  <th scope="col" className={thBase}>
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-white/35 text-sm">
                      <p className="font-medium text-white/50">No users match this search</p>
                      <p className="mt-1 text-white/35">Try another name, email fragment, or company.</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr
                      key={u.id}
                      className={cn(
                        'border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.05]',
                        i % 2 === 1 && 'bg-white/[0.02]'
                      )}
                    >
                      <td className="px-5 py-3 font-medium text-white">{u.full_name || '-'}</td>
                      <td className="px-5 py-3 text-white/70 break-all">{u.email || '—'}</td>
                      <td className="px-5 py-3 text-white/45">{u.company_name || '-'}</td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={roleBadgeVariant(u.role)}
                          className="capitalize border-white/20 text-[10px] tracking-wide text-white/85"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 tabular-nums">
                        {u.projectCount > 0 ? (
                          <Link
                            href={`/admin/projects?userId=${u.id}`}
                            className="font-medium text-white hover:text-cyan-300/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b] rounded-sm inline-block min-w-[1.25rem]"
                          >
                            {u.projectCount}
                          </Link>
                        ) : (
                          <span className="text-white/40">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-white/40 whitespace-nowrap tabular-nums">
                        {u.lastSignIn ? formatDate(u.lastSignIn) : 'Never'}
                      </td>
                      <td className="px-5 py-3 text-white/40 whitespace-nowrap tabular-nums">
                        {formatDate(u.created_at)}
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
