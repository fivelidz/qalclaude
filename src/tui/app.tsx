// QalClaude Main App - OpenTUI/SolidJS version
// Full-featured TUI matching qalcode

import { createSignal, createEffect, onMount, onCleanup, Show, For } from "solid-js"
import { useKeyHandler, useTerminalDimensions } from "@opentui/solid"

// Context Providers
import { ThemeProvider, useTheme, defaultTheme } from "../context/theme"
import { ToastProvider, useToast } from "../context/toast"
import { DialogProvider, useDialog } from "../context/dialog"
import { KeybindProvider, useKeybind } from "../context/keybind"
import { CommandProvider, useCommand, type CommandOption } from "../context/command"
import { AgentProvider, useAgent, AGENTS, type Agent } from "../context/agents"

// Components
import { Logo } from "../components/logo"
import { Prompt } from "../components/prompt"
import { MessageList } from "../components/message-list"
import { Sidebar } from "../components/sidebar"
import { StatusBar } from "../components/status-bar"
import { Header } from "../components/header"
import { ToolOutput, type ToolCall } from "../components/tool-output"

// Dialogs
import { CommandPalette } from "../dialogs/command-palette"
import { AgentSelect } from "../dialogs/agent-select"
import { ThemeSelect } from "../dialogs/theme-select"

// Claude connection
import { createClaudeConnection, type ClaudeConnection } from "../claude/connection"

export interface Message {
  role: "user" | "assistant" | "system" | "tool"
  content: string
  timestamp: Date
  toolName?: string
  toolCall?: ToolCall
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

// Main App wrapper with all providers
export function App(props: AppProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <KeybindProvider>
          <DialogProvider>
            <AgentProvider initialAgent={props.agent}>
              <CommandProvider>
                <AppContent model={props.model} permissionMode={props.permissionMode} />
              </CommandProvider>
            </AgentProvider>
          </DialogProvider>
        </KeybindProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

// App content (uses all contexts)
function AppContent(props: { model: string; permissionMode: string }) {
  const dimensions = useTerminalDimensions()
  const { theme } = useTheme()
  const toast = useToast()
  const dialog = useDialog()
  const keybind = useKeybind()
  const command = useCommand()
  const agent = useAgent()

  // State
  const [messages, setMessages] = createSignal<Message[]>([])
  const [inputValue, setInputValue] = createSignal("")
  const [isLoading, setIsLoading] = createSignal(false)
  const [showSidebar, setShowSidebar] = createSignal(true)
  const [showLogo, setShowLogo] = createSignal(true)
  const [streamingContent, setStreamingContent] = createSignal("")
  const [todos, setTodos] = createSignal<TodoItem[]>([])
  const [usage, setUsage] = createSignal({ input: 0, output: 0, cost: 0 })
  const [interruptCount, setInterruptCount] = createSignal(0)
  const [connected, setConnected] = createSignal(false)
  const [claudeVersion, setClaudeVersion] = createSignal("")
  const [hasError, setHasError] = createSignal(false)
  const [promptHistory, setPromptHistory] = createSignal<string[]>([])
  const [historyIndex, setHistoryIndex] = createSignal(-1)

  // Claude connection
  let claude: ClaudeConnection | null = null

  onMount(async () => {
    claude = createClaudeConnection({
      model: props.model,
      agent: agent.currentAgent().name,
      permissionMode: agent.currentAgent().permissionMode,
    })

    // Set up event handlers
    claude.on("init", (data) => {
      setConnected(true)
      setClaudeVersion(data.claude_code_version || "")
      toast.success("Connected to Claude")
    })

    claude.on("assistant", (data) => {
      setHasError(false)
      const text = data.message?.content
        ?.filter((c: any) => c.type === "text")
        ?.map((c: any) => c.text)
        ?.join("") || ""

      if (text) {
        setStreamingContent((prev) => prev + text)
      }

      // Handle tool uses
      const toolUses = data.message?.content?.filter((c: any) => c.type === "tool_use") || []
      for (const tool of toolUses) {
        if (tool.name === "TodoWrite" && tool.input?.todos) {
          setTodos(tool.input.todos)
        }
        if (tool.name) {
          setMessages((prev) => [
            ...prev,
            {
              role: "tool",
              content: `Using ${tool.name}...`,
              timestamp: new Date(),
              toolName: tool.name,
              toolCall: {
                name: tool.name,
                input: tool.input || {},
                status: "running",
              },
            },
          ])
        }
      }

      if (data.message?.usage) {
        setUsage((prev) => ({
          input: prev.input + (data.message.usage.input_tokens || 0),
          output: prev.output + (data.message.usage.output_tokens || 0),
          cost: prev.cost,
        }))
      }
    })

    claude.on("result", (data) => {
      setIsLoading(false)
      const content = streamingContent()
      if (content || data.result) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: content || data.result,
            timestamp: new Date(),
          },
        ])
        setStreamingContent("")
      }
      if (data.total_cost_usd) {
        setUsage((prev) => ({ ...prev, cost: data.total_cost_usd }))
      }
    })

    claude.on("error", (err) => {
      setIsLoading(false)
      setHasError(true)
      toast.error(err.message || "An error occurred")
    })

