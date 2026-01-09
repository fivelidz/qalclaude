// QalClaude Header Component

import { Show } from "solid-js"
import { theme, type TodoItem } from "../tui/app"

interface HeaderProps {
  agent: { name: string; color: string; description: string }
  model: string
  usage: { input: number; output: number; cost: number }
  isLoading: boolean
  interruptCount: number
  todos: TodoItem[]
}

export function Header(props: HeaderProps) {
  const inProgressTodo = () => props.todos.find(t => t.status === "in_progress")
  const completedCount = () => props.todos.filter(t => t.status === "completed").length

  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      borderStyle="single"
      borderColor={theme.border}
    >
      {/* Left side */}
      <box flexDirection="row" gap={1}>
        <text fg={theme.primary} bold>QalClaude</text>
        <text fg={theme.textMuted}>│</text>
        <text fg={props.agent.color} bold>{props.agent.name}</text>
        <text fg={theme.textMuted}>{props.agent.description}</text>

        {/* Loading indicator */}
        <Show when={props.isLoading}>
          <text fg={theme.textMuted}>│</text>
          <text fg={theme.warning}>◐ working</text>
          <Show when={props.interruptCount > 0}>
            <text fg={theme.error}> ESC to stop</text>
          </Show>
        </Show>

        {/* Todo status */}
        <Show when={props.todos.length > 0}>
          <text fg={theme.textMuted}>│</text>
          <Show when={inProgressTodo()} fallback={
            <text fg={theme.success}>● {completedCount()}/{props.todos.length} tasks</text>
          }>
            <text fg={theme.warning}>◐ {inProgressTodo()!.activeForm}</text>
          </Show>
        </Show>
      </box>

      {/* Right side */}
      <box flexDirection="row" gap={1}>
        <text fg={theme.textMuted}>{props.model.replace("claude-", "")}</text>
        <text fg={theme.textMuted}>│</text>
        <text fg={theme.success}>${props.usage.cost.toFixed(4)}</text>
      </box>
    </box>
  )
}
