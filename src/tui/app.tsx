// QalClaude TUI - Main App Component
// Combines Claude Code backend with qalcode-style TUI

import React, { useState, useEffect, useCallback } from "react"
import { Box, Text, useInput, useApp, useStdout } from "ink"
import { ClaudeConnector, ClaudeSystemInit, ClaudeEvent, ClaudeAssistantMessage, ClaudeResult } from "../claude/connector.js"
import { Sidebar } from "../components/sidebar.js"
import { ChatView } from "../components/chat-view.js"
import { InputBox } from "../components/input-box.js"
import { StatusBar } from "../components/status-bar.js"
import { Logo } from "../components/logo.js"
import { HelpDialog, AgentDialog, ModelDialog } from "../components/dialogs.js"

interface Message {
  role: "user" | "assistant" | "system" | "tool"
  content: string
  timestamp: Date
  toolName?: string
  isStreaming?: boolean
}

interface AppProps {
  claude: ClaudeConnector
  init: ClaudeSystemInit
}

type DialogType = "none" | "help" | "agent" | "model"

const AGENTS = [
  { name: "coder", color: "green", description: "Full development", permissionMode: "acceptEdits" },
  { name: "yolo", color: "red", description: "No permissions", permissionMode: "bypassPermissions" },
  { name: "plan", color: "blue", description: "Read-only planning", permissionMode: "plan" },
  { name: "researcher", color: "cyan", description: "Code exploration", permissionMode: "plan" },
  { name: "architect", color: "magenta", description: "System design", permissionMode: "plan" },
  { name: "debugger", color: "yellow", description: "Bug fixing", permissionMode: "acceptEdits" },
]

const MODELS = [
  "claude-opus-4-5-20251101",
  "claude-sonnet-4-5-20250929",
  "claude-sonnet-4-20250514",
  "claude-haiku-4-5-20251001",
]

