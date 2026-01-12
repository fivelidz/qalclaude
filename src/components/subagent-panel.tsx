// QalClaude Subagent Panel - Tabbed view for monitoring active subagents

import { createMemo, createSignal, createEffect, For, Show, batch } from "solid-js"
import type { Accessor, Setter } from "solid-js"
import { useTheme, defaultTheme } from "../context/theme"
import { useSync, type Session, type Part } from "../context/sync"

interface SubagentTab {
  sessionID: string
  title: string
  status: "busy" | "idle" | "error"
  agentType?: string
  shortName: string
  taskNumber: number
  toolCount: number
}

export interface SubagentPanelProps {
  parentSessionID: string
  onNavigateToSession?: (sessionID: string) => void
  minimized?: Accessor<boolean>
  setMinimized?: Setter<boolean>
  activeTabIndex?: Accessor<number>
  setActiveTabIndex?: Setter<number>
}

export function SubagentPanel(props: SubagentPanelProps) {
  const sync = useSync()

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  // Panel state
  const [localMinimized, setLocalMinimized] = createSignal(false)
  const [localActiveTabIndex, setLocalActiveTabIndex] = createSignal(0)

  const minimized = () => (props.minimized ? props.minimized() : localMinimized())
  const setMinimized = (v: boolean | ((prev: boolean) => boolean)) => {
    const setter = props.setMinimized || setLocalMinimized
    if (typeof v === "function") {
      setter(v(minimized()))
    } else {
      setter(v)
    }
  }

  const activeTabIndex = () =>
    props.activeTabIndex ? props.activeTabIndex() : localActiveTabIndex()
  const setActiveTabIndex = (v: number | ((prev: number) => number)) => {
    const setter = props.setActiveTabIndex || setLocalActiveTabIndex
    if (typeof v === "function") {
      setter(v(activeTabIndex()))
    } else {
      setter(v)
    }
  }

  const panelHeight = 10

  // Get all child sessions (subagents) of the parent session
  const childSessions = createMemo(() => {
    return sync.data.session
      .filter((s) => s.parentID === props.parentSessionID)
      .sort((a, b) => a.time.created - b.time.created)
  })

  // Build tabs from child sessions
  const tabs = createMemo((): SubagentTab[] => {
    return childSessions().map((session, index) => {
      const status = sync.data.session_status[session.id]
      const agentType = extractAgentType(session.title)
      const shortName = extractShortName(session.title)

      // Count tools across all messages
      const messages = sync.data.message[session.id] ?? []
      const toolCount = messages.reduce((count, msg) => {
        const parts = sync.data.part[msg.id] ?? []
        return count + parts.filter((p) => p.type === "tool").length
      }, 0)

      return {
        sessionID: session.id,
        title: session.title || "Subagent",
        status: status?.type === "busy" ? "busy" : status?.type === "retry" ? "error" : "idle",
        agentType,
        shortName,
        taskNumber: index + 1,
        toolCount,
      }
    })
  })

  // Currently selected tab
  const activeTab = createMemo(() => {
    const t = tabs()
    const idx = activeTabIndex()
    if (idx >= 0 && idx < t.length) return t[idx]
    return t[0]
  })

  // Sync subagent session data
  createEffect(() => {
    const tab = activeTab()
    if (tab) {
      sync.session.sync(tab.sessionID).catch(() => {})
    }
  })

  // Get messages for active subagent
  const activeMessages = createMemo(() => {
    const tab = activeTab()
    if (!tab) return []
    return sync.data.message[tab.sessionID] ?? []
  })

  // Get latest activity summary
  const latestActivity = createMemo(() => {
    const messages = activeMessages()
    if (messages.length === 0) return null

    const lastAssistant = messages.findLast((m) => m.role === "assistant")
    if (!lastAssistant) return null

    const parts = sync.data.part[lastAssistant.id] ?? []
    return {
      message: lastAssistant,
      parts,
      toolCount: parts.filter((p) => p.type === "tool").length,
      lastTool: parts.findLast((p) => p.type === "tool"),
    }
  })

  // Auto-focus busy tab
  createEffect(() => {
    const t = tabs()
    const busyIndex = t.findIndex((tab) => tab.status === "busy")
    if (busyIndex >= 0 && busyIndex !== activeTabIndex()) {
      const currentTab = t[activeTabIndex()]
      if (!currentTab || currentTab.status !== "busy") {
        setActiveTabIndex(busyIndex)
        if (minimized()) {
          setMinimized(false)
        }
      }
    }
  })

  const hasSubagents = createMemo(() => tabs().length > 0)

  return (
    <Show when={hasSubagents()}>
      <box flexShrink={0} borderStyle="single" borderColor={theme.border}>
        {/* Tab bar */}
        <box flexDirection="row" paddingLeft={1} paddingRight={1} gap={1} flexShrink={0}>
          {/* Toggle button */}
          <text fg={theme.textMuted}>{minimized() ? "▶" : "▼"}</text>

          <text fg={theme.text}>
            <b>Subagents</b>
          </text>

          <text fg={theme.border}>│</text>

          {/* Tabs */}
          <For each={tabs()}>
            {(tab, index) => {
              const isActive = () => index() === activeTabIndex()
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
                <box paddingLeft={1} paddingRight={1}>
                  <text fg={isActive() ? theme.text : theme.textMuted}>
                    <text fg={statusColor()}>{statusIcon()}</text>
                    <text fg={theme.accent}> #{tab.taskNumber}</text> {tab.shortName}
                    <text fg={theme.textMuted}> ({tab.toolCount})</text>
                  </text>
                </box>
              )
            }}
          </For>

          {/* Tab counter */}
          <box flexGrow={1} />
          <text fg={theme.textMuted}>
            {activeTabIndex() + 1}/{tabs().length}
          </text>
        </box>

        {/* Panel content */}
        <Show when={!minimized() && activeTab()}>
          <box height={panelHeight} paddingLeft={2} paddingRight={2} paddingTop={1}>
            {/* Session header */}
            <box flexDirection="row" gap={2} flexShrink={0}>
              <text fg={theme.accent}>
                <b>#{activeTab()?.taskNumber}</b>
              </text>
              <text fg={theme.secondary}>
                <b>@{activeTab()?.agentType || "subagent"}</b>
              </text>
              <text fg={theme.text}>
                <b>{activeTab()?.shortName}</b>
              </text>
              <text fg={theme.textMuted}>({activeTab()?.toolCount} tools)</text>
            </box>

            {/* Recent activity */}
            <Show
              when={latestActivity()}
              fallback={<text fg={theme.textMuted}>Waiting for activity...</text>}
            >
              <box marginTop={1}>
                <For each={latestActivity()?.parts.slice(-6) ?? []}>
                  {(part) => (
                    <Show when={part.type === "tool"}>
                      <text fg={getToolStatusColor(part, theme)}>
                        {getToolIcon(part)} {formatToolSummary(part)}
                      </text>
                    </Show>
                  )}
                </For>
              </box>
            </Show>

            {/* Text preview */}
            <Show when={latestActivity()?.parts.some((p) => p.type === "text")}>
              <box marginTop={1} paddingLeft={1}>
                <For each={latestActivity()?.parts.filter((p) => p.type === "text").slice(-1) ?? []}>
                  {(part) => (
                    <text fg={theme.textMuted}>{truncateText(part.text || "", 150)}</text>
                  )}
                </For>
              </box>
            </Show>

            {/* Footer */}
            <box flexDirection="row" gap={2} flexShrink={0} marginTop={1}>
              <text fg={theme.accent}>
                <b>[ Focus Session ]</b>
              </text>
              <text fg={theme.textMuted}>Click tabs to switch</text>
            </box>
          </box>
        </Show>
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

  shortName = shortName.toLowerCase()

  if (shortName.length > 20) {
    const truncated = shortName.slice(0, 20)
    const lastSpace = truncated.lastIndexOf(" ")
    if (lastSpace > 10) {
      return truncated.slice(0, lastSpace) + "…"
    }
    return truncated + "…"
  }

  return shortName
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return ""
  const cleaned = text.trim().replace(/\n+/g, " ")
  if (cleaned.length <= maxLen) return cleaned
  return cleaned.slice(0, maxLen - 3) + "..."
}

