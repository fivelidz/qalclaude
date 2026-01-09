// Bash Tool Output Renderer

import { createSignal, Show } from "solid-js"
import { useTheme, defaultTheme } from "../../context/theme"
import type { ToolCall } from "./index"

interface BashOutputProps {
  tool: ToolCall
  expanded?: boolean
}

export function BashOutput(props: BashOutputProps) {
  const [expanded, setExpanded] = createSignal(props.expanded ?? false)

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const command = props.tool.input?.command || ""
  const output = props.tool.output || ""
  const lines = output.split("\n")
  const isLong = lines.length > 10

  const displayedOutput = () => {
    if (expanded() || !isLong) return output
    return lines.slice(0, 5).join("\n") + `\n... (${lines.length - 5} more lines)`
  }

  const exitCode = props.tool.status === "error" ? 1 : 0

  return (
    <box flexDirection="column">
      {/* Command */}
      <box
        borderStyle="single"
        borderColor={theme.border}
        paddingLeft={1}
        paddingRight={1}
      >
        <text fg={theme.textMuted}>$ </text>
        <text fg={theme.text}>{command}</text>
      </box>

      {/* Output */}
      <Show when={output}>
        <box
          marginTop={0}
          paddingLeft={1}
          paddingRight={1}
          borderStyle="single"
          borderColor={theme.border}
        >
          <text fg={theme.textMuted}>{displayedOutput()}</text>
        </box>
      </Show>

      {/* Status and expand toggle */}
      <box gap={2}>
        <text fg={exitCode === 0 ? theme.success : theme.error}>
          Exit: {exitCode}
        </text>
        <Show when={isLong}>
          <text fg={theme.accent}>
            [{expanded() ? "Collapse" : "Expand"}]
          </text>
        </Show>
      </box>
    </box>
  )
}
