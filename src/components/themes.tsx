// QalClaude Theme System - Like qalcode's 25+ themes

import React from "react"
import { Box, Text, useInput } from "ink"

export interface Theme {
  name: string
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  error: string
  muted: string
  background: "dark" | "light"
}

export const THEMES: Record<string, Theme> = {
  // Dark themes
  catppuccin: {
    name: "Catppuccin Mocha",
    primary: "#cdd6f4",
    secondary: "#89b4fa",
    accent: "#cba6f7",
    success: "#a6e3a1",
    warning: "#f9e2af",
    error: "#f38ba8",
    muted: "#6c7086",
    background: "dark"
  },
  dracula: {
    name: "Dracula",
    primary: "#f8f8f2",
    secondary: "#bd93f9",
    accent: "#ff79c6",
    success: "#50fa7b",
    warning: "#f1fa8c",
    error: "#ff5555",
    muted: "#6272a4",
    background: "dark"
  },
  tokyoNight: {
    name: "Tokyo Night",
    primary: "#c0caf5",
    secondary: "#7aa2f7",
    accent: "#bb9af7",
    success: "#9ece6a",
    warning: "#e0af68",
    error: "#f7768e",
    muted: "#565f89",
    background: "dark"
  },
  nord: {
    name: "Nord",
    primary: "#eceff4",
    secondary: "#88c0d0",
    accent: "#b48ead",
    success: "#a3be8c",
    warning: "#ebcb8b",
    error: "#bf616a",
    muted: "#4c566a",
    background: "dark"
  },
  gruvbox: {
    name: "Gruvbox Dark",
    primary: "#ebdbb2",
    secondary: "#83a598",
    accent: "#d3869b",
    success: "#b8bb26",
    warning: "#fabd2f",
    error: "#fb4934",
    muted: "#928374",
    background: "dark"
  },
  oneDark: {
    name: "One Dark",
    primary: "#abb2bf",
    secondary: "#61afef",
    accent: "#c678dd",
    success: "#98c379",
    warning: "#e5c07b",
    error: "#e06c75",
    muted: "#5c6370",
    background: "dark"
  },
  synthwave: {
    name: "Synthwave '84",
    primary: "#ffffff",
    secondary: "#00fff9",
    accent: "#ff00ff",
    success: "#72f1b8",
    warning: "#fede5d",
    error: "#fe4450",
    muted: "#848bbd",
    background: "dark"
  },
  monokai: {
    name: "Monokai Pro",
    primary: "#fcfcfa",
    secondary: "#78dce8",
    accent: "#ab9df2",
    success: "#a9dc76",
    warning: "#ffd866",
    error: "#ff6188",
    muted: "#727072",
    background: "dark"
  },
  nightOwl: {
    name: "Night Owl",
    primary: "#d6deeb",
    secondary: "#82aaff",
    accent: "#c792ea",
    success: "#22da6e",
    warning: "#ffeb95",
    error: "#ef5350",
    muted: "#637777",
    background: "dark"
  },
  ayu: {
    name: "Ayu Dark",
    primary: "#bfbdb6",
    secondary: "#59c2ff",
    accent: "#d2a6ff",
    success: "#7fd962",
    warning: "#ffb454",
    error: "#d95757",
    muted: "#626a73",
    background: "dark"
  },
  // Light themes
  solarizedLight: {
    name: "Solarized Light",
    primary: "#657b83",
    secondary: "#268bd2",
    accent: "#6c71c4",
    success: "#859900",
    warning: "#b58900",
    error: "#dc322f",
    muted: "#93a1a1",
    background: "light"
  },
  github: {
    name: "GitHub Light",
    primary: "#24292e",
    secondary: "#0366d6",
    accent: "#6f42c1",
    success: "#22863a",
    warning: "#b08800",
    error: "#cb2431",
    muted: "#6a737d",
    background: "light"
  },
  catppuccinLatte: {
    name: "Catppuccin Latte",
    primary: "#4c4f69",
    secondary: "#1e66f5",
    accent: "#8839ef",
    success: "#40a02b",
    warning: "#df8e1d",
    error: "#d20f39",
    muted: "#9ca0b0",
    background: "light"
  },
  // Special themes
  matrix: {
    name: "Matrix",
    primary: "#00ff00",
    secondary: "#00cc00",
    accent: "#00ff66",
    success: "#00ff00",
    warning: "#ccff00",
    error: "#ff0000",
    muted: "#006600",
    background: "dark"
  },
  cyberpunk: {
    name: "Cyberpunk",
    primary: "#00ffff",
    secondary: "#ff00ff",
    accent: "#ffff00",
    success: "#00ff00",
    warning: "#ff9900",
    error: "#ff0066",
    muted: "#666699",
    background: "dark"
  }
}

export const THEME_NAMES = Object.keys(THEMES)

interface ThemeDialogProps {
  current: string
  onSelect: (theme: string) => void
  onClose: () => void
}

export function ThemeDialog({ current, onSelect, onClose }: ThemeDialogProps) {
  const [cursor, setCursor] = React.useState(THEME_NAMES.indexOf(current) || 0)

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
      setCursor(c => Math.min(THEME_NAMES.length - 1, c + 1))
      return
    }

    if (key.return) {
      onSelect(THEME_NAMES[cursor])
      onClose()
      return
    }
  })

  const darkThemes = THEME_NAMES.filter(n => THEMES[n].background === "dark")
  const lightThemes = THEME_NAMES.filter(n => THEMES[n].background === "light")

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1}>
      <Text color="cyan" bold>Select Theme</Text>

      <Box marginTop={1} flexDirection="column">
        <Text color="gray" dimColor bold>Dark Themes</Text>
        {darkThemes.map(name => {
          const theme = THEMES[name]
          const isSelected = name === THEME_NAMES[cursor]
          const isCurrent = name === current

          return (
            <Box key={name}>
              <Text color={isSelected ? "cyan" : "white"}>
                {isSelected ? "▸ " : "  "}
              </Text>
              <Text color={theme.secondary}>{theme.name}</Text>
              {isCurrent && <Text color="green"> (current)</Text>}
              <Text color="gray"> </Text>
              <Text backgroundColor={theme.primary} color={theme.background === "dark" ? "black" : "white"}> A </Text>
              <Text backgroundColor={theme.secondary}> B </Text>
              <Text backgroundColor={theme.accent}> C </Text>
            </Box>
          )
        })}

        <Box marginTop={1}>
          <Text color="gray" dimColor bold>Light Themes</Text>
        </Box>
        {lightThemes.map(name => {
          const theme = THEMES[name]
          const isSelected = name === THEME_NAMES[cursor]
          const isCurrent = name === current

          return (
            <Box key={name}>
              <Text color={isSelected ? "cyan" : "white"}>
                {isSelected ? "▸ " : "  "}
              </Text>
              <Text color={theme.secondary}>{theme.name}</Text>
              {isCurrent && <Text color="green"> (current)</Text>}
              <Text color="gray"> </Text>
              <Text backgroundColor={theme.primary} color={theme.background === "dark" ? "black" : "white"}> A </Text>
              <Text backgroundColor={theme.secondary}> B </Text>
              <Text backgroundColor={theme.accent}> C </Text>
            </Box>
          )
        })}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>↑↓: select | Enter: apply | Esc: close</Text>
      </Box>
    </Box>
  )
}
