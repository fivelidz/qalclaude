// QalClaude Message List Component

import { For, Show } from "solid-js"
import { theme, type Message } from "../tui/app"

interface MessageListProps {
  messages: Message[]
  streamingContent: string
  isLoading: boolean
}

export function MessageList(props: MessageListProps) {
  return (
    <box flexDirection="column" flexGrow={1} overflow="scroll" paddingX={1}>
      <For each={props.messages}>
        {(message) => <MessageItem message={message} />}
      </For>

      {/* Streaming content */}
      <Show when={props.streamingContent}>
        <box marginTop={1}>
          <text fg={theme.secondary} bold>Assistant</text>
        </box>
        <box paddingLeft={2}>
          <text fg={theme.text}>{props.streamingContent}</text>
          <text fg={theme.warning}>▌</text>
        </box>
      </Show>

      {/* Loading indicator */}
      <Show when={props.isLoading && !props.streamingContent}>
        <box marginTop={1}>
          <text fg={theme.warning}>◐ Thinking...</text>
        </box>
      </Show>
    </box>
  )
}

function MessageItem(props: { message: Message }) {
  const roleColors: Record<string, string> = {
    user: theme.accent,
    assistant: theme.secondary,
    system: theme.error,
    tool: theme.warning,
  }

  const roleLabels: Record<string, string> = {
    user: "You",
    assistant: "Assistant",
    system: "System",
    tool: "Tool",
  }

  return (
    <box flexDirection="column" marginTop={1}>
      {/* Role header */}
      <box>
        <text fg={roleColors[props.message.role]} bold>
          {props.message.toolName || roleLabels[props.message.role]}
        </text>
        <text fg={theme.textMuted}> {formatTime(props.message.timestamp)}</text>
      </box>

      {/* Content */}
      <box paddingLeft={2}>
        <Show when={props.message.role === "tool"} fallback={
          <text fg={theme.text} wrap="wrap">{props.message.content}</text>
        }>
          <text fg={theme.textMuted}>{props.message.content}</text>
        </Show>
      </box>
    </box>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
