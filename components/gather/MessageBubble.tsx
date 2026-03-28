'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'
import { Bot, Copy, Pencil, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'

interface MessageBubbleProps {
  message: Message
  onEdit?: (message: Message) => void
  canEdit?: boolean
}

export function MessageBubble({ message, onEdit, canEdit }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const components = {
    p: ({ children }: any) => <p className="mb-0 leading-relaxed last:mb-0">{children}</p>,
    strong: ({ children }: any) => <strong className="font-bold text-white transition-all duration-300">{children}</strong>,
  }

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
        'flex gap-2.5 animate-fade-in group w-full',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-none border transition-all duration-500',
          isUser 
            ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.2)]' 
            : 'bg-white/[0.03] border-white/[0.08] text-white shadow-inner'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div
        className={cn(
          'flex max-w-[80%] flex-col gap-1',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-[1px] px-2.5 py-2 text-[11px] font-light tracking-wide shadow-2xl transition-all duration-500 leading-relaxed',
            isUser
              ? 'bg-white text-black border border-white'
              : 'bg-[#0a0a0b]/60 backdrop-blur-[64px] border border-white/[0.08] text-white/90'
          )}
        >
          <div
            className={cn(
              'prose prose-sm max-w-none prose-p:text-[11px] prose-p:leading-relaxed prose-strong:text-inherit',
              isUser ? 'prose-neutral' : 'prose-invert'
            )}
          >
            <ReactMarkdown components={components}>
              {message.content}
            </ReactMarkdown>
          </div>
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
