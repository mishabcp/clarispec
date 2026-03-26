'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { DepthSelector, DocumentSelector } from '@/components/project/ProjectSetup'
import type { DepthLevel, DocumentType } from '@/types'
import { INDUSTRIES, DOCUMENT_TYPES } from '@/types'
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react'

export default function NewProjectPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
    if (!user) return

    // Ensure profile exists before creating project
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
      console.error('Error creating project:', JSON.stringify(error, null, 2))
      alert(`Error creating project: ${error?.message || 'Unknown error'}`)
      setLoading(false)
      return
    }

    // Save document selections
    const selections = selectedDocs.map(doc_type => ({
      project_id: project.id,
      doc_type,
      is_selected: true,
    }))

    await supabase.from('document_selections').insert(selections)

    // Create default requirement areas
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

    router.push(`/projects/${project.id}/gather`)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading">Create New Project</h1>
        <p className="text-text-secondary mt-1">Set up a new requirements gathering session</p>
      </div>

      {/* Progress indicators */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s
                  ? 'bg-primary text-white'
                  : 'bg-surface-hover text-text-muted'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={`h-0.5 w-12 ${step > s ? 'bg-primary' : 'bg-surface-hover'}`} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Basic details about the project and client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g. E-Commerce Platform Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name <span className="text-text-muted">(optional)</span></Label>
              <Input
                id="clientName"
                placeholder="e.g. Acme Corp"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Client Industry <span className="text-text-muted">(optional)</span></Label>
              <Select
                id="industry"
                value={clientIndustry}
                onChange={(e) => setClientIndustry(e.target.value)}
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="gap-2"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Client Brief</CardTitle>
            <CardDescription>
              Describe what the client wants to build. Don&apos;t worry about being technical — write it exactly as the client described it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brief">Initial Brief *</Label>
              <Textarea
                id="brief"
                placeholder="The client wants to build a mobile app for ordering food from local restaurants. Users should be able to browse menus, place orders, track delivery, and pay online..."
                value={initialBrief}
                onChange={(e) => setInitialBrief(e.target.value)}
                className="min-h-[200px]"
                required
              />
              <p className="text-xs text-text-muted">
                Minimum 50 characters. {initialBrief.length}/50
              </p>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={initialBrief.trim().length < 50}
                className="gap-2"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Choose the depth of analysis and which documents to generate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DepthSelector value={depthLevel} onChange={setDepthLevel} />
            <DocumentSelector selected={selectedDocs} onChange={setSelectedDocs} />
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || selectedDocs.length === 0}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {loading ? 'Creating...' : 'Start Gathering'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
