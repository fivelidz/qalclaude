// QalClaude Subagent Panel - Spawn and manage background agents

import React, { useState } from "react"
import { Box, Text, useInput } from "ink"
import { Spinner } from "./spinner.js"

export interface Subagent {
  id: string
  type: string
  status: "pending" | "running" | "completed" | "failed"
  description: string
  startTime: Date
  result?: string
}

interface SubagentPanelProps {
  subagents: Subagent[]
  availableTypes: string[]
  onSpawn: (type: string, prompt: string) => void
  onCancel: (id: string) => void
  onClose: () => void
}

const SUBAGENT_ICONS: Record<string, string> = {
  explore: "🔍",
  git: "📦",
  docs: "📝",
  test: "🧪",
  build: "🔨",
  deploy: "🚀",
  general: "⚡",
  plan: "📋",
  default: "🤖"
}

const SUBAGENT_COLORS: Record<string, string> = {
  explore: "cyan",
  git: "magenta",
  docs: "blue",
  test: "green",
  build: "yellow",
  deploy: "red",
  general: "white",
  plan: "blue"
}

export function SubagentPanel({
  subagents,
  availableTypes,
  onSpawn,
  onCancel,
  onClose
}: SubagentPanelProps) {
  const [mode, setMode] = useState<"list" | "spawn">("list")
  const [cursor, setCursor] = useState(0)
  const [selectedType, setSelectedType] = useState(0)
  const [prompt, setPrompt] = useState("")

  useInput((input, key) => {
    if (key.escape) {
      if (mode === "spawn") {
        setMode("list")
        setPrompt("")
      } else {
        onClose()
      }
      return
    }

    if (mode === "list") {
      if (key.upArrow) {
        setCursor(c => Math.max(0, c - 1))
        return
      }

      if (key.downArrow) {
        setCursor(c => Math.min(subagents.length - 1, c + 1))
        return
      }

      // N for new subagent
      if (input === "n" || input === "N") {
        setMode("spawn")
        return
      }

      // X to cancel running subagent
      if ((input === "x" || input === "X") && subagents[cursor]?.status === "running") {
        onCancel(subagents[cursor].id)
        return
      }
    }

    if (mode === "spawn") {
      if (key.tab) {
        setSelectedType(t => (t + 1) % availableTypes.length)
        return
      }

      if (key.return && prompt.trim()) {
        onSpawn(availableTypes[selectedType], prompt.trim())
        setPrompt("")
        setMode("list")
        return
      }

      if (key.backspace || key.delete) {
        setPrompt(p => p.slice(0, -1))
        return
      }

      if (input && !key.ctrl) {
        setPrompt(p => p + input)
      }
    }
  })

  if (mode === "spawn") {
    return (
      <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1}>
        <Text color="cyan" bold>Spawn Subagent</Text>

        <Box marginTop={1}>
          <Text color="gray">Type: </Text>
          {availableTypes.map((type, i) => (
            <Box key={type} marginRight={1}>
              <Text
                color={i === selectedType ? SUBAGENT_COLORS[type] || "white" : "gray"}
                bold={i === selectedType}
              >
                {SUBAGENT_ICONS[type] || SUBAGENT_ICONS.default} {type}
              </Text>
            </Box>
          ))}
        </Box>

        <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
          <Text color="cyan">&gt; </Text>
          <Text>{prompt || <Text color="gray">Enter task description...</Text>}</Text>
          <Text color="cyan">█</Text>
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>Tab: switch type | Enter: spawn | Esc: cancel</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>Subagents</Text>
        <Text color="gray"> ({subagents.length} active)</Text>
      </Box>

      <Box flexDirection="column" height={12} overflow="hidden">
        {subagents.length === 0 ? (
          <Text color="gray">No subagents running</Text>
        ) : (
          subagents.map((agent, i) => {
            const isSelected = i === cursor
            const icon = SUBAGENT_ICONS[agent.type] || SUBAGENT_ICONS.default
            const color = SUBAGENT_COLORS[agent.type] || "white"

            return (
              <Box key={agent.id} flexDirection="column">
                <Box>
                  <Text color={isSelected ? "cyan" : "white"}>
                    {isSelected ? "▸ " : "  "}
                  </Text>
                  <Text color={color}>{icon} </Text>
                  <Text color={isSelected ? "white" : "gray"} bold={isSelected}>
                    {agent.type}
                  </Text>
                  <Text color="gray"> - </Text>

                  {agent.status === "running" && (
                    <Box>
                      <Spinner type="dots" color="yellow" />
                      <Text color="yellow"> Running</Text>
                    </Box>
                  )}
                  {agent.status === "pending" && (
                    <Text color="gray">Pending</Text>
                  )}
                  {agent.status === "completed" && (
                    <Text color="green">✓ Done</Text>
                  )}
                  {agent.status === "failed" && (
                    <Text color="red">✗ Failed</Text>
                  )}
                </Box>

                {isSelected && (
                  <Box paddingLeft={4} flexDirection="column">
                    <Text color="gray" dimColor wrap="truncate">
                      {agent.description.slice(0, 60)}
                      {agent.description.length > 60 ? "..." : ""}
                    </Text>
                    {agent.result && (
                      <Text color="gray" dimColor wrap="truncate">
                        Result: {agent.result.slice(0, 50)}...
                      </Text>
                    )}
                  </Box>
                )}
              </Box>
            )
          })
        )}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>N: new | X: cancel | Esc: close</Text>
      </Box>
    </Box>
  )
}

// Compact subagent status for sidebar
interface SubagentStatusProps {
  subagents: Subagent[]
}

export function SubagentStatus({ subagents }: SubagentStatusProps) {
  const running = subagents.filter(s => s.status === "running").length
  const pending = subagents.filter(s => s.status === "pending").length
  const completed = subagents.filter(s => s.status === "completed").length

  if (subagents.length === 0) {
    return <Text color="gray" dimColor>No subagents</Text>
  }

  return (
    <Box flexDirection="column">
      {running > 0 && (
        <Box>
          <Spinner type="dots" color="yellow" />
          <Text color="yellow"> {running} running</Text>
        </Box>
      )}
      {pending > 0 && (
        <Text color="gray">⏳ {pending} pending</Text>
      )}
      {completed > 0 && (
        <Text color="green">✓ {completed} done</Text>
      )}
    </Box>
  )
}
