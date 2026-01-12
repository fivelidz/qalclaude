// QalClaude Enhanced Sidebar Component with MCP/LSP/Git Integration

import { createSignal, createMemo, Show, For } from "solid-js"
import { useTheme, defaultTheme } from "../context/theme"
import { useAgent, type Agent } from "../context/agents"
import { Animation } from "./animation"
import { TodoList } from "./tool-output/todo"

// MCP Status type
interface McpStatus {
  status: "connected" | "failed" | "disabled" | "needs_auth" | "needs_client_registration"
  error?: string
}

// LSP Status type
interface LspStatus {
  id: string
  status: "connected" | "error"
  root?: string
}

interface SidebarProps {
  agents: Agent[]
  currentAgent: number
  usage: { input: number; output: number; cost: number; contextPercent?: number }
  cwd: string
  todos: Array<{ content: string; status: string; activeForm?: string }>
  isLoading: boolean
  hasError: boolean
  claudeVersion?: string
  gitBranch?: string
  gitAhead?: number
  gitBehind?: number
  modifiedFiles?: Array<{ path: string; additions: number; deletions: number }>
  sessionTitle?: string
  sessionCreated?: number
  sessionID?: string
  mcp?: Record<string, McpStatus>
  lsp?: LspStatus[]
  parentSession?: { id: string; title: string }
  subagentInfo?: { agentType: string; shortName: string; taskNumber: number }
}

