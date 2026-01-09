// QalClaude Agents Context Provider

import { createContext, useContext, createSignal, type ParentProps } from "solid-js"

// Permission mode for Claude Code
export type PermissionMode = "default" | "plan" | "acceptEdits" | "bypassPermissions"

// Agent definition
export interface Agent {
  name: string
  color: string
  description: string
  permissionMode: PermissionMode
  animationState: string
  systemPrompt?: string
}

// All available agents
export const AGENTS: Agent[] = [
  {
    name: "coder",
    color: "#9ece6a", // green
    description: "Full development",
    permissionMode: "default",
    animationState: "working",
    systemPrompt: "You are a skilled software developer. Write clean, efficient code.",
  },
  {
    name: "build",
    color: "#7aa2f7", // blue
    description: "Build specialist",
    permissionMode: "default",
    animationState: "working",
    systemPrompt: "You are a build and deployment specialist.",
  },
  {
    name: "plan",
    color: "#7dcfff", // cyan
    description: "Read-only planning",
    permissionMode: "plan",
    animationState: "thinking",
    systemPrompt: "You are a planning assistant. Analyze and suggest without modifying.",
  },
  {
    name: "researcher",
    color: "#2ac3de", // teal
    description: "Code exploration",
    permissionMode: "plan",
    animationState: "searching",
    systemPrompt: "You are a code researcher. Explore and explain codebases.",
  },
  {
    name: "architect",
    color: "#bb9af7", // purple
    description: "System design",
    permissionMode: "plan",
    animationState: "thinking",
    systemPrompt: "You are a system architect. Design systems and document architecture.",
  },
  {
    name: "debugger",
    color: "#e0af68", // orange
    description: "Bug fixing",
    permissionMode: "default",
    animationState: "searching",
    systemPrompt: "You are a debugging specialist. Find and fix bugs.",
  },
  {
    name: "yolo",
    color: "#f7768e", // red
    description: "No restrictions",
    permissionMode: "bypassPermissions",
    animationState: "yolo",
    systemPrompt: "Full access mode. Execute without asking for permissions.",
  },
  {
    name: "yolo_extreme",
    color: "#ff0000", // bright red
    description: "MAXIMUM CHAOS",
    permissionMode: "bypassPermissions",
    animationState: "yolo_extreme",
    systemPrompt: "EXTREME MODE. No limits. No safety. Full send.",
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
}

const AgentContext = createContext<AgentContextValue>()

export function AgentProvider(props: ParentProps & { initialAgent?: string }) {
  // Find initial agent index
  const initialIndex = props.initialAgent
    ? AGENTS.findIndex((a) => a.name === props.initialAgent)
    : 0

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

  const value: AgentContextValue = {
    agents: AGENTS,
    currentAgent,
    currentIndex,
    setAgent,
    setAgentByName,
    cycleAgent,
    getAgentByName,
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
  return agent.permissionMode === "bypassPermissions"
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
