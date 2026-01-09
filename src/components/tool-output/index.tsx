// QalClaude Tool Output Renderers

import { Show, Switch, Match } from "solid-js"
import { useTheme, defaultTheme } from "../../context/theme"
import { BashOutput } from "./bash"
import { EditOutput, DiffViewer } from "./edit"
import { FileOutput } from "./file"
import { TodoOutput } from "./todo"
import { SearchOutput } from "./search"
import { TaskOutput } from "./task"

export interface ToolCall {
  name: string
  input: Record<string, any>
  output?: string
  status?: "pending" | "running" | "success" | "error"
  duration?: number
}

interface ToolOutputProps {
  tool: ToolCall
  expanded?: boolean
}

export function ToolOutput(props: ToolOutputProps) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const getIcon = () => {
    switch (props.tool.name) {
      case "Bash": return "⚡"
      case "Read": return "📖"
      case "Write": return "📝"
      case "Edit": return "✏️"
      case "Glob": return "🔍"
      case "Grep": return "🔎"
      case "TodoWrite": return "📋"
      case "Task": return "🤖"
      case "WebFetch": return "🌐"
      case "WebSearch": return "🔍"
      default: return "🔧"
    }
  }

  const getStatusColor = () => {
    switch (props.tool.status) {
      case "success": return theme.success
      case "error": return theme.error
      case "running": return theme.warning
      default: return theme.textMuted
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
    <box flexDirection="column" marginTop={1}>
      {/* Tool header */}
      <box gap={1}>
        <text fg={theme.warning}>{getIcon()}</text>
        <text fg={theme.accent}><b>{props.tool.name}</b></text>
        <text fg={getStatusColor()}>{getStatusIcon()}</text>
        <Show when={props.tool.duration}>
          <text fg={theme.textMuted}>({props.tool.duration}ms)</text>
        </Show>
      </box>

      {/* Tool-specific output */}
      <box paddingLeft={2}>
        <Switch fallback={<GenericOutput tool={props.tool} />}>
          <Match when={props.tool.name === "Bash"}>
            <BashOutput tool={props.tool} expanded={props.expanded} />
          </Match>
          <Match when={props.tool.name === "Edit"}>
            <EditOutput tool={props.tool} expanded={props.expanded} />
          </Match>
          <Match when={props.tool.name === "Read" || props.tool.name === "Write"}>
            <FileOutput tool={props.tool} />
          </Match>
          <Match when={props.tool.name === "Glob" || props.tool.name === "Grep"}>
            <SearchOutput tool={props.tool} />
          </Match>
          <Match when={props.tool.name === "TodoWrite"}>
            <TodoOutput tool={props.tool} />
          </Match>
          <Match when={props.tool.name === "Task"}>
            <TaskOutput tool={props.tool} />
          </Match>
        </Switch>
      </box>
    </box>
  )
}

// Generic output for unknown tools
function GenericOutput(props: { tool: ToolCall }) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  // Show input params
  const params = Object.entries(props.tool.input || {})
    .filter(([k, v]) => v !== undefined && v !== null)
    .slice(0, 3)

  return (
    <box flexDirection="column">
      <Show when={params.length > 0}>
        {params.map(([key, value]) => (
          <text fg={theme.textMuted}>
            {key}: {typeof value === "string" ? value.slice(0, 50) : JSON.stringify(value).slice(0, 50)}
          </text>
        ))}
      </Show>
      <Show when={props.tool.output}>
        <text fg={theme.text}>{props.tool.output?.slice(0, 200)}</text>
      </Show>
    </box>
  )
}

// Re-export components
export { BashOutput } from "./bash"
export { EditOutput, DiffViewer } from "./edit"
export { FileOutput } from "./file"
export { TodoOutput } from "./todo"
export { SearchOutput } from "./search"
export { TaskOutput } from "./task"
