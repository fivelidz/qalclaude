// QalClaude Token Usage Display

import React from "react"
import { Box, Text } from "ink"

interface UsageDisplayProps {
  input: number
  output: number
  cost: number
  maxTokens?: number
  compact?: boolean
}

// Format large numbers nicely
function formatTokens(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

// Bar visualization
function createBar(value: number, max: number, width: number): { filled: string; empty: string; percent: number } {
  const percent = Math.min(100, (value / max) * 100)
  const filledWidth = Math.round((percent / 100) * width)
  return {
    filled: "█".repeat(filledWidth),
    empty: "░".repeat(width - filledWidth),
    percent
  }
}

export function UsageDisplay({ input, output, cost, maxTokens = 200000, compact = false }: UsageDisplayProps) {
  const total = input + output
  const bar = createBar(total, maxTokens, compact ? 10 : 20)

  if (compact) {
    return (
      <Box>
        <Text color={bar.percent > 80 ? "red" : bar.percent > 50 ? "yellow" : "green"}>
          {bar.filled}
        </Text>
        <Text color="gray">{bar.empty}</Text>
        <Text color="gray" dimColor> {formatTokens(total)}</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="gray">Tokens: </Text>
        <Text color={bar.percent > 80 ? "red" : bar.percent > 50 ? "yellow" : "green"}>
          {bar.filled}
        </Text>
        <Text color="gray">{bar.empty}</Text>
        <Text color="gray" dimColor> {bar.percent.toFixed(0)}%</Text>
      </Box>

      <Box>
        <Text color="blue">↓ {formatTokens(input)}</Text>
        <Text color="gray"> │ </Text>
        <Text color="magenta">↑ {formatTokens(output)}</Text>
        <Text color="gray"> │ </Text>
        <Text color="green">${cost.toFixed(4)}</Text>
      </Box>
    </Box>
  )
}

// Detailed usage panel
interface UsagePanelProps {
  sessions: Array<{
    name: string
    input: number
    output: number
    cost: number
  }>
  onClose: () => void
}

export function UsagePanel({ sessions, onClose }: UsagePanelProps) {
  const totalInput = sessions.reduce((a, s) => a + s.input, 0)
  const totalOutput = sessions.reduce((a, s) => a + s.output, 0)
  const totalCost = sessions.reduce((a, s) => a + s.cost, 0)

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1}>
      <Text color="cyan" bold>Usage Statistics</Text>

      <Box marginTop={1} flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Session Breakdown:</Text>
        </Box>

        {sessions.map((session, i) => (
          <Box key={i}>
            <Text color="gray">{session.name}: </Text>
            <Text color="blue">{formatTokens(session.input)}↓</Text>
            <Text color="gray"> / </Text>
            <Text color="magenta">{formatTokens(session.output)}↑</Text>
            <Text color="gray"> = </Text>
            <Text color="green">${session.cost.toFixed(4)}</Text>
          </Box>
        ))}

        <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
          <Box flexDirection="column">
            <Text bold>Totals:</Text>
            <Text>Input: <Text color="blue">{formatTokens(totalInput)}</Text></Text>
            <Text>Output: <Text color="magenta">{formatTokens(totalOutput)}</Text></Text>
            <Text>Total: <Text color="cyan">{formatTokens(totalInput + totalOutput)}</Text></Text>
            <Text>Cost: <Text color="green" bold>${totalCost.toFixed(4)}</Text></Text>
          </Box>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>Press Esc to close</Text>
      </Box>
    </Box>
  )
}

// Inline cost badge
interface CostBadgeProps {
  cost: number
  showChange?: boolean
  previousCost?: number
}

export function CostBadge({ cost, showChange, previousCost }: CostBadgeProps) {
  const change = previousCost !== undefined ? cost - previousCost : 0

  return (
    <Box>
      <Text color="green" bold>${cost.toFixed(4)}</Text>
      {showChange && change > 0 && (
        <Text color="yellow" dimColor> (+${change.toFixed(4)})</Text>
      )}
    </Box>
  )
}

// Token counter with animation
interface TokenCounterProps {
  tokens: number
  label?: string
  color?: string
}

export function TokenCounter({ tokens, label, color = "cyan" }: TokenCounterProps) {
  return (
    <Box>
      {label && <Text color="gray">{label}: </Text>}
      <Text color={color} bold>{formatTokens(tokens)}</Text>
    </Box>
  )
}
