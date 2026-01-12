// QalClaude - Claude Code Connection
// Bidirectional streaming to Claude Code CLI

import { spawn, type ChildProcessWithoutNullStreams } from "child_process"
import { createInterface, type Interface } from "readline"
import { EventEmitter } from "events"

export interface ClaudeConnectionOptions {
  model?: string
  permissionMode?: string
  cwd?: string
  // Additional CLI args (from agent settings)
  extraArgs?: string[]
}

export interface ClaudeMessage {
  model?: string
  id?: string
  type?: string
  role?: string
  content?: Array<{
    type: string
    text?: string
    name?: string
    input?: any
    id?: string
  }>
  stop_reason?: string | null
  usage?: {
    input_tokens?: number
    output_tokens?: number
    cache_read_input_tokens?: number
    cache_creation_input_tokens?: number
  }
}

// Permission request from Claude
export interface PermissionRequest {
  tool: string
  toolId: string
  description: string
  input?: any
  risk?: "low" | "medium" | "high"
}

export interface ClaudeEvent {
  type: string
  subtype?: string
  message?: ClaudeMessage
  result?: string
  session_id?: string
  cwd?: string
  tools?: string[]
  model?: string
  permissionMode?: string
  claude_code_version?: string
  total_cost_usd?: number
  duration_ms?: number
  is_error?: boolean
  error?: string
  usage?: any
  // Permission events
  tool_use_id?: string
  tool_name?: string
  tool_input?: any
}

export interface ClaudeConnection extends EventEmitter {
  connect(): Promise<void>
  send(message: string): Promise<void>
  sendPermissionResponse(toolId: string, allowed: boolean): void
  interrupt(): void
  disconnect(): void
  isConnected(): boolean
  reconnect(options?: Partial<ClaudeConnectionOptions>): Promise<void>
}

