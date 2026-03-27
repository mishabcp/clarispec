'use client'

import { useSyncExternalStore } from 'react'
import {
  getAuthDebugPanelServerSnapshot,
  getAuthDebugPanelSnapshot,
  subscribeAuthDebugPanel,
} from '@/lib/auth-debug'
import { Button } from '@/components/ui/button'

type Props = {
  /** After hydration; avoids SSR/client mismatch for localStorage-gated verbose mode. */
  visible: boolean
  countdownMs: number | null
  manualGate: boolean
  onManualContinue: () => void
}

export function AuthDebugUi({ visible, countdownMs, manualGate, onManualContinue }: Props) {
  const panelLines = useSyncExternalStore(
    subscribeAuthDebugPanel,
    getAuthDebugPanelSnapshot,
    getAuthDebugPanelServerSnapshot
  )

  if (!visible) return null

  return (
    <div className="mt-6 space-y-3">
      {countdownMs !== null && countdownMs > 0 && (
        <p className="text-[10px] font-medium uppercase tracking-wider text-amber-400/90">
          Debug: waiting ~{Math.ceil(countdownMs / 1000)}s before refresh / navigation…
        </p>
      )}

      <div className="max-h-36 overflow-y-auto rounded border border-amber-500/25 bg-black/50 p-2 font-mono text-[9px] leading-relaxed text-amber-100/85">
        <div className="mb-1 font-bold text-amber-500/80">Auth debug log (page)</div>
        {panelLines.length === 0 ? (
          <span className="text-white/35">No lines yet — submit the form.</span>
        ) : (
          panelLines.map((line, i) => (
            <div key={`${i}-${line.slice(0, 24)}`} className="break-all border-b border-white/[0.06] py-0.5 last:border-0">
              {line}
            </div>
          ))
        )}
      </div>

      <p className="text-[9px] text-white/40">
        DevTools → Console → enable <span className="text-white/60">Preserve log</span> to keep console output after navigation.
      </p>

      {manualGate && (
        <div className="space-y-2 border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] text-white/65">
            Manual debug mode: when ready, continue to the dashboard (runs refresh + navigation).
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full rounded-none border-white/20 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10"
            onClick={onManualContinue}
          >
            Continue to dashboard
          </Button>
        </div>
      )}
    </div>
  )
}
