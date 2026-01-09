// Task/Subagent Tool Output Renderer

import { Show } from "solid-js"
import { useTheme, defaultTheme } from "../../context/theme"
import type { ToolCall } from "./index"

interface TaskOutputProps {
  tool: ToolCall
}

export function TaskOutput(props: TaskOutputProps) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const description = props.tool.input?.description || ""
  const agentType = props.tool.input?.subagent_type || "general"
  const prompt = props.tool.input?.prompt || ""

  const getAgentColor = () => {
    switch (agentType) {
      case "Explore": return theme.accent
      case "Plan": return theme.secondary
      case "Bash": return theme.warning
      default: return theme.primary
    }
  }

  const getStatusIcon = () => {
    switch (props.tool.status) {
      case "success": return "✓"
      case "error": return "✗"
      case "running": return "◐"
      default: return "○"
    }
  }

  return (
    <box flexDirection="column">
      {/* Task header */}
      <box gap={1}>
        <text fg={theme.warning}>🤖</text>
        <text fg={getAgentColor()}><b>@{agentType}</b></text>
        <text fg={props.tool.status === "success" ? theme.success : props.tool.status === "error" ? theme.error : theme.warning}>
          {getStatusIcon()}
        </text>
      </box>

      {/* Description */}
      <text fg={theme.text}>{description}</text>

      {/* Prompt preview */}
      <Show when={prompt}>
        <box marginTop={1}>
          <text fg={theme.textMuted}>
            "{prompt.slice(0, 60)}{prompt.length > 60 ? "..." : ""}"
          </text>
        </box>
      </Show>

      {/* Output preview */}
      <Show when={props.tool.output}>
        <box
          marginTop={1}
          borderStyle="single"
          borderColor={theme.border}
          paddingLeft={1}
          paddingRight={1}
          maxHeight={5}
        >
          <text fg={theme.textMuted}>
            {props.tool.output?.slice(0, 200)}
            {(props.tool.output?.length || 0) > 200 ? "..." : ""}
          </text>
        </box>
      </Show>
    </box>
  )
}