export function App({ claude, init }: AppProps) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentAgent, setCurrentAgent] = useState(0)
  const [currentModel, setCurrentModel] = useState(init.model)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showLogo, setShowLogo] = useState(true)
  const [dialog, setDialog] = useState<DialogType>("none")
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [usage, setUsage] = useState({ input: 0, output: 0, cost: 0 })
  const [streamingContent, setStreamingContent] = useState("")

  // Hide logo after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowLogo(false)
    }
  }, [messages])

  // Handle Claude events
  useEffect(() => {
    const handleAssistant = (event: ClaudeAssistantMessage) => {
      const content = event.message.content
        .filter(c => c.type === "text")
        .map(c => c.text)
        .join("")

      if (content) {
        setStreamingContent(prev => prev + content)
      }

      // Handle tool use
      const toolUses = event.message.content.filter(c => c.type === "tool_use")
      for (const tool of toolUses) {
        if (tool.name) {
          setMessages(prev => [...prev, {
            role: "tool",
            content: `Using ${tool.name}...`,
            timestamp: new Date(),
            toolName: tool.name
          }])
        }
      }

      if (event.message.usage) {
        setUsage(prev => ({
          input: prev.input + (event.message.usage.input_tokens || 0),
          output: prev.output + (event.message.usage.output_tokens || 0),
          cost: prev.cost
        }))
      }
    }

    const handleResult = (event: ClaudeResult) => {
      setIsLoading(false)

      if (streamingContent || event.result) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: streamingContent || event.result,
          timestamp: new Date()
        }])
        setStreamingContent("")
      }

      setUsage(prev => ({
        ...prev,
        cost: event.total_cost_usd
      }))
    }

    const handleToolResult = (event: any) => {
      if (event.content) {
        setMessages(prev => {
          const updated = [...prev]
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === "tool" && updated[i].toolName) {
              updated[i].content = event.content.slice(0, 200) + (event.content.length > 200 ? "..." : "")
              break
            }
          }
          return updated
        })
      }
    }

    claude.on("assistant", handleAssistant)
    claude.on("result", handleResult)
    claude.on("tool_result", handleToolResult)

    return () => {
      claude.off("assistant", handleAssistant)
      claude.off("result", handleResult)
      claude.off("tool_result", handleToolResult)
    }
  }, [claude, streamingContent])

  // Handle keyboard input
  useInput((input, key) => {
    // Don't handle input when dialog is open (dialog handles its own)
    if (dialog !== "none") return

    if (key.ctrl && input === "c") {
      claude.disconnect()
      exit()
      return
    }

    if (key.tab) {
      setCurrentAgent(prev => (prev + 1) % AGENTS.length)
      return
    }

    if (key.ctrl && input === "l") {
      setMessages([])
      setShowLogo(true)
      return
    }

    if (key.ctrl && input === "s") {
      setShowSidebar(prev => !prev)
      return
    }

    if (key.ctrl && input === "t") {
      setTheme(prev => prev === "dark" ? "light" : "dark")
      return
    }

    if (key.ctrl && input === "m") {
      setDialog("model")
      return
    }

    if (key.ctrl && input === "a") {
      setDialog("agent")
      return
    }

    if (input === "?" && !isLoading) {
      setDialog("help")
      return
    }
  })

  const handleSubmit = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    setMessages(prev => [...prev, {
      role: "user",
      content: text,
      timestamp: new Date()
    }])

    setInputValue("")
    setIsLoading(true)
    setStreamingContent("")

    try {
      await claude.send(text)
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "system",
        content: `Error: ${err}`,
        timestamp: new Date()
      }])
      setIsLoading(false)
    }
  }, [claude, isLoading])

  const handleAgentSelect = (index: number) => {
    setCurrentAgent(index)
    // TODO: Reconnect with new agent's permission mode
  }

  const handleModelSelect = (model: string) => {
    setCurrentModel(model)
    // TODO: Reconnect with new model
  }

  // Render dialogs
  if (dialog === "help") {
    return <HelpDialog onClose={() => setDialog("none")} />
  }

  if (dialog === "agent") {
    return (
      <AgentDialog
        agents={AGENTS}
        current={currentAgent}
        onSelect={handleAgentSelect}
        onClose={() => setDialog("none")}
      />
    )
  }

  if (dialog === "model") {
    return (
      <ModelDialog
        models={MODELS}
        current={currentModel}
        onSelect={handleModelSelect}
        onClose={() => setDialog("none")}
      />
    )
  }

  return (
    <Box flexDirection="column" height={stdout?.rows || 24}>
      {/* Header */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1} justifyContent="space-between">
        <Box>
          <Text bold color="cyan">QalClaude</Text>
          <Text color="gray"> | </Text>
          <Text color={AGENTS[currentAgent].color}>{AGENTS[currentAgent].name}</Text>
        </Box>
        <Box>
          <Text color="gray">{currentModel}</Text>
          <Text color="gray"> | </Text>
          <Text color="gray">Session: {init.session_id.slice(0, 8)}</Text>
        </Box>
      </Box>

      {/* Main content */}
      <Box flexGrow={1} flexDirection="row">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            agents={AGENTS}
            currentAgent={currentAgent}
            tools={init.tools}
            usage={usage}
          />
        )}

        {/* Chat area */}
        <Box flexDirection="column" flexGrow={1}>
          {showLogo && messages.length === 0 ? (
            <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} padding={2}>
              <Logo />
              <Box marginTop={1}>
                <Text color="gray">Claude Code with a beautiful TUI</Text>
              </Box>
              <Box marginTop={1}>
                <Text color="gray" dimColor>Press ? for help | Tab to switch agents</Text>
              </Box>
            </Box>
          ) : (
            <ChatView
              messages={messages}
              streamingContent={streamingContent}
              isLoading={isLoading}
            />
          )}

          {/* Input */}
          <InputBox
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder={`Message ${AGENTS[currentAgent].name} agent...`}
          />
        </Box>
      </Box>

      {/* Status bar */}
      <StatusBar
        connected={claude.connected}
        agent={AGENTS[currentAgent]}
        usage={usage}
        showSidebarHint={!showSidebar}
      />
    </Box>
  )
}
