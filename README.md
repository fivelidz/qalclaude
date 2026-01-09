# QalClaude

> Claude Code with qalcode's beautiful TUI

QalClaude combines the power of Anthropic's Claude Code with a modern, feature-rich terminal interface inspired by qalcode/OpenCode.

## Why QalClaude?

Anthropic's Claude Code is powerful but has a basic TUI. qalcode has a beautiful interface but can't directly use Claude subscriptions due to OAuth restrictions. QalClaude bridges this gap by:

- Using Claude Code's bidirectional streaming API for full feature support
- Wrapping it with qalcode's beautiful terminal interface
- Supporting all Claude Code features: tools, agents, MCP, etc.
- No API key needed - uses your Claude subscription

## Features

- **Beautiful TUI** - Side panel, syntax highlighting, animations
- **Agent Support** - Switch between agents with Tab
  - `coder` - Full development agent
  - `yolo` - No permission prompts
  - `plan` - Read-only planning
  - `researcher` - Code exploration
  - `architect` - System design
  - `debugger` - Bug fixing
- **Full Tool Support** - All Claude Code tools work
- **Real Streaming** - See responses as they're generated
- **Usage Tracking** - Token counts and costs displayed
- **Session Management** - Continue conversations

## Installation

### Prerequisites

- [Claude Code](https://claude.ai/code) installed and authenticated
- [Bun](https://bun.sh/) runtime

### Install

```bash
# Clone the repository
git clone https://github.com/fivelidz/qalclaude.git
cd qalclaude

# Install dependencies
bun install

# Run
bun run dev
```

### Build

```bash
bun run build
```

## Usage

```bash
# Start QalClaude
qalclaude

# Start with specific agent
qalclaude --agent yolo

# Start with specific model
qalclaude --model claude-sonnet-4-5-20250929
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Switch agents |
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Ctrl+S` | Toggle sidebar |
| `Ctrl+L` | Clear chat |
| `Ctrl+C` | Exit |

## Configuration

QalClaude uses Claude Code's settings from `~/.claude/settings.json`. You can define custom agents there:

```json
{
  "agents": {
    "my-agent": {
      "description": "My custom agent",
      "prompt": "You are a helpful assistant",
      "permissionMode": "acceptEdits"
    }
  }
}
```

## Architecture

```
qalclaude (TUI)
    ↓
Claude Connector (bidirectional streaming)
    ↓
claude --input-format stream-json --output-format stream-json
    ↓
Claude API (via subscription)
```

## Why Not Just Use qalcode?

qalcode's claude-code provider is limited because:
1. It spawns Claude in `--print` mode which is non-interactive
2. Tool calls are executed by Claude, not returned to qalcode
3. No real streaming of tool results

QalClaude solves this by using Claude Code's full bidirectional streaming protocol, giving you the best of both worlds.

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT

## Credits

- [Claude Code](https://claude.ai/code) by Anthropic
- [qalcode/OpenCode](https://github.com/opencode-ai/opencode) for TUI inspiration
- [Ink](https://github.com/vadimdemedes/ink) for React terminal rendering

---

*Built because Anthropic's OAuth restrictions are frustrating, but Claude Code is still awesome.*
