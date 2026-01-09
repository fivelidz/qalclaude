// QalClaude Theme Selection Dialog

import { createSignal, For } from "solid-js"
import { useKeyHandler } from "@opentui/solid"
import { useTheme } from "../context/theme"

interface ThemeSelectProps {
  onSelect: (theme: string, mode: "dark" | "light") => void
}

export function ThemeSelect(props: ThemeSelectProps) {
  const themeCtx = useTheme()
  const [selectedTheme, setSelectedTheme] = createSignal(themeCtx.themeName())
  const [selectedMode, setSelectedMode] = createSignal(themeCtx.mode())

  const themes = themeCtx.availableThemes

  useKeyHandler((evt: any) => {
    if (evt.key === "up") {
      const idx = themes.indexOf(selectedTheme())
      if (idx > 0) setSelectedTheme(themes[idx - 1])
      return
    }
    if (evt.key === "down") {
      const idx = themes.indexOf(selectedTheme())
      if (idx < themes.length - 1) setSelectedTheme(themes[idx + 1])
      return
    }
    if (evt.key === "left" || evt.key === "right") {
      setSelectedMode((m) => m === "dark" ? "light" : "dark")
      return
    }
    if (evt.key === "return" || evt.key === "enter") {
      props.onSelect(selectedTheme(), selectedMode())
      return
    }
  }, {})

  const theme = themeCtx.theme

  return (
    <box flexDirection="column" gap={1}>
      <box>
        <text fg={theme.primary}><b>Select Theme</b></text>
      </box>

      {/* Mode toggle */}
      <box gap={2}>
        <text fg={theme.textMuted}>Mode:</text>
        <text
          fg={selectedMode() === "dark" ? theme.accent : theme.textMuted}
        >
          {selectedMode() === "dark" ? "▸ " : "  "}Dark
        </text>
        <text
          fg={selectedMode() === "light" ? theme.accent : theme.textMuted}
        >
          {selectedMode() === "light" ? "▸ " : "  "}Light
        </text>
      </box>

      {/* Theme list */}
      <box flexDirection="column" marginTop={1}>
        <For each={themes}>
          {(themeName) => {
            const isSelected = () => themeName === selectedTheme()
            const isCurrent = () => themeName === themeCtx.themeName()
            return (
              <box
                paddingLeft={1}
                backgroundColor={isSelected() ? theme.backgroundElement : undefined}
              >
                <text fg={isSelected() ? theme.accent : isCurrent() ? theme.primary : theme.text}>
                  {isSelected() ? "▸ " : isCurrent() ? "● " : "  "}
                  {themeName}
                </text>
              </box>
            )
          }}
        </For>
      </box>

      <box marginTop={1}>
        <text fg={theme.textMuted}>↑↓ Theme  ←→ Mode  Enter Apply  Esc Cancel</text>
      </box>
    </box>
  )
}
