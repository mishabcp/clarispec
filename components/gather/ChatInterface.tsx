'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageBubble } from './MessageBubble'
import { QuestionCard } from './QuestionCard'
import { TypingIndicator } from './TypingIndicator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Message, Project, RequirementAreas, AIResponse } from '@/types'
import { REQUIREMENT_AREA_LABELS, DEPTH_THRESHOLDS } from '@/types'
import { formatConversationHistory, getDefaultRequirementAreas, calculateScore, buildTopicSummary, buildCategoryCounts } from '@/lib/ai/conversation'
import { Send, X, CheckCircle2 } from 'lucide-react'

interface ChatInterfaceProps {
  project: Project
  onScoreUpdate: (score: number, areas: RequirementAreas) => void
}

export function ChatInterface({ project, onScoreUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<AIResponse | null>(null)
  const [areas, setAreas] = useState<RequirementAreas>(getDefaultRequirementAreas())
  const [score, setScore] = useState(project.requirement_score || 0)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initRef = useRef(false)
  const submittingRef = useRef(false)
  const supabase = createClient()

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    async function init() {
      // Load existing messages via API route (avoids RLS issues)
      try {
        const msgRes = await fetch(`/api/projects/${project.id}/messages`)
        const existingMessages = msgRes.ok ? await msgRes.json() : []

        if (Array.isArray(existingMessages) && existingMessages.length > 0) {
          setMessages(existingMessages as Message[])

          const { data: areasData } = await supabase
            .from('requirement_areas')
            .select('*')
            .eq('project_id', project.id)

          let areasObj = getDefaultRequirementAreas()
          if (areasData) {
            areasData.forEach((area) => {
              const key = area.area_name as keyof RequirementAreas
              if (key in areasObj) {
                areasObj[key] = area.is_covered
              }
            })
            setAreas(areasObj)
          }

          setScore(project.requirement_score)

          // Restore options for the last question so they show after re-entering the chat
          const lastMsg = existingMessages[existingMessages.length - 1] as Message
          const suggestions = lastMsg?.metadata?.suggestions
          const suggestionDetails = lastMsg?.metadata?.suggestionDetails
          if (
            lastMsg?.role === 'assistant' &&
            lastMsg?.message_type === 'question' &&
            Array.isArray(suggestions) &&
            suggestions.length > 0
          ) {
            setCurrentQuestion({
              acknowledgment: (lastMsg.metadata?.acknowledgment as string) || '',
              question: lastMsg.content,
              questionCategory: (lastMsg.metadata?.questionCategory as keyof RequirementAreas) || 'purpose',
              suggestions: suggestions as string[],
              suggestionDetails: Array.isArray(suggestionDetails) ? (suggestionDetails as string[]) : undefined,
              updatedScore: project.requirement_score ?? 0,
              updatedAreas: areasObj,
              isComplete: false,
            })
          }
          return
        }
      } catch (e) {
        console.error('Failed to load existing messages:', e)
      }

      setIsTyping(true)
      try {
        const analyzeRes = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brief: project.initial_brief,
            projectName: project.name,
            clientIndustry: project.client_industry,
          }),
        })
        const analysis = await analyzeRes.json()

        // F4: Do not persist analyzer's initialRequirementAreas/initialScore. Start at 0 so the questioner drives coverage.
        // (Areas and score remain at default: all false, 0.)

        const welcomeContent = `I've analyzed the brief for **${project.name}**. ${
          analysis.detectedIndustry
            ? `I can see this is a ${analysis.detectedIndustry} project.`
            : ''
        } I've identified some key areas we need to cover. Let me start with the most important question.`

        const welcomeMsg = await saveMessage(welcomeContent, 'assistant', 'system')

        const questionContent = analysis.suggestedFirstQuestion ||
          'Could you tell me more about the primary goal of this project? What specific problem are you trying to solve for the end users?'

        const firstOptions = analysis.suggestedFirstOptions && Array.isArray(analysis.suggestedFirstOptions)
          ? analysis.suggestedFirstOptions.slice(0, 4)
          : [
              'Increase revenue or reduce costs',
              'Improve internal processes or productivity',
              'Solve a specific problem for end users',
              'Validate a new product or market idea',
            ]
        const firstOptionDetails = analysis.suggestedFirstOptionDetails && Array.isArray(analysis.suggestedFirstOptionDetails)
          ? analysis.suggestedFirstOptionDetails.slice(0, 4)
          : undefined
        const questionMsg = await saveMessage(questionContent, 'assistant', 'question', {
          suggestions: firstOptions,
          suggestionDetails: firstOptionDetails,
          questionCategory: 'purpose',
          acknowledgment: '',
          scoreSnapshot: 0,
          areasSnapshot: getDefaultRequirementAreas(),
        })
        setMessages([welcomeMsg, questionMsg])
        setCurrentQuestion({
          acknowledgment: '',
          question: questionContent,
          questionCategory: 'purpose',
          suggestions: firstOptions,
          suggestionDetails: firstOptionDetails,
          updatedScore: 0,
          updatedAreas: getDefaultRequirementAreas(),
          isComplete: false,
        })
      } catch (err) {
        console.error('Init error:', err)
        const fallbackMsg = await saveMessage(
          'Welcome! I\'m ready to help gather requirements for your project. Could you tell me more about the primary goal of this project?',
          'assistant',
          'question'
        )
        setMessages([fallbackMsg])
      }

      setIsTyping(false)
    }

    init()
  }, [project.id])

  async function saveMessage(
    content: string,
    role: 'user' | 'assistant',
    messageType: string = 'chat',
    metadata: Record<string, unknown> = {}
  ): Promise<Message> {
    try {
      const res = await fetch(`/api/projects/${project.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, message_type: messageType, metadata }),
      })

      if (res.ok) {
        const data = await res.json()
        return data as Message
      }

      console.error('Failed to save message via API:', res.status, await res.text())
    } catch (err) {
      console.error('Failed to save message:', err)
    }

    return {
      id: crypto.randomUUID(),
      project_id: project.id,
      role,
      content,
      message_type: messageType,
      metadata,
      created_at: new Date().toISOString(),
    } as Message
  }

  function handleEdit(message: Message) {
    if (isTyping) return
    setEditingMessage(message)
    setInput(message.content)
  }

  async function sendMessage(text?: string, baseMessages?: Message[]) {
    const messageText = text || input.trim()
    if (!messageText || isTyping || submittingRef.current) return
    submittingRef.current = true

    const sourceMessages = baseMessages ?? messages
    setInput('')
    setIsTyping(true)
    setCurrentQuestion(null)
    if (baseMessages) setEditingMessage(null)

    try {
      const userMsg = await saveMessage(messageText, 'user')
      const updatedMessages = [...sourceMessages, userMsg]
      setMessages(updatedMessages)

      const history = formatConversationHistory(updatedMessages)
      const topicSummary = buildTopicSummary(updatedMessages)
      const categoryCounts = buildCategoryCounts(updatedMessages)

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: project.initial_brief,
          industry: project.client_industry || 'Not specified',
          depthLevel: project.depth_level,
          conversationHistory: history,
          requirementAreas: areas,
          score,
          topicSummary,
          categoryCounts,
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        console.error('[Clarispec Chat] API error:', res.status, res.statusText, '—', errBody?.substring(0, 300))
        let userMessage = `AI API returned ${res.status}`
        if (res.status === 429) {
          try {
            const parsed = JSON.parse(errBody) as { error?: string }
            if (parsed?.error) userMessage = parsed.error
          } catch {
            userMessage = 'AI is at capacity. Please try again in a minute.'
          }
        }
        throw new Error(userMessage)
      }

      const aiResponse: AIResponse = await res.json()
      const nextSuggestions = Array.isArray(aiResponse.suggestions) ? aiResponse.suggestions.slice(0, 4) : []
      const nextSuggestionDetails = Array.isArray(aiResponse.suggestionDetails) ? aiResponse.suggestionDetails.slice(0, 4) : undefined

      let currentScore = score
      let currentAreas = { ...areas }

      if (aiResponse.updatedAreas) {
        // OR-merge: areas can only go false -> true, never true -> false
        for (const [key, value] of Object.entries(aiResponse.updatedAreas)) {
          if (value === true) {
            currentAreas[key as keyof RequirementAreas] = true
          }
        }

        // Backstop: if the AI has asked 3+ questions targeting an area but never
        // marked it covered, force it to covered. The AI is being overly conservative.
        const catCounts = buildCategoryCounts(updatedMessages)
        for (const [cat, count] of Object.entries(catCounts)) {
          if (count >= 3 && cat in currentAreas && !currentAreas[cat as keyof RequirementAreas]) {
            currentAreas[cat as keyof RequirementAreas] = true
          }
        }

        setAreas(currentAreas)

        const weights = Object.fromEntries(
          Object.entries(REQUIREMENT_AREA_LABELS).map(([k, v]) => [k, v.weight])
        ) as Record<string, number>

        for (const [key, value] of Object.entries(currentAreas)) {
          await supabase
            .from('requirement_areas')
            .update({
              is_covered: value as boolean,
              coverage_score: (value as boolean) ? (weights[key] || 0) : 0,
              updated_at: new Date().toISOString(),
            })
            .eq('project_id', project.id)
            .eq('area_name', key)
        }

        currentScore = calculateScore(currentAreas)
        setScore(currentScore)
        await supabase
          .from('projects')
          .update({ requirement_score: currentScore })
          .eq('id', project.id)
        onScoreUpdate(currentScore, currentAreas)
      }

      // Check for session completion
      const threshold = DEPTH_THRESHOLDS[project.depth_level as keyof typeof DEPTH_THRESHOLDS] || 70
      const allCovered = Object.values(currentAreas).every((v) => v)
      if (aiResponse.isComplete || (currentScore >= threshold && allCovered)) {
        setIsSessionComplete(true)
        const completionMsg = await saveMessage(
          'All requirement areas are now covered! You can generate your documents.',
          'assistant',
          'system'
        )
        updatedMessages.push(completionMsg)
      }

      const ackTrim = (aiResponse.acknowledgment || '').trim()
      const questionTrim = (aiResponse.question || '').trim()
      const userTrim = messageText.trim()

      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
      const isSimilar = (a: string, b: string) => {
        const na = normalize(a)
        const nb = normalize(b)
        if (!na || !nb) return false
        if (na === nb) return true
        const shorter = na.length < nb.length ? na : nb
        const longer = na.length < nb.length ? nb : na
        return longer.includes(shorter) && shorter.length > longer.length * 0.5
      }

      const isDuplicateOfQuestion = isSimilar(ackTrim, questionTrim)
      const isDuplicateOfUser = isSimilar(ackTrim, userTrim)
      const lastAssistantMsg = [...updatedMessages].reverse().find(m => m.role === 'assistant')
      const isDuplicateOfPrev = lastAssistantMsg ? isSimilar(ackTrim, lastAssistantMsg.content) : false

      const shouldSkipAck = !ackTrim || isDuplicateOfQuestion || isDuplicateOfUser || isDuplicateOfPrev

      if (!shouldSkipAck) {
        const ackMsg = await saveMessage(aiResponse.acknowledgment, 'assistant', 'chat')
        updatedMessages.push(ackMsg)
      }

      // If the AI returned the same text for question and acknowledgment, use only the ack
      // and still show the question card with the proper question text
      let finalQuestion = questionTrim
      if (isSimilar(questionTrim, ackTrim) && ackTrim.length > 0) {
        finalQuestion = ackTrim
      }

      setCurrentQuestion({ ...aiResponse, question: finalQuestion, suggestions: nextSuggestions, suggestionDetails: nextSuggestionDetails })

      const qMsg = await saveMessage(finalQuestion, 'assistant', 'question', {
        suggestions: nextSuggestions,
        suggestionDetails: nextSuggestionDetails,
        questionCategory: aiResponse.questionCategory || 'purpose',
        acknowledgment: shouldSkipAck ? '' : aiResponse.acknowledgment || '',
        scoreSnapshot: currentScore,
        areasSnapshot: currentAreas,
      })
      updatedMessages.push(qMsg)

      setMessages([...updatedMessages])
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err)
      const errName = err instanceof Error ? err.name : typeof err
      const isGeneric = !(err instanceof Error && err.message.includes('at capacity'))
      console.error('[Clarispec Chat] sendMessage failed:', errName, errMessage)
      if (err instanceof Error && err.stack) {
        console.error('[Clarispec Chat] Stack:', err.stack)
      }
      if (isGeneric) {
        console.error('[Clarispec Chat] Showing generic apology to user. Actual error above.')
      }
      const friendlyMessage =
        err instanceof Error && err.message.includes('at capacity')
          ? err.message
          : 'I apologize, I encountered an issue processing your response. Could you try again?'
      const errorMsg = await saveMessage(friendlyMessage, 'assistant', 'system')
      setMessages(prev => [...prev, errorMsg])
    } finally {
      submittingRef.current = false
    }

    setIsTyping(false)
  }

  async function handleSubmit() {
    const text = input.trim()
    if (!text || isTyping) return

    if (editingMessage) {
      const res = await fetch(`/api/projects/${project.id}/messages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: editingMessage.id }),
      })
      if (!res.ok) {
        console.error('Failed to delete messages:', await res.text())
        return
      }
      const idx = messages.findIndex((m) => m.id === editingMessage.id)
      const truncated = idx >= 0 ? messages.slice(0, idx) : messages
      setEditingMessage(null)
      sendMessage(text, truncated)
      return
    }

    sendMessage()
  }

  function handleSuggestionClick(suggestion: string) {
    if (submittingRef.current) return
    sendMessage(suggestion)
  }

  function handleMultiSelectConfirm(selectedOptions: string[]) {
    if (selectedOptions.length === 0 || submittingRef.current) return
    const answerText = selectedOptions[0]
    sendMessage(answerText)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.filter(Boolean).map((msg, idx, filteredMsgs) => {
          const isLastMessage = idx === filteredMsgs.length - 1
          const isLastQuestion =
            msg.role === 'assistant' &&
            msg.message_type === 'question' &&
            isLastMessage &&
            currentQuestion?.suggestions?.length
          const canEdit = msg.role === 'user'

          // Skip the ack bubble right before the active QuestionCard (it's shown inside the card)
          if (
            !isLastMessage &&
            idx === filteredMsgs.length - 2 &&
            msg.role === 'assistant' &&
            msg.message_type === 'chat' &&
            filteredMsgs[filteredMsgs.length - 1]?.role === 'assistant' &&
            filteredMsgs[filteredMsgs.length - 1]?.message_type === 'question' &&
            currentQuestion?.suggestions?.length
          ) {
            return null
          }

          if (isLastQuestion && currentQuestion) {
            return (
              <QuestionCard
                key={msg.id}
                acknowledgment={currentQuestion.acknowledgment || ''}
                question={msg.content}
                category={currentQuestion.questionCategory}
                suggestions={currentQuestion.suggestions}
                suggestionDetails={currentQuestion.suggestionDetails}
                onSuggestionClick={handleSuggestionClick}
                onMultiSelectConfirm={handleMultiSelectConfirm}
                onOtherSubmit={handleSuggestionClick}
              />
            )
          }

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              onEdit={handleEdit}
              canEdit={canEdit}
            />
          )
        })}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Session complete banner */}
      {isSessionComplete && (
        <div className="border-t border-border bg-success/10 p-4">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Session Complete</span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            All requirement areas are covered. You can now generate your documents from the panel on the left.
          </p>
        </div>
      )}

      {/* Input area — show when editing or when not in multiple-choice question mode, hide when session is complete */}
      {!isSessionComplete && (editingMessage !== null ||
        !(
          messages.length > 0 &&
          messages[messages.length - 1]?.role === 'assistant' &&
          messages[messages.length - 1]?.message_type === 'question' &&
          currentQuestion?.suggestions?.length
        )) && (
        <div className="border-t border-border p-4">
          {editingMessage !== null && (
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs text-text-muted">Editing message — resend will replace it and the following replies</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-text-muted hover:text-text-primary"
                onClick={() => {
                  setEditingMessage(null)
                  setInput('')
                }}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={editingMessage ? 'Edit your response...' : 'Type your response...'}
              disabled={isTyping}
              className="flex-1"
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isTyping}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
