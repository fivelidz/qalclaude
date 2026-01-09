// QalClaude Chat View Component
// Displays conversation messages with syntax highlighting

import React from "react"
import { Box, Text } from "ink"
import Spinner from "ink-spinner"

interface Message {
  role: "user" | "assistant" | "system" | "tool"
  content: string
  timestamp: Date
  toolName?: string
}

interface ChatViewProps {
  messages: Message[]
  streamingContent: string
  isLoading: boolean
}

export function ChatView({ messages, streamingContent, isLoading }: ChatViewProps) {
  const roleColors: Record<string, string> = {
    user: "blue",
    assistant: "green",
    system: "yellow",
    tool: "magenta"
  }

  const roleLabels: Record<string, string> = {
    user: "You",
    assistant: "Claude",
    system: "System",
    tool: "Tool"
  }

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      overflow="hidden"
    >
      {/* Messages */}
      {messages.map((msg, i) => (
        <Box key={i} flexDirection="column" marginBottom={1}>
          <Box>
            <Text color={roleColors[msg.role]} bold>
              {msg.toolName ? `[${msg.toolName}]` : roleLabels[msg.role]}
            </Text>
            <Text color="gray" dimColor>
              {" "}
              {msg.timestamp.toLocaleTimeString()}
            </Text>
          </Box>
          <Box paddingLeft={2}>
            <Text wrap="wrap">
              {msg.content.length > 500
                ? msg.content.slice(0, 500) + "..."
                : msg.content}
            </Text>
          </Box>
        </Box>
      ))}

      {/* Streaming content */}
      {streamingContent && (
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color="green" bold>Claude</Text>
            <Text color="cyan"> (streaming)</Text>
          </Box>
          <Box paddingLeft={2}>
            <Text wrap="wrap">{streamingContent}</Text>
          </Box>
        </Box>
      )}

      {/* Loading indicator */}
      {isLoading && !streamingContent && (
        <Box>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text color="gray"> Claude is thinking...</Text>
        </Box>
      )}

      {/* Empty state */}
      {messages.length === 0 && !isLoading && (
        <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
          <Text color="gray">No messages yet</Text>
          <Text color="gray" dimColor>Start typing to chat with Claude</Text>
        </Box>
      )}
    </Box>
  )
}
