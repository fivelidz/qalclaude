#!/usr/bin/env bun
// QalClaude Main Entry Point
// Launches the TUI application

import { render } from "@opentui/solid"
import { App } from "./tui/app"

// Parse CLI arguments
const args = process.argv.slice(2)
let model = "claude-sonnet-4-20250514"
let agent = "coder"
let permissionMode = "default"

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--model" || args[i] === "-m") {
    model = args[i + 1] || model
    i++
  } else if (args[i] === "--agent" || args[i] === "-a") {
    agent = args[i + 1] || agent
    i++
  } else if (args[i] === "--yolo") {
    permissionMode = "yolo"
  } else if (args[i] === "--plan") {
    permissionMode = "plan"
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
QalClaude - Claude Code with qalcode's beautiful TUI

Usage: qalclaude [options]

Options:
  -m, --model <model>   Claude model to use (default: claude-sonnet-4-20250514)
  -a, --agent <agent>   Starting agent (default: coder)
  --yolo                Enable YOLO mode (auto-approve all actions)
  --plan                Enable plan mode (read-only exploration)
  -h, --help            Show this help message

Keyboard Shortcuts:
  Tab          Cycle through agents
  Ctrl+K       Open command palette
  Ctrl+B       Toggle sidebar
  Ctrl+L       Clear messages
  Escape       Interrupt current operation
  Ctrl+C       Exit

Agents:
  coder        Default development agent with full access
  build        Full access development agent
  plan         Read-only planning agent
  researcher   Analysis and exploration (read-only)
  architect    System design specialist
  debugger     Bug fixing specialist
  yolo         Unrestricted agent (use with caution)
`)
    process.exit(0)
  }
}

// Start the TUI
render(() => <App model={model} agent={agent} permissionMode={permissionMode} />)
