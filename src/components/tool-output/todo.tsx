// Todo Tool Output Renderer

import { For, Show } from "solid-js"
import { useTheme, defaultTheme } from "../../context/theme"
import type { ToolCall } from "./index"

interface TodoItem {
  content: string
  status: "pending" | "in_progress" | "completed"
  activeForm?: string
}

interface TodoOutputProps {
  tool: ToolCall
}

export function TodoOutput(props: TodoOutputProps) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const todos: TodoItem[] = props.tool.input?.todos || []

  const getIcon = (status: string) => {
    switch (status) {
      case "completed": return "✓"
      case "in_progress": return "►"
      default: return "○"
    }
  }

  const getColor = (status: string) => {
    switch (status) {
      case "completed": return theme.textMuted
      case "in_progress": return theme.success
      default: return theme.accent
    }
  }

  const completedCount = todos.filter((t) => t.status === "completed").length
  const inProgressCount = todos.filter((t) => t.status === "in_progress").length

  return (
    <box flexDirection="column">
      {/* Header */}
      <box gap={2}>
        <text fg={theme.primary}><b>Tasks</b></text>
        <text fg={theme.success}>✓ {completedCount}</text>
        <text fg={theme.warning}>► {inProgressCount}</text>
        <text fg={theme.textMuted}>○ {todos.length - completedCount - inProgressCount}</text>
      </box>

      {/* Todo list */}
      <box flexDirection="column" marginTop={1}>
        <For each={todos}>
          {(todo) => (
            <box gap={1}>
              <text fg={getColor(todo.status)}>{getIcon(todo.status)}</text>
              <text
                fg={todo.status === "completed" ? theme.textMuted : theme.text}
              >
                {todo.status === "completed" ? `~~${todo.content}~~` : todo.content}
              </text>
              <Show when={todo.status === "in_progress" && todo.activeForm}>
                <text fg={theme.warning}>({todo.activeForm})</text>
              </Show>
            </box>
          )}
        </For>
      </box>
    </box>
  )
}

// Standalone todo list component for sidebar
export function TodoList(props: { todos: TodoItem[] }) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const getIcon = (status: string) => {
    switch (status) {
      case "completed": return "✓"
      case "in_progress": return "►"
      default: return "○"
    }
  }

  const getColor = (status: string) => {
    switch (status) {
      case "completed": return theme.textMuted
      case "in_progress": return theme.success
      default: return theme.accent
    }
  }

  return (
    <box flexDirection="column">
      <Show when={props.todos.length === 0}>
        <text fg={theme.textMuted}>No active tasks</text>
      </Show>
      <For each={props.todos}>
        {(todo) => (
          <box>
            <text fg={getColor(todo.status)}>{getIcon(todo.status)} </text>
            <text
              fg={todo.status === "completed" ? theme.textMuted : theme.text}
            >
              {todo.content.slice(0, 30)}
              {todo.content.length > 30 ? "..." : ""}
            </text>
          </box>
        )}
      </For>
    </box>
  )
}
