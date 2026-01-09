// QalClaude Todo List Component
// Displays Claude's task list from TodoWrite events

import React from "react"
import { Box, Text } from "ink"

export interface TodoItem {
  content: string
  status: "pending" | "in_progress" | "completed"
  activeForm: string
}

interface TodoListProps {
  todos: TodoItem[]
  compact?: boolean
  showHeader?: boolean
}

const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  pending: { icon: "○", color: "gray" },
  in_progress: { icon: "◐", color: "yellow" },
  completed: { icon: "●", color: "green" }
}

export function TodoList({ todos, compact = false, showHeader = true }: TodoListProps) {
  if (todos.length === 0) {
    return null
  }

  const pending = todos.filter(t => t.status === "pending").length
  const inProgress = todos.filter(t => t.status === "in_progress").length
  const completed = todos.filter(t => t.status === "completed").length

  if (compact) {
    return (
      <Box>
        <Text color="cyan">Tasks: </Text>
        <Text color="green">{completed}✓</Text>
        <Text color="gray"> / </Text>
        <Text color="yellow">{inProgress}◐</Text>
        <Text color="gray"> / </Text>
        <Text color="gray">{pending}○</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1}>
      {showHeader && (
        <Box marginBottom={1}>
          <Text color="cyan" bold>Tasks</Text>
          <Text color="gray"> ({completed}/{todos.length})</Text>
        </Box>
      )}

      {todos.map((todo, i) => {
        const { icon, color } = STATUS_ICONS[todo.status]
        const isActive = todo.status === "in_progress"

        return (
          <Box key={i}>
            <Text color={color}>{icon} </Text>
            <Text
              color={isActive ? "white" : todo.status === "completed" ? "gray" : "white"}
              bold={isActive}
              strikethrough={todo.status === "completed"}
            >
              {isActive ? todo.activeForm : todo.content}
            </Text>
          </Box>
        )
      })}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {completed}/{todos.length} completed
          {inProgress > 0 && ` • ${inProgress} in progress`}
        </Text>
      </Box>
    </Box>
  )
}

// Inline todo status for header/status bar
interface TodoStatusProps {
  todos: TodoItem[]
}

export function TodoStatus({ todos }: TodoStatusProps) {
  if (todos.length === 0) return null

  const inProgress = todos.find(t => t.status === "in_progress")
  const completed = todos.filter(t => t.status === "completed").length

  return (
    <Box>
      {inProgress ? (
        <>
          <Text color="yellow">◐ </Text>
          <Text color="white">{inProgress.activeForm}</Text>
        </>
      ) : (
        <>
          <Text color="green">● </Text>
          <Text color="gray">{completed}/{todos.length} tasks</Text>
        </>
      )}
    </Box>
  )
}

// Parse todo events from Claude
export function parseTodoEvent(event: any): TodoItem[] | null {
  if (event.type === "tool_result" && event.tool_name === "TodoWrite") {
    try {
      const result = JSON.parse(event.content)
      if (Array.isArray(result.todos)) {
        return result.todos
      }
    } catch {
      // Not a todo event
    }
  }
  return null
}
