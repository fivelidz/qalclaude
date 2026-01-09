// Search Tool Output Renderer (Glob/Grep)

import { Show, For } from "solid-js"
import { useTheme, defaultTheme } from "../../context/theme"
import type { ToolCall } from "./index"

interface SearchOutputProps {
  tool: ToolCall
}

export function SearchOutput(props: SearchOutputProps) {
  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const isGlob = props.tool.name === "Glob"
  const pattern = props.tool.input?.pattern || props.tool.input?.glob || ""
  const path = props.tool.input?.path || "."

  // Parse output to get file list
  const files = (props.tool.output || "")
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, 10)

  const totalFiles = (props.tool.output || "").split("\n").filter((l) => l.trim()).length

  return (
    <box flexDirection="column">
      {/* Search info */}
      <box gap={1}>
        <text fg={theme.accent}>{isGlob ? "🔍" : "🔎"}</text>
        <text fg={theme.warning}>{pattern}</text>
        <text fg={theme.textMuted}>in {path}</text>
      </box>

      {/* Results */}
      <Show when={files.length > 0}>
        <box flexDirection="column" marginTop={1}>
          <For each={files}>
            {(file) => (
              <text fg={theme.text}>  {file}</text>
            )}
          </For>
          <Show when={totalFiles > 10}>
            <text fg={theme.textMuted}>  ... and {totalFiles - 10} more</text>
          </Show>
        </box>
      </Show>

      {/* Count */}
      <box marginTop={1}>
        <text fg={props.tool.status === "success" ? theme.success : theme.textMuted}>
          {totalFiles} {isGlob ? "files" : "matches"} found
        </text>
      </box>
    </box>
  )
}
