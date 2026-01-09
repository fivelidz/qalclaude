// QalClaude - Claude Code with qalcode's beautiful TUI
// OpenTUI/SolidJS version

import { render } from "@opentui/solid"
import { App } from "./tui/app"

// Parse command line arguments
const args = process.argv.slice(2)
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
QalClaude - Claude Code with qalcode's TUI (OpenTUI version)

Usage: qalclaude [options]

Options:
  --model <model>           Model to use (default: claude-opus-4-5-20251101)
  --agent <agent>           Agent to use (coder, yolo, plan, researcher, etc.)
  --permission-mode <mode>  Permission mode (default, bypassPermissions, plan, acceptEdits)
  -h, --help               Show this help

Keyboard Shortcuts:
  Tab          Switch agents
  Ctrl+C       Exit
  Ctrl+K       Command palette
  Escape       Interrupt (press twice)
  Enter        Send message
  Shift+Enter  New line

Built with OpenTUI/SolidJS for maximum performance.
`)
    process.exit(0)
  }
}

// Run the TUI
render(() => <App model={model} agent={agent} permissionMode={permissionMode} />, {
  targetFps: 60,
  exitOnCtrlC: false,
  useKittyKeyboard: true,
})
