// QalClaude Toast Notification Context

import { createContext, useContext, createSignal, For, Show, type ParentProps } from "solid-js"
import { useTheme, defaultTheme } from "./theme"

export interface Toast {
  id: number
  message: string
  variant: "success" | "error" | "warning" | "info"
  duration?: number
}

interface ToastContextValue {
  show: (toast: Omit<Toast, "id">) => void
  success: (message: string) => void
  error: (message: string | Error) => void
  warning: (message: string) => void
  info: (message: string) => void
  clear: () => void
}

const ToastContext = createContext<ToastContextValue>()

let toastId = 0

export function ToastProvider(props: ParentProps) {
  const [toasts, setToasts] = createSignal<Toast[]>([])

  // Try to get theme, fallback to default
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const show = (toast: Omit<Toast, "id">) => {
    const id = ++toastId
    const duration = toast.duration ?? 3000

    setToasts((prev) => [...prev.slice(-2), { ...toast, id }])

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }

  const value: ToastContextValue = {
    show,
    success: (message) => show({ message, variant: "success" }),
    error: (message) => show({ message: message instanceof Error ? message.message : message, variant: "error" }),
    warning: (message) => show({ message, variant: "warning" }),
    info: (message) => show({ message, variant: "info" }),
    clear: () => setToasts([]),
  }

  const getColor = (variant: Toast["variant"]) => {
    switch (variant) {
      case "success": return theme.success
      case "error": return theme.error
      case "warning": return theme.warning
      case "info": return theme.info
      default: return theme.text
    }
  }

  const getIcon = (variant: Toast["variant"]) => {
    switch (variant) {
      case "success": return "✓"
      case "error": return "✗"
      case "warning": return "!"
      case "info": return "i"
      default: return "•"
    }
  }

  return (
    <ToastContext.Provider value={value}>
      {props.children}
      <Show when={toasts().length > 0}>
        <box
          position="absolute"
          bottom={2}
          right={2}
          flexDirection="column"
          gap={1}
        >
          <For each={toasts()}>
            {(toast) => (
              <box
                paddingLeft={1}
                paddingRight={1}
                borderStyle="single"
                borderColor={getColor(toast.variant)}
              >
                <text fg={getColor(toast.variant)}>
                  {getIcon(toast.variant)} {toast.message}
                </text>
              </box>
            )}
          </For>
        </box>
      </Show>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return ctx
}
