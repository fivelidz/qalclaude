// QalClaude Permissions Dialog - Manage tool permissions

import { createMemo, For, Show } from "solid-js"
import { useTheme, defaultTheme } from "../context/theme"
import { useDialog } from "../context/dialog"
import { useSync } from "../context/sync"
import { useToast } from "../context/toast"

type PermissionLevel = "ask" | "allow" | "deny"

interface PermissionConfig {
  tool: string
  displayName: string
  description: string
  level: PermissionLevel
  risk: "low" | "medium" | "high"
}

const TOOL_INFO: Record<
  string,
  { displayName: string; description: string; risk: "low" | "medium" | "high" }
> = {
  read: { displayName: "Read Files", description: "Read file contents from disk", risk: "low" },
  write: {
    displayName: "Write Files",
    description: "Create or overwrite files",
    risk: "medium",
  },
  edit: {
    displayName: "Edit Files",
    description: "Modify existing file contents",
    risk: "medium",
  },
  bash: {
    displayName: "Shell Commands",
    description: "Execute terminal commands",
    risk: "high",
  },
  glob: { displayName: "Find Files", description: "Search for files by pattern", risk: "low" },
  grep: { displayName: "Search Content", description: "Search file contents", risk: "low" },
  webfetch: {
    displayName: "Web Fetch",
    description: "Fetch content from URLs",
    risk: "medium",
  },
  task: {
    displayName: "Subagents",
    description: "Spawn sub-agents for tasks",
    risk: "medium",
  },
  doom_loop: {
    displayName: "Doom Loop",
    description: "Allow repeated tool calls",
    risk: "medium",
  },
  external_directory: {
    displayName: "External Dirs",
    description: "Access files outside project",
    risk: "high",
  },
}

export function DialogPermissions() {
  const dialog = useDialog()
  const sync = useSync()
  const toast = useToast()

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  // Get current permission levels from config
  const permissions = createMemo((): PermissionConfig[] => {
    const config = sync.data.config.permission ?? {}
    return Object.entries(TOOL_INFO).map(([tool, info]) => {
      const configValue = config[tool as keyof typeof config]
      let level: PermissionLevel = "ask"
      if (configValue === "allow") level = "allow"
      if (configValue === "deny") level = "deny"
      return {
        tool,
        ...info,
        level,
      }
    })
  })

  // Pending permissions count
  const pendingCount = createMemo(() => {
    let count = 0
    for (const sessionID in sync.data.permission) {
      count += sync.data.permission[sessionID]?.length ?? 0
    }
    return count
  })

  const levelIcon = (level: PermissionLevel) => {
    switch (level) {
      case "allow":
        return "✓"
      case "deny":
        return "✗"
      default:
        return "?"
    }
  }

  const levelColor = (level: PermissionLevel) => {
    switch (level) {
      case "allow":
        return theme.success
      case "deny":
        return theme.error
      default:
        return theme.warning
    }
  }

  const riskLabel = (risk: PermissionConfig["risk"]) => {
    switch (risk) {
      case "high":
        return "[HIGH]"
      case "medium":
        return "[MED]"
      default:
        return "[LOW]"
    }
  }

  const riskColor = (risk: PermissionConfig["risk"]) => {
    switch (risk) {
      case "high":
        return theme.error
      case "medium":
        return theme.warning
      default:
        return theme.success
    }
  }

  return (
    <box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme.border}
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
      width={60}
      height={20}
    >
      {/* Header */}
      <box marginBottom={1}>
        <text fg={theme.primary}>
          <b>Permission Settings</b>
        </text>
        <Show when={pendingCount() > 0}>
          <text fg={theme.warning}> ({pendingCount()} pending)</text>
        </Show>
      </box>

      {/* Permission list */}
      <box flexGrow={1} flexDirection="column">
        {/* Allowed */}
        <text fg={theme.success}>
          <b>Allowed</b>
        </text>
        <For each={permissions().filter((p) => p.level === "allow")}>
          {(perm) => (
            <box paddingLeft={2} flexDirection="row" gap={1}>
              <text fg={levelColor(perm.level)}>{levelIcon(perm.level)}</text>
              <text fg={theme.text}>{perm.displayName}</text>
              <text fg={riskColor(perm.risk)}>{riskLabel(perm.risk)}</text>
            </box>
          )}
        </For>

        {/* Ask Permission */}
        <text fg={theme.warning} marginTop={1}>
          <b>Ask Permission</b>
        </text>
        <For each={permissions().filter((p) => p.level === "ask")}>
          {(perm) => (
            <box paddingLeft={2} flexDirection="row" gap={1}>
              <text fg={levelColor(perm.level)}>{levelIcon(perm.level)}</text>
              <text fg={theme.text}>{perm.displayName}</text>
              <text fg={riskColor(perm.risk)}>{riskLabel(perm.risk)}</text>
            </box>
          )}
        </For>

        {/* Denied */}
        <Show when={permissions().filter((p) => p.level === "deny").length > 0}>
          <text fg={theme.error} marginTop={1}>
            <b>Denied</b>
          </text>
          <For each={permissions().filter((p) => p.level === "deny")}>
            {(perm) => (
              <box paddingLeft={2} flexDirection="row" gap={1}>
                <text fg={levelColor(perm.level)}>{levelIcon(perm.level)}</text>
                <text fg={theme.text}>{perm.displayName}</text>
                <text fg={riskColor(perm.risk)}>{riskLabel(perm.risk)}</text>
              </box>
            )}
          </For>
        </Show>
      </box>

      {/* Footer */}
      <box marginTop={1}>
        <text fg={theme.textMuted}>
          Edit .qalclaude.json to change: "permission": {"{"}"tool": "allow|ask|deny"{"}"}
        </text>
      </box>
    </box>
  )
}

