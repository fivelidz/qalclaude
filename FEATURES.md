# QalClaude Feature Implementation Guide

This document outlines all features from qalcode that need to be implemented in QalClaude.

## Current Status

### Implemented
- [x] Basic TUI layout with header, sidebar, message list, prompt, status bar
- [x] Tokyo Night theme colors
- [x] Agent list in sidebar (Tab to cycle)
- [x] Basic keyboard shortcuts (Tab, Ctrl+B, Ctrl+L, Escape, Ctrl+C)
- [x] Shift+Enter for newlines in prompt
- [x] Claude Code connection via bidirectional JSON streaming
- [x] Message display with streaming content
- [x] Todo list tracking from Claude

### Not Implemented
See sections below for all missing features.

---

## 1. CONTEXT PROVIDERS

Context providers manage global state with SolidJS. Each needs to be ported.

### 1.1 ThemeProvider
**Source:** `/nix/store/.../context/theme.tsx`

Features:
- Theme color definitions (27+ built-in themes)
- Dark/light mode toggle
- Custom theme loading from config
- Syntax highlighting rules
- ANSI color conversion
- Theme resolution (hex, references, variants)

Colors needed:
```typescript
interface ThemeColors {
  primary, secondary, accent, error, warning, success, info
  text, textMuted, textSubtle
  background, backgroundPanel, backgroundElement
  border, borderActive
  diff: { added, removed, addedBg, removedBg }
  markdown: { code, codeBg, link, heading }
  syntax: { keyword, string, number, comment, function, variable, type, operator }
}
```

### 1.2 DialogProvider
**Source:** `/nix/store/.../ui/dialog.tsx`

Features:
- Stack-based dialog management
- Push/replace/clear dialogs
- Escape to close
- Click outside to dismiss
- Focus management (save/restore focus)
- Copy-on-select with OSC 52

### 1.3 CommandProvider
**Source:** `/nix/store/.../component/dialog-command.tsx`

Features:
- Command registration system
- Keybind matching
- Command palette UI (Ctrl+K)
- Suggested commands section
- Category grouping
- Keybind display next to commands

### 1.4 KeybindProvider
**Source:** `/nix/store/.../context/keybind.tsx`

Features:
- Keybind configuration
- Leader key support (vim-like)
- Key event parsing
- Modifier key handling (ctrl, shift, meta)
- Keybind printing for display

---

## 2. DIALOG SYSTEM

### 2.1 Base Dialog Component
```
┌────────────────────────────────────────┐
│  Semi-transparent overlay              │
│  ┌──────────────────────────────┐      │
│  │  Dialog content box          │      │
│  │  - Title                     │      │
│  │  - Body                      │      │
│  │  - Actions                   │      │
│  └──────────────────────────────┘      │
└────────────────────────────────────────┘
```

### 2.2 Dialog Types Needed

| Dialog | Trigger | Purpose |
|--------|---------|---------|
| CommandPalette | Ctrl+K | Search and execute commands |
| SessionList | command | Switch between sessions |
| ModelSelect | command | Choose LLM model |
| AgentSelect | command | Switch agent |
| ThemeSelect | command | Change color theme |
| MCPServers | command | View/toggle MCP servers |
| StatusView | command | System status dashboard |
| TaskMonitor | command | View active tasks |
| ProcessViewer | command | View running processes |
| Permissions | command | Handle permission requests |
| SessionRename | command | Rename session |
| MessageEditor | click | Edit user message |
| Timeline | command | Jump to message |
| Help | command | Show help |

### 2.3 DialogSelect Component
Reusable select dialog with:
- Searchable/filterable list
- Category grouping
- Keyboard navigation (arrows, enter)
- Footer text per option
- Disabled state

---

## 3. ASCII ANIMATIONS

### 3.1 Animation States (17 total)