export function Sidebar(props: SidebarProps) {
  const [showFullAnimation, setShowFullAnimation] = createSignal(true)
  const [expandedSections, setExpandedSections] = createSignal<Record<string, boolean>>({
    agents: true,
    usage: true,
    todos: true,
    git: false,
    files: false,
    mcp: true,
    lsp: false,
  })

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const toggleSection = (section: string) => {
    setExpandedSections((s) => ({ ...s, [section]: !s[section] }))
  }

  // Format token count
  const formatTokens = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  // Get directory name
  const dirName = () => {
    const parts = props.cwd.split("/")
    return parts[parts.length - 1] || props.cwd
  }

  // Get animation state
  const getAnimationState = () => {
    const agent = props.agents[props.currentAgent]
    if (!agent) return "idle"

    if (props.hasError) return "error"
    if (!props.isLoading) return "idle"

    if (agent.name === "yolo_extreme") return "yolo_extreme"
    if (agent.name === "yolo") return "yolo"

    return agent.animationState || "working"
  }

  const currentAgent = () => props.agents[props.currentAgent]

  // MCP entries
  const mcpEntries = createMemo(() =>
    props.mcp ? Object.entries(props.mcp).sort(([a], [b]) => a.localeCompare(b)) : []
  )

  // Format time
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  // MCP status color
  const getMcpStatusColor = (status: McpStatus["status"]) => {
    switch (status) {
      case "connected":
        return theme.success
      case "failed":
        return theme.error
      case "disabled":
        return theme.textMuted
      case "needs_auth":
        return theme.warning
      case "needs_client_registration":
        return theme.error
      default:
        return theme.textMuted
    }
  }

  return (
    <box
      flexDirection="column"
      width={35}
      borderStyle="single"
      borderColor={theme.border}
      paddingLeft={1}
      paddingRight={1}
    >
      {/* Animation Display */}
      <box flexDirection="column" alignItems="center" marginBottom={1}>
        <Animation state={getAnimationState()} compact={!showFullAnimation()} />
      </box>

      {/* Current Agent Banner */}
      <box marginBottom={1} paddingLeft={1}>
        <text fg={currentAgent()?.color || theme.primary}>
          <b>{currentAgent()?.name?.toUpperCase()}</b>
        </text>
        <text fg={theme.textMuted}> - {currentAgent()?.description}</text>
      </box>

      {/* Active Subagent Banner */}
      <Show when={props.subagentInfo}>
        <box paddingLeft={1} paddingRight={1} marginBottom={1}>
          <text fg={theme.accent}>
            <b>#{props.subagentInfo!.taskNumber} @{props.subagentInfo!.agentType}</b>
          </text>
          <text fg={theme.text}>
            <b> {props.subagentInfo!.shortName}</b>
          </text>
        </box>
      </Show>

      {/* Location */}
      <CollapsibleSection title="Location" icon="📍" expanded={true} theme={theme}>
        <text fg={theme.text}>{dirName()}</text>
        <Show when={props.gitBranch}>
          <box>
            <text fg={theme.success}>⎇ {props.gitBranch}</text>
            <Show when={props.gitAhead}>
              <text fg={theme.textMuted}> ↑{props.gitAhead}</text>
            </Show>
            <Show when={props.gitBehind}>
              <text fg={theme.textMuted}> ↓{props.gitBehind}</text>
            </Show>
          </box>
        </Show>
      </CollapsibleSection>

      {/* Session Info */}
      <Show when={props.sessionTitle}>
        <CollapsibleSection title="Session" icon="💬" expanded={true} theme={theme}>
          <text fg={theme.text}>
            <b>{props.sessionTitle}</b>
          </text>
          <Show when={props.sessionCreated}>
            <text fg={theme.textMuted}>{formatTime(props.sessionCreated)}</text>
          </Show>
          <Show when={props.parentSession}>
            <box>
              <text fg={theme.secondary}>◆ Parent: {props.parentSession!.title}</text>
            </box>
          </Show>
        </CollapsibleSection>
      </Show>

      {/* Agents */}
      <CollapsibleSection
        title="Agents"
        icon="👤"
        expanded={expandedSections().agents}
        onToggle={() => toggleSection("agents")}
        suffix={<text fg={theme.textMuted}>(Tab)</text>}
        theme={theme}
      >
        <For each={props.agents}>
          {(agent, i) => (
            <box>
              <text fg={i() === props.currentAgent ? agent.color : theme.textMuted}>
                {i() === props.currentAgent ? "▸ " : "  "}
                {agent.name}
              </text>
            </box>
          )}
        </For>
      </CollapsibleSection>

      {/* Usage */}
      <CollapsibleSection
        title="Usage"
        icon="📊"
        expanded={expandedSections().usage}
        onToggle={() => toggleSection("usage")}
        theme={theme}
      >
        <text fg={theme.textMuted}>In: {formatTokens(props.usage.input)}</text>
        <text fg={theme.textMuted}>Out: {formatTokens(props.usage.output)}</text>
        <Show when={props.usage.contextPercent !== undefined}>
          <text fg={props.usage.contextPercent! > 80 ? theme.warning : theme.textMuted}>
            Context: {props.usage.contextPercent}%
          </text>
        </Show>
        <text fg={theme.success}>${props.usage.cost.toFixed(4)}</text>
      </CollapsibleSection>

      {/* MCP Servers */}
      <Show when={mcpEntries().length > 0}>
        <CollapsibleSection
          title="MCP"
          icon="🔌"
          expanded={expandedSections().mcp}
          onToggle={() => toggleSection("mcp")}
          suffix={<text fg={theme.textMuted}>({mcpEntries().length})</text>}
          theme={theme}
        >
          <For each={mcpEntries()}>
            {([name, status]) => (
              <box flexDirection="row" gap={1}>
                <text fg={getMcpStatusColor(status.status)}>•</text>
                <text fg={theme.text}>{name}</text>
                <text fg={theme.textMuted}>
                  {status.status === "connected"
                    ? "Connected"
                    : status.status === "failed"
                    ? status.error || "Failed"
                    : status.status === "disabled"
                    ? "Disabled"
                    : status.status}
                </text>
              </box>
            )}
          </For>
        </CollapsibleSection>
      </Show>

      {/* LSP Servers */}
      <Show when={props.lsp && props.lsp.length > 0}>
        <CollapsibleSection
          title="LSP"
          icon="🔧"
          expanded={expandedSections().lsp}
          onToggle={() => toggleSection("lsp")}
          suffix={<text fg={theme.textMuted}>({props.lsp!.length})</text>}
          theme={theme}
        >
          <For each={props.lsp}>
            {(lsp) => (
              <box flexDirection="row" gap={1}>
                <text fg={lsp.status === "connected" ? theme.success : theme.error}>
                  {lsp.status === "connected" ? "●" : "!"}
                </text>
                <text fg={theme.textMuted}>
                  {lsp.id} {lsp.root}
                </text>
              </box>
            )}
          </For>
        </CollapsibleSection>
      </Show>
      <Show when={!props.lsp || props.lsp.length === 0}>
        <CollapsibleSection
          title="LSP"
          icon="🔧"
          expanded={false}
          onToggle={() => toggleSection("lsp")}
          theme={theme}
        >
          <text fg={theme.textMuted}>LSPs activate as files are read</text>
        </CollapsibleSection>
      </Show>

      {/* Todo List */}
      <CollapsibleSection
        title="Tasks"
        icon="📋"
        expanded={expandedSections().todos}
        onToggle={() => toggleSection("todos")}
        suffix={
          <text fg={theme.textMuted}>
            ({props.todos.filter((t) => t.status === "completed").length}/{props.todos.length})
          </text>
        }
        theme={theme}
      >
        <Show
          when={props.todos.length > 0}
          fallback={
            <box flexDirection="column">
              <text fg={theme.textMuted}>No active tasks</text>
              <text fg={theme.textMuted}>Claude adds tasks here</text>
            </box>
          }
        >
          <TodoList todos={props.todos as any} />
        </Show>
      </CollapsibleSection>

      {/* Modified Files */}
      <Show when={props.modifiedFiles && props.modifiedFiles.length > 0}>
        <CollapsibleSection
          title="Modified"
          icon="📝"
          expanded={expandedSections().files}
          onToggle={() => toggleSection("files")}
          suffix={<text fg={theme.textMuted}>({props.modifiedFiles!.length})</text>}
          theme={theme}
        >
          <For each={props.modifiedFiles!.slice(0, 5)}>
            {(file) => (
              <box flexDirection="row" gap={1}>
                <text fg={theme.text}>{file.path.split("/").pop()}</text>
                <text fg={theme.diff.added}>+{file.additions}</text>
                <text fg={theme.diff.removed}>-{file.deletions}</text>
              </box>
            )}
          </For>
          <Show when={props.modifiedFiles!.length > 5}>
            <text fg={theme.textMuted}>...and {props.modifiedFiles!.length - 5} more</text>
          </Show>
        </CollapsibleSection>
      </Show>

      {/* Keyboard Shortcuts */}
      <CollapsibleSection title="Keys" icon="⌨️" expanded={false} theme={theme}>
        <text fg={theme.textMuted}>Tab: agents</text>
        <text fg={theme.textMuted}>^K: commands</text>
        <text fg={theme.textMuted}>^B: sidebar</text>
        <text fg={theme.textMuted}>^L: clear</text>
        <text fg={theme.textMuted}>Esc: interrupt</text>
        <text fg={theme.textMuted}>^C: exit</text>
      </CollapsibleSection>

      {/* Footer */}
      <box flexGrow={1} />
      <box marginTop={1} flexDirection="column">
        <text fg={theme.textMuted}>{props.cwd}</text>
        <box>
          <text fg={theme.primary}>Qal</text>
          <text fg={theme.secondary}>Claude</text>
          <Show when={props.claudeVersion}>
            <text fg={theme.textMuted}> v{props.claudeVersion}</text>
          </Show>
        </box>
      </box>
    </box>
  )
}

// Collapsible section component
interface CollapsibleSectionProps {
  title: string
  icon?: string
  expanded?: boolean
  onToggle?: () => void
  suffix?: any
  theme: typeof defaultTheme
  children?: any
}

function CollapsibleSection(props: CollapsibleSectionProps) {
  const [localExpanded, setLocalExpanded] = createSignal(props.expanded ?? true)

  const isExpanded = () => (props.onToggle ? props.expanded : localExpanded())
  const toggle = () => (props.onToggle ? props.onToggle() : setLocalExpanded((e) => !e))

  return (
    <box flexDirection="column" marginTop={1}>
      <box>
        <text fg={props.theme.primary}>
          {props.icon ? `${props.icon} ` : ""}
          <b>{props.title}</b>
        </text>
        <text fg={props.theme.textMuted}> {isExpanded() ? "▾" : "▸"}</text>
        {props.suffix}
      </box>
      <Show when={isExpanded()}>
        <box flexDirection="column" paddingLeft={2}>
          {props.children}
        </box>
      </Show>
    </box>
  )
}

// Export CollapsibleSection for use in other components
export { CollapsibleSection }
