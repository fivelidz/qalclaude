// QalClaude Prompt Input Component

import { createSignal, createEffect, Show } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { theme } from "../tui/app"

interface PromptProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  isLoading: boolean
  placeholder?: string
}

export function Prompt(props: PromptProps) {
  const keyboard = useKeyboard()
  const [focused, setFocused] = createSignal(true)

  // Handle keyboard input
  createEffect(() => {
    const key = keyboard()
    if (!key || props.isLoading) return

    // Enter: submit (without shift)
    if (key.key === "return" || key.key === "enter") {
      if (key.shift) {
        // Shift+Enter: new line
        props.onChange(props.value + "\n")
      } else {
        // Enter: submit
        props.onSubmit(props.value)
      }
      return
    }

    // Backspace
    if (key.key === "backspace") {
      props.onChange(props.value.slice(0, -1))
      return
    }

    // Regular character input
    if (key.key.length === 1 && !key.ctrl && !key.meta) {
      props.onChange(props.value + key.key)
    }
  })

  const displayValue = () => props.value || props.placeholder || ""
  const isPlaceholder = () => !props.value
  const lines = () => props.value.split("\n").length

  return (
    <box
      flexDirection="column"
      borderStyle="single"
      borderColor={props.isLoading ? theme.textMuted : theme.primary}
      paddingX={1}
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
        <Show when={props.isLoading}>
          <text fg={theme.warning}>Esc: interrupt</text>
        </Show>
      </box>
    </box>
  )
}
