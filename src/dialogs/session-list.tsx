// QalClaude Session List Dialog - Browse and manage sessions

import { createMemo, createSignal, For, Show } from "solid-js"
import { useTheme, defaultTheme } from "../context/theme"
import { useDialog } from "../context/dialog"
import { useSync, type Session } from "../context/sync"

interface SessionListProps {
  currentSessionID?: string
  onSelect: (sessionID: string) => void
  onRename?: (sessionID: string) => void
  onDelete?: (sessionID: string) => void
}

export function SessionList(props: SessionListProps) {
  const dialog = useDialog()
  const sync = useSync()

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const [filter, setFilter] = createSignal("")
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  const [toDelete, setToDelete] = createSignal<string>()

  // Get sessions grouped by date
  const sessions = createMemo(() => {
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    return sync.data.session
      .filter((x) => x.parentID === undefined) // Only root sessions
      .filter((x) => {
        const f = filter().toLowerCase()
        if (!f) return true
        return x.title?.toLowerCase().includes(f) || x.id.toLowerCase().includes(f)
      })
      .sort((a, b) => b.time.updated - a.time.updated)
      .map((x) => {
        const date = new Date(x.time.updated)
        let category = date.toDateString()
        if (category === today) category = "Today"
        else if (category === yesterday) category = "Yesterday"
        return { ...x, category }
      })
      .slice(0, 100)
  })

  // Group sessions by category
  const groupedSessions = createMemo(() => {
    const groups: Record<string, (Session & { category: string })[]> = {}
    for (const s of sessions()) {
      if (!groups[s.category]) groups[s.category] = []
      groups[s.category].push(s)
    }
    return groups
  })

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  return (
    <box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme.border}
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
      width={60}
      height={20}
    >
      {/* Header */}
      <box marginBottom={1}>
        <text fg={theme.primary}>
          <b>Sessions</b>
        </text>
      </box>

      {/* Search */}
      <box marginBottom={1}>
        <text fg={theme.textMuted}>Search: {filter() || "..."}</text>
      </box>

      {/* Session list */}
      <box flexGrow={1} flexDirection="column">
        <For each={Object.entries(groupedSessions())}>
          {([category, items]) => (
            <box flexDirection="column">
              <text fg={theme.secondary}>
                <b>{category}</b>
              </text>
              <For each={items}>
                {(session) => {
                  const isCurrent = session.id === props.currentSessionID
                  const isDeleting = toDelete() === session.id

                  return (
                    <box paddingLeft={2}>
                      <text fg={isDeleting ? theme.error : isCurrent ? theme.accent : theme.text}>
                        {isCurrent ? "▸ " : "  "}
                        {isDeleting
                          ? "Press Ctrl+D again to confirm delete"
                          : session.title || "Untitled"}
                      </text>
                      <text fg={theme.textMuted}> {formatTime(session.time.updated)}</text>
                      <Show when={session.share?.url}>
                        <text fg={theme.success}> (shared)</text>
                      </Show>
                    </box>
                  )
                }}
              </For>
            </box>
          )}
        </For>
        <Show when={sessions().length === 0}>
          <text fg={theme.textMuted}>No sessions found</text>
        </Show>
      </box>

      {/* Footer */}
      <box marginTop={1} flexDirection="row" gap={2}>
        <text fg={theme.textMuted}>Enter: select</text>
        <text fg={theme.textMuted}>Ctrl+R: rename</text>
        <text fg={theme.textMuted}>Ctrl+D: delete</text>
        <text fg={theme.textMuted}>Esc: close</text>
      </box>
    </box>
  )
}

// Standalone dialog component
export function DialogSessionList() {
  const dialog = useDialog()

  return (
    <SessionList
      onSelect={(sessionID) => {
        // Navigate to session
        dialog.clear()
      }}
    />
  )
}
