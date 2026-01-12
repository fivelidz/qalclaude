// QalClaude Sync Context - Central state management for sessions, messages, permissions, MCP, LSP

import {
  createContext,
  useContext,
  createSignal,
  createMemo,
  onCleanup,
  type ParentProps,
} from "solid-js"
import { createStore, produce, reconcile } from "solid-js/store"

// Types matching Claude Code SDK v2
export interface Session {
  id: string
  title: string
  parentID?: string // For subagent sessions
  time: {
    created: number
    updated: number
    compacting?: number
  }
  share?: {
    url: string
  }
}

export interface Message {
  id: string
  sessionID: string
  role: "user" | "assistant"
  time: {
    created: number
    completed?: number
  }
  modelID?: string
  providerID?: string
  tokens?: {
    input?: number
    output?: number
    reasoning?: number
    cache?: {
      read?: number
      write?: number
    }
  }
  cost?: number
}

export interface Part {
  id: string
  messageID: string
  type: "text" | "tool" | "thinking"
  text?: string
  tool?: string
  state?: {
    status: "pending" | "completed" | "error"
    input?: Record<string, any>
    output?: any
    metadata?: Record<string, any>
  }
  synthetic?: boolean
}

export interface Todo {
  content: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  activeForm?: string
}

export interface Permission {
  id: string
  sessionID: string
  tool: string
  input: Record<string, any>
  time: number
  status: "pending" | "approved" | "denied"
}

export interface McpStatus {
  status: "connected" | "failed" | "disabled" | "needs_auth" | "needs_client_registration"
  error?: string
}

export interface LspStatus {
  id: string
  status: "connected" | "error"
  root?: string
}

export interface SessionStatus {
  type: "idle" | "busy" | "retry"
}

export interface FileDiff {
  file: string
  additions: number
  deletions: number
}

export interface VcsInfo {
  branch?: string
}

export interface Agent {
  name: string
  description?: string
  builtIn?: boolean
  mode?: "primary" | "subagent"
}

export interface ProviderModel {
  id: string
  name: string
  limit?: {
    context?: number
  }
  cost?: {
    input?: number
    output?: number
  }
}

export interface Provider {
  id: string
  name: string
  models: Record<string, ProviderModel>
}

export interface Config {
  permission?: Record<string, "ask" | "allow" | "deny">
  share?: "disabled" | "enabled"
}

export interface Command {
  name: string
  description?: string
}

interface SyncStore {
  status: "loading" | "partial" | "complete"
  provider: Provider[]
  provider_default: Record<string, string>
  agent: Agent[]
  command: Command[]
  config: Config
  permission: Record<string, Permission[]>
  session: Session[]
  session_status: Record<string, SessionStatus>
  session_diff: Record<string, FileDiff[]>
  todo: Record<string, Todo[]>
  message: Record<string, Message[]>
  part: Record<string, Part[]>
  lsp: LspStatus[]
  mcp: Record<string, McpStatus>
  vcs: VcsInfo | undefined
}

interface SyncContextValue {
  data: SyncStore
  set: <K extends keyof SyncStore>(key: K, value: SyncStore[K]) => void
  status: "loading" | "partial" | "complete"
  ready: boolean
  session: {
    get: (sessionID: string) => Session | undefined
    status: (sessionID: string) => "idle" | "working" | "compacting"
    sync: (sessionID: string) => Promise<void>
  }
  // For updating specific nested values
  updateSession: (session: Session) => void
  updateMessage: (message: Message) => void
  updatePart: (part: Part) => void
  updateTodo: (sessionID: string, todos: Todo[]) => void
  updatePermission: (permission: Permission) => void
  removePermission: (sessionID: string, permissionID: string) => void
  updateSessionStatus: (sessionID: string, status: SessionStatus) => void
  updateSessionDiff: (sessionID: string, diff: FileDiff[]) => void
  updateVcs: (vcs: VcsInfo) => void
  updateMcp: (mcp: Record<string, McpStatus>) => void
  updateLsp: (lsp: LspStatus[]) => void
}

const SyncContext = createContext<SyncContextValue>()

