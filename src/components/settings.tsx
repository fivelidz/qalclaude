// QalClaude Settings Dialog

import React, { useState } from "react"
import { Box, Text, useInput } from "ink"

export interface Settings {
  theme: string
  showSidebar: boolean
  showCost: boolean
  showTokens: boolean
  autoSave: boolean
  vimMode: boolean
  soundEnabled: boolean
  animationsEnabled: boolean
  streamingSpeed: "slow" | "normal" | "fast"
  maxContextTokens: number
  defaultAgent: string
  defaultModel: string
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "catppuccin",
  showSidebar: true,
  showCost: true,
  showTokens: true,
  autoSave: true,
  vimMode: false,
  soundEnabled: false,
  animationsEnabled: true,
  streamingSpeed: "normal",
  maxContextTokens: 200000,
  defaultAgent: "coder",
  defaultModel: "claude-opus-4-5-20251101"
}

interface SettingItem {
  key: keyof Settings
  label: string
  type: "boolean" | "select" | "number"
  options?: string[]
  min?: number
  max?: number
}

const SETTING_ITEMS: SettingItem[] = [
  { key: "showSidebar", label: "Show Sidebar", type: "boolean" },
  { key: "showCost", label: "Show Cost", type: "boolean" },
  { key: "showTokens", label: "Show Tokens", type: "boolean" },
  { key: "autoSave", label: "Auto-save Sessions", type: "boolean" },
  { key: "vimMode", label: "Vim Keybindings", type: "boolean" },
  { key: "animationsEnabled", label: "Animations", type: "boolean" },
  { key: "streamingSpeed", label: "Streaming Speed", type: "select", options: ["slow", "normal", "fast"] },
  { key: "maxContextTokens", label: "Max Context Tokens", type: "number", min: 10000, max: 200000 },
]

interface SettingsDialogProps {
  settings: Settings
  onUpdate: (settings: Settings) => void
  onClose: () => void
}

export function SettingsDialog({ settings, onUpdate, onClose }: SettingsDialogProps) {
  const [cursor, setCursor] = useState(0)
  const [localSettings, setLocalSettings] = useState(settings)

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
      setCursor(c => Math.min(SETTING_ITEMS.length - 1, c + 1))
      return
    }

    const item = SETTING_ITEMS[cursor]

    if (key.return || input === " ") {
      if (item.type === "boolean") {
        setLocalSettings(s => ({
          ...s,
          [item.key]: !s[item.key]
        }))
      }
      return
    }

    if (key.leftArrow || key.rightArrow) {
      if (item.type === "select" && item.options) {
        const currentIndex = item.options.indexOf(localSettings[item.key] as string)
        const newIndex = key.rightArrow
          ? (currentIndex + 1) % item.options.length
          : (currentIndex - 1 + item.options.length) % item.options.length
        setLocalSettings(s => ({
          ...s,
          [item.key]: item.options![newIndex]
        }))
      }

      if (item.type === "number") {
        const current = localSettings[item.key] as number
        const step = item.key === "maxContextTokens" ? 10000 : 1
        const newValue = key.rightArrow
          ? Math.min(item.max || 999999, current + step)
          : Math.max(item.min || 0, current - step)
        setLocalSettings(s => ({
          ...s,
          [item.key]: newValue
        }))
      }
      return
    }

    // Save on Ctrl+S
    if (key.ctrl && input === "s") {
      onUpdate(localSettings)
      onClose()
      return
    }
  })

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>Settings</Text>
      </Box>

      <Box flexDirection="column">
        {SETTING_ITEMS.map((item, i) => {
          const isSelected = i === cursor
          const value = localSettings[item.key]

          return (
            <Box key={item.key}>
              <Text color={isSelected ? "cyan" : "white"}>
                {isSelected ? "▸ " : "  "}
                {item.label}:
              </Text>
              <Text> </Text>

              {item.type === "boolean" && (
                <Text color={value ? "green" : "red"}>
                  {value ? "✓ On" : "✗ Off"}
                </Text>
              )}

              {item.type === "select" && (
                <Box>
                  <Text color="gray">◀ </Text>
                  <Text color="yellow">{value as string}</Text>
                  <Text color="gray"> ▶</Text>
                </Box>
              )}

              {item.type === "number" && (
                <Box>
                  <Text color="gray">◀ </Text>
                  <Text color="yellow">{(value as number).toLocaleString()}</Text>
                  <Text color="gray"> ▶</Text>
                </Box>
              )}
            </Box>
          )
        })}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color="gray" dimColor>↑↓: navigate | Space/Enter: toggle | ←→: adjust</Text>
        <Text color="gray" dimColor>Ctrl+S: save | Esc: cancel</Text>
      </Box>
    </Box>
  )
}
