// QalClaude Dialog Context Provider

import {
  createContext,
  useContext,
  createSignal,
  Show,
  type ParentProps,
  type JSX,
  batch,
} from "solid-js"
import { useKeyHandler, useTerminalDimensions } from "@opentui/solid"
import { useTheme, defaultTheme } from "./theme"

interface DialogStackItem {
  element: JSX.Element
  onClose?: () => void
}

interface DialogContextValue {
  // Push a new dialog onto the stack
  push: (element: JSX.Element, onClose?: () => void) => void
  // Replace entire stack with single dialog
  replace: (element: JSX.Element, onClose?: () => void) => void
  // Close top dialog
  pop: () => void
  // Clear all dialogs
  clear: () => void
  // Check if any dialogs open
  isOpen: () => boolean
  // Get stack length
  stackLength: () => number
}

const DialogContext = createContext<DialogContextValue>()

export function DialogProvider(props: ParentProps) {
  const [stack, setStack] = createSignal<DialogStackItem[]>([])
  const dimensions = useTerminalDimensions()

  // Try to get theme
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  // Handle escape to close dialogs
  useKeyHandler((evt: any) => {
    if (evt.key === "escape" && stack().length > 0) {
      const current = stack().at(-1)
      current?.onClose?.()
      setStack((s) => s.slice(0, -1))
    }
  }, {})

  const value: DialogContextValue = {
    push: (element, onClose) => {
      setStack((s) => [...s, { element, onClose }])
    },
    replace: (element, onClose) => {
      // Close all existing dialogs
      for (const item of stack()) {
        item.onClose?.()
      }
      setStack([{ element, onClose }])
    },
    pop: () => {
      const current = stack().at(-1)
      current?.onClose?.()
      setStack((s) => s.slice(0, -1))
    },
    clear: () => {
      for (const item of stack()) {
        item.onClose?.()
      }
      setStack([])
    },
    isOpen: () => stack().length > 0,
    stackLength: () => stack().length,
  }

  return (
    <DialogContext.Provider value={value}>
      {props.children}
      <Show when={stack().length > 0}>
        <box
          position="absolute"
          left={0}
          top={0}
          width={dimensions().width}
          height={dimensions().height}
          alignItems="center"
          justifyContent="center"
        >
          {/* Backdrop */}
          <box
            position="absolute"
            left={0}
            top={0}
            width="100%"
            height="100%"
            backgroundColor="rgba(0,0,0,0.6)"
          />
          {/* Dialog content */}
          <box
            minWidth={50}
            maxWidth={80}
            backgroundColor={theme.backgroundPanel}
            borderStyle="single"
            borderColor={theme.border}
            padding={1}
          >
            {stack().at(-1)?.element}
          </box>
        </box>
      </Show>
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) {
    throw new Error("useDialog must be used within DialogProvider")
  }
  return ctx
}

// Dialog component wrapper for custom dialogs
export function Dialog(props: ParentProps<{ title?: string; onClose?: () => void }>) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  return (
    <box flexDirection="column" gap={1}>
      <Show when={props.title}>
        <box>
          <text fg={theme.primary}><b>{props.title}</b></text>
        </box>
      </Show>
      {props.children}
      <box marginTop={1}>
        <text fg={theme.textMuted}>Press Escape to close</text>
      </box>
    </box>
  )
}
