// QalClaude Keybind Context Provider

import { createContext, useContext, createSignal, type ParentProps } from "solid-js"
import { useKeyHandler } from "@opentui/solid"

// Keybind configuration
export interface KeybindConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  meta?: boolean
  alt?: boolean
}

// All available keybinds
export interface KeybindsConfig {
  // Global
  command_list: KeybindConfig
  app_exit: KeybindConfig

  // Session
  sidebar_toggle: KeybindConfig
  clear_messages: KeybindConfig
  page_up: KeybindConfig
  page_down: KeybindConfig
  scroll_top: KeybindConfig
  scroll_bottom: KeybindConfig

  // Agent
  agent_cycle: KeybindConfig
  agent_cycle_reverse: KeybindConfig

  // Model
  model_cycle: KeybindConfig

  // Submit
  submit: KeybindConfig
  newline: KeybindConfig
}

// Default keybinds
const defaultKeybinds: KeybindsConfig = {
  command_list: { key: "k", ctrl: true },
  app_exit: { key: "c", ctrl: true },

  sidebar_toggle: { key: "b", ctrl: true },
  clear_messages: { key: "l", ctrl: true },
  page_up: { key: "pageup" },
  page_down: { key: "pagedown" },
  scroll_top: { key: "home" },
  scroll_bottom: { key: "end" },

  agent_cycle: { key: "tab" },
  agent_cycle_reverse: { key: "tab", shift: true },

  model_cycle: { key: "m", ctrl: true },

  submit: { key: "return" },
  newline: { key: "return", shift: true },
}

interface KeybindContextValue {
  keybinds: KeybindsConfig
  match: (name: keyof KeybindsConfig, event: any) => boolean
  print: (name: keyof KeybindsConfig) => string
  setKeybind: (name: keyof KeybindsConfig, config: KeybindConfig) => void
}

const KeybindContext = createContext<KeybindContextValue>()

export function KeybindProvider(props: ParentProps) {
  const [keybinds, setKeybinds] = createSignal<KeybindsConfig>(defaultKeybinds)

  // Check if a key event matches a keybind
  const match = (name: keyof KeybindsConfig, event: any): boolean => {
    const kb = keybinds()[name]
    if (!kb) return false

    const keyMatch = event.key?.toLowerCase() === kb.key?.toLowerCase() ||
                     event.name?.toLowerCase() === kb.key?.toLowerCase()
    const ctrlMatch = !!event.ctrl === !!kb.ctrl
    const shiftMatch = !!event.shift === !!kb.shift
    const metaMatch = !!event.meta === !!kb.meta
    const altMatch = !!event.alt === !!kb.alt

    return keyMatch && ctrlMatch && shiftMatch && metaMatch && altMatch
  }

  // Format keybind for display
  const print = (name: keyof KeybindsConfig): string => {
    const kb = keybinds()[name]
    if (!kb) return ""

    const parts: string[] = []
    if (kb.ctrl) parts.push("Ctrl")
    if (kb.shift) parts.push("Shift")
    if (kb.meta) parts.push("Cmd")
    if (kb.alt) parts.push("Alt")

    // Format key name
    let keyName = kb.key
    if (keyName === "return") keyName = "Enter"
    else if (keyName === "escape") keyName = "Esc"
    else if (keyName === "tab") keyName = "Tab"
    else if (keyName === "pageup") keyName = "PgUp"
    else if (keyName === "pagedown") keyName = "PgDn"
    else if (keyName === "home") keyName = "Home"
    else if (keyName === "end") keyName = "End"
    else keyName = keyName.toUpperCase()

    parts.push(keyName)
    return parts.join("+")
  }

  // Update a keybind
  const setKeybind = (name: keyof KeybindsConfig, config: KeybindConfig) => {
    setKeybinds((kb) => ({ ...kb, [name]: config }))
  }

  const value: KeybindContextValue = {
    get keybinds() {
      return keybinds()
    },
    match,
    print,
    setKeybind,
  }

  return <KeybindContext.Provider value={value}>{props.children}</KeybindContext.Provider>
}

export function useKeybind() {
  const ctx = useContext(KeybindContext)
  if (!ctx) {
    throw new Error("useKeybind must be used within KeybindProvider")
  }
  return ctx
}
