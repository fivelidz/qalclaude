// QalClaude Toast Notifications

import React, { useState, useEffect } from "react"
import { Box, Text } from "ink"

type ToastVariant = "info" | "success" | "warning" | "error"

interface Toast {
  id: string
  message: string
  title?: string
  variant: ToastVariant
  duration?: number
}

interface ToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

const variantColors: Record<ToastVariant, string> = {
  info: "blue",
  success: "green",
  warning: "yellow",
  error: "red"
}

const variantIcons: Record<ToastVariant, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  error: "✗"
}

export function ToastItem({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  const color = variantColors[toast.variant]
  const icon = variantIcons[toast.variant]

  return (
    <Box
      borderStyle="single"
      borderColor={color}
      paddingX={1}
      marginBottom={1}
    >
      <Text color={color}>{icon} </Text>
      {toast.title && <Text bold>{toast.title}: </Text>}
      <Text>{toast.message}</Text>
    </Box>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <Box
      position="absolute"
      flexDirection="column"
      marginTop={1}
      marginRight={1}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </Box>
  )
}

// Toast hook for easy usage
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (
    message: string,
    variant: ToastVariant = "info",
    title?: string,
    duration?: number
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, message, variant, title, duration }])
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, addToast, dismissToast }
}
