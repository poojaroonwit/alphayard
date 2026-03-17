import { store } from '../../store'
import { API_BASE_URL } from '../config/api'

const AI_BASE_URL = (process.env.EXPO_PUBLIC_AI_SERVICE_URL || API_BASE_URL).replace(':4000', ':5001')

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export type SSEEventType = 'token' | 'tool_start' | 'tool_end' | 'done' | 'error' | 'retry'

export interface StreamCallbacks {
  onToken: (token: string) => void
  onToolStart?: (name: string, input: Record<string, any>) => void
  onToolEnd?: (name: string, result: any) => void
  onDone: (data: { usage: { input_tokens: number; output_tokens: number }; cost_usd: number; provider: string; model: string }) => void
  onError: (message: string) => void
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

function getToken(): string | null {
  const state = store.getState() as any
  return state.auth?.token ?? state.user?.token ?? null
}

function authHeaders(extra: Record<string, string> = {}) {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

// ─── SSE reader ───────────────────────────────────────────────────────────────

async function readSSE(response: Response, callbacks: StreamCallbacks): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError('No response body')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            switch (currentEvent as SSEEventType) {
              case 'token':
                callbacks.onToken(data.token ?? '')
                break
              case 'tool_start':
                callbacks.onToolStart?.(data.name, data.input ?? {})
                break
              case 'tool_end':
                callbacks.onToolEnd?.(data.name, data.result)
                break
              case 'done':
                callbacks.onDone(data)
                break
              case 'error':
                callbacks.onError(data.message ?? 'Unknown error')
                break
            }
          } catch {}
          currentEvent = ''
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const aiService = {
  /** Stream a chat message. Returns a cancel function. */
  streamChat(
    message: string,
    callbacks: StreamCallbacks,
    opts: { appId?: string; sessionId?: string; attachments?: Array<{ type: string; media_type: string; data: string }> } = {},
  ): { cancel: () => void } {
    const controller = new AbortController()

    ;(async () => {
      try {
        const res = await fetch(`${AI_BASE_URL}/v1/chat/stream`, {
          method: 'POST',
          headers: authHeaders(),
            body: JSON.stringify({
              message,
              appId: opts.appId ?? 'appkit',
              sessionId: opts.sessionId ?? 'default',
              attachments: opts.attachments ?? [],
            }),
          signal: controller.signal,
        })

        if (!res.ok) {
          if (res.status === 429) {
            const body = await res.json().catch(() => ({}))
            callbacks.onError(`Rate limit reached. ${body.detail?.reason ?? ''}`)
          } else {
            callbacks.onError(`HTTP ${res.status}`)
          }
          return
        }

        await readSSE(res, callbacks)
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          callbacks.onError(err?.message ?? 'Connection error')
        }
      }
    })()

    return { cancel: () => controller.abort() }
  },

  /** Clear conversation history for a session. */
  async clearHistory(sessionId = 'default'): Promise<void> {
    await fetch(`${AI_BASE_URL}/v1/chat/history?sessionId=${sessionId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  },

  /** List all sessions for the current user. */
  async getSessions(): Promise<Array<{ sessionId: string; messageCount: number; lastMessage: ChatMessage | null }>> {
    const res = await fetch(`${AI_BASE_URL}/v1/chat/sessions`, { headers: authHeaders() })
    if (!res.ok) return []
    const data = await res.json()
    return data.sessions ?? []
  },

  /** Submit feedback (👍 / 👎) for a message. */
  async sendFeedback(opts: {
    messageIndex: number
    rating: 1 | -1
    comment?: string
    sessionId?: string
  }): Promise<void> {
    await fetch(`${AI_BASE_URL}/v1/chat/feedback`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        messageIndex: opts.messageIndex,
        rating: opts.rating,
        comment: opts.comment ?? '',
        sessionId: opts.sessionId ?? 'default',
      }),
    })
  },

  /** Get feedback for the current session. */
  async getFeedback(sessionId = 'default'): Promise<Array<{ message_index: number; rating: number; comment: string }>> {
    const res = await fetch(`${AI_BASE_URL}/v1/chat/feedback?sessionId=${sessionId}`, { headers: authHeaders() })
    if (!res.ok) return []
    const data = await res.json()
    return data.feedback ?? []
  },
}
