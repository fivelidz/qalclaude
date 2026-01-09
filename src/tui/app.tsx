// QalClaude Main App - OpenTUI/SolidJS version

import { createSignal, createEffect, onMount, onCleanup, Show, For } from "solid-js"
import { useKeyHandler, useTerminalDimensions } from "@opentui/solid"
import { Logo } from "../components/logo"
import { Prompt } from "../components/prompt"
import { MessageList } from "../components/message-list"
import { Sidebar } from "../components/sidebar"
import { StatusBar } from "../components/status-bar"
import { Header } from "../components/header"
import { createClaudeConnection, type ClaudeConnection } from "../claude/connection"

// Theme colors (Tokyo Night style)
export const theme = {
  primary: "#7aa2f7",
  secondary: "#bb9af7",
  accent: "#7dcfff",
  success: "#9ece6a",
  warning: "#e0af68",
  error: "#f7768e",
  text: "#c0caf5",
  textMuted: "#565f89",
  bg: "#1a1b26",
  bgPanel: "#24283b",
  border: "#3b4261",
}

// Agent definitions
const AGENTS = [
  { name: "coder", color: "#9ece6a", description: "Full development" },
  { name: "yolo", color: "#f7768e", description: "No permissions" },
  { name: "plan", color: "#7aa2f7", description: "Read-only planning" },
  { name: "researcher", color: "#7dcfff", description: "Code exploration" },
  { name: "architect", color: "#bb9af7", description: "System design" },
  { name: "debugger", color: "#e0af68", description: "Bug fixing" },
]

export interface Message {
  role: "user" | "assistant" | "system" | "tool"
  content: string
  timestamp: Date
  toolName?: string
}

export interface TodoItem {
  content: string
  status: "pending" | "in_progress" | "completed"
  activeForm: string
}

interface AppProps {
  model: string
  agent?: string
  permissionMode: string
}

