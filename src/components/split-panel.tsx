// QalClaude Split Panel View - Side-by-side session monitoring

import { createMemo, createSignal, For, Show, onCleanup } from "solid-js"
import type { Accessor, Setter } from "solid-js"
import { useTheme, defaultTheme } from "../context/theme"
import { useSync, type Part, type Message } from "../context/sync"

export interface SplitSessionPanelProps {
  sessionID: string
  onClose: () => void
  isActive: boolean
  onActivate: () => void
}

export function SplitSessionPanel(props: SplitSessionPanelProps) {
  const sync = useSync()

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const session = createMemo(() => sync.session.get(props.sessionID))
  const messages = createMemo(() => sync.data.message[props.sessionID] ?? [])
  const status = createMemo(() => sync.data.session_status[props.sessionID])

  // Extract short title
  const shortTitle = createMemo(() => {
    const s = session()
    if (!s) return "Session"
    let title = s.title || "Subagent"
    title = title.replace(/\s*\(@[a-z-]+\s+subagent\)\s*$/i, "").trim()
    if (title.length > 30) {
      return title.slice(0, 27) + "..."
    }
    return title
  })

  const statusColor = createMemo(() => {
    const s = status()
    if (!s) return theme.textMuted
    switch (s.type) {
      case "busy":
        return theme.warning
      case "retry":
        return theme.error
      default:
        return theme.success
    }
  })

  const statusIcon = createMemo(() => {
    const s = status()
    if (!s) return "○"
    switch (s.type) {
      case "busy":
        return "●"
      case "retry":
        return "!"
      default:
        return "○"
    }
  })

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      borderStyle="single"
      borderColor={props.isActive ? theme.accent : theme.border}
    >
      {/* Header */}
      <box flexDirection="row" paddingLeft={1} paddingRight={1} flexShrink={0}>
        <text fg={statusColor()}>{statusIcon()}</text>
        <text fg={theme.text} paddingLeft={1} flexGrow={1}>
          {shortTitle()}
        </text>
        <text fg={theme.textMuted}>×</text>
      </box>

      {/* Message list */}
      <box flexGrow={1} paddingLeft={1} paddingRight={1} flexDirection="column">
        <For each={messages().slice(-10)}>
          {(message) => (
            <Show when={message.role === "user"}>
              <SplitUserMessage
                message={message}
                parts={sync.data.part[message.id] ?? []}
              />
            </Show>
          )}
        </For>
        <For each={messages().slice(-10)}>
          {(message) => (
            <Show when={message.role === "assistant"}>
              <SplitAssistantMessage
                message={message}
                parts={sync.data.part[message.id] ?? []}
              />
            </Show>
          )}
        </For>
      </box>

      {/* Status bar */}
      <box paddingLeft={1} flexShrink={0}>
        <text fg={theme.textMuted}>
          {status()?.type === "busy" ? "Working..." : "Idle"} · {messages().length} messages
        </text>
      </box>
    </box>
  )
}

function SplitUserMessage(props: { message: Message; parts: Part[] }) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const text = createMemo(
    () => props.parts.find((x) => x.type === "text" && !x.synthetic)?.text || ""
  )

  return (
    <Show when={text()}>
      <box marginTop={1} paddingLeft={1}>
        <text fg={theme.text}>
          {text().length > 100 ? text().slice(0, 97) + "..." : text()}
        </text>
      </box>
    </Show>
  )
}

function SplitAssistantMessage(props: { message: Message; parts: Part[] }) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const textParts = createMemo(() =>
    props.parts.filter((p) => p.type === "text").slice(0, 2)
  )
  const toolParts = createMemo(() => props.parts.filter((p) => p.type === "tool"))

  return (
    <box marginTop={1} paddingLeft={2} flexDirection="column">
      {/* Show first text snippet */}
      <For each={textParts()}>
        {(part) => (
          <text fg={theme.text}>
            {(part.text || "").length > 80
              ? (part.text || "").slice(0, 77) + "..."
              : (part.text || "").slice(0, 80)}
          </text>
        )}
      </For>

      {/* Show tool summary */}
      <Show when={toolParts().length > 0}>
        <text fg={theme.textMuted}>
          {toolParts().length} tool{toolParts().length > 1 ? "s" : ""}:{" "}
          {toolParts()
            .slice(0, 3)
            .map((t) => t.tool)
            .join(", ")}
          {toolParts().length > 3 ? ` +${toolParts().length - 3} more` : ""}
        </text>
      </Show>
    </box>
  )
}

// Container for multiple split panels
export interface SplitPanelContainerProps {
  splitSessionIDs: Accessor<Set<string>>
  onCloseSplit: (sessionID: string) => void
  activeSessionID: Accessor<string | undefined>
  onActivateSession: (sessionID: string) => void
}

export function SplitPanelContainer(props: SplitPanelContainerProps) {
  const splitArray = createMemo(() => Array.from(props.splitSessionIDs()))

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  return (
    <Show when={splitArray().length > 0}>
      <box flexDirection="row" flexGrow={1} minHeight={10} maxHeight={20}>
        <For each={splitArray()}>
          {(sessionID) => (
            <SplitSessionPanel
              sessionID={sessionID}
              onClose={() => props.onCloseSplit(sessionID)}
              isActive={props.activeSessionID() === sessionID}
              onActivate={() => props.onActivateSession(sessionID)}
            />
          )}
        </For>
      </box>
    </Show>
  )
}

// Helper to create split panel state
export function createSplitPanelState() {
  const [splitSessionIDs, setSplitSessionIDs] = createSignal<Set<string>>(new Set())
  const [activeSessionID, setActiveSessionID] = createSignal<string | undefined>()

  return {
    splitSessionIDs,
    activeSessionID,
    setActiveSessionID,
    addSplit: (sessionID: string) => {
      setSplitSessionIDs((prev) => {
        const next = new Set(prev)
        next.add(sessionID)
        return next
      })
    },
    removeSplit: (sessionID: string) => {
      setSplitSessionIDs((prev) => {
        const next = new Set(prev)
        next.delete(sessionID)
        return next
      })
    },
    toggleSplit: (sessionID: string) => {
      setSplitSessionIDs((prev) => {
        const next = new Set(prev)
        if (next.has(sessionID)) {
          next.delete(sessionID)
        } else {
          next.add(sessionID)
        }
        return next
      })
    },
    hasSplit: (sessionID: string) => splitSessionIDs().has(sessionID),
    clearSplits: () => setSplitSessionIDs(new Set<string>()),
  }
}
