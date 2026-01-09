// QalClaude - Claude Code Connection
// Bidirectional streaming to Claude Code CLI

import { spawn, type ChildProcessWithoutNullStreams } from "child_process"
import { createInterface, type Interface } from "readline"
import { EventEmitter } from "events"

export interface ClaudeConnectionOptions {
  model?: string
  agent?: string
  permissionMode?: string
  cwd?: string
}

export interface ClaudeConnection extends EventEmitter {
  connect(): Promise<void>
  send(message: string): Promise<void>
  interrupt(): void
  disconnect(): void
}

export function createClaudeConnection(options: ClaudeConnectionOptions = {}): ClaudeConnection {
  const emitter = new EventEmitter()
  let process: ChildProcessWithoutNullStreams | null = null
  let readline: Interface | null = null
  let connected = false

  const connect = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const args = [
        "--print",
        "--verbose",
        "--input-format", "stream-json",
        "--output-format", "stream-json",
        "--model", options.model || "claude-opus-4-5-20251101",
        "--permission-mode", options.permissionMode || "default"
      ]

      if (options.agent) {
        args.push("--agent", options.agent)
      }

      process = spawn("claude", args, {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: options.cwd || globalThis.process.cwd(),
      })

      readline = createInterface({ input: process.stdout })

      let initReceived = false

      readline.on("line", (line: string) => {
        if (!line.trim()) return

        try {
          const event = JSON.parse(line)

          // Handle system init
          if (event.type === "system" && event.subtype === "init") {
            connected = true
            initReceived = true
            emitter.emit("init", event)
            resolve()
          }

          // Emit all events
          emitter.emit("event", event)
          emitter.emit(event.type, event)

        } catch {
          emitter.emit("raw", line)
        }
      })

      readline.on("close", () => {
        connected = false
        emitter.emit("close")
      })

      process.stderr.on("data", (data: Buffer) => {
        emitter.emit("stderr", data.toString())
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
          reject(new Error("Connection timeout"))
        }
      }, 30000)

      emitter.once("init", () => clearTimeout(timeout))

      // Send init trigger
      setTimeout(() => {
        if (!initReceived && process) {
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
      throw new Error("Not connected")
    }

    const msg = JSON.stringify({
      type: "user",
      message: { role: "user", content: message }
    })

    process.stdin.write(msg + "\n")
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
  }

  return Object.assign(emitter, {
    connect,
    send,
    interrupt,
    disconnect,
  }) as ClaudeConnection
}