export function App(props: AppProps) {
  const dimensions = useTerminalDimensions()

  // State
  const [messages, setMessages] = createSignal<Message[]>([])
  const [inputValue, setInputValue] = createSignal("")
  const [isLoading, setIsLoading] = createSignal(false)
  const [currentAgent, setCurrentAgent] = createSignal(0)
  const [showSidebar, setShowSidebar] = createSignal(true)
  const [showLogo, setShowLogo] = createSignal(true)
  const [streamingContent, setStreamingContent] = createSignal("")
  const [todos, setTodos] = createSignal<TodoItem[]>([])
  const [usage, setUsage] = createSignal({ input: 0, output: 0, cost: 0 })
  const [interruptCount, setInterruptCount] = createSignal(0)
  const [connected, setConnected] = createSignal(false)
  const [claudeVersion, setClaudeVersion] = createSignal("")

  // Claude connection
  let claude: ClaudeConnection | null = null

  onMount(async () => {
    claude = createClaudeConnection({
      model: props.model,
      agent: props.agent,
      permissionMode: props.permissionMode,
    })

    // Set up event handlers
    claude.on("init", (data) => {
      setConnected(true)
      setClaudeVersion(data.claude_code_version)
    })

    claude.on("assistant", (data) => {
      const text = data.message.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("")

      if (text) {
        setStreamingContent(prev => prev + text)
      }

      // Handle tool uses
      const toolUses = data.message.content.filter((c: any) => c.type === "tool_use")
      for (const tool of toolUses) {
        if (tool.name === "TodoWrite" && tool.input?.todos) {
          setTodos(tool.input.todos)
        }
        if (tool.name) {
          setMessages(prev => [...prev, {
            role: "tool",
            content: `Using ${tool.name}...`,
            timestamp: new Date(),
            toolName: tool.name
          }])
        }
      }

      if (data.message.usage) {
        setUsage(prev => ({
          input: prev.input + (data.message.usage.input_tokens || 0),
          output: prev.output + (data.message.usage.output_tokens || 0),
          cost: prev.cost
        }))
      }
    })

    claude.on("result", (data) => {
      setIsLoading(false)
      const content = streamingContent()
      if (content || data.result) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: content || data.result,
          timestamp: new Date()
        }])
        setStreamingContent("")
      }
      setUsage(prev => ({ ...prev, cost: data.total_cost_usd }))
    })

    claude.on("error", () => {
      setIsLoading(false)
    })

    // Connect
    try {
      await claude.connect()
    } catch (err) {
      console.error("Failed to connect:", err)
    }
  })

  onCleanup(() => {
    claude?.disconnect()
  })

  // Reset interrupt count after timeout
  createEffect(() => {
    if (interruptCount() > 0) {
      const timer = setTimeout(() => setInterruptCount(0), 3000)
      return () => clearTimeout(timer)
    }
  })

  // Hide logo after first message
  createEffect(() => {
    if (messages().length > 0) {
      setShowLogo(false)
    }
  })

  // Keyboard handling
  useKeyHandler((key: any) => {
    if (!key) return

    // Escape: interrupt
    if (key.key === "escape") {
      if (isLoading()) {
        if (interruptCount() >= 1) {
          claude?.interrupt()
          setIsLoading(false)
          setStreamingContent("")
          setInterruptCount(0)
        } else {
          setInterruptCount(1)
        }
      }
      return
    }

    // Ctrl+C: exit or interrupt
    if (key.ctrl && key.key === "c") {
      if (isLoading()) {
        claude?.interrupt()
        setIsLoading(false)
      } else {
        claude?.disconnect()
        process.exit(0)
      }
      return
    }

    // Tab: cycle agents
    if (key.key === "tab") {
      const next = key.shift
        ? (currentAgent() - 1 + AGENTS.length) % AGENTS.length
        : (currentAgent() + 1) % AGENTS.length
      setCurrentAgent(next)
      return
    }

    // Ctrl+B: toggle sidebar
    if (key.ctrl && key.key === "b") {
      setShowSidebar(prev => !prev)
      return
    }

    // Ctrl+L: clear
    if (key.ctrl && key.key === "l") {
      setMessages([])
      setShowLogo(true)
      return
    }
  }, {})

  // Submit handler
  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading()) return

    setMessages(prev => [...prev, {
      role: "user",
      content: text,
      timestamp: new Date()
    }])

    setInputValue("")
    setIsLoading(true)
    setStreamingContent("")

    try {
      await claude?.send(text)
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "system",
        content: `Error: ${err}`,
        timestamp: new Date()
      }])
      setIsLoading(false)
    }
  }

  const agent = () => AGENTS[currentAgent()]
  const cwd = process.cwd()

  return (
    <box flexDirection="column" width="100%" height="100%">
      {/* Header */}
      <Header
        agent={agent()}
        model={props.model}
        usage={usage()}
        isLoading={isLoading()}
        interruptCount={interruptCount()}
        todos={todos()}
      />

      {/* Main content */}
      <box flexDirection="row" flexGrow={1}>
        {/* Sidebar */}
        <Show when={showSidebar()}>
          <Sidebar
            agents={AGENTS}
            currentAgent={currentAgent()}
            usage={usage()}
            cwd={cwd}
          />
        </Show>

        {/* Chat area */}
        <box flexDirection="column" flexGrow={1}>
          <Show when={showLogo() && messages().length === 0} fallback={
            <MessageList
              messages={messages()}
              streamingContent={streamingContent()}
              isLoading={isLoading()}
            />
          }>
            <box flexGrow={1} justifyContent="center" alignItems="center" gap={1}>
              <Logo />
              <text fg={theme.textMuted}>Claude Code with qalcode's beautiful TUI</text>
              <box gap={1} flexDirection="column" alignItems="center">
                <text fg={theme.textMuted}>Tab: agents │ Ctrl+K: commands │ Ctrl+B: sidebar</text>
                <text fg={theme.textMuted}>Escape: interrupt │ Ctrl+C: exit</text>
              </box>
            </box>
          </Show>

          {/* Input */}
          <Prompt
            value={inputValue()}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading()}
            placeholder={`Message ${agent().name}...`}
          />
        </box>
      </box>

      {/* Status bar */}
      <StatusBar
        connected={connected()}
        agent={agent()}
        cwd={cwd}
        claudeVersion={claudeVersion()}
      />
    </box>
  )
}
