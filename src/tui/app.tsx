// QalClaude TUI - Main App Component
// Full-featured TUI combining Claude Code with qalcode's interface

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Box, Text, useInput, useApp, useStdout } from "ink"
import { ClaudeConnector, ClaudeSystemInit, ClaudeAssistantMessage, ClaudeResult } from "../claude/connector.js"
import { Sidebar } from "../components/sidebar.js"
import { ChatView } from "../components/chat-view.js"
import { InputBox } from "../components/input-box.js"
import { StatusBar } from "../components/status-bar.js"
import { Logo } from "../components/logo.js"
import { HelpDialog, AgentDialog, ModelDialog } from "../components/dialogs.js"
import { CommandPalette } from "../components/command-palette.js"
import { SessionList } from "../components/session-list.js"
import { ToastContainer, useToasts } from "../components/toast.js"
import { Spinner } from "../components/spinner.js"
import { THEMES, THEME_NAMES, ThemeDialog } from "../components/themes.js"
import { SettingsDialog, Settings, DEFAULT_SETTINGS } from "../components/settings.js"
import { SubagentPanel, Subagent, SubagentStatus } from "../components/subagent-panel.js"
import { UsageDisplay } from "../components/usage-display.js"
import { MiniFileTree } from "../components/file-tree.js"

interface Message {
  role: "user" | "assistant" | "system" | "tool"
  content: string
  timestamp: Date
  toolName?: string
}

interface AppProps {
  claude: ClaudeConnector
  init: ClaudeSystemInit
}

interface Session {
  id: string
  title: string
  updatedAt: Date
  messageCount: number
  cost: number
}