| State | Frames | Trigger |
|-------|--------|---------|
| idle | 11 | Default, no activity |
| thinking | 10 | Processing, waiting for response |
| working | 10 | Tool execution, writing code |
| searching | 8 | Grep, glob, file search |
| success | 8 | Task completed successfully |
| error | 8 | Error occurred |
| waiting | 8 | Waiting for user input |
| installing | 8 | Package installation |
| writing | 8 | File write operations |
| deploying | 8 | Deployment actions |
| security | 6 | Security-related operations |
| database | 6 | Database operations |
| api | 6 | API calls |
| testing | 6 | Running tests |
| monitoring | 6 | System monitoring |
| yolo | 8 | YOLO agent mode |
| yolo_extreme | 10 | Extreme YOLO mode |

### 3.2 Animation Format
```
5 lines tall ASCII art
Example idle frame:
    ∧,,,∧
  ( ̳• · • ̳)  ♪
  /    づ♡  ~
 Thinking...
```

### 3.3 Simple One-Liners
Compact versions for small displays:
- `( ̳• · • ̳) zzZ` - idle
- `( ̳° ▽ ° ̳) ?` - thinking
- `( ̳> ᴗ < ̳) ⚡` - working

---

## 4. COMMAND PALETTE

### 4.1 Command Categories

**Session Commands:**
- session.list - Switch sessions
- session.new - Create new session
- session.rename - Rename session
- session.share/unshare - Share session
- session.compact - Summarize session
- session.undo/redo - Undo/redo messages
- session.timeline - Jump to message
- session.copy - Copy transcript
- session.export - Export to markdown

**Navigation Commands:**
- session.sidebar.toggle - Toggle sidebar
- session.page.up/down - Scroll page
- session.first/last - Jump to start/end
- split.focus.next/prev - Focus split panels
- subagent.tab.next/prev - Navigate subagent tabs

**Display Toggle Commands:**
- session.toggle.timestamps - Show/hide timestamps
- session.toggle.thinking - Show/hide reasoning
- session.toggle.diffwrap - Wrap diffs
- session.toggle.actions - Show/hide tool details
- session.toggle.scrollbar - Show/hide scrollbar

**Agent/Model Commands:**
- agent.list - Select agent
- agent.cycle - Cycle agents
- model.list - Select model
- model.cycle_recent - Cycle models

**System Commands:**
- status_view - System status
- mcp.list - MCP servers
- theme.switch - Change theme
- help.show - Show help
- app.exit - Exit app

---

## 5. TOOL OUTPUT RENDERERS

### 5.1 Tool Types and Rendering

| Tool | Display |
|------|---------|
| bash | Command + output with status badge |
| read | File path with line count |
| write | Filename + syntax highlighted code + diagnostics |
| edit | Diff viewer (split/unified) |
| glob | Pattern + match count |
| grep | Pattern + file matches |
| patch | Patch application status |
| todowrite | Task list with status indicators |
| webfetch | URL fetch indicator |
| websearch | Search query + results summary |
| task | Subagent progress with tool summary |

### 5.2 Diff Viewer
```
┌─ file.ts ─────────────────────────────┐
│ - old line                    (red)   │
│ + new line                    (green) │
│   context line                        │
└───────────────────────────────────────┘
```

Options:
- Split view vs unified view
- Line wrapping toggle
- Line numbers
- Syntax highlighting

---

## 6. SUBAGENT PANEL

### 6.1 Tab Bar
```
┌──────────────────────────────────────────────────┐
│ [Parent] [#1 explore ●] [#2 general ○] [#3 ✓]   │
└──────────────────────────────────────────────────┘
```

Tab states:
- Active: Accent border
- Split open: Secondary border
- Working: ● indicator
- Completed: ✓ indicator
- Error: ! indicator

### 6.2 Tab Controls
- Click: Switch to tab
- ▶ button: Open in split view
- ◀ button: Close split
- × button: Close tab

### 6.3 Minimizable Panel
- Expand/collapse toggle
- Shows active task summary when collapsed