function getToolIcon(part: Part): string {
  if (part.type !== "tool") return "?"
  const tool = part.tool || ""
  switch (tool) {
    case "bash":
      return "#"
    case "read":
      return "→"
    case "write":
      return "←"
    case "edit":
      return "✎"
    case "glob":
      return "✱"
    case "grep":
      return "✱"
    case "list":
      return "▤"
    case "task":
      return "◉"
    case "webfetch":
      return "⇣"
    case "todowrite":
      return "☑"
    case "todoread":
      return "☐"
    default:
      return "⚙"
  }
}

function getToolStatusColor(part: Part, theme: typeof defaultTheme): string {
  if (part.type !== "tool") return theme.textMuted
  const status = part.state?.status
  switch (status) {
    case "completed":
      return theme.success
    case "error":
      return theme.error
    case "pending":
      return theme.warning
    default:
      return theme.textMuted
  }
}

function formatToolSummary(part: Part): string {
  if (part.type !== "tool") return ""
  const tool = part.tool || ""
  const input = part.state?.input ?? {}

  switch (tool) {
    case "bash":
      return `${input.description || "Shell"}: ${truncateText(input.command || "", 50)}`
    case "read":
      return `Read ${truncateText(input.filePath || input.file_path || "", 50)}`
    case "write":
      return `Write ${truncateText(input.filePath || input.file_path || "", 50)}`
    case "edit":
      return `Edit ${truncateText(input.filePath || input.file_path || "", 50)}`
    case "glob":
      return `Glob "${input.pattern}" (${part.state?.metadata?.count ?? "..."} matches)`
    case "grep":
      return `Grep "${input.pattern}" (${part.state?.metadata?.matches ?? "..."} matches)`
    case "task":
      return `Subtask: ${input.description || "..."}`
    case "webfetch":
      return `Fetch ${truncateText(input.url || "", 50)}`
    case "todowrite":
      return `Todo: ${part.state?.metadata?.todos?.length ?? "?"} items`
    default:
      return tool
  }
}

// Export helper for creating controlled state
export function createSubagentPanelState() {
  const [minimized, setMinimized] = createSignal(false)
  const [activeTabIndex, setActiveTabIndex] = createSignal(0)

  return {
    minimized,
    setMinimized,
    activeTabIndex,
    setActiveTabIndex,
    toggle: () => setMinimized((prev) => !prev),
    nextTab: (tabCount: number) => {
      if (tabCount === 0) return
      setActiveTabIndex((prev) => (prev + 1) % tabCount)
    },
    prevTab: (tabCount: number) => {
      if (tabCount === 0) return
      setActiveTabIndex((prev) => (prev - 1 + tabCount) % tabCount)
    },
  }
}
