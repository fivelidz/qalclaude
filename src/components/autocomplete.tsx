// QalClaude Autocomplete - Multi-trigger autocomplete for prompt

import { createMemo, createSignal, createEffect, For, Show } from "solid-js"
import { useTheme, defaultTheme } from "../context/theme"
import { useSync } from "../context/sync"

export interface AutocompleteOption {
  display: string
  aliases?: string[]
  disabled?: boolean
  description?: string
  category?: "file" | "agent" | "command"
  onSelect?: () => void
}

export interface AutocompleteRef {
  onInput: (value: string, cursorPos: number) => void
  onKeyDown: (key: string, ctrl: boolean) => boolean
  visible: false | "@" | "/"
  selectedOption: AutocompleteOption | undefined
}

export interface AutocompleteProps {
  value: string
  cursorPos: number
  sessionID?: string
  onSelectFile?: (path: string) => void
  onSelectAgent?: (name: string) => void
  onSelectCommand?: (command: string) => void
  ref?: (ref: AutocompleteRef) => void
}

export function Autocomplete(props: AutocompleteProps) {
  const sync = useSync()

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const [visible, setVisible] = createSignal<false | "@" | "/">(false)
  const [triggerIndex, setTriggerIndex] = createSignal(0)
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  // Filter text after trigger
  const filter = createMemo(() => {
    if (!visible()) return ""
    const start = triggerIndex() + 1
    const end = props.cursorPos
    if (end < start) return ""
    return props.value.slice(start, end)
  })

  // Available agents (non-built-in)
  const agents = createMemo((): AutocompleteOption[] => {
    return sync.data.agent
      .filter((agent) => !agent.builtIn && agent.mode !== "primary")
      .map((agent) => ({
        display: "@" + agent.name,
        description: agent.description,
        category: "agent" as const,
        onSelect: () => props.onSelectAgent?.(agent.name),
      }))
  })

  // Available commands
  const commands = createMemo((): AutocompleteOption[] => {
    const results: AutocompleteOption[] = []

    // Session commands
    results.push(
      {
        display: "/new",
        aliases: ["/clear"],
        description: "Create a new session",
        category: "command",
        onSelect: () => props.onSelectCommand?.("new"),
      },
      {
        display: "/session",
        aliases: ["/resume", "/continue"],
        description: "List sessions",
        category: "command",
        onSelect: () => props.onSelectCommand?.("session"),
      },
      {
        display: "/models",
        description: "List models",
        category: "command",
        onSelect: () => props.onSelectCommand?.("models"),
      },
      {
        display: "/agents",
        description: "List agents",
        category: "command",
        onSelect: () => props.onSelectCommand?.("agents"),
      },
      {
        display: "/mcp",
        description: "Toggle MCPs",
        category: "command",
        onSelect: () => props.onSelectCommand?.("mcp"),
      },
      {
        display: "/theme",
        description: "Switch theme",
        category: "command",
        onSelect: () => props.onSelectCommand?.("theme"),
      },
      {
        display: "/help",
        description: "Show help",
        category: "command",
        onSelect: () => props.onSelectCommand?.("help"),
      },
      {
        display: "/exit",
        aliases: ["/quit", "/q"],
        description: "Exit the app",
        category: "command",
        onSelect: () => props.onSelectCommand?.("exit"),
      },
      {
        display: "/undo",
        description: "Undo last message",
        category: "command",
        onSelect: () => props.onSelectCommand?.("undo"),
      },
      {
        display: "/redo",
        description: "Redo last message",
        category: "command",
        onSelect: () => props.onSelectCommand?.("redo"),
      },
      {
        display: "/compact",
        aliases: ["/summarize"],
        description: "Compact the session",
        category: "command",
        onSelect: () => props.onSelectCommand?.("compact"),
      },
      {
        display: "/rename",
        description: "Rename session",
        category: "command",
        onSelect: () => props.onSelectCommand?.("rename"),
      },
      {
        display: "/copy",
        description: "Copy transcript to clipboard",
        category: "command",
        onSelect: () => props.onSelectCommand?.("copy"),
      },
      {
        display: "/export",
        description: "Export transcript to file",
        category: "command",
        onSelect: () => props.onSelectCommand?.("export"),
      },
      {
        display: "/share",
        description: "Share session",
        category: "command",
        onSelect: () => props.onSelectCommand?.("share"),
      },
      {
        display: "/thinking",
        description: "Toggle thinking visibility",
        category: "command",
        onSelect: () => props.onSelectCommand?.("thinking"),
      },
      {
        display: "/commands",
        description: "Show all commands",
        category: "command",
        onSelect: () => props.onSelectCommand?.("commands"),
      }
    )

    // Pad display names for alignment
    const maxLen = Math.max(...results.map((r) => r.display.length))
    return results.map((item) => ({
      ...item,
      display: item.display.padEnd(maxLen + 2),
    }))
  })

  // Combined and filtered options
  const options = createMemo((): AutocompleteOption[] => {
    const mode = visible()
    if (!mode) return []

    const source = mode === "@" ? agents() : commands()
    const filterText = filter().toLowerCase()

    if (!filterText) return source.slice(0, 10)

    // Fuzzy match
    return source
      .filter((opt) => {
        const display = opt.display.toLowerCase()
        const desc = opt.description?.toLowerCase() || ""
        const aliases = opt.aliases?.join(" ").toLowerCase() || ""
        return (
          display.includes(filterText) ||
          desc.includes(filterText) ||
          aliases.includes(filterText)
        )
      })
      .slice(0, 10)
  })

  // Reset selection when filter changes
  createEffect(() => {
    filter()
    setSelectedIndex(0)
  })

  // Navigation
  const move = (direction: -1 | 1) => {
    if (!visible()) return
    if (!options().length) return
    let next = selectedIndex() + direction
    if (next < 0) next = options().length - 1
    if (next >= options().length) next = 0
    setSelectedIndex(next)
  }

  const select = () => {
    const selected = options()[selectedIndex()]
    if (!selected) return
    hide()
    selected.onSelect?.()
  }

  const show = (mode: "@" | "/", index: number) => {
    setVisible(mode)
    setTriggerIndex(index)
    setSelectedIndex(0)
  }

  const hide = () => {
    setVisible(false)
  }

  // Expose ref for parent control
  if (props.ref) {
    props.ref({
      get visible() {
        return visible()
      },
      get selectedOption() {
        return options()[selectedIndex()]
      },
      onInput(value: string, cursorPos: number) {
        if (visible()) {
          // Check if we should hide
          if (
            cursorPos <= triggerIndex() ||
            value.slice(triggerIndex(), cursorPos).includes(" ")
          ) {
            hide()
            return
          }
        }
      },
      onKeyDown(key: string, ctrl: boolean) {
        if (visible()) {
          if (key === "ArrowUp" || (ctrl && key === "p")) {
            move(-1)
            return true
          }
          if (key === "ArrowDown" || (ctrl && key === "n")) {
            move(1)
            return true
          }
          if (key === "Escape") {
            hide()
            return true
          }
          if (key === "Enter" || key === "Tab") {
            select()
            return true
          }
        }

        // Trigger autocomplete
        if (!visible()) {
          if (key === "@") {
            const charBefore =
              props.cursorPos === 0 ? "" : props.value[props.cursorPos - 1]
            if (!charBefore || /\s/.test(charBefore)) {
              show("@", props.cursorPos)
            }
          }
          if (key === "/" && props.cursorPos === 0) {
            show("/", 0)
          }
        }

        return false
      },
    })
  }

  const selectedOption = createMemo(() => options()[selectedIndex()])

  return (
    <Show when={visible() && options().length > 0}>
      <box
        flexDirection="column"
        borderStyle="single"
        borderColor={theme.border}
        width={50}
      >
        <For each={options()}>
          {(option, index) => {
            const isSelected = () => index() === selectedIndex()
            return (
              <box paddingLeft={1} paddingRight={1} flexDirection="row">
                <text
                  fg={isSelected() ? theme.primary : theme.text}
                  flexShrink={0}
                >
                  {option.display}
                </text>
                <Show when={option.description}>
                  <text fg={theme.textMuted}>{option.description}</text>
                </Show>
              </box>
            )
          }}
        </For>
        <Show when={options().length === 0}>
          <box paddingLeft={1} paddingRight={1}>
            <text fg={theme.textMuted}>No matching items</text>
          </box>
        </Show>
      </box>
    </Show>
  )
}

// Simple file autocomplete suggestion list
export function FileSuggestions(props: {
  files: string[]
  selectedIndex: number
  onSelect: (file: string) => void
}) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  return (
    <Show when={props.files.length > 0}>
      <box
        flexDirection="column"
        borderStyle="single"
        borderColor={theme.border}
        maxHeight={10}
      >
        <For each={props.files.slice(0, 10)}>
          {(file, index) => {
            const isSelected = () => index() === props.selectedIndex
            return (
              <box paddingLeft={1} paddingRight={1}>
                <text fg={isSelected() ? theme.primary : theme.textMuted}>{file}</text>
              </box>
            )
          }}
        </For>
      </box>
    </Show>
  )
}
