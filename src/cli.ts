#!/usr/bin/env bun
// QalClaude - Claude Code with qalcode's beautiful TUI
// Combines the power of Claude Code with a modern terminal interface

import { render } from "ink"
import React from "react"
import { App } from "./tui/app.js"
import { createClaudeConnector } from "./claude/connector.js"

async function main() {
  const args = process.argv.slice(2)

  // Parse arguments
  let model = "claude-opus-4-5-20251101"
  let agent: string | undefined
  let permissionMode = "default"

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--model" && args[i + 1]) {
      model = args[i + 1]
      i++
    } else if (args[i] === "--agent" && args[i + 1]) {
      agent = args[i + 1]
      i++
    } else if (args[i] === "--permission-mode" && args[i + 1]) {
      permissionMode = args[i + 1]
      i++
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
QalClaude - Claude Code with qalcode's TUI

Usage: qalclaude [options]

Options:
  --model <model>           Model to use (default: claude-opus-4-5-20251101)
  --agent <agent>           Agent to use (coder, yolo, plan, researcher, etc.)
  --permission-mode <mode>  Permission mode (default, bypassPermissions, plan, acceptEdits)
  -h, --help               Show this help

Keyboard Shortcuts:
  Tab          Switch agents
  Ctrl+C       Exit
  Ctrl+L       Clear screen
  Enter        Send message
  Shift+Enter  New line

Built with love, combining Claude Code's power with qalcode's beautiful interface.
`)
      process.exit(0)
    }
  }

  // Create Claude connector
  const claude = createClaudeConnector({
    model,
    agent,
    permissionMode,
    cwd: process.cwd()
  })

  // Log stderr from Claude
  claude.on("stderr", (data: string) => {
    if (data.includes("Error") || data.includes("error")) {
      console.error("[Claude]", data.trim())
    }
  })

  claude.on("error", (err: Error) => {
    console.error("[Error]", err.message)
  })

  // Connect and get init info
  console.log("Connecting to Claude Code...")
  try {
    const init = await claude.connect()
    console.log(`Connected to Claude ${init.claude_code_version}`)
    console.log(`Session: ${init.session_id}`)
    console.log(`Model: ${init.model}`)
    console.log(`Tools: ${init.tools.length} available`)
    console.log(`Agents: ${init.agents.join(", ")}`)
    console.log("")
    console.log("Starting TUI...")

    // Render TUI
    const { waitUntilExit } = render(
      React.createElement(App, { claude, init })
    )

    await waitUntilExit()
  } catch (err) {
    console.error("Failed to connect to Claude:", err)
    process.exit(1)
  } finally {
    claude.disconnect()
  }
}

main().catch(console.error)
