// QalClaude Sidebar Component
// Shows agents, tools, and usage stats

import React from "react"
import { Box, Text } from "ink"

interface Agent {
  name: string
  color: string
  description: string
}

interface SidebarProps {
  agents: Agent[]
  currentAgent: number
  tools: string[]
  usage: { input: number; output: number; cost: number }
}

export function Sidebar({ agents, currentAgent, tools, usage }: SidebarProps) {
  return (
    <Box
      flexDirection="column"
      width={24}
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
    >
      {/* Agents section */}
      <Box marginBottom={1}>
        <Text bold color="cyan">Agents</Text>
        <Text color="gray"> (Tab)</Text>
      </Box>

      {agents.map((agent, i) => (
        <Box key={agent.name}>
          <Text color={i === currentAgent ? agent.color : "gray"}>
            {i === currentAgent ? "▸ " : "  "}
            {agent.name}
          </Text>
        </Box>
      ))}

      {/* Tools section */}
      <Box marginTop={1} marginBottom={1}>
        <Text bold color="cyan">Tools</Text>
        <Text color="gray"> ({tools.length})</Text>
      </Box>

      <Box flexDirection="column" height={8} overflow="hidden">
        {tools.slice(0, 8).map(tool => (
          <Text key={tool} color="gray" dimColor>
            • {tool.length > 18 ? tool.slice(0, 15) + "..." : tool}
          </Text>
        ))}
      </Box>

      {/* Usage section */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">Usage</Text>
        <Text color="gray">In: {usage.input.toLocaleString()}</Text>
        <Text color="gray">Out: {usage.output.toLocaleString()}</Text>
        <Text color="green">${usage.cost.toFixed(4)}</Text>
      </Box>

      {/* Help */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">Keys</Text>
        <Text color="gray" dimColor>Tab: agents</Text>
        <Text color="gray" dimColor>^S: sidebar</Text>
        <Text color="gray" dimColor>^L: clear</Text>
        <Text color="gray" dimColor>^C: exit</Text>
      </Box>
    </Box>
  )
}
