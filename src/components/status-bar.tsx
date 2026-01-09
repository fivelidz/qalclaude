// QalClaude Status Bar Component

import { Show } from "solid-js"
import { useTheme, defaultTheme } from "../context/theme"
import type { Agent } from "../context/agents"

interface StatusBarProps {
  connected: boolean
  agent: Agent
  cwd: string
  claudeVersion: string
}

export function StatusBar(props: StatusBarProps) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      paddingLeft={1}
      paddingRight={1}
      borderStyle="single"
      borderColor={theme.border}
      flexShrink={0}
    >
      {/* Left side */}
      <box flexDirection="row" gap={1}>
        <Show
          when={props.connected}
          fallback={<text fg={theme.error}>● disconnected</text>}
        >
          <text fg={theme.success}>●</text>
        </Show>
        <text fg={props.agent.color}><b>{props.agent.name}</b></text>
        <text fg={theme.textMuted}>- {props.agent.description}</text>
        <Show when={props.agent.permissionMode === "bypassPermissions"}>
          <text fg={theme.error}>⚠️ NO LIMITS</text>
        </Show>
        <Show when={props.agent.permissionMode === "plan"}>
          <text fg={theme.info}>👁️ READ ONLY</text>
        </Show>
      </box>

      {/* Right side */}
      <box flexDirection="row" gap={2}>
        <text fg={theme.textMuted}>{props.cwd}</text>
        <Show when={props.claudeVersion}>
          <text fg={theme.textMuted}>Claude {props.claudeVersion}</text>
        </Show>
      </box>
    </box>
  )
}
