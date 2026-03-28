export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2.5 py-1.5">
      <div className="flex items-center gap-1.5 rounded-2xl bg-surface px-2.5 py-1.5">
        <span className="h-2 w-2 rounded-full bg-text-muted animate-pulse-dot" style={{ animationDelay: '0s' }} />
        <span className="h-2 w-2 rounded-full bg-text-muted animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
        <span className="h-2 w-2 rounded-full bg-text-muted animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}
