// QalClaude Spinner - Knight Rider style animation

import React, { useState, useEffect } from "react"
import { Text } from "ink"

interface SpinnerProps {
  type?: "dots" | "line" | "knight" | "pulse"
  color?: string
  label?: string
}

const DOTS = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
const LINE = ["—", "\\", "|", "/"]
const PULSE = ["◐", "◓", "◑", "◒"]

// Knight Rider style scanner
function generateKnightFrames(width: number = 20): string[] {
  const frames: string[] = []
  const chars = "░▒▓█▓▒░"

  // Forward sweep
  for (let pos = 0; pos < width; pos++) {
    let frame = ""
    for (let i = 0; i < width; i++) {
      const dist = Math.abs(i - pos)
      if (dist < chars.length / 2) {
        frame += chars[Math.floor(chars.length / 2) - dist] || "░"
      } else {
        frame += " "
      }
    }
    frames.push(frame)
  }

  // Backward sweep
  for (let pos = width - 1; pos >= 0; pos--) {
    let frame = ""
    for (let i = 0; i < width; i++) {
      const dist = Math.abs(i - pos)
      if (dist < chars.length / 2) {
        frame += chars[Math.floor(chars.length / 2) - dist] || "░"
      } else {
        frame += " "
      }
    }
    frames.push(frame)
  }

  return frames
}

const KNIGHT_FRAMES = generateKnightFrames(20)

export function Spinner({ type = "dots", color = "cyan", label }: SpinnerProps) {
  const [frame, setFrame] = useState(0)

  const frames = type === "dots" ? DOTS
    : type === "line" ? LINE
    : type === "pulse" ? PULSE
    : KNIGHT_FRAMES

  const interval = type === "knight" ? 50 : 80

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame(f => (f + 1) % frames.length)
    }, interval)

    return () => clearInterval(timer)
  }, [frames.length, interval])

  return (
    <Text color={color}>
      {frames[frame]}
      {label && <Text color="gray"> {label}</Text>}
    </Text>
  )
}

// Simple loading bar
interface LoadingBarProps {
  progress?: number // 0-100, or undefined for indeterminate
  width?: number
  color?: string
}

export function LoadingBar({ progress, width = 20, color = "cyan" }: LoadingBarProps) {
  const [pos, setPos] = useState(0)

  useEffect(() => {
    if (progress === undefined) {
      const timer = setInterval(() => {
        setPos(p => (p + 1) % (width * 2))
      }, 100)
      return () => clearInterval(timer)
    }
  }, [progress, width])

  if (progress !== undefined) {
    const filled = Math.round((progress / 100) * width)
    return (
      <Text>
        <Text color={color}>{"█".repeat(filled)}</Text>
        <Text color="gray">{"░".repeat(width - filled)}</Text>
        <Text color="gray"> {progress}%</Text>
      </Text>
    )
  }

  // Indeterminate
  const bar = Array(width).fill("░")
  const actualPos = pos < width ? pos : width * 2 - pos - 1
  bar[actualPos] = "█"
  if (actualPos > 0) bar[actualPos - 1] = "▓"
  if (actualPos < width - 1) bar[actualPos + 1] = "▓"

  return <Text color={color}>{bar.join("")}</Text>
}
