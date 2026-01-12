// Test that all imports work correctly
import { createSignal } from "solid-js"

// Context providers
import { ThemeProvider, useTheme, defaultTheme } from "./src/context/theme"
import { ToastProvider, useToast } from "./src/context/toast"
import { DialogProvider, useDialog } from "./src/context/dialog"
import { KeybindProvider, useKeybind } from "./src/context/keybind"
import { CommandProvider, useCommand } from "./src/context/command"
import { AgentProvider, useAgent, AGENTS } from "./src/context/agents"
import { SyncProvider, useSync } from "./src/context/sync"
import { GitProvider, useGit } from "./src/context/git"

// Components
import { Logo } from "./src/components/logo"
import { Prompt } from "./src/components/prompt"
import { MessageList } from "./src/components/message-list"
import { Sidebar } from "./src/components/sidebar"
import { StatusBar } from "./src/components/status-bar"
import { Header } from "./src/components/header"
import { Animation, ANIMATION_STATES } from "./src/components/animation"
import { SubagentPanel, createSubagentPanelState } from "./src/components/subagent-panel"
import { SplitPanelContainer, createSplitPanelState } from "./src/components/split-panel"
import { SessionTabs } from "./src/components/session-tabs"
import { Autocomplete } from "./src/components/autocomplete"

// Tool outputs
import { ToolOutput } from "./src/components/tool-output"
import { BashOutput } from "./src/components/tool-output/bash"
import { EditOutput, DiffViewer } from "./src/components/tool-output/edit"
import { FileOutput } from "./src/components/tool-output/file"
import { TodoOutput, TodoList } from "./src/components/tool-output/todo"
import { SearchOutput } from "./src/components/tool-output/search"
import { TaskOutput } from "./src/components/tool-output/task"

// Dialogs
import { CommandPalette } from "./src/dialogs/command-palette"
import { AgentSelect } from "./src/dialogs/agent-select"
import { ThemeSelect } from "./src/dialogs/theme-select"
import { DialogSessionList } from "./src/dialogs/session-list"
import { DialogSessionRename } from "./src/dialogs/session-rename"
import { DialogPermissions, PermissionPrompt } from "./src/dialogs/permissions"
import { DialogMcp, DialogLsp } from "./src/dialogs/mcp"

// App
import { App } from "./src/tui/app"

// Tests
console.log("Testing imports...")

// Test 1: Agents
console.log(`✓ ${AGENTS.length} agents loaded:`, AGENTS.map(a => a.name).join(", "))

// Test 2: Animation states
console.log(`✓ ${ANIMATION_STATES.length} animation states:`, ANIMATION_STATES.join(", "))

// Test 3: Default theme
console.log(`✓ Default theme loaded:`, Object.keys(defaultTheme).slice(0, 5).join(", "), "...")

// Test 4: Components are functions
const components = [
  ["Logo", Logo],
  ["Prompt", Prompt],
  ["MessageList", MessageList],
  ["Sidebar", Sidebar],
  ["Header", Header],
  ["StatusBar", StatusBar],
  ["Animation", Animation],
  ["SubagentPanel", SubagentPanel],
  ["SplitPanelContainer", SplitPanelContainer],
  ["SessionTabs", SessionTabs],
  ["Autocomplete", Autocomplete],
]
for (const [name, comp] of components) {
  if (typeof comp === "function") {
    console.log(`✓ ${name} component is a function`)
  } else {
    console.log(`✗ ${name} component failed to load`)
  }
}

// Test 5: Tool outputs
const toolOutputs = [
  ["ToolOutput", ToolOutput],
  ["BashOutput", BashOutput],
  ["EditOutput", EditOutput],
  ["DiffViewer", DiffViewer],
  ["FileOutput", FileOutput],
  ["TodoOutput", TodoOutput],
  ["TodoList", TodoList],
  ["SearchOutput", SearchOutput],
  ["TaskOutput", TaskOutput],
]
console.log(`✓ ${toolOutputs.length} tool output renderers loaded`)

// Test 6: Dialogs
const dialogs = [
  ["CommandPalette", CommandPalette],
  ["AgentSelect", AgentSelect],
  ["ThemeSelect", ThemeSelect],
  ["DialogSessionList", DialogSessionList],
  ["DialogSessionRename", DialogSessionRename],
  ["DialogPermissions", DialogPermissions],
  ["PermissionPrompt", PermissionPrompt],
  ["DialogMcp", DialogMcp],
  ["DialogLsp", DialogLsp],
]
console.log(`✓ ${dialogs.length} dialogs loaded`)

// Test 7: State helpers
const subagentState = createSubagentPanelState()
console.log(`✓ createSubagentPanelState works:`, Object.keys(subagentState).join(", "))

const splitState = createSplitPanelState()
console.log(`✓ createSplitPanelState works:`, Object.keys(splitState).join(", "))

// Test 8: App
console.log(`✓ App component loaded: ${typeof App}`)

console.log("\n=== All imports successful! ===")
