// QalClaude Command Palette - Like VSCode/qalcode Ctrl+K

import React, { useState, useMemo } from "react"
import { Box, Text, useInput } from "ink"

interface Command {
  id: string
  label: string
  description?: string
  category: string
  keybind?: string
  action: () => void
  disabled?: boolean
}

interface CommandPaletteProps {
  commands: Command[]
  onClose: () => void
}

export function CommandPalette({ commands, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState("")
  const [cursor, setCursor] = useState(0)

  const filteredCommands = useMemo(() => {
    if (!search) return commands.filter(c => !c.disabled)
    const lower = search.toLowerCase()
    return commands.filter(c =>
      !c.disabled && (
        c.label.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower) ||
        c.description?.toLowerCase().includes(lower)
      )
    )
  }, [commands, search])

  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) groups[cmd.category] = []
      groups[cmd.category].push(cmd)
    }
    return groups
  }, [filteredCommands])

  useInput((input, key) => {
    if (key.escape) {
      onClose()
      return
    }

    if (key.upArrow) {
      setCursor(c => Math.max(0, c - 1))
      return
    }

    if (key.downArrow) {
      setCursor(c => Math.min(filteredCommands.length - 1, c + 1))
      return
    }

    if (key.return && filteredCommands[cursor]) {
      filteredCommands[cursor].action()
      onClose()
      return
    }

    if (key.backspace || key.delete) {
      setSearch(s => s.slice(0, -1))
      setCursor(0)
      return
    }

    if (input && !key.ctrl && !key.meta) {
      setSearch(s => s + input)
      setCursor(0)
    }
  })

  let itemIndex = 0

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>Command Palette</Text>
      </Box>

      {/* Search input */}
      <Box borderStyle="single" borderColor="gray" paddingX={1} marginBottom={1}>
        <Text color="cyan">&gt; </Text>
        <Text>{search || <Text color="gray">Type to search commands...</Text>}</Text>
      </Box>

      {/* Commands grouped by category */}
      <Box flexDirection="column" height={15} overflow="hidden">
        {Object.entries(groupedCommands).map(([category, cmds]) => (
          <Box key={category} flexDirection="column">
            <Text color="gray" dimColor bold>{category}</Text>
            {cmds.map(cmd => {
              const isSelected = itemIndex === cursor
              const currentIndex = itemIndex
              itemIndex++
              return (
                <Box key={cmd.id}>
                  <Text color={isSelected ? "cyan" : "white"}>
                    {isSelected ? "▸ " : "  "}
                    {cmd.label}
                  </Text>
                  {cmd.keybind && (
                    <Text color="gray" dimColor> [{cmd.keybind}]</Text>
                  )}
                </Box>
              )
            })}
          </Box>
        ))}

        {filteredCommands.length === 0 && (
          <Text color="gray">No commands found</Text>
        )}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>↑↓: navigate | Enter: run | Esc: close</Text>
      </Box>
    </Box>
  )
}
