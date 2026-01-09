// QalClaude Input Box Component
// Multi-line input with Shift+Enter support

import React, { useState } from "react"
import { Box, Text, useInput } from "ink"

interface InputBoxProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  isLoading: boolean
  placeholder?: string
}

export function InputBox({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "Type a message..."
}: InputBoxProps) {
  const [cursorVisible, setCursorVisible] = useState(true)

  // Blink cursor
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  useInput((input, key) => {
    if (isLoading) return

    if (key.return) {
      if (key.shift) {
        // Shift+Enter: new line
        onChange(value + "\n")
      } else {
        // Enter: submit
        onSubmit(value)
      }
      return
    }

    if (key.backspace || key.delete) {
      onChange(value.slice(0, -1))
      return
    }

    if (key.escape) {
      onChange("")
      return
    }

    // Regular character input
    if (input && !key.ctrl && !key.meta) {
      onChange(value + input)
    }
  })

  const lines = value.split("\n")
  const displayValue = value || placeholder
  const isPlaceholder = !value

  return (
    <Box
      borderStyle="single"
      borderColor={isLoading ? "gray" : "cyan"}
      paddingX={1}
      flexDirection="column"
    >
      <Box>
        <Text color={isLoading ? "gray" : "cyan"}>▸ </Text>
        <Text color={isPlaceholder ? "gray" : "white"} dimColor={isPlaceholder}>
          {displayValue}
        </Text>
        {!isLoading && cursorVisible && <Text color="cyan">█</Text>}
      </Box>

      {lines.length > 1 && (
        <Box paddingLeft={2}>
          <Text color="gray" dimColor>
            ({lines.length} lines)
          </Text>
        </Box>
      )}

      <Box>
        <Text color="gray" dimColor>
          Enter: send | Shift+Enter: newline | Esc: clear
        </Text>
      </Box>
    </Box>
  )
}
