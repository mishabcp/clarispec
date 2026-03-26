'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'
import { Bot, Copy, Pencil, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessageBubbleProps {
  message: Message
  onEdit?: (message: Message) => void
  canEdit?: boolean
}

export function MessageBubble({ message, onEdit, canEdit }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    onEdit?.(message)
  }

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary/20' : 'bg-accent/20'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary" />
        ) : (
          <Bot className="h-4 w-4 text-accent" />
        )}
      </div>
      <div
        className={cn(
          'flex max-w-[75%] flex-col gap-1',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm',
            isUser
              ? 'bg-primary text-white rounded-tr-sm'
              : 'bg-surface border border-border text-text-primary rounded-tl-sm'
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        {isUser && (
          <div
            className={cn(
              'flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
              isUser ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-text-muted hover:text-text-primary hover:bg-muted"
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy'}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            {canEdit && onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-text-muted hover:text-text-primary hover:bg-muted"
                onClick={handleEdit}
                title="Edit and resend"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
        {isUser && copied && (
          <span className="text-xs text-text-muted">Copied!</span>
        )}
      </div>
    </div>
  )
}
