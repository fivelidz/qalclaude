// QalClaude Status Bar Component
// Shows connection status, agent info, and usage

import React from "react"
import { Box, Text } from "ink"

interface Agent {
  name: string
  color: string
  description: string
}

interface StatusBarProps {
  connected: boolean
  agent: Agent
  usage: { input: number; output: number; cost: number }
  showSidebarHint: boolean
}

export function StatusBar({ connected, agent, usage, showSidebarHint }: StatusBarProps) {
  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      justifyContent="space-between"
    >
      {/* Left: Connection status */}
      <Box>
        <Text color={connected ? "green" : "red"}>
          {connected ? "●" : "○"}
        </Text>
        <Text color="gray"> </Text>
        <Text color={agent.color}>{agent.name}</Text>
        <Text color="gray" dimColor> - {agent.description}</Text>
      </Box>

      {/* Center: Hint */}
      {showSidebarHint && (
        <Box>
          <Text color="gray" dimColor>Ctrl+S: show sidebar</Text>
        </Box>
      )}

      {/* Right: Usage */}
      <Box>
        <Text color="gray">
          {usage.input + usage.output > 0
            ? `${(usage.input + usage.output).toLocaleString()} tokens`
            : ""}
        </Text>
        {usage.cost > 0 && (
          <>
            <Text color="gray"> | </Text>
            <Text color="green">${usage.cost.toFixed(4)}</Text>
          </>
        )}
      </Box>
    </Box>
  )
}
