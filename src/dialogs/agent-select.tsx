// QalClaude Agent Selection Dialog

import { createSignal, For, Show } from "solid-js"
import { useKeyHandler } from "@opentui/solid"
import { useTheme, defaultTheme } from "../context/theme"
import { AGENTS, type Agent } from "../context/agents"

interface AgentSelectProps {
  currentAgent: Agent
  onSelect: (agent: Agent) => void
}

export function AgentSelect(props: AgentSelectProps) {
  const currentIndex = AGENTS.findIndex((a) => a.name === props.currentAgent.name)
  const [selectedIndex, setSelectedIndex] = createSignal(currentIndex >= 0 ? currentIndex : 0)

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  useKeyHandler((evt: any) => {
    if (evt.key === "up" || (evt.key === "k" && evt.ctrl)) {
      setSelectedIndex((i) => Math.max(0, i - 1))
      return
    }
    if (evt.key === "down" || (evt.key === "j" && evt.ctrl)) {
      setSelectedIndex((i) => Math.min(AGENTS.length - 1, i + 1))
      return
    }
    if (evt.key === "return" || evt.key === "enter") {
      props.onSelect(AGENTS[selectedIndex()])
      return
    }
  }, {})

  const getPermissionBadge = (agent: Agent) => {
    switch (agent.permissionMode) {
      case "bypassPermissions": return "⚠️ NO LIMITS"
      case "plan": return "👁️ READ ONLY"
      case "acceptEdits": return "✏️ AUTO-EDIT"
      default: return "✓ DEFAULT"
    }
  }

  return (
    <box flexDirection="column" gap={1}>
      <box>
        <text fg={theme.primary}><b>Select Agent</b></text>
      </box>

      <box flexDirection="column">
        <For each={AGENTS}>
          {(agent, i) => {
            const isSelected = () => i() === selectedIndex()
            const isCurrent = () => agent.name === props.currentAgent.name
            return (
              <box
                paddingLeft={1}
                paddingRight={1}
                backgroundColor={isSelected() ? theme.backgroundElement : undefined}
              >
                <box width={20}>
                  <text fg={isSelected() ? agent.color : isCurrent() ? agent.color : theme.text}>
                    {isSelected() ? "▸ " : isCurrent() ? "● " : "  "}
                    <b>{agent.name}</b>
                  </text>
                </box>
                <box width={20}>
                  <text fg={theme.textMuted}>{agent.description}</text>
                </box>
                <text fg={agent.permissionMode === "bypassPermissions" ? theme.error : theme.textMuted}>
                  {getPermissionBadge(agent)}
                </text>
              </box>
            )
          }}
        </For>
      </box>

      {/* Selected agent details */}
      <box marginTop={1} borderStyle="single" borderColor={theme.border} padding={1}>
        <box flexDirection="column">
          <text fg={AGENTS[selectedIndex()].color}>
            <b>{AGENTS[selectedIndex()].name.toUpperCase()}</b>
          </text>
          <text fg={theme.textMuted}>{AGENTS[selectedIndex()].description}</text>
          <Show when={AGENTS[selectedIndex()].systemPrompt}>
            <box marginTop={1}>
              <text fg={theme.textSubtle}>{AGENTS[selectedIndex()].systemPrompt}</text>
            </box>
          </Show>
        </box>
      </box>

      <box marginTop={1}>
        <text fg={theme.textMuted}>↑↓ Navigate  Enter Select  Esc Close  Tab Quick-cycle</text>
      </box>
    </box>
  )
}
