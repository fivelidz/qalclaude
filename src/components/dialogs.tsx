// QalClaude Dialog Components

import React, { useState } from "react"
import { Box, Text, useInput } from "ink"

interface DialogProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function Dialog({ title, onClose, children }: DialogProps) {
  useInput((input, key) => {
    if (key.escape) {
      onClose()
    }
  })

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      padding={1}
    >
      <Box marginBottom={1}>
        <Text color="cyan" bold>{title}</Text>
        <Text color="gray"> (Esc to close)</Text>
      </Box>
      {children}
    </Box>
  )
}

interface SelectDialogProps<T> {
  title: string
  items: Array<{ label: string; value: T; description?: string; color?: string }>
  selected: number
  onSelect: (value: T, index: number) => void
  onClose: () => void
}

export function SelectDialog<T>({
  title,
  items,
  selected,
  onSelect,
  onClose
}: SelectDialogProps<T>) {
  const [cursor, setCursor] = useState(selected)

  useInput((input, key) => {
    if (key.escape) {
      onClose()
    } else if (key.upArrow || input === "k") {
      setCursor(c => Math.max(0, c - 1))
    } else if (key.downArrow || input === "j") {
      setCursor(c => Math.min(items.length - 1, c + 1))
    } else if (key.return) {
      onSelect(items[cursor].value, cursor)
      onClose()
    }
  })

  return (
    <Dialog title={title} onClose={onClose}>
      {items.map((item, i) => (
        <Box key={i}>
          <Text color={i === cursor ? "cyan" : "gray"}>
            {i === cursor ? "▸ " : "  "}
          </Text>
          <Text color={item.color || (i === cursor ? "white" : "gray")} bold={i === cursor}>
            {item.label}
          </Text>
          {item.description && (
            <Text color="gray" dimColor> - {item.description}</Text>
          )}
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color="gray" dimColor>↑↓/jk: navigate | Enter: select | Esc: cancel</Text>
      </Box>
    </Dialog>
  )
}

interface HelpDialogProps {
  onClose: () => void
}

export function HelpDialog({ onClose }: HelpDialogProps) {
  const shortcuts = [
    { key: "Tab", action: "Switch agents" },
    { key: "Ctrl+M", action: "Change model" },
    { key: "Ctrl+A", action: "Select agent" },
    { key: "Ctrl+S", action: "Toggle sidebar" },
    { key: "Ctrl+L", action: "Clear chat" },
    { key: "Ctrl+T", action: "Toggle theme" },
    { key: "?", action: "Show this help" },
    { key: "Esc", action: "Close dialogs" },
    { key: "Enter", action: "Send message" },
    { key: "Shift+Enter", action: "New line" },
    { key: "Ctrl+C", action: "Exit" },
  ]

  return (
    <Dialog title="Keyboard Shortcuts" onClose={onClose}>
      {shortcuts.map((s, i) => (
        <Box key={i}>
          <Box width={15}>
            <Text color="cyan">{s.key}</Text>
          </Box>
          <Text color="gray">{s.action}</Text>
        </Box>
      ))}
    </Dialog>
  )
}

interface ModelDialogProps {
  models: string[]
  current: string
  onSelect: (model: string) => void
  onClose: () => void
}

export function ModelDialog({ models, current, onSelect, onClose }: ModelDialogProps) {
  const items = models.map(m => ({
    label: m,
    value: m,
    color: m === current ? "green" : undefined
  }))

  const currentIndex = models.indexOf(current)

  return (
    <SelectDialog
      title="Select Model"
      items={items}
      selected={currentIndex >= 0 ? currentIndex : 0}
      onSelect={onSelect}
      onClose={onClose}
    />
  )
}

interface AgentDialogProps {
  agents: Array<{ name: string; color: string; description: string }>
  current: number
  onSelect: (index: number) => void
  onClose: () => void
}

export function AgentDialog({ agents, current, onSelect, onClose }: AgentDialogProps) {
  const items = agents.map((a, i) => ({
    label: a.name,
    value: i,
    description: a.description,
    color: a.color
  }))

  return (
    <SelectDialog
      title="Select Agent"
      items={items}
      selected={current}
      onSelect={(_, index) => onSelect(index)}
      onClose={onClose}
    />
  )
}