---

## 7. SPLIT PANEL VIEW

### 7.1 Layout
```
┌────────────────────┬────────────────────┐
│ Main Session       │ Subagent Session   │
│ (full features)    │ (compact mode)     │
│                    │                    │
│ [Prompt]           │ [Read-only]        │
└────────────────────┴────────────────────┘
```

### 7.2 Features
- Independent scrolling per panel
- Focus switching (Ctrl+arrows or commands)
- Close individual panels
- Main panel always has input

---

## 8. ENHANCED SIDEBAR

### 8.1 Sections (top to bottom)

1. **Animation Display** (toggleable full/compact)
2. **Subagent Banner** (if viewing subagent)
3. **Location** - Current directory, git branch
4. **Session Info** - Title, timestamp, share URL
5. **Token Usage** - Last, total, context %, cost
6. **MCP Servers** - Status per server (collapsible)
7. **LSP Servers** - Language server status (collapsible)
8. **Todo List** - Tasks with status indicators
9. **Branches** - Session tree (parent, siblings, children)
10. **Modified Files** - Changed files with diff stats
11. **Footer** - Version info

### 8.2 Collapsible Sections
- Click header to expand/collapse
- Auto-expand if ≤2 items
- Persist collapse state

---

## 9. ENHANCED PROMPT

### 9.1 Features

**History:**
- Up/Down arrows to navigate
- Per-session history
- Persist across restarts

**Autocomplete:**
- Trigger on @ or / or file paths
- Symbol completion
- File path suggestions
- Agent mentions (@explore, @general)
- Command shortcuts (/help, /clear)

**Attachments:**
- File attachment support
- Type indicators (img, pdf, txt, dir)
- Multiple files

**Keybinds:**
- Enter: Submit (configurable)
- Shift+Enter or Meta+Enter: New line
- Escape: Clear or cancel
- Ctrl+U: Clear line
- Ctrl+W: Delete word

---

## 10. MESSAGE RENDERING

### 10.1 User Messages
- Username (optional)
- Timestamp (optional)
- Agent color indicator
- File attachments with badges
- "QUEUED" status indicator
- Click to edit

### 10.2 Assistant Messages
- Model info
- Duration
- Text with markdown/syntax highlighting
- Tool calls (collapsible)
- Reasoning blocks (toggleable)
- Error styling

### 10.3 Markdown Support
- Headers
- Bold, italic, code
- Code blocks with syntax highlighting
- Links
- Lists
- Blockquotes

---

## 11. SESSION MANAGEMENT

### 11.1 Multiple Sessions
- Session list dialog
- Create new session
- Switch sessions
- Session persistence

### 11.2 Session Features
- Rename
- Share (generate URL)
- Unshare
- Compact (summarize)
- Export to markdown
- Copy transcript

### 11.3 Undo/Redo
- Undo last message pair
- Redo undone messages
- Visual diff of changes

### 11.4 Branches
- Fork session
- View parent/children
- Navigate between branches

---

## 12. PERMISSION SYSTEM

### 12.1 Permission Prompt
```
┌─ Permission Required ─────────────────┐
│ Tool: bash                            │
│ Command: rm -rf /tmp/test             │
│                                       │
│ [Enter: Once] [A: Always] [D: Deny]   │
└───────────────────────────────────────┘
```

### 12.2 Permission Types
- File write
- File delete
- Bash commands
- Network requests
- System commands

---

## 13. KEYBOARD SHORTCUTS

### 13.1 Global
| Key | Action |
|-----|--------|
| Ctrl+K | Command palette |
| Ctrl+C | Exit/interrupt |
| Escape | Close dialog/interrupt |

### 13.2 Session View
| Key | Action |
|-----|--------|
| Tab | Cycle agents |
| Shift+Tab | Cycle agents reverse |
| Ctrl+B | Toggle sidebar |
| Ctrl+L | Clear messages |
| Ctrl+U | Clear input |
| PageUp/Down | Scroll |
| Home/End | First/last message |

