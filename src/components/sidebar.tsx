// QalClaude Sidebar Component
// Shows agents, tools, git status, and usage stats

import React from "react"
import { Box, Text } from "ink"
import { GitPanel } from "./git-panel.js"

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
  cwd?: string
  theme?: { secondary: string; muted: string }
}

export function Sidebar({ agents, currentAgent, tools, usage, cwd, theme }: SidebarProps) {
  const primaryColor = theme?.secondary || "cyan"
  const mutedColor = theme?.muted || "gray"

  return (
    <Box
      flexDirection="column"
      width={24}
      borderStyle="single"
      borderColor={mutedColor}
      paddingX={1}
    >
      {/* Agents section */}
      <Box marginBottom={1}>
        <Text bold color={primaryColor}>Agents</Text>
        <Text color={mutedColor}> (Tab)</Text>
      </Box>

      {agents.map((agent, i) => (
        <Box key={agent.name}>
          <Text color={i === currentAgent ? agent.color : mutedColor}>
            {i === currentAgent ? "▸ " : "  "}
            {agent.name}
          </Text>
        </Box>
      ))}

      {/* Git section */}
      {cwd && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color={primaryColor}>Git</Text>
          <GitPanel cwd={cwd} compact />
        </Box>
      )}

      {/* Tools section */}
      <Box marginTop={1} marginBottom={1}>
        <Text bold color={primaryColor}>Tools</Text>
        <Text color={mutedColor}> ({tools.length})</Text>
      </Box>

      <Box flexDirection="column" height={5} overflow="hidden">
        {tools.slice(0, 5).map(tool => (
          <Text key={tool} color={mutedColor} dimColor>
            • {tool.length > 18 ? tool.slice(0, 15) + "..." : tool}
          </Text>
        ))}
      </Box>

      {/* Usage section */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color={primaryColor}>Usage</Text>
        <Text color={mutedColor}>In: {usage.input.toLocaleString()}</Text>
        <Text color={mutedColor}>Out: {usage.output.toLocaleString()}</Text>
        <Text color="green">${usage.cost.toFixed(4)}</Text>
      </Box>

      {/* Help */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color={primaryColor}>Keys</Text>
        <Text color={mutedColor} dimColor>Tab: agents</Text>
        <Text color={mutedColor} dimColor>^K: commands</Text>
        <Text color={mutedColor} dimColor>^T: theme</Text>
        <Text color={mutedColor} dimColor>^C: exit</Text>
      </Box>
    </Box>
  )
}