type DialogType = "none" | "help" | "agent" | "model" | "command" | "sessions" | "status" | "theme" | "settings" | "subagents" | "usage"

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
  const { toasts, addToast, dismissToast } = useToasts()

  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentAgent, setCurrentAgent] = useState(0)
  const [currentModel, setCurrentModel] = useState(init.model)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showLogo, setShowLogo] = useState(true)
  const [dialog, setDialog] = useState<DialogType>("none")
  const [themeName, setThemeName] = useState("catppuccin")
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [usage, setUsage] = useState({ input: 0, output: 0, cost: 0 })
  const [streamingContent, setStreamingContent] = useState("")
  const [sessions, setSessions] = useState<Session[]>([])
  const [promptHistory, setPromptHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [subagents, setSubagents] = useState<Subagent[]>([])
  const [workingDir] = useState(process.cwd())

  const theme = THEMES[themeName] || THEMES.catppuccin

  // Commands for command palette
  const commands = useMemo(() => [
    { id: "agent", label: "Switch Agent", category: "Agent", keybind: "Ctrl+A", action: () => setDialog("agent") },
    { id: "agent-cycle", label: "Cycle Agent", category: "Agent", keybind: "Tab", action: () => setCurrentAgent(p => (p + 1) % AGENTS.length) },
    { id: "subagents", label: "Subagent Panel", category: "Agent", keybind: "Ctrl+U", action: () => setDialog("subagents") },
    { id: "model", label: "Switch Model", category: "Model", keybind: "Ctrl+M", action: () => setDialog("model") },
    { id: "sessions", label: "Session List", category: "Session", keybind: "Ctrl+O", action: () => setDialog("sessions") },
    { id: "new-session", label: "New Session", category: "Session", keybind: "Ctrl+N", action: () => { setMessages([]); setShowLogo(true); addToast("New session started", "success") } },
    { id: "clear", label: "Clear Chat", category: "Session", keybind: "Ctrl+L", action: () => { setMessages([]); setShowLogo(true) } },
    { id: "sidebar", label: "Toggle Sidebar", category: "View", keybind: "Ctrl+B", action: () => setShowSidebar(p => !p) },
    { id: "theme", label: "Change Theme", category: "View", keybind: "Ctrl+T", action: () => setDialog("theme") },
    { id: "settings", label: "Settings", category: "View", keybind: "Ctrl+,", action: () => setDialog("settings") },
    { id: "usage", label: "Usage Stats", category: "System", keybind: "Ctrl+U", action: () => setDialog("usage") },
    { id: "status", label: "View Status", category: "System", keybind: "Ctrl+I", action: () => setDialog("status") },
    { id: "help", label: "Show Help", category: "System", keybind: "?", action: () => setDialog("help") },
    { id: "exit", label: "Exit", category: "System", keybind: "Ctrl+C", action: () => { claude.disconnect(); exit() } },
  ], [exit, claude, addToast])

  // Hide logo after first message
  useEffect(() => {
    if (messages.length > 0) setShowLogo(false)
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

      setUsage(prev => ({ ...prev, cost: event.total_cost_usd }))
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

  // Keyboard handler
  useInput((input, key) => {
    if (dialog !== "none") return

    // Exit
    if (key.ctrl && input === "c") {
      claude.disconnect()
      exit()
      return
    }

    // Tab: cycle agents
    if (key.tab) {
      const next = key.shift
        ? (currentAgent - 1 + AGENTS.length) % AGENTS.length
        : (currentAgent + 1) % AGENTS.length
      setCurrentAgent(next)
      addToast(`Switched to ${AGENTS[next].name}`, "info")
      return
    }

    // Ctrl+K or Ctrl+P: command palette
    if (key.ctrl && (input === "k" || input === "p")) {
      setDialog("command")
      return
    }

    // Ctrl+A: agent dialog
    if (key.ctrl && input === "a") {
      setDialog("agent")
      return
    }

    // Ctrl+M: model dialog
    if (key.ctrl && input === "m") {
      setDialog("model")
      return
    }

    // Ctrl+O: sessions
    if (key.ctrl && input === "o") {
      setDialog("sessions")
      return
    }

    // Ctrl+N: new session
    if (key.ctrl && input === "n") {
      setMessages([])
      setShowLogo(true)
      addToast("New session started", "success")
      return
    }

    // Ctrl+L: clear
    if (key.ctrl && input === "l") {
      setMessages([])
      setShowLogo(true)
      return
    }

    // Ctrl+B: sidebar
    if (key.ctrl && input === "b") {
      setShowSidebar(p => !p)
      return
    }

    // Ctrl+T: theme dialog
    if (key.ctrl && input === "t") {
      setDialog("theme")
      return
    }

    // Ctrl+U: subagents
    if (key.ctrl && input === "u") {
      setDialog("subagents")
      return
    }

    // Ctrl+I: status
    if (key.ctrl && input === "i") {
      setDialog("status")
      return
    }

    // ?: help
    if (input === "?" && !isLoading) {
      setDialog("help")
      return
    }

    // Up/Down: prompt history
    if (key.upArrow && promptHistory.length > 0) {
      const newIndex = historyIndex < promptHistory.length - 1 ? historyIndex + 1 : historyIndex
      setHistoryIndex(newIndex)
      setInputValue(promptHistory[promptHistory.length - 1 - newIndex] || "")
      return
    }

    if (key.downArrow && historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setInputValue(promptHistory[promptHistory.length - 1 - newIndex] || "")
      return
    }
  })

  const handleSubmit = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    // Add to history
    setPromptHistory(prev => [...prev, text])
    setHistoryIndex(-1)

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
      addToast(`Error: ${err}`, "error")
    }
  }, [claude, isLoading, addToast])

  // Dialog handlers
  const handleAgentSelect = (index: number) => {
    setCurrentAgent(index)
    addToast(`Agent: ${AGENTS[index].name}`, "success")
  }

  const handleModelSelect = (model: string) => {
    setCurrentModel(model)
    addToast(`Model: ${model}`, "success")
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

  if (dialog === "command") {
    return (
      <CommandPalette
        commands={commands}
        onClose={() => setDialog("none")}
      />
    )
  }

  if (dialog === "sessions") {
    return (
      <SessionList
        sessions={sessions}
        currentId={init.session_id}
        onSelect={(id) => addToast(`Session: ${id}`, "info")}
        onDelete={(id) => { setSessions(p => p.filter(s => s.id !== id)); addToast("Session deleted", "warning") }}
        onRename={(id, name) => { setSessions(p => p.map(s => s.id === id ? {...s, title: name} : s)); addToast("Session renamed", "success") }}
        onClose={() => setDialog("none")}
      />
    )
  }

  if (dialog === "status") {
    return (
      <Box flexDirection="column" borderStyle="double" borderColor={theme.secondary} padding={1}>
        <Text color={theme.secondary} bold>System Status</Text>
        <Box marginTop={1} flexDirection="column">
          <Text>Claude Version: {init.claude_code_version}</Text>
          <Text>Model: {currentModel}</Text>
          <Text>Agent: {AGENTS[currentAgent].name}</Text>
          <Text>Session: {init.session_id}</Text>
          <Text>Tools: {init.tools.length}</Text>
          <Text>Available Agents: {init.agents.join(", ")}</Text>
          <Text>Theme: {theme.name}</Text>
          <Box marginTop={1}>
            <UsageDisplay input={usage.input} output={usage.output} cost={usage.cost} />
          </Box>
        </Box>
        <Box marginTop={1}>
          <Text color="gray" dimColor>Press Esc to close</Text>
        </Box>
      </Box>
    )
  }

  if (dialog === "theme") {
    return (
      <ThemeDialog
        current={themeName}
        onSelect={(name) => { setThemeName(name); addToast(`Theme: ${THEMES[name].name}`, "success") }}
        onClose={() => setDialog("none")}
      />
    )
  }

  if (dialog === "settings") {
    return (
      <SettingsDialog
        settings={settings}
        onUpdate={(s) => { setSettings(s); addToast("Settings saved", "success") }}
        onClose={() => setDialog("none")}
      />
    )
  }

  if (dialog === "subagents") {
    return (
      <SubagentPanel
        subagents={subagents}
        availableTypes={["explore", "git", "docs", "test", "general"]}
        onSpawn={(type, prompt) => {
          const id = `subagent-${Date.now()}`
          setSubagents(prev => [...prev, {
            id,
            type,
            status: "running",
            description: prompt,
            startTime: new Date()
          }])
          addToast(`Spawned ${type} subagent`, "info")
        }}
        onCancel={(id) => {
          setSubagents(prev => prev.filter(s => s.id !== id))
          addToast("Subagent cancelled", "warning")
        }}
        onClose={() => setDialog("none")}
      />
    )
  }

  if (dialog === "usage") {
    return (
      <Box flexDirection="column" borderStyle="double" borderColor={theme.secondary} padding={1}>
        <Text color={theme.secondary} bold>Usage Statistics</Text>
        <Box marginTop={1}>
          <UsageDisplay input={usage.input} output={usage.output} cost={usage.cost} />
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text>Session Cost: <Text color="green">${usage.cost.toFixed(4)}</Text></Text>
          <Text>Tokens Used: <Text color="cyan">{(usage.input + usage.output).toLocaleString()}</Text></Text>
          <Text>Input: <Text color="blue">{usage.input.toLocaleString()}</Text></Text>
          <Text>Output: <Text color="magenta">{usage.output.toLocaleString()}</Text></Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray" dimColor>Press Esc to close</Text>
        </Box>
      </Box>
    )
  }

  const termHeight = stdout?.rows || 24

  return (
    <Box flexDirection="column" height={termHeight}>
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <Box borderStyle="single" borderColor={theme.secondary} paddingX={1} justifyContent="space-between">
        <Box>
          <Text bold color={theme.secondary}>QalClaude</Text>
          <Text color="gray"> │ </Text>
          <Text color={AGENTS[currentAgent].color} bold>{AGENTS[currentAgent].name}</Text>
          <Text color="gray" dimColor> {AGENTS[currentAgent].description}</Text>
          {subagents.filter(s => s.status === "running").length > 0 && (
            <>
              <Text color="gray"> │ </Text>
              <Spinner type="dots" color="yellow" />
              <Text color="yellow"> {subagents.filter(s => s.status === "running").length}</Text>
            </>
          )}
        </Box>
        <Box>
          <Text color="gray" dimColor>{currentModel.replace("claude-", "")}</Text>
          <Text color="gray"> │ </Text>
          <Text color={theme.success}>${usage.cost.toFixed(4)}</Text>
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
            cwd={workingDir}
            theme={theme}
          />
        )}

        {/* Chat area */}
        <Box flexDirection="column" flexGrow={1}>
          {showLogo && messages.length === 0 ? (
            <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} padding={2}>
              <Logo />
              <Box marginTop={1}>
                <Text color={theme.muted}>Claude Code with a beautiful TUI</Text>
              </Box>
              <Box marginTop={1} flexDirection="column" alignItems="center">
                <Text color={theme.muted} dimColor>Ctrl+K: commands │ Tab: agents │ ?: help</Text>
                <Text color={theme.muted} dimColor>Ctrl+A: agent │ Ctrl+M: model │ Ctrl+T: theme</Text>
                <Text color={theme.muted} dimColor>Ctrl+U: subagents │ Ctrl+O: sessions │ Ctrl+B: sidebar</Text>
              </Box>
              <Box marginTop={1}>
                <Text color={theme.accent}>Theme: {theme.name}</Text>
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
            placeholder={`Message ${AGENTS[currentAgent].name}... (Ctrl+K for commands)`}
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
