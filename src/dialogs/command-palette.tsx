// QalClaude Command Palette Dialog

import { createSignal, createMemo, For, Show } from "solid-js"
import { useKeyHandler } from "@opentui/solid"
import { useTheme, defaultTheme } from "../context/theme"
import { useKeybind } from "../context/keybind"
import type { CommandOption } from "../context/command"

interface CommandPaletteProps {
  commands: CommandOption[]
  onSelect: (command: CommandOption) => void
}

export function CommandPalette(props: CommandPaletteProps) {
  const [filter, setFilter] = createSignal("")
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  let keybind: ReturnType<typeof useKeybind> | null = null
  try {
    keybind = useKeybind()
  } catch {}

  // Filter and group commands
  const filteredCommands = createMemo(() => {
    const query = filter().toLowerCase()
    return props.commands.filter((cmd) => {
      if (cmd.disabled) return false
      const matchLabel = cmd.label.toLowerCase().includes(query)
      const matchValue = cmd.value.toLowerCase().includes(query)
      const matchCategory = cmd.category?.toLowerCase().includes(query)
      return matchLabel || matchValue || matchCategory
    })
  })

  // Group by category
  const groupedCommands = createMemo(() => {
    const groups: Record<string, CommandOption[]> = {}
    for (const cmd of filteredCommands()) {
      const cat = cmd.category || "Commands"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(cmd)
    }
    return groups
  })

  // Flat list for navigation
  const flatCommands = createMemo(() => {
    const result: CommandOption[] = []
    for (const category of Object.keys(groupedCommands())) {
      result.push(...groupedCommands()[category])
    }
    return result
  })

  // Handle keyboard input
  useKeyHandler((evt: any) => {
    // Arrow navigation
    if (evt.key === "up" || (evt.key === "k" && evt.ctrl)) {
      setSelectedIndex((i) => Math.max(0, i - 1))
      return
    }
    if (evt.key === "down" || (evt.key === "j" && evt.ctrl)) {
      setSelectedIndex((i) => Math.min(flatCommands().length - 1, i + 1))
      return
    }

    // Enter to select
    if (evt.key === "return" || evt.key === "enter") {
      const cmd = flatCommands()[selectedIndex()]
      if (cmd) {
        props.onSelect(cmd)
      }
      return
    }

    // Backspace
    if (evt.key === "backspace") {
      setFilter((f) => f.slice(0, -1))
      setSelectedIndex(0)
      return
    }

    // Character input
    if (evt.key?.length === 1 && !evt.ctrl && !evt.meta) {
      setFilter((f) => f + evt.key)
      setSelectedIndex(0)
    }
  }, {})

  return (
    <box flexDirection="column" gap={1}>
      {/* Title */}
      <box>
        <text fg={theme.primary}><b>Commands</b></text>
      </box>

      {/* Search input */}
      <box
        borderStyle="single"
        borderColor={theme.border}
        paddingLeft={1}
        paddingRight={1}
      >
        <text fg={theme.textMuted}>🔍 </text>
        <text fg={theme.text}>{filter()}</text>
        <text fg={theme.primary}>█</text>
      </box>

      {/* Command list */}
      <box flexDirection="column" maxHeight={15}>
        <For each={Object.entries(groupedCommands())}>
          {([category, commands]) => (
            <box flexDirection="column">
              {/* Category header */}
              <box marginTop={1}>
                <text fg={theme.textMuted}><b>{category}</b></text>
              </box>

              {/* Commands in category */}
              <For each={commands}>
                {(cmd) => {
                  const isSelected = () => flatCommands()[selectedIndex()] === cmd
                  return (
                    <box
                      paddingLeft={1}
                      backgroundColor={isSelected() ? theme.backgroundElement : undefined}
                    >
                      <box flexGrow={1}>
                        <text fg={isSelected() ? theme.accent : theme.text}>
                          {isSelected() ? "▸ " : "  "}{cmd.label}
                        </text>
                      </box>
                      <Show when={cmd.keybind && keybind}>
                        <text fg={theme.textMuted}>{keybind!.print(cmd.keybind!)}</text>
                      </Show>
                    </box>
                  )
                }}
              </For>
            </box>
          )}
        </For>

        {/* No results */}
        <Show when={flatCommands().length === 0}>
          <text fg={theme.textMuted}>No commands found</text>
        </Show>
      </box>

      {/* Footer */}
      <box marginTop={1}>
        <text fg={theme.textMuted}>↑↓ Navigate  Enter Select  Esc Close</text>
      </box>
    </box>
  )
}