// Permission prompt component - shown when a tool needs approval
export interface PermissionPromptProps {
  tool: string
  description?: string
  input?: Record<string, any>
  risk?: "low" | "medium" | "high"
  onAllow: () => void
  onDeny: () => void
  onAllowSession?: () => void
  onAlwaysAllow?: () => void
  onAlwaysDeny?: () => void
}

export function PermissionPrompt(props: PermissionPromptProps) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const toolInfo = TOOL_INFO[props.tool.toLowerCase()] || {
    displayName: props.tool,
    description: props.description || "Tool operation",
    risk: props.risk || ("medium" as const),
  }

  const risk = props.risk || toolInfo.risk

  // Format input for display
  const formatInput = () => {
    if (!props.input) return ""
    const entries = Object.entries(props.input).slice(0, 5)
    return entries
      .map(([key, value]) => {
        const strVal = typeof value === "string" ? value : JSON.stringify(value)
        const truncated = strVal.length > 60 ? strVal.slice(0, 57) + "..." : strVal
        return `${key}: ${truncated}`
      })
      .join("\n")
  }

  // Risk color
  const riskColor = () => {
    switch (risk) {
      case "high": return theme.error
      case "medium": return theme.warning
      default: return theme.success
    }
  }

  // Risk border color
  const borderColor = () => {
    switch (risk) {
      case "high": return theme.error
      case "medium": return theme.warning
      default: return theme.border
    }
  }

  return (
    <box
      flexDirection="column"
      borderStyle="single"
      borderColor={borderColor()}
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
      width={70}
    >
      {/* Header */}
      <box marginBottom={1}>
        <text fg={risk === "high" ? theme.error : theme.warning}>
          <b>{risk === "high" ? "⚠ HIGH RISK" : risk === "medium" ? "⚠ Permission Required" : "Permission Required"}</b>
        </text>
      </box>

      {/* Tool info */}
      <box marginBottom={1}>
        <text fg={theme.text}>
          <b>{toolInfo.displayName}</b>
        </text>
        <text fg={theme.textMuted}> - {props.description || toolInfo.description}</text>
        <text fg={riskColor()}>
          {" "}[{risk.toUpperCase()}]
        </text>
      </box>

      {/* Input details */}
      <Show when={props.input && Object.keys(props.input).length > 0}>
        <box marginBottom={1} paddingLeft={2} flexDirection="column">
          <For each={formatInput().split("\n")}>
            {(line) => <text fg={theme.textMuted}>{line}</text>}
          </For>
        </box>
      </Show>

      {/* Actions */}
      <box flexDirection="column" gap={1}>
        <box flexDirection="row" gap={3}>
          <text fg={theme.success}>[Y] Allow once</text>
          <text fg={theme.error}>[N] Deny</text>
        </box>
        <box flexDirection="row" gap={3}>
          <text fg={theme.accent}>[S] Allow for session</text>
          <Show when={props.onAlwaysAllow}>
            <text fg={theme.secondary}>[A] Always allow</text>
          </Show>
        </box>
      </box>

      {/* Hint */}
      <box marginTop={1}>
        <text fg={theme.textMuted}>Press key to respond, or Escape to deny</text>
      </box>
    </box>
  )
}
