// QalClaude Command Context Provider

import {
  createContext,
  useContext,
  createSignal,
  createMemo,
  onCleanup,
  type ParentProps,
  type Accessor,
} from "solid-js"
import { useKeyHandler } from "@opentui/solid"
import { useDialog } from "./dialog"
import { useKeybind, type KeybindsConfig } from "./keybind"

export interface CommandOption {
  value: string
  label: string
  description?: string
  category?: string
  keybind?: keyof KeybindsConfig
  suggested?: boolean
  disabled?: boolean
  onSelect: () => void
}

interface CommandContextValue {
  // Register commands (returns cleanup function)
  register: (commands: () => CommandOption[]) => void
  // Trigger a command by name
  trigger: (name: string) => void
  // Show command palette
  show: () => void
  // Get all registered commands
  commands: () => CommandOption[]
  // Suspend keybind handling (for input focus)
  suspend: () => void
  resume: () => void
  isSuspended: () => boolean
}

const CommandContext = createContext<CommandContextValue>()

export function CommandProvider(props: ParentProps) {
  const [registrations, setRegistrations] = createSignal<Accessor<CommandOption[]>[]>([])
  const [suspended, setSuspended] = createSignal(0)
  const dialog = useDialog()
  const keybind = useKeybind()

  // Merge all registered commands
  const commands = createMemo(() => {
    const all = registrations().flatMap((r) => r())

    // Add suggested commands at the top
    const suggested = all.filter((c) => c.suggested)
    const regular = all.filter((c) => !c.suggested)

    return [
      ...suggested.map((c) => ({ ...c, category: "Suggested" })),
      ...regular,
    ]
  })

  const isSuspended = () => suspended() > 0

  // Handle global keybinds for commands
  useKeyHandler((evt: any) => {
    if (isSuspended()) return
    if (dialog.isOpen()) return

    // Check for command palette trigger
    if (keybind.match("command_list", evt)) {
      show()
      return
    }

    // Check for command keybinds
    for (const cmd of commands()) {
      if (cmd.keybind && !cmd.disabled && keybind.match(cmd.keybind, evt)) {
        cmd.onSelect()
        return
      }
    }
  }, {})

  const show = async () => {
    const { CommandPalette } = await import("../dialogs/command-palette")
    dialog.replace(<CommandPalette commands={commands()} onSelect={(cmd) => {
      dialog.clear()
      cmd.onSelect()
    }} />)
  }

  const value: CommandContextValue = {
    register: (commandsFn) => {
      const accessor = createMemo(commandsFn)
      setRegistrations((r) => [...r, accessor])
      onCleanup(() => {
        setRegistrations((r) => r.filter((x) => x !== accessor))
      })
    },
    trigger: (name) => {
      const cmd = commands().find((c) => c.value === name)
      if (cmd && !cmd.disabled) {
        cmd.onSelect()
      }
    },
    show: async () => {
      // Dynamic import to avoid circular dependency
      const { CommandPalette } = await import("../dialogs/command-palette")
      dialog.replace(<CommandPalette commands={commands()} onSelect={(cmd) => {
        dialog.clear()
        cmd.onSelect()
      }} />)
    },
    commands,
    suspend: () => setSuspended((s) => s + 1),
    resume: () => setSuspended((s) => Math.max(0, s - 1)),
    isSuspended,
  }

  return <CommandContext.Provider value={value}>{props.children}</CommandContext.Provider>
}

export function useCommand() {
  const ctx = useContext(CommandContext)
  if (!ctx) {
    throw new Error("useCommand must be used within CommandProvider")
  }
  return ctx
}
