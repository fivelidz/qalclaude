// QalClaude MCP Dialog - Manage MCP servers

import { createMemo, createSignal, For, Show } from "solid-js"
import { useTheme, defaultTheme } from "../context/theme"
import { useDialog } from "../context/dialog"
import { useSync, type McpStatus } from "../context/sync"

export function DialogMcp() {
  const dialog = useDialog()
  const sync = useSync()

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const [selectedIndex, setSelectedIndex] = createSignal(0)
  const [loading, setLoading] = createSignal<string | null>(null)

  // Get MCP entries sorted alphabetically
  const mcpEntries = createMemo(() =>
    Object.entries(sync.data.mcp).sort(([a], [b]) => a.localeCompare(b))
  )

  const getStatusColor = (status: McpStatus["status"]) => {
    switch (status) {
      case "connected":
        return theme.success
      case "failed":
        return theme.error
      case "disabled":
        return theme.textMuted
      case "needs_auth":
        return theme.warning
      case "needs_client_registration":
        return theme.error
      default:
        return theme.textMuted
    }
  }

  const getStatusIcon = (status: McpStatus["status"]) => {
    switch (status) {
      case "connected":
        return "✓"
      case "failed":
        return "✗"
      case "disabled":
        return "○"
      case "needs_auth":
        return "⚠"
      default:
        return "?"
    }
  }

  const getStatusText = (status: McpStatus["status"], error?: string) => {
    switch (status) {
      case "connected":
        return "Connected"
      case "failed":
        return error ? `Failed: ${error}` : "Failed"
      case "disabled":
        return "Disabled"
      case "needs_auth":
        return "Needs auth"
      case "needs_client_registration":
        return "Needs client ID"
      default:
        return status
    }
  }

  const handleToggle = async (name: string) => {
    if (loading() !== null) return
    setLoading(name)
    // In a real implementation, this would toggle the MCP via the SDK
    // For now, just simulate a toggle
    setTimeout(() => {
      setLoading(null)
    }, 500)
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
      height={18}
    >
      {/* Header */}
      <box marginBottom={1}>
        <text fg={theme.primary}>
          <b>MCP Servers</b>
        </text>
      </box>

      {/* MCP list */}
      <box flexGrow={1} flexDirection="column">
        <Show
          when={mcpEntries().length > 0}
          fallback={<text fg={theme.textMuted}>No MCP servers configured</text>}
        >
          <For each={mcpEntries()}>
            {([name, status], index) => {
              const isSelected = () => index() === selectedIndex()
              const isLoading = () => loading() === name

              return (
                <box
                  paddingLeft={isSelected() ? 0 : 2}
                  flexDirection="row"
                  gap={1}
                >
                  <Show when={isSelected()}>
                    <text fg={theme.accent}>▸</text>
                  </Show>
                  <Show when={isLoading()} fallback={
                    <text fg={getStatusColor(status.status)}>{getStatusIcon(status.status)}</text>
                  }>
                    <text fg={theme.warning}>⋯</text>
                  </Show>
                  <text fg={isSelected() ? theme.text : theme.textMuted}>
                    {name}
                  </text>
                  <text fg={theme.textMuted}>
                    - {isLoading() ? "Loading..." : getStatusText(status.status, status.error)}
                  </text>
                </box>
              )
            }}
          </For>
        </Show>
      </box>

      {/* Footer */}
      <box marginTop={1} flexDirection="row" gap={2}>
        <text fg={theme.textMuted}>Space: toggle</text>
        <text fg={theme.textMuted}>↑↓: navigate</text>
        <text fg={theme.textMuted}>Esc: close</text>
      </box>
    </box>
  )
}

// LSP Status Dialog
export function DialogLsp() {
  const sync = useSync()

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const getStatusColor = (status: "connected" | "error") => {
    return status === "connected" ? theme.success : theme.error
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
      height={15}
    >
      {/* Header */}
      <box marginBottom={1}>
        <text fg={theme.primary}>
          <b>LSP Servers</b>
        </text>
      </box>

      {/* LSP list */}
      <box flexGrow={1} flexDirection="column">
        <Show
          when={sync.data.lsp.length > 0}
          fallback={
            <box flexDirection="column">
              <text fg={theme.textMuted}>No LSP servers active</text>
              <text fg={theme.textMuted}>LSPs will activate as files are read</text>
            </box>
          }
        >
          <For each={sync.data.lsp}>
            {(lsp) => (
              <box flexDirection="row" gap={1}>
                <text fg={getStatusColor(lsp.status)}>
                  {lsp.status === "connected" ? "●" : "!"}
                </text>
                <text fg={theme.text}>{lsp.id}</text>
                <Show when={lsp.root}>
                  <text fg={theme.textMuted}> ({lsp.root})</text>
                </Show>
              </box>
            )}
          </For>
        </Show>
      </box>

      {/* Footer */}
      <box marginTop={1}>
        <text fg={theme.textMuted}>Esc: close</text>
      </box>
    </box>
  )
}
