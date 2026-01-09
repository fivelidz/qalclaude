// File Tool Output Renderer (Read/Write)

import { Show } from "solid-js"
import { useTheme, defaultTheme } from "../../context/theme"
import type { ToolCall } from "./index"

interface FileOutputProps {
  tool: ToolCall
}

export function FileOutput(props: FileOutputProps) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const filePath = props.tool.input?.file_path || props.tool.input?.path || ""
  const fileName = filePath.split("/").pop() || filePath
  const isRead = props.tool.name === "Read"

  // For read, count lines
  const lineCount = props.tool.output?.split("\n").length || 0

  // For write, get content length
  const contentLength = props.tool.input?.content?.length || 0

  return (
    <box flexDirection="column">
      <box gap={1}>
        <text fg={theme.accent}>
          {isRead ? "📖" : "📝"} {fileName}
        </text>
        <Show when={isRead}>
          <text fg={theme.textMuted}>({lineCount} lines)</text>
        </Show>
        <Show when={!isRead}>
          <text fg={theme.textMuted}>({contentLength} chars)</text>
        </Show>
      </box>

      {/* File path */}
      <text fg={theme.textSubtle}>{filePath}</text>

      {/* Status */}
      <text fg={props.tool.status === "success" ? theme.success : theme.error}>
        {props.tool.status === "success"
          ? (isRead ? "✓ Read" : "✓ Written")
          : "✗ Failed"}
      </text>
    </box>
  )
}
