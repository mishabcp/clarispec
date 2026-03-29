'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { KeyRound, Loader2, Save, UserRound } from 'lucide-react'

const inputGlass =
  'h-10 border-0 border-b border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] focus:bg-white/[0.04] ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none text-white caret-white text-[15px] font-light pl-3 placeholder:text-white/10 shadow-none outline-none'

const labelGlass =
  'text-[9px] font-bold text-white/40 uppercase tracking-widest group-focus-within:text-white/90'

function SettingsPanel({
  icon: Icon,
  title,
  description,
  children,
  footer,
  delay = 0,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] overflow-hidden transition-all duration-500 hover:border-white/[0.12]"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent shadow-[0_1px_4px_rgba(255,255,255,0.05)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-6">
        <div className="flex gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-white/[0.03] border border-white/[0.1]">
            <Icon className="h-4 w-4 text-white/80" />
          </div>
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">{title}</h2>
            <p className="text-[9px] text-white/35 mt-1 uppercase tracking-widest font-bold">{description}</p>
          </div>
        </div>
        {children}
        <div className="mt-5 pt-4 border-t border-white/[0.08]">{footer}</div>
      </div>
    </motion.div>
  )
}

export default function SettingsPage() {
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const { addToast } = useToast()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setCompanyName(profile.company_name || '')
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        company_name: companyName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      addToast({ title: 'Error', description: error.message, variant: 'danger' })
    } else {
      addToast({ title: 'Profile updated', variant: 'success' })
    }

    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      addToast({ title: 'Password must be at least 6 characters', variant: 'danger' })
      return
    }

    setChangingPassword(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      addToast({ title: 'Error', description: error.message, variant: 'danger' })
    } else {
      addToast({ title: 'Password updated', variant: 'success' })
      setNewPassword('')
    }

    setChangingPassword(false)
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08, duration: 0.45 }}
          className="text-[32px] font-extralight font-heading tracking-tight text-white/90 uppercase"
        >
          Settings
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.14, duration: 0.45 }}
          className="text-white/40 mt-1 text-[10px] uppercase tracking-[0.2em] font-bold"
        >
          Account & profile
        </motion.p>
      </div>

      <div className="space-y-5">
        <SettingsPanel
          icon={UserRound}
          title="Profile"
          description="Your name and organization"
          delay={0.1}
          footer={
            <Button
              type="submit"
              form="settings-profile-form"
              disabled={saving}
              className="group relative h-10 bg-white text-black hover:bg-white/90 transition-all duration-500 font-bold text-[10px] uppercase tracking-widest rounded-none shadow-[0_4px_24px_rgba(255,255,255,0.08)] active:scale-[0.985] overflow-hidden px-6"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/[0.05] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative z-10 flex items-center gap-2">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save changes
              </span>
            </Button>
          }
        >
          <form id="settings-profile-form" onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1 group relative">
              <Label htmlFor="fullName" className={labelGlass}>
                Full name
              </Label>
              <div className="relative">
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className={inputGlass}
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/40 transition-all duration-500 group-focus-within:w-full" />
              </div>
            </div>
            <div className="space-y-1 group relative">
              <Label htmlFor="companyName" className={labelGlass}>
                Company
              </Label>
              <div className="relative">
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Organization"
                  className={inputGlass}
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/40 transition-all duration-500 group-focus-within:w-full" />
              </div>
            </div>
          </form>
        </SettingsPanel>

        <SettingsPanel
          icon={KeyRound}
          title="Password"
          description="Sign-in security"
          delay={0.18}
          footer={
            <Button
              type="submit"
              form="settings-password-form"
              variant="outline"
              disabled={changingPassword}
              className="h-10 rounded-none border border-white/[0.12] bg-transparent text-white hover:bg-white/[0.06] hover:text-white hover:border-white/20 font-bold text-[10px] uppercase tracking-widest px-6 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                {changingPassword ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" />
                )}
                Update password
              </span>
            </Button>
          }
        >
          <form id="settings-password-form" onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1 group relative">
              <Label htmlFor="newPassword" className={labelGlass}>
                New password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  autoComplete="new-password"
                  className={inputGlass}
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/40 transition-all duration-500 group-focus-within:w-full" />
              </div>
            </div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
              Uses your current session — no old password required
            </p>
          </form>
        </SettingsPanel>
      </div>
    </motion.div>
  )
}
