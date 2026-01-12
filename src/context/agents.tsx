// QalClaude Agents Context Provider
// Agents that map to Claude Code CLI options

import { createContext, useContext, createSignal, type ParentProps } from "solid-js"

// Permission modes supported by Claude Code CLI
export type PermissionMode =
  | "default"      // Ask for permissions (normal mode)
  | "plan"         // Read-only, no modifications
  | "acceptEdits"  // Auto-accept file edits
  | "bypassPermissions"  // Skip most permission checks
  | "dontAsk"      // Don't ask, just execute

// Agent definition with Claude CLI mappings
export interface Agent {
  name: string
  color: string
  description: string
  permissionMode: PermissionMode
  animationState: string
  systemPrompt?: string
  // Claude CLI tool restrictions
  allowedTools?: string[]      // Only these tools available
  disallowedTools?: string[]   // These tools blocked
  // Special flags
  dangerouslySkipPermissions?: boolean  // --dangerously-skip-permissions
  model?: string               // Override model for this agent
}

// All available agents - sorted by permission level (safest first)
export const AGENTS: Agent[] = [
  // === SAFE AGENTS (Read-only) ===
  {
    name: "researcher",
    color: "#2ac3de", // teal
    description: "Read-only exploration",
    permissionMode: "plan",
    animationState: "searching",
    systemPrompt: "You are a code researcher. Explore, analyze, and explain codebases. Do not modify any files.",
    allowedTools: ["Read", "Glob", "Grep", "Task", "WebSearch", "WebFetch"],
  },
  {
    name: "architect",
    color: "#bb9af7", // purple
    description: "System design & planning",
    permissionMode: "plan",
    animationState: "thinking",
    systemPrompt: "You are a system architect. Analyze codebases, design systems, and create plans. Focus on documentation and architecture decisions.",
    allowedTools: ["Read", "Glob", "Grep", "Task", "WebSearch", "WebFetch", "Write"],
    disallowedTools: ["Bash"],
  },
  {
    name: "plan",
    color: "#7dcfff", // cyan
    description: "Safe planning mode",
    permissionMode: "plan",
    animationState: "thinking",
    systemPrompt: "You are in planning mode. Analyze the codebase and create detailed implementation plans without executing changes.",
  },

  // === STANDARD AGENTS (With permissions) ===
  {
    name: "coder",
    color: "#9ece6a", // green
    description: "Full development",
    permissionMode: "default",
    animationState: "working",
    systemPrompt: "You are a skilled software developer. Write clean, efficient, well-tested code.",
  },
  {
    name: "build",
    color: "#7aa2f7", // blue
    description: "Build & deploy",
    permissionMode: "default",
    animationState: "working",
    systemPrompt: "You are a build and deployment specialist. Focus on CI/CD, builds, and deployment pipelines.",
  },
  {
    name: "debugger",
    color: "#e0af68", // orange
    description: "Bug hunting",
    permissionMode: "default",
    animationState: "searching",
    systemPrompt: "You are a debugging specialist. Systematically find and fix bugs. Use logs, traces, and tests.",
  },

  // === UNRESTRICTED AGENTS (No permission prompts) ===
  {
    name: "yolo",
    color: "#f7768e", // red
    description: "Auto-approve edits",
    permissionMode: "acceptEdits",
    animationState: "yolo",
    systemPrompt: "Fast development mode. File edits are auto-approved. Be efficient.",
  },
  {
    name: "yolo_extreme",
    color: "#ff5555", // bright red
    description: "No permission checks",
    permissionMode: "bypassPermissions",
    dangerouslySkipPermissions: true,
    animationState: "yolo_extreme",
    systemPrompt: "Full access mode. All operations execute immediately without confirmation. Use responsibly.",
  },
]

interface AgentContextValue {
  agents: Agent[]
  currentAgent: () => Agent
  currentIndex: () => number
  setAgent: (index: number) => void
  setAgentByName: (name: string) => void
  cycleAgent: (reverse?: boolean) => void
  getAgentByName: (name: string) => Agent | undefined
  // New: get CLI args for current agent
  getClaudeArgs: () => string[]
}

