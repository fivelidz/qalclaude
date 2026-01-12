// QalClaude Session Tabs - Unified tab bar for navigating sessions

import { createMemo, createSignal, For, Show } from "solid-js"
import type { Accessor, Setter } from "solid-js"
import { useTheme, defaultTheme } from "../context/theme"
import { useSync } from "../context/sync"

interface SessionTab {
  sessionID: string
  title: string
  shortName: string
  status: "busy" | "idle" | "error"
  isParent: boolean
  taskNumber?: number
  agentType?: string
}

export interface SessionTabsProps {
  currentSessionID: string
  onNavigateToSession: (sessionID: string) => void
  splitSessionIDs?: Accessor<Set<string>>
  onSplitOpen?: (sessionID: string) => void
  onSplitClose?: (sessionID: string) => void
  onCloseSession?: (sessionID: string) => void
}

export function SessionTabs(props: SessionTabsProps) {
  const sync = useSync()

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  // Get current session info
  const currentSession = createMemo(() => sync.session.get(props.currentSessionID))

  // Determine the root parent
  const rootSessionID = createMemo(() => {
    const current = currentSession()
    if (!current) return props.currentSessionID
    if (current.parentID) return current.parentID
    return current.id
  })

  const rootSession = createMemo(() => sync.session.get(rootSessionID()))

  // Get all child sessions of the root
  const childSessions = createMemo(() => {
    return sync.data.session
      .filter((s) => s.parentID === rootSessionID())
      .sort((a, b) => a.time.created - b.time.created)
  })

  // Check if a session is split open
  const isSplitOpen = (sessionID: string) => {
    return props.splitSessionIDs?.()?.has(sessionID) ?? false
  }

  // Build the unified tab list
  const tabs = createMemo((): SessionTab[] => {
    const result: SessionTab[] = []

    // Add parent session first
    const parent = rootSession()
    if (parent) {
      const status = sync.data.session_status[parent.id]
      result.push({
        sessionID: parent.id,
        title: parent.title || "Main Session",
        shortName: "main",
        status: status?.type === "busy" ? "busy" : status?.type === "retry" ? "error" : "idle",
        isParent: true,
      })
    }

    // Add all subagent sessions
    childSessions().forEach((session, index) => {
      const status = sync.data.session_status[session.id]
      const agentType = extractAgentType(session.title)
      const shortName = extractShortName(session.title)

      result.push({
        sessionID: session.id,
        title: session.title || "Subagent",
        shortName,
        status: status?.type === "busy" ? "busy" : status?.type === "retry" ? "error" : "idle",
        isParent: false,
        taskNumber: index + 1,
        agentType,
      })
    })

    return result
  })

  // Check if we have any subagents
  const hasSubagents = createMemo(() => childSessions().length > 0)

  return (
    <Show when={hasSubagents()}>
      <box
        flexDirection="row"
        paddingLeft={1}
        paddingRight={1}
        gap={1}
        flexShrink={0}
        borderStyle="single"
        borderColor={theme.border}
      >
        {/* Tabs */}
        <For each={tabs()}>
          {(tab) => {
            const isActive = () => tab.sessionID === props.currentSessionID
            const isSplit = () => isSplitOpen(tab.sessionID)

            const statusColor = () => {
              switch (tab.status) {
                case "busy":
                  return theme.warning
                case "error":
                  return theme.error
                default:
                  return theme.success
              }
            }

            const statusIcon = () => {
              switch (tab.status) {
                case "busy":
                  return "●"
                case "error":
                  return "!"
                default:
                  return "○"
              }
            }

            return (
              <box paddingLeft={1} paddingRight={1} flexDirection="row" gap={1}>
                {/* Tab label */}
                <text fg={isActive() ? theme.text : theme.textMuted}>
                  <text fg={statusColor()}>{statusIcon()}</text>{" "}
                  <Show
                    when={tab.isParent}
                    fallback={
                      <>
                        <text fg={isActive() ? theme.accent : theme.secondary}>
                          #{tab.taskNumber}
                        </text>{" "}
                        {tab.shortName}
                      </>
                    }
                  >
                    <text fg={theme.error}>◆ main</text>
                  </Show>
                </text>

                {/* Controls for subagent tabs */}
                <Show when={!tab.isParent}>
                  {/* Split/unsplit button */}
                  <Show when={isSplit()}>
                    <text fg={theme.warning}>◀</text>
                  </Show>
                  <Show when={!isActive() && !isSplit()}>
                    <text fg={theme.textMuted}>▶</text>
                  </Show>
                  {/* Close button */}
                  <text fg={theme.textMuted}>×</text>
                </Show>
              </box>
            )
          }}
        </For>

        {/* Spacer */}
        <box flexGrow={1} />
      </box>
    </Show>
  )
}

// Helper functions

function extractAgentType(title: string): string | undefined {
  const match = title.match(/@([a-z-]+)\s+subagent/i)
  return match ? match[1] : undefined
}

function extractShortName(title: string): string {
  if (!title) return "task"

  let shortName = title.replace(/\s*\(@[a-z-]+\s+subagent\)\s*$/i, "").trim()

  if (!shortName) {
    const agentType = extractAgentType(title)
    return agentType || "task"
  }

  return shortName.toLowerCase()
}
