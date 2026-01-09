// QalClaude Prompt Input Component

import { createSignal, Show } from "solid-js"
import { useKeyHandler } from "@opentui/solid"
import { useTheme, defaultTheme } from "../context/theme"

interface PromptProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  isLoading: boolean
  placeholder?: string
  onHistoryUp?: () => void
  onHistoryDown?: () => void
}

export function Prompt(props: PromptProps) {
  const [focused, setFocused] = createSignal(true)

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  // Handle keyboard input
  useKeyHandler((key: any) => {
    if (!key || props.isLoading) return

    // Enter: submit (without shift)
    if (key.key === "return" || key.key === "enter") {
      if (key.shift || key.meta) {
        // Shift+Enter or Meta+Enter: new line
        props.onChange(props.value + "\n")
      } else {
        // Enter: submit
        props.onSubmit(props.value)
      }
      return
    }

    // Arrow up: history
    if (key.key === "up" && !props.value.includes("\n")) {
      props.onHistoryUp?.()
      return
    }

    // Arrow down: history
    if (key.key === "down" && !props.value.includes("\n")) {
      props.onHistoryDown?.()
      return
    }

    // Backspace
    if (key.key === "backspace") {
      props.onChange(props.value.slice(0, -1))
      return
    }

    // Ctrl+U: clear line
    if (key.ctrl && key.key === "u") {
      props.onChange("")
      return
    }

    // Ctrl+W: delete word
    if (key.ctrl && key.key === "w") {
      const words = props.value.split(/\s+/)
      words.pop()
      props.onChange(words.join(" "))
      return
    }

    // Regular character input
    if (key.key.length === 1 && !key.ctrl && !key.meta) {
      props.onChange(props.value + key.key)
    }
  }, {})

  const displayValue = () => props.value || props.placeholder || ""
  const isPlaceholder = () => !props.value
  const lines = () => props.value.split("\n").length

  return (
    <box
      flexDirection="column"
      borderStyle="single"
      borderColor={props.isLoading ? theme.textMuted : theme.primary}
      paddingLeft={1}
      paddingRight={1}
      flexShrink={0}
    >
      {/* Input line */}
      <box flexDirection="row">
        <text fg={props.isLoading ? theme.textMuted : theme.primary}>▸ </text>
        <text fg={isPlaceholder() ? theme.textMuted : theme.text}>
          {displayValue()}
        </text>
        <Show when={!props.isLoading}>
          <text fg={theme.primary}>█</text>
        </Show>
      </box>

      {/* Multi-line indicator */}
      <Show when={lines() > 1}>
        <text fg={theme.textMuted}>({lines()} lines)</text>
      </Show>

      {/* Hints */}
      <box flexDirection="row" gap={2}>
        <text fg={theme.textMuted}>Enter: send</text>
        <text fg={theme.textMuted}>Shift+Enter: newline</text>
        <text fg={theme.textMuted}>↑↓: history</text>
        <Show when={props.isLoading}>
          <text fg={theme.warning}>Esc: interrupt</text>
        </Show>
      </box>
    </box>
  )
}