### 13.3 With Leader Key
| Key | Action |
|-----|--------|
| Leader+s | Session list |
| Leader+m | Model list |
| Leader+a | Agent list |
| Leader+t | Theme list |

---

## 14. AGENTS WITH PERMISSIONS

### 14.1 Agent Definitions

| Agent | Color | Description | Permissions |
|-------|-------|-------------|-------------|
| coder | green | Full development | All tools, all access |
| build | blue | Build specialist | All tools, all access |
| plan | cyan | Read-only planning | Read only, no write/bash |
| researcher | teal | Code exploration | Read only, safe commands |
| architect | purple | System design | Read, write docs only |
| debugger | orange | Bug fixing | All except dangerous |
| yolo | red | No restrictions | Bypass all permissions |

### 14.2 Permission Modes
- `default` - Ask for permission on sensitive operations
- `plan` - Read-only, no modifications
- `acceptEdits` - Auto-accept file edits
- `bypassPermissions` - Skip all permission prompts (yolo)

### 14.3 Agent Features
- Switch with Tab key
- Command palette selection
- Per-agent animation state
- Per-agent color theming
- Permission inheritance
- Custom system prompts per agent

---

## 15. ADDITIONAL FEATURES

### 14.1 Copy-on-Select
- Select text → auto-copy to clipboard
- OSC 52 for tmux support
- Toast notification

### 14.2 Terminal Integration
- Dynamic terminal title
- Background color detection
- Kitty keyboard protocol
- Mouse event handling

### 14.3 Toast Notifications
- Success, error, warning, info variants
- Auto-dismiss
- Stack management

---

## Implementation Priority

### Phase 1: Core Infrastructure
1. Context providers (Theme, Dialog, Command, Keybind)
2. Dialog system base
3. Toast notifications

### Phase 2: Command System
1. Command palette
2. Basic commands
3. Keybind handling

### Phase 3: Visual Enhancements
1. ASCII animations
2. Enhanced sidebar sections
3. Tool output renderers

### Phase 4: Advanced Features
1. Subagent panel
2. Split view
3. Session management
4. Permission system

### Phase 5: Polish
1. Prompt enhancements
2. Message rendering improvements
3. All remaining features

---

## File Structure

```
src/
├── index.tsx              # Entry point
├── tui/
│   └── app.tsx            # Main app component
├── context/
│   ├── theme.tsx          # Theme provider
│   ├── dialog.tsx         # Dialog provider
│   ├── command.tsx        # Command provider
│   ├── keybind.tsx        # Keybind provider
│   ├── session.tsx        # Session state
│   └── toast.tsx          # Toast provider
├── components/
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── message-list.tsx
│   ├── prompt.tsx
│   ├── status-bar.tsx
│   ├── logo.tsx
│   ├── animation.tsx      # ASCII animations
│   ├── dialog.tsx         # Dialog wrapper
│   ├── toast.tsx
│   └── tool-output/
│       ├── bash.tsx
│       ├── edit.tsx
│       ├── diff.tsx
│       └── ...
├── dialogs/
│   ├── command-palette.tsx
│   ├── session-list.tsx
│   ├── model-select.tsx
│   ├── agent-select.tsx
│   └── ...
├── claude/
│   └── connection.ts      # Claude Code connection
└── util/
    ├── clipboard.ts
    ├── keybind.ts
    └── ...
```

---

## Reference Files

Qalcode source location:
`/nix/store/i6122ld69nspfjzx2gbagm6rlhhb04f2-source/packages/opencode/src/cli/cmd/tui/`

Key files to reference:
- `app.tsx` - Main application
- `routes/session/index.tsx` - Session layout
- `routes/session/sidebar.tsx` - Sidebar with animations
- `component/` - Reusable components
- `context/` - State providers
- `ui/` - Dialog implementations
