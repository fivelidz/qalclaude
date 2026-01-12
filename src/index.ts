// QalClaude - Claude Code TUI with qalcode features
// Main exports

// Context Providers
export { ThemeProvider, useTheme, defaultTheme } from "./context/theme"
export { ToastProvider, useToast } from "./context/toast"
export { DialogProvider, useDialog } from "./context/dialog"
export { KeybindProvider, useKeybind, type KeybindsConfig } from "./context/keybind"
export { CommandProvider, useCommand, type CommandOption } from "./context/command"
export { AgentProvider, useAgent, AGENTS, type Agent, type PermissionMode } from "./context/agents"
export {
  SyncProvider,
  useSync,
  type Session,
  type Message,
  type Part,
  type Todo,
  type Permission,
  type McpStatus,
  type LspStatus,
  type SessionStatus,
  type FileDiff,
  type VcsInfo,
  type Provider,
  type Config,
} from "./context/sync"
export { GitProvider, useGit, type GitInfo, type GitFile } from "./context/git"

// Components
export { Logo } from "./components/logo"
export { Prompt } from "./components/prompt"
export { MessageList } from "./components/message-list"
export { Sidebar, CollapsibleSection } from "./components/sidebar"
export { StatusBar } from "./components/status-bar"
export { Header } from "./components/header"
export { Animation, ANIMATION_STATES } from "./components/animation"
export {
  SubagentPanel,
  createSubagentPanelState,
} from "./components/subagent-panel"
export {
  SplitSessionPanel,
  SplitPanelContainer,
  createSplitPanelState,
} from "./components/split-panel"
export { SessionTabs } from "./components/session-tabs"
export {
  Autocomplete,
  FileSuggestions,
  type AutocompleteOption,
  type AutocompleteRef,
  type AutocompleteProps,
} from "./components/autocomplete"

// Tool Output Components
export { ToolOutput, type ToolCall } from "./components/tool-output"
export { BashOutput } from "./components/tool-output/bash"
export { EditOutput, DiffViewer } from "./components/tool-output/edit"
export { FileOutput } from "./components/tool-output/file"
export { TodoOutput, TodoList } from "./components/tool-output/todo"
export { SearchOutput } from "./components/tool-output/search"
export { TaskOutput } from "./components/tool-output/task"

// Dialogs
export { CommandPalette } from "./dialogs/command-palette"
export { AgentSelect } from "./dialogs/agent-select"
export { ThemeSelect } from "./dialogs/theme-select"
export { SessionList, DialogSessionList } from "./dialogs/session-list"
export { SessionRename, DialogSessionRename } from "./dialogs/session-rename"
export { DialogPermissions, PermissionPrompt } from "./dialogs/permissions"
export { DialogMcp, DialogLsp } from "./dialogs/mcp"

// Main App
export { App, type Message as AppMessage, type TodoItem } from "./tui/app"

// Claude Connection
export { createClaudeConnection, type ClaudeConnection } from "./claude/connection"