export function SyncProvider(props: ParentProps) {
  const [store, setStore] = createStore<SyncStore>({
    status: "loading",
    provider: [],
    provider_default: {},
    agent: [],
    command: [],
    config: {},
    permission: {},
    session: [],
    session_status: {},
    session_diff: {},
    todo: {},
    message: {},
    part: {},
    lsp: [],
    mcp: {},
    vcs: undefined,
  })

  // Binary search helper for sorted arrays
  const binarySearch = <T,>(arr: T[], id: string, getId: (item: T) => string) => {
    let low = 0
    let high = arr.length - 1
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const midId = getId(arr[mid])
      if (midId === id) return { found: true, index: mid }
      if (midId < id) low = mid + 1
      else high = mid - 1
    }
    return { found: false, index: low }
  }

  // Track which sessions have been fully synced
  const fullSyncedSessions = new Set<string>()

  const value: SyncContextValue = {
    data: store,
    set: (key, val) => setStore(key, val),
    get status() {
      return store.status
    },
    get ready() {
      return store.status !== "loading"
    },
    session: {
      get(sessionID: string) {
        const result = binarySearch(store.session, sessionID, (s) => s.id)
        if (result.found) return store.session[result.index]
        return undefined
      },
      status(sessionID: string) {
        const session = value.session.get(sessionID)
        if (!session) return "idle"
        if (session.time.compacting) return "compacting"
        const messages = store.message[sessionID] ?? []
        const last = messages.at(-1)
        if (!last) return "idle"
        if (last.role === "user") return "working"
        return last.time.completed ? "idle" : "working"
      },
      async sync(sessionID: string) {
        if (fullSyncedSessions.has(sessionID)) return
        // In a real implementation, this would fetch from Claude Code
        // For now, mark as synced
        fullSyncedSessions.add(sessionID)
      },
    },
    updateSession(session: Session) {
      setStore(
        produce((draft) => {
          const result = binarySearch(draft.session, session.id, (s) => s.id)
          if (result.found) {
            draft.session[result.index] = session
          } else {
            draft.session.splice(result.index, 0, session)
          }
        })
      )
    },
    updateMessage(message: Message) {
      setStore(
        produce((draft) => {
          const messages = draft.message[message.sessionID]
          if (!messages) {
            draft.message[message.sessionID] = [message]
            return
          }
          const result = binarySearch(messages, message.id, (m) => m.id)
          if (result.found) {
            messages[result.index] = message
          } else {
            messages.splice(result.index, 0, message)
          }
        })
      )
    },
    updatePart(part: Part) {
      setStore(
        produce((draft) => {
          const parts = draft.part[part.messageID]
          if (!parts) {
            draft.part[part.messageID] = [part]
            return
          }
          const result = binarySearch(parts, part.id, (p) => p.id)
          if (result.found) {
            parts[result.index] = part
          } else {
            parts.splice(result.index, 0, part)
          }
        })
      )
    },
    updateTodo(sessionID: string, todos: Todo[]) {
      setStore("todo", sessionID, todos)
    },
    updatePermission(permission: Permission) {
      setStore(
        produce((draft) => {
          const permissions = draft.permission[permission.sessionID]
          if (!permissions) {
            draft.permission[permission.sessionID] = [permission]
            return
          }
          const result = binarySearch(permissions, permission.id, (p) => p.id)
          if (result.found) {
            permissions[result.index] = permission
          } else {
            permissions.push(permission)
          }
        })
      )
    },
    removePermission(sessionID: string, permissionID: string) {
      setStore(
        produce((draft) => {
          const permissions = draft.permission[sessionID]
          if (!permissions) return
          const result = binarySearch(permissions, permissionID, (p) => p.id)
          if (result.found) {
            permissions.splice(result.index, 1)
          }
        })
      )
    },
    updateSessionStatus(sessionID: string, status: SessionStatus) {
      setStore("session_status", sessionID, status)
    },
    updateSessionDiff(sessionID: string, diff: FileDiff[]) {
      setStore("session_diff", sessionID, diff)
    },
    updateVcs(vcs: VcsInfo) {
      setStore("vcs", vcs)
    },
    updateMcp(mcp: Record<string, McpStatus>) {
      setStore("mcp", mcp)
    },
    updateLsp(lsp: LspStatus[]) {
      setStore("lsp", lsp)
    },
  }

  // Initialize with some default data
  setStore("status", "complete")
  setStore("agent", [
    { name: "coder", description: "Full development", builtIn: true },
    { name: "researcher", description: "Read-only analysis", builtIn: true },
    { name: "architect", description: "System design", builtIn: true },
    { name: "debugger", description: "Bug fixing", builtIn: true },
    { name: "yolo", description: "No restrictions", builtIn: true },
    { name: "yolo_extreme", description: "MAXIMUM CHAOS", builtIn: true },
    { name: "general", description: "Multi-step tasks", builtIn: false, mode: "subagent" },
    { name: "explore", description: "Code exploration", builtIn: false, mode: "subagent" },
  ])
  setStore("command", [
    { name: "new", description: "Create new session" },
    { name: "session", description: "List sessions" },
    { name: "models", description: "List models" },
    { name: "agents", description: "List agents" },
    { name: "mcp", description: "Toggle MCPs" },
    { name: "theme", description: "Switch theme" },
    { name: "help", description: "Show help" },
    { name: "exit", description: "Exit app" },
  ])

  return <SyncContext.Provider value={value}>{props.children}</SyncContext.Provider>
}

export function useSync() {
  const ctx = useContext(SyncContext)
  if (!ctx) {
    throw new Error("useSync must be used within SyncProvider")
  }
  return ctx
}
