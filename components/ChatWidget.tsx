'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

function renderMarkdown(text: string): React.ReactNode[] {
  // Split into lines for list/paragraph handling
  const lines = text.split('\n')
  const result: React.ReactNode[] = []

  function inlineFormat(line: string, lineKey: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = []
    // Match **bold**, *italic*, `code` — process in order of appearance
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
    let lastIndex = 0
    let match: RegExpExecArray | null
    let i = 0
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(line.slice(lastIndex, match.index))
      }
      if (match[2]) {
        nodes.push(<strong key={`${lineKey}-${i}`}>{match[2]}</strong>)
      } else if (match[3]) {
        nodes.push(<em key={`${lineKey}-${i}`}>{match[3]}</em>)
      } else if (match[4]) {
        nodes.push(<code key={`${lineKey}-${i}`} className="chat-inline-code">{match[4]}</code>)
      }
      lastIndex = match.index + match[0].length
      i++
    }
    if (lastIndex < line.length) {
      nodes.push(line.slice(lastIndex))
    }
    return nodes
  }

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    // Bullet lists
    if (/^[-•]\s/.test(line)) {
      result.push(
        <div key={li} style={{ paddingLeft: 12, display: 'flex', gap: 6 }}>
          <span>•</span>
          <span>{inlineFormat(line.replace(/^[-•]\s/, ''), `l${li}`)}</span>
        </div>
      )
    } else if (line.trim() === '') {
      result.push(<div key={li} style={{ height: 6 }} />)
    } else {
      result.push(<span key={li}>{inlineFormat(line, `l${li}`)}{li < lines.length - 1 && lines[li + 1]?.trim() !== '' && !/^[-•]\s/.test(lines[li + 1] || '') ? '\n' : ''}</span>)
    }
  }
  return result
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      if (!res.ok) throw new Error('Chat failed')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let assistantContent = ''
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                assistantContent += parsed.text
                const content = assistantContent
                setMessages((prev) => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content }
                  return updated
                })
              }
            } catch { /* skip malformed chunks */ }
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Try again?' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleClear() {
    setMessages([])
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          className="chat-fab"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18 }}>💬</span>
              <span className="font-body font-semibold text-neutral-900" style={{ fontSize: 16 }}>CashGPT</span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  className="chat-header-btn"
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="chat-header-btn"
                aria-label="Close chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <p className="font-display" style={{ fontSize: 18, marginBottom: 4 }}>Hey, what&apos;s up?</p>
                <p className="text-neutral-400" style={{ fontSize: 13 }}>
                  Ask me anything about your finances. I&apos;ll be honest — maybe too honest.
                </p>
                <div className="chat-suggestions">
                  {[
                    'What am I spending too much on?',
                    'Can I afford a $2000/mo apartment?',
                    'How\'s my net worth trending?',
                  ].map((q) => (
                    <button
                      key={q}
                      className="chat-suggestion"
                      onClick={() => {
                        setInput(q)
                        setTimeout(() => inputRef.current?.focus(), 0)
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                {msg.role === 'assistant' && msg.content === '' && isLoading && (
                  <span className="chat-typing">...</span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-bar">
            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              placeholder="Ask about your money..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              disabled={isLoading}
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