    // Connect
    try {
      await claude.connect()
    } catch (err: any) {
      toast.error(`Failed to connect: ${err.message}`)
    }
  })

  onCleanup(() => {
    claude?.disconnect()
  })

  // Register commands
  command.register(() => [
    {
      value: "agent.list",
      label: "Select Agent",
      category: "Agent",
      keybind: "agent_cycle",
      onSelect: () => {
        dialog.replace(
          <AgentSelect
            currentAgent={agent.currentAgent()}
            onSelect={(a) => {
              agent.setAgentByName(a.name)
              dialog.clear()
              toast.info(`Switched to ${a.name}`)
            }}
          />
        )
      },
    },
    {
      value: "theme.switch",
      label: "Change Theme",
      category: "Settings",
      onSelect: () => {
        const themeCtx = useTheme()
        dialog.replace(
          <ThemeSelect
            onSelect={(name, mode) => {
              themeCtx.setTheme(name)
              themeCtx.setMode(mode)
              dialog.clear()
              toast.info(`Theme: ${name} (${mode})`)
            }}
          />
        )
      },
    },
    {
      value: "sidebar.toggle",
      label: "Toggle Sidebar",
      category: "View",
      keybind: "sidebar_toggle",
      onSelect: () => setShowSidebar((s) => !s),
    },
    {
      value: "messages.clear",
      label: "Clear Messages",
      category: "Session",
      keybind: "clear_messages",
      onSelect: () => {
        setMessages([])
        setShowLogo(true)
        toast.info("Messages cleared")
      },
    },
    {
      value: "app.exit",
      label: "Exit",
      category: "System",
      keybind: "app_exit",
      onSelect: () => {
        claude?.disconnect()
        process.exit(0)
      },
    },
  ])

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
    if (dialog.isOpen()) return // Let dialog handle keys

    // Escape: interrupt
    if (key.key === "escape") {
      if (isLoading()) {
        if (interruptCount() >= 1) {
          claude?.interrupt()
          setIsLoading(false)
          setStreamingContent("")
          setInterruptCount(0)
          toast.warning("Interrupted")
        } else {
          setInterruptCount(1)
          toast.warning("Press Escape again to interrupt")
        }
      }
      return
    }

    // Ctrl+C: exit or interrupt
    if (key.ctrl && key.key === "c") {
      if (isLoading()) {
        claude?.interrupt()
        setIsLoading(false)
        toast.warning("Interrupted")
      } else {
        claude?.disconnect()
        process.exit(0)
      }
      return
    }

    // Tab: cycle agents
    if (key.key === "tab") {
      agent.cycleAgent(key.shift)
      toast.info(`Agent: ${agent.currentAgent().name}`)
      return
    }

    // Ctrl+B: toggle sidebar
    if (key.ctrl && key.key === "b") {
      setShowSidebar((prev) => !prev)
      return
    }

    // Ctrl+L: clear
    if (key.ctrl && key.key === "l") {
      setMessages([])
      setShowLogo(true)
      return
    }

    // Ctrl+K: command palette
    if (key.ctrl && key.key === "k") {
      command.show()
      return
    }
  }, {})

  // Submit handler
  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading()) return

    // Add to history
    setPromptHistory((h) => [text, ...h.slice(0, 50)])
    setHistoryIndex(-1)

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: text,
        timestamp: new Date(),
      },
    ])

    setInputValue("")
    setIsLoading(true)
    setStreamingContent("")
    setHasError(false)

    try {
      await claude?.send(text)
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Error: ${err.message}`,
          timestamp: new Date(),
        },
      ])
      setIsLoading(false)
      setHasError(true)
    }
  }

  // History navigation
  const navigateHistory = (direction: "up" | "down") => {
    const history = promptHistory()
    if (history.length === 0) return

    if (direction === "up") {
      const newIndex = Math.min(historyIndex() + 1, history.length - 1)
      setHistoryIndex(newIndex)
      setInputValue(history[newIndex])
    } else {
      const newIndex = historyIndex() - 1
      if (newIndex < 0) {
        setHistoryIndex(-1)
        setInputValue("")
      } else {
        setHistoryIndex(newIndex)
        setInputValue(history[newIndex])
      }
    }
  }

  const cwd = process.cwd()

  return (
    <box flexDirection="column" width="100%" height="100%">
      {/* Header */}
      <Header
        agent={agent.currentAgent()}
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
            currentAgent={agent.currentIndex()}
            usage={usage()}
            cwd={cwd}
            todos={todos()}
            isLoading={isLoading()}
            hasError={hasError()}
            claudeVersion={claudeVersion()}
          />
        </Show>

        {/* Chat area */}
        <box flexDirection="column" flexGrow={1}>
          <Show
            when={showLogo() && messages().length === 0}
            fallback={
              <MessageList
                messages={messages()}
                streamingContent={streamingContent()}
                isLoading={isLoading()}
              />
            }
          >
            <box flexGrow={1} justifyContent="center" alignItems="center" gap={1}>
              <Logo />
              <text fg={theme.textMuted}>Claude Code with qalcode's beautiful TUI</text>
              <box gap={1} flexDirection="column" alignItems="center">
                <text fg={theme.textMuted}>
                  Tab: agents │ Ctrl+K: commands │ Ctrl+B: sidebar
                </text>
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
            placeholder={`Message ${agent.currentAgent().name}...`}
            onHistoryUp={() => navigateHistory("up")}
            onHistoryDown={() => navigateHistory("down")}
          />
        </box>
      </box>

      {/* Status bar */}
      <StatusBar
        connected={connected()}
        agent={agent.currentAgent()}
        cwd={cwd}
        claudeVersion={claudeVersion()}
      />
    </box>
  )
}

// Re-export theme for other components
export { defaultTheme as theme } from "../context/theme"
