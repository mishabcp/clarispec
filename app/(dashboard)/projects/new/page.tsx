'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/toast'
import { DepthSelector, DocumentSelector } from '@/components/project/ProjectSetup'
import { clientError } from '@/lib/client-log'
import type { DepthLevel, DocumentType } from '@/types'
import { INDUSTRIES, DOCUMENT_TYPES } from '@/types'
import { ArrowLeft, ArrowRight, Loader2, Sparkles, FolderOpen, PenTool, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NewProjectPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()

  // Step 1
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientIndustry, setClientIndustry] = useState('')

  // Step 2
  const [initialBrief, setInitialBrief] = useState('')

  // Step 3
  const [depthLevel, setDepthLevel] = useState<DepthLevel>('standard')
  const [selectedDocs, setSelectedDocs] = useState<DocumentType[]>(
    DOCUMENT_TYPES.map(d => d.type)
  )

  async function handleSubmit() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      addToast({ title: 'Authentication Error', description: 'User not found. Please log in again.', variant: 'danger' })
      setLoading(false)
      return
    }

    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name || null,
      company_name: user.user_metadata?.company_name || null,
    }, { onConflict: 'id' })

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        client_name: clientName || null,
        client_industry: clientIndustry || null,
        initial_brief: initialBrief,
        depth_level: depthLevel,
        status: 'gathering',
        requirement_score: 0,
      })
      .select()
      .single()

    if (error || !project) {
      clientError('Error creating project')
      addToast({ title: 'Creation Failed', description: error?.message || 'Something went wrong. Please try again.', variant: 'danger' })
      setLoading(false)
      return
    }

    const selections = selectedDocs.map(doc_type => ({
      project_id: project.id,
      doc_type,
      is_selected: true,
    }))

    await supabase.from('document_selections').insert(selections)

    const areas = [
      'purpose', 'userRoles', 'coreFeatures', 'userFlows', 'integrations',
      'platform', 'scale', 'dataPrivacy', 'nonFunctional', 'constraints',
    ]
    const requirementAreas = areas.map(area_name => ({
      project_id: project.id,
      area_name,
      is_covered: false,
      coverage_score: 0,
    }))

    await supabase.from('requirement_areas').insert(requirementAreas)

    addToast({ title: 'Project Created', description: 'Redirecting to the gathering page...', variant: 'success' })
    router.push(`/projects/${project.id}/gather`)
  }

  const steps = [
    { num: 1, title: 'Details', icon: FolderOpen },
    { num: 2, title: 'Briefing', icon: PenTool },
    { num: 3, title: 'Parameters', icon: Settings },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto space-y-12"
    >
      <div>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-[32px] font-extralight font-heading tracking-tight text-white/90 uppercase"
        >
          Create New Project
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-white/40 mt-2 text-[10px] uppercase tracking-[0.2em] font-bold"
        >
          Set up your project details
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-4 border-b border-white/[0.08] pb-6"
      >
        {steps.map((s, idx) => (
          <div key={s.num} className="flex items-center gap-4">
            <div className="flex items-center gap-2 group">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-none border transition-all duration-700",
                step >= s.num ? "border-white bg-white/[0.05] text-white shadow-[0_0_16px_rgba(255,255,255,0.2)]" : "border-white/[0.08] bg-transparent text-white/20"
              )}>
                <s.icon className="h-4 w-4" />
              </div>
              <span className={cn(
                "hidden sm:block text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-700 mt-0.5",
                step >= s.num ? "text-white/90" : "text-white/20"
              )}>
                {s.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="w-8 sm:w-16 h-[1px] bg-white/[0.08]">
                <div 
                  className="h-full bg-white transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: step > s.num ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        ))}
      </motion.div>

      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="grid gap-8 p-10 bg-[#0a0a0b]/40 backdrop-blur-[64px] border border-white/[0.08] rounded-[1px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
                
                <div className="relative space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block">Project Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. E-Commerce Platform Redesign"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-14 bg-white/[0.03] border border-white/[0.08] focus:border-white/[0.3] rounded-none px-4 text-white font-light tracking-wide outline-none transition-colors placeholder:text-white/20"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-8 relative">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block flex items-center gap-2">
                      Client Name <span className="text-white/20 tracking-wider">/ OPTIONAL</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full h-14 bg-white/[0.03] border border-white/[0.08] focus:border-white/[0.3] rounded-none px-4 text-white font-light tracking-wide outline-none transition-colors placeholder:text-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block flex items-center gap-2">
                      Industry <span className="text-white/20 tracking-wider">/ OPTIONAL</span>
                    </label>
                    <select
                      value={clientIndustry}
                      onChange={(e) => setClientIndustry(e.target.value)}
                      className="w-full h-14 bg-black border border-white/[0.08] focus:border-white/[0.3] rounded-none px-4 text-white font-light tracking-wide outline-none transition-colors appearance-none"
                    >
                      <option value="" className="bg-black text-white/50">Select Industry...</option>
                      {INDUSTRIES.map((industry) => (
                        <option key={industry} value={industry} className="bg-black">{industry}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative pt-6 border-t border-white/[0.08] flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!name.trim()}
                    className="group relative flex items-center justify-center gap-3 h-12 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white transition-all duration-500 font-bold text-[10px] uppercase tracking-[0.2em] rounded-none shadow-[0_4px_24px_rgba(255,255,255,0.08)] active:scale-[0.985] overflow-hidden px-10"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Next <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="grid gap-6 p-10 bg-[#0a0a0b]/40 backdrop-blur-[64px] border border-white/[0.08] rounded-[1px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
                
                <div className="relative">
                  <p className="text-[12px] font-light text-white/60 leading-relaxed max-w-2xl mb-6">
                    Describe what the client wants to build in your own words. Include goals, key features, and any known constraints. Our AI will ask follow-up questions to fill in the gaps.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 flex justify-between">
                      <span>Initial Briefing *</span>
                      <span className={initialBrief.length < 50 ? "text-red-400" : "text-white/30"}>
                        {initialBrief.length} / 50 MIN
                      </span>
                    </label>
                    <textarea
                      placeholder="The client requires a high-performance logistics tracking system..."
                      value={initialBrief}
                      onChange={(e) => setInitialBrief(e.target.value)}
                      className="w-full min-h-[280px] bg-white/[0.02] border border-white/[0.08] focus:border-white/[0.3] rounded-none p-6 text-white font-light tracking-wide outline-none transition-colors placeholder:text-white/20 resize-y"
                    />
                  </div>
                </div>

                <div className="relative pt-6 border-t border-white/[0.08] flex justify-between items-center">
                  <button
                    onClick={() => setStep(1)}
                    className="group flex items-center gap-3 h-12 text-white/50 hover:text-white transition-colors duration-300 font-bold text-[10px] uppercase tracking-[0.2em] px-4"
                  >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={initialBrief.trim().length < 50}
                    className="group relative flex items-center justify-center gap-3 h-12 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white transition-all duration-500 font-bold text-[10px] uppercase tracking-[0.2em] rounded-none shadow-[0_4px_24px_rgba(255,255,255,0.08)] active:scale-[0.985] overflow-hidden px-10"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Next <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="grid gap-8 p-10 bg-[#0a0a0b]/40 backdrop-blur-[64px] border border-white/[0.08] rounded-[1px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
                
                <div className="relative z-10">
                  <DepthSelector value={depthLevel} onChange={setDepthLevel} />
                </div>
                
                <div className="relative z-10 pt-8 border-t border-white/[0.08]">
                  <DocumentSelector selected={selectedDocs} onChange={setSelectedDocs} />
                </div>

                <div className="relative pt-8 border-t border-white/[0.08] flex justify-between items-center">
                  <button
                    onClick={() => setStep(2)}
                    className="group flex items-center gap-3 h-12 text-white/50 hover:text-white transition-colors duration-300 font-bold text-[10px] uppercase tracking-[0.2em] px-4"
                  >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || selectedDocs.length === 0}
                    className="group relative flex items-center justify-center gap-3 h-12 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white transition-all duration-500 font-bold text-[10px] uppercase tracking-[0.2em] rounded-none shadow-[0_4px_24px_rgba(255,255,255,0.08)] active:scale-[0.985] overflow-hidden px-10"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/[0.05] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10 flex items-center gap-3">
                      {loading ? (
                        <>Processing <Loader2 className="h-4 w-4 animate-spin" /></>
                      ) : (
                        <>Create Project <Sparkles className="h-4 w-4" /></>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
