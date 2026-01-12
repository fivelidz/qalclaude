// QalClaude Session Rename Dialog

import { createSignal } from "solid-js"
import { useTheme, defaultTheme } from "../context/theme"
import { useDialog } from "../context/dialog"
import { useSync } from "../context/sync"

interface SessionRenameProps {
  sessionID: string
  currentTitle?: string
  onConfirm: (newTitle: string) => void
}

export function SessionRename(props: SessionRenameProps) {
  const dialog = useDialog()

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const [title, setTitle] = createSignal(props.currentTitle || "")

  const handleConfirm = () => {
    const newTitle = title().trim()
    if (newTitle) {
      props.onConfirm(newTitle)
    }
    dialog.clear()
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
      width={50}
    >
      {/* Header */}
      <box marginBottom={1}>
        <text fg={theme.primary}>
          <b>Rename Session</b>
        </text>
      </box>

      {/* Input */}
      <box marginBottom={1}>
        <text fg={theme.textMuted}>New title: </text>
        <text fg={theme.text}>{title() || "..."}</text>
      </box>

      {/* Footer */}
      <box flexDirection="row" gap={2}>
        <text fg={theme.success}>Enter: confirm</text>
        <text fg={theme.textMuted}>Esc: cancel</text>
      </box>
    </box>
  )
}

// Dialog wrapper
export function DialogSessionRename(props: { sessionID: string }) {
  const dialog = useDialog()
  const sync = useSync()

  const session = sync.session.get(props.sessionID)

  return (
    <SessionRename
      sessionID={props.sessionID}
      currentTitle={session?.title}
      onConfirm={(newTitle) => {
        // Update session title
        const s = sync.session.get(props.sessionID)
        if (s) {
          sync.updateSession({ ...s, title: newTitle })
        }
        dialog.clear()
      }}
    />
  )
}
