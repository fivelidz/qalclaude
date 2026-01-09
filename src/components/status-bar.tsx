// QalClaude Status Bar Component

import { Show } from "solid-js"
import { theme } from "../tui/app"

interface StatusBarProps {
  connected: boolean
  agent: { name: string; color: string; description: string }
  cwd: string
  claudeVersion: string
}

export function StatusBar(props: StatusBarProps) {
  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      borderStyle="single"
      borderColor={theme.border}
      flexShrink={0}
    >
      {/* Left side */}
      <box flexDirection="row" gap={1}>
        <Show when={props.connected} fallback={
          <text fg={theme.error}>● disconnected</text>
        }>
          <text fg={theme.success}>●</text>
        </Show>
        <text fg={props.agent.color} bold>{props.agent.name}</text>
        <text fg={theme.textMuted}>- {props.agent.description}</text>
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