const AgentContext = createContext<AgentContextValue>()

export function AgentProvider(props: ParentProps & { initialAgent?: string }) {
  // Find initial agent index (default to coder)
  const defaultAgent = "coder"
  const initialName = props.initialAgent || defaultAgent
  const initialIndex = AGENTS.findIndex((a) => a.name === initialName)

  const [currentIndex, setCurrentIndex] = createSignal(initialIndex >= 0 ? initialIndex : 0)

  const currentAgent = () => AGENTS[currentIndex()]

  const setAgent = (index: number) => {
    if (index >= 0 && index < AGENTS.length) {
      setCurrentIndex(index)
    }
  }

  const setAgentByName = (name: string) => {
    const index = AGENTS.findIndex((a) => a.name === name)
    if (index >= 0) {
      setCurrentIndex(index)
    }
  }

  const cycleAgent = (reverse = false) => {
    setCurrentIndex((i) => {
      if (reverse) {
        return (i - 1 + AGENTS.length) % AGENTS.length
      }
      return (i + 1) % AGENTS.length
    })
  }

  const getAgentByName = (name: string) => {
    return AGENTS.find((a) => a.name === name)
  }

  // Build Claude CLI arguments for current agent
  const getClaudeArgs = (): string[] => {
    const agent = currentAgent()
    const args: string[] = []

    // Permission mode
    if (agent.permissionMode !== "default") {
      args.push("--permission-mode", agent.permissionMode)
    }

    // Dangerous skip permissions (for yolo_extreme)
    if (agent.dangerouslySkipPermissions) {
      args.push("--dangerously-skip-permissions")
    }

    // Tool restrictions
    if (agent.allowedTools && agent.allowedTools.length > 0) {
      args.push("--allowed-tools", agent.allowedTools.join(","))
    }

    if (agent.disallowedTools && agent.disallowedTools.length > 0) {
      args.push("--disallowed-tools", agent.disallowedTools.join(","))
    }

    // System prompt
    if (agent.systemPrompt) {
      args.push("--append-system-prompt", agent.systemPrompt)
    }

    // Model override
    if (agent.model) {
      args.push("--model", agent.model)
    }

    return args
  }

  const value: AgentContextValue = {
    agents: AGENTS,
    currentAgent,
    currentIndex,
    setAgent,
    setAgentByName,
    cycleAgent,
    getAgentByName,
    getClaudeArgs,
  }

  return <AgentContext.Provider value={value}>{props.children}</AgentContext.Provider>
}

export function useAgent() {
  const ctx = useContext(AgentContext)
  if (!ctx) {
    throw new Error("useAgent must be used within AgentProvider")
  }
  return ctx
}

// Helper to check if agent has write permissions
export function canWrite(agent: Agent): boolean {
  return agent.permissionMode !== "plan"
}

// Helper to check if agent bypasses permissions
export function bypassesPermissions(agent: Agent): boolean {
  return (
    agent.permissionMode === "bypassPermissions" ||
    agent.permissionMode === "acceptEdits" ||
    agent.dangerouslySkipPermissions === true
  )
}

// Helper to check if agent is read-only
export function isReadOnly(agent: Agent): boolean {
  return agent.permissionMode === "plan"
}

// Helper to get animation state for agent
export function getAnimationState(agent: Agent, isWorking: boolean, hasError: boolean): string {
  if (hasError) return "error"
  if (!isWorking) return "idle"

  // Yolo agents have special animations
  if (agent.name === "yolo_extreme") return "yolo_extreme"
  if (agent.name === "yolo") return "yolo"

  return agent.animationState
}

// Get agent by permission level (for sorting/filtering)
export function getPermissionLevel(agent: Agent): number {
  if (agent.dangerouslySkipPermissions) return 4
  switch (agent.permissionMode) {
    case "plan": return 0
    case "default": return 1
    case "acceptEdits": return 2
    case "bypassPermissions": return 3
    case "dontAsk": return 3
    default: return 1
  }
}
