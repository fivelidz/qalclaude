// QalClaude Enhanced Sidebar Component

import { createSignal, Show, For } from "solid-js"
import { useTheme, defaultTheme } from "../context/theme"
import { useAgent, type Agent } from "../context/agents"
import { Animation } from "./animation"
import { TodoList } from "./tool-output/todo"

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
  modifiedFiles?: Array<{ path: string; additions: number; deletions: number }>
}

export function Sidebar(props: SidebarProps) {
  const [showFullAnimation, setShowFullAnimation] = createSignal(true)
  const [expandedSections, setExpandedSections] = createSignal<Record<string, boolean>>({
    agents: true,
    usage: true,
    todos: true,
    git: false,
    files: false,
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

  return (
    <box
      flexDirection="column"
      width={30}
      borderStyle="single"
      borderColor={theme.border}
      paddingLeft={1}
      paddingRight={1}
    >
      {/* Animation Display */}
      <box
        flexDirection="column"
        alignItems="center"
        marginBottom={1}
      >
        <Animation state={getAnimationState()} compact={!showFullAnimation()} />
      </box>

      {/* Current Agent Banner */}
      <box
        marginBottom={1}
        paddingLeft={1}
      >
        <text fg={currentAgent()?.color || theme.primary}>
          <b>{currentAgent()?.name?.toUpperCase()}</b>
        </text>
        <text fg={theme.textMuted}> - {currentAgent()?.description}</text>
      </box>

      {/* Location */}
      <CollapsibleSection
        title="Location"
        icon="📍"
        expanded={true}
        theme={theme}
      >
        <text fg={theme.text}>{dirName()}</text>
        <Show when={props.gitBranch}>
          <box>
            <text fg={theme.secondary}>⎇ {props.gitBranch}</text>
          </box>
        </Show>
      </CollapsibleSection>

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
                {i() === props.currentAgent ? "▸ " : "  "}{agent.name}
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
        <TodoList todos={props.todos as any} />
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
              <box>
                <text fg={theme.text}>{file.path.split("/").pop()}</text>
                <text fg={theme.diff.added}> +{file.additions}</text>
                <text fg={theme.diff.removed}> -{file.deletions}</text>
              </box>
            )}
          </For>
          <Show when={props.modifiedFiles!.length > 5}>
            <text fg={theme.textMuted}>...and {props.modifiedFiles!.length - 5} more</text>
          </Show>
        </CollapsibleSection>
      </Show>

      {/* Keyboard Shortcuts */}
      <CollapsibleSection
        title="Keys"
        icon="⌨️"
        expanded={false}
        theme={theme}
      >
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
        <text fg={theme.textMuted}>{dirName()}</text>
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

  const isExpanded = () => props.onToggle ? props.expanded : localExpanded()
  const toggle = () => props.onToggle ? props.onToggle() : setLocalExpanded((e) => !e)

  return (
    <box flexDirection="column" marginTop={1}>
      <box>
        <text fg={props.theme.primary}>
          {props.icon ? `${props.icon} ` : ""}<b>{props.title}</b>
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