export function createClaudeConnection(options: ClaudeConnectionOptions = {}): ClaudeConnection {
  const emitter = new EventEmitter()
  let process: ChildProcessWithoutNullStreams | null = null
  let readline: Interface | null = null
  let connected = false
  let sessionId: string | null = null
  let currentOptions = { ...options }

  const buildArgs = (opts: ClaudeConnectionOptions): string[] => {
    const args = [
      "--print",
      "--verbose",
      "--input-format", "stream-json",
      "--output-format", "stream-json",
    ]

    // Model (can be overridden by extraArgs)
    if (opts.model) {
      args.push("--model", opts.model)
    } else {
      args.push("--model", "claude-sonnet-4-20250514")
    }

    // Permission mode (if not in extraArgs)
    if (opts.permissionMode && opts.permissionMode !== "default") {
      // Check if not already in extraArgs
      if (!opts.extraArgs?.includes("--permission-mode")) {
        args.push("--permission-mode", opts.permissionMode)
      }
    }

    // Add agent-specific extra args
    if (opts.extraArgs && opts.extraArgs.length > 0) {
      args.push(...opts.extraArgs)
    }

    return args
  }

  const connect = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const args = buildArgs(currentOptions)

      process = spawn("claude", args, {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: currentOptions.cwd || globalThis.process.cwd(),
      })

      readline = createInterface({ input: process.stdout })

      let initReceived = false

      readline.on("line", (line: string) => {
        if (!line.trim()) return

        try {
          const event: ClaudeEvent = JSON.parse(line)

          // Handle system init
          if (event.type === "system" && event.subtype === "init") {
            connected = true
            initReceived = true
            sessionId = event.session_id || null
            emitter.emit("init", event)
            resolve()
          }

          // Handle assistant messages (streaming content)
          if (event.type === "assistant" && event.message) {
            emitter.emit("assistant", event)
          }

          // Handle result (conversation turn complete)
          if (event.type === "result") {
            emitter.emit("result", event)
          }

          // Handle permission requests
          // Claude emits these when it needs user approval for a tool
          if (event.type === "permission_request" ||
              (event.type === "system" && event.subtype === "permission_request")) {
            const permissionReq: PermissionRequest = {
              tool: event.tool_name || "unknown",
              toolId: event.tool_use_id || "",
              description: `${event.tool_name} wants to execute`,
              input: event.tool_input,
              risk: getToolRisk(event.tool_name || ""),
            }
            emitter.emit("permission", permissionReq)
          }

          // Handle errors
          if (event.type === "error" || event.is_error) {
            emitter.emit("error", { message: event.error || event.result || "Unknown error" })
          }

          // Emit all events for custom handling
          emitter.emit("event", event)
          emitter.emit(event.type, event)

        } catch (err) {
          // Non-JSON output (debug info, etc.)
          emitter.emit("raw", line)
        }
      })

      readline.on("close", () => {
        connected = false
        emitter.emit("close")
      })

      process.stderr.on("data", (data: Buffer) => {
        const stderr = data.toString()
        emitter.emit("stderr", stderr)

        // Check for error messages
        if (stderr.includes("Error:") || stderr.includes("error:")) {
          emitter.emit("error", { message: stderr.trim() })
        }
      })

      process.on("error", (err) => {
        if (!initReceived) reject(err)
        emitter.emit("error", err)
      })

      process.on("close", (code) => {
        connected = false
        emitter.emit("exit", code)
      })

      // Connection timeout
      const timeout = setTimeout(() => {
        if (!initReceived) {
          reject(new Error("Connection timeout - is Claude CLI installed?"))
        }
      }, 30000)

      emitter.once("init", () => clearTimeout(timeout))

      // Send initial trigger message to get init event
      // Claude CLI waits for first input before emitting init
      // Empty content triggers init without starting a conversation
      setTimeout(() => {
        if (!initReceived && process && process.stdin.writable) {
          const initMsg = JSON.stringify({
            type: "user",
            message: { role: "user", content: "" }
          })
          process.stdin.write(initMsg + "\n")
        }
      }, 100)
    })
  }

  const send = async (message: string): Promise<void> => {
    if (!process || !connected) {
      throw new Error("Not connected to Claude")
    }

    const msg = JSON.stringify({
      type: "user",
      message: {
        role: "user",
        content: message
      }
    })

    process.stdin.write(msg + "\n")
  }

  // Send permission response (allow/deny) for a tool request
  const sendPermissionResponse = (toolId: string, allowed: boolean): void => {
    if (!process || !connected) return

    const response = JSON.stringify({
      type: "permission_response",
      tool_use_id: toolId,
      allowed: allowed
    })

    process.stdin.write(response + "\n")
  }

  const interrupt = (): void => {
    if (process) {
      process.kill("SIGINT")
      emitter.emit("interrupted")
    }
  }

  const disconnect = (): void => {
    if (process) {
      process.stdin.end()
      process.kill()
      process = null
    }
    if (readline) {
      readline.close()
      readline = null
    }
    connected = false
    sessionId = null
  }

  const isConnected = (): boolean => connected

  // Reconnect with new options (used when switching agents)
  const reconnect = async (newOptions?: Partial<ClaudeConnectionOptions>): Promise<void> => {
    disconnect()
    if (newOptions) {
      currentOptions = { ...currentOptions, ...newOptions }
    }
    await connect()
  }

  return Object.assign(emitter, {
    connect,
    send,
    sendPermissionResponse,
    interrupt,
    disconnect,
    isConnected,
    reconnect,
  }) as ClaudeConnection
}

// Get risk level for a tool
function getToolRisk(toolName: string): "low" | "medium" | "high" {
  const highRisk = ["Bash", "Write", "Edit", "NotebookEdit", "KillShell"]
  const mediumRisk = ["WebFetch", "WebSearch", "Task"]

  if (highRisk.includes(toolName)) return "high"
  if (mediumRisk.includes(toolName)) return "medium"
  return "low"
}
