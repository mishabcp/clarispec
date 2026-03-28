'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportToPDF } from '@/lib/documents/exportPDF'
import { exportToMarkdown } from '@/lib/documents/exportMarkdown'
import { Download, FileText, FileCode, Loader2 } from 'lucide-react'

interface ExportMenuProps {
  title: string
  content: string
}

export function ExportMenu({ title, content }: ExportMenuProps) {
  const [exporting, setExporting] = useState(false)
  const [open, setOpen] = useState(false)

  async function handlePDF() {
    setExporting(true)
    try {
      await exportToPDF(title, content)
    } catch {}
    setExporting(false)
    setOpen(false)
  }

  function handleMarkdown() {
    exportToMarkdown(title, content)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(!open)}
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-surface p-1 shadow-lg">
            <button
              onClick={handlePDF}
              disabled={exporting}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Export as PDF
            </button>
            <button
              onClick={handleMarkdown}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              <FileCode className="h-4 w-4" />
              Export as Markdown
            </button>
          </div>
        </>
      )}
    </div>
  )
}
