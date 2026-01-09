// QalClaude TUI - Main App Component
// Based on qalcode's TUI with Claude Code backend

import React, { useState, useEffect, useCallback } from "react"
import { Box, Text, useInput, useApp } from "ink"
import { ClaudeConnector, ClaudeSystemInit, ClaudeEvent, ClaudeAssistantMessage, ClaudeResult } from "../claude/connector.js"
import { Sidebar } from "../components/sidebar.js"
import { ChatView } from "../components/chat-view.js"
import { InputBox } from "../components/input-box.js"
import { StatusBar } from "../components/status-bar.js"

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

export function App({ claude, init }: AppProps) {
  const { exit } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentAgent, setCurrentAgent] = useState(0)
  const [showSidebar, setShowSidebar] = useState(true)
  const [usage, setUsage] = useState({ input: 0, output: 0, cost: 0 })
  const [streamingContent, setStreamingContent] = useState("")

  const agents = [
    { name: "coder", color: "green", description: "Full development" },
    { name: "yolo", color: "red", description: "No permissions" },
    { name: "plan", color: "blue", description: "Read-only planning" },
    { name: "researcher", color: "cyan", description: "Code exploration" },
    { name: "architect", color: "magenta", description: "System design" },
    { name: "debugger", color: "yellow", description: "Bug fixing" },
  ]

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

      // Finalize streaming content as message
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
          // Find and update the tool message
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
    if (key.ctrl && input === "c") {
      claude.disconnect()
      exit()
      return
    }

    if (key.tab) {
      setCurrentAgent(prev => (prev + 1) % agents.length)
      return
    }

    if (key.ctrl && input === "l") {
      setMessages([])
      return
    }

    if (key.ctrl && input === "s") {
      setShowSidebar(prev => !prev)
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

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">QalClaude</Text>
        <Text> - </Text>
        <Text color="gray">{init.model}</Text>
        <Text> | </Text>
        <Text color={agents[currentAgent].color}>{agents[currentAgent].name}</Text>
        <Text> | </Text>
        <Text color="gray">Session: {init.session_id.slice(0, 8)}...</Text>
      </Box>

      {/* Main content */}
      <Box flexGrow={1} flexDirection="row">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            agents={agents}
            currentAgent={currentAgent}
            tools={init.tools}
            usage={usage}
          />
        )}

        {/* Chat area */}
        <Box flexDirection="column" flexGrow={1}>
          <ChatView
            messages={messages}
            streamingContent={streamingContent}
            isLoading={isLoading}
          />

          {/* Input */}
          <InputBox
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder={`Message ${agents[currentAgent].name} agent...`}
          />
        </Box>
      </Box>

      {/* Status bar */}
      <StatusBar
        connected={claude.connected}
        agent={agents[currentAgent]}
        usage={usage}
        showSidebarHint={!showSidebar}
      />
    </Box>
  )
}
