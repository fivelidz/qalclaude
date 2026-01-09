// QalClaude - Claude Code Connector
// Uses bidirectional streaming for full feature support

import { spawn, ChildProcessWithoutNullStreams } from "child_process"
import { createInterface, Interface } from "readline"
import { EventEmitter } from "events"

export interface ClaudeSystemInit {
  type: "system"
  subtype: "init"
  cwd: string
  session_id: string
  tools: string[]
  model: string
  permissionMode: string
  agents: string[]
  claude_code_version: string
  slash_commands: string[]
}

export interface ClaudeAssistantMessage {
  type: "assistant"
  message: {
    model: string
    id: string
    role: "assistant"
    content: Array<{
      type: "text" | "tool_use"
      text?: string
      id?: string
      name?: string
      input?: any
    }>
    usage: {
      input_tokens: number
      output_tokens: number
      cache_read_input_tokens?: number
    }
  }
  session_id: string
}

export interface ClaudeToolUse {
  type: "tool_use"
  tool_name: string
  tool_use_id: string
  input: any
}

export interface ClaudeToolResult {
  type: "tool_result"
  tool_use_id: string
  content: string
  is_error?: boolean
}

export interface ClaudeResult {
  type: "result"
  subtype: "success" | "error"
  result: string
  session_id: string
  total_cost_usd: number
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export type ClaudeEvent =
  | ClaudeSystemInit
  | ClaudeAssistantMessage
  | ClaudeToolUse
  | ClaudeToolResult
  | ClaudeResult
  | { type: string; [key: string]: any }

export interface ClaudeConnectorOptions {
  model?: string
  permissionMode?: string
  cwd?: string
  agent?: string
}

export class ClaudeConnector extends EventEmitter {
  private process: ChildProcessWithoutNullStreams | null = null
  private readline: Interface | null = null
  private sessionId: string | null = null
  private model: string
  private permissionMode: string
  private cwd: string
  private agent?: string
  private isConnected: boolean = false

  // Available after init
  public tools: string[] = []
  public agents: string[] = []
  public slashCommands: string[] = []
  public claudeVersion: string = ""

  constructor(options: ClaudeConnectorOptions = {}) {
    super()
    this.model = options.model || "claude-opus-4-5-20251101"
    this.permissionMode = options.permissionMode || "default"
    this.cwd = options.cwd || process.cwd()
    this.agent = options.agent
  }

  async connect(): Promise<ClaudeSystemInit> {
    return new Promise((resolve, reject) => {
      const args = [
        "--print",
        "--verbose",
        "--input-format", "stream-json",
        "--output-format", "stream-json",
        "--model", this.model,
        "--permission-mode", this.permissionMode
      ]

      if (this.agent) {
        args.push("--agent", this.agent)
      }

      this.process = spawn("claude", args, {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: this.cwd,
        env: { ...process.env, ANTHROPIC_API_KEY: undefined },
      })

      this.readline = createInterface({ input: this.process.stdout })

      let initReceived = false

      this.readline.on("line", (line: string) => {
        if (!line.trim()) return

        try {
          const event: ClaudeEvent = JSON.parse(line)

          // Handle system init
          if (event.type === "system" && (event as any).subtype === "init") {
            const init = event as ClaudeSystemInit
            this.sessionId = init.session_id
            this.tools = init.tools
            this.agents = init.agents
            this.slashCommands = init.slash_commands
            this.claudeVersion = init.claude_code_version
            this.isConnected = true
            initReceived = true
            this.emit("init", init)
            resolve(init)
          }

          // Emit all events
          this.emit("event", event)
          this.emit(event.type, event)

        } catch (e) {
          // Non-JSON output, emit as raw
          this.emit("raw", line)
        }
      })

      this.readline.on("close", () => {
        this.isConnected = false
        this.emit("close")
      })

      this.process.stderr.on("data", (data: Buffer) => {
        this.emit("stderr", data.toString())
      })

      this.process.on("error", (err) => {
        if (!initReceived) {
          reject(err)
        }
        this.emit("error", err)
      })

      this.process.on("close", (code) => {
        this.isConnected = false
        this.emit("exit", code)
      })

      // Timeout for connection
      const timeout = setTimeout(() => {
        if (!initReceived) {
          reject(new Error("Connection timeout - no init received from Claude"))
        }
      }, 30000)

      // Clear timeout on init
      this.once("init", () => clearTimeout(timeout))

      // Send an initial empty user message to trigger init
      // Claude streaming mode sends init on first interaction
      setTimeout(() => {
        if (!initReceived && this.process) {
          const initMsg = JSON.stringify({
            type: "user",
            message: { role: "user", content: "" }
          })
          this.process.stdin.write(initMsg + "\n")
        }
      }, 100)
    })
  }

  async send(message: string): Promise<void> {
    if (!this.process || !this.isConnected) {
      throw new Error("Not connected to Claude")
    }

    const inputMsg = JSON.stringify({
      type: "user",
      message: { role: "user", content: message }
    })

    this.process.stdin.write(inputMsg + "\n")
  }

  async sendControl(command: string, data?: any): Promise<void> {
    if (!this.process) {
      throw new Error("Not connected to Claude")
    }

    const controlMsg = JSON.stringify({
      type: "control",
      command,
      ...data
    })

    this.process.stdin.write(controlMsg + "\n")
  }

  // Interrupt the current operation
  async interrupt(): Promise<void> {
    if (!this.process) {
      throw new Error("Not connected to Claude")
    }

    // Send interrupt signal
    this.process.kill("SIGINT")
    this.emit("interrupted")
  }

  disconnect(): void {
    if (this.process) {
      this.process.stdin.end()
      this.process.kill()
      this.process = null
    }
    if (this.readline) {
      this.readline.close()
      this.readline = null
    }
    this.isConnected = false
  }

  get connected(): boolean {
    return this.isConnected
  }

  get session(): string | null {
    return this.sessionId
  }
}

// Factory function
export function createClaudeConnector(options?: ClaudeConnectorOptions): ClaudeConnector {
  return new ClaudeConnector(options)
}
