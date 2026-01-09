// QalClaude Sidebar Component

import { For } from "solid-js"
import { theme } from "../tui/app"

interface Agent {
  name: string
  color: string
  description: string
}

interface SidebarProps {
  agents: Agent[]
  currentAgent: number
  usage: { input: number; output: number; cost: number }
  cwd: string
}

export function Sidebar(props: SidebarProps) {
  // Format token count
  const formatTokens = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  // Get directory name
  const dirName = () => {
    const parts = props.cwd.split("/")
    return parts[parts.length - 1] || props.cwd
  }

  return (
    <box
      flexDirection="column"
      width={24}
      borderStyle="single"
      borderColor={theme.border}
      paddingLeft={1}
      paddingRight={1}
    >
      {/* Agents */}
      <box marginBottom={1}>
        <text fg={theme.primary}><b>Agents</b></text>
        <text fg={theme.textMuted}> (Tab)</text>
      </box>

      <For each={props.agents}>
        {(agent, i) => (
          <box>
            <text fg={i() === props.currentAgent ? agent.color : theme.textMuted}>
              {i() === props.currentAgent ? "▸ " : "  "}{agent.name}
            </text>
          </box>
        )}
      </For>

      {/* Directory */}
      <box marginTop={1} marginBottom={1}>
        <text fg={theme.primary}><b>Directory</b></text>
      </box>
      <text fg={theme.textMuted}>{dirName()}</text>

      {/* Usage */}
      <box marginTop={1} flexDirection="column">
        <text fg={theme.primary}><b>Usage</b></text>
        <text fg={theme.textMuted}>In: {formatTokens(props.usage.input)}</text>
        <text fg={theme.textMuted}>Out: {formatTokens(props.usage.output)}</text>
        <text fg={theme.success}>${props.usage.cost.toFixed(4)}</text>
      </box>

      {/* Keys */}
      <box marginTop={1} flexDirection="column">
        <text fg={theme.primary}><b>Keys</b></text>
        <text fg={theme.textMuted}>Tab: agents</text>
        <text fg={theme.textMuted}>^B: sidebar</text>
        <text fg={theme.textMuted}>^L: clear</text>
        <text fg={theme.textMuted}>Esc: interrupt</text>
        <text fg={theme.textMuted}>^C: exit</text>
      </box>
    </box>
  )
}
