'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Search, Loader2 } from 'lucide-react'

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)

    const res = await fetch(`/api/admin/users?${params}`)
    if (res.ok) setUsers(await res.json())
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
        <p className="text-text-secondary mt-1">Manage and view all registered users</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Search by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Company</th>
                  <th className="text-left px-5 py-3 font-medium">Role</th>
                  <th className="text-left px-5 py-3 font-medium">Projects</th>
                  <th className="text-left px-5 py-3 font-medium">Last Sign-In</th>
                  <th className="text-left px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-text-muted">
                      No users found
                    </td>
                  </tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3 font-medium text-text-primary">{u.full_name || '-'}</td>
                    <td className="px-5 py-3 text-text-secondary">{u.email}</td>
                    <td className="px-5 py-3 text-text-muted">{u.company_name || '-'}</td>
                    <td className="px-5 py-3">
                      <Badge variant={u.role === 'superadmin' ? 'danger' : 'outline'} className="capitalize">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {u.projectCount > 0 ? (
                        <Link href={`/admin/projects?userId=${u.id}`} className="text-primary hover:underline font-medium">
                          {u.projectCount}
                        </Link>
                      ) : (
                        <span className="text-text-muted">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {u.lastSignIn ? formatDate(u.lastSignIn) : 'Never'}
                    </td>
                    <td className="px-5 py-3 text-text-muted">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
