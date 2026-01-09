// Edit Tool Output Renderer with Diff Viewer

import { createSignal, For, Show } from "solid-js"
import { useTheme, defaultTheme } from "../../context/theme"
import type { ToolCall } from "./index"

interface EditOutputProps {
  tool: ToolCall
  expanded?: boolean
}

export function EditOutput(props: EditOutputProps) {
  const [expanded, setExpanded] = createSignal(props.expanded ?? true)

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const filePath = props.tool.input?.file_path || ""
  const oldString = props.tool.input?.old_string || ""
  const newString = props.tool.input?.new_string || ""

  const fileName = filePath.split("/").pop() || filePath

  return (
    <box flexDirection="column">
      {/* File header */}
      <box
        borderStyle="single"
        borderColor={theme.border}
        paddingLeft={1}
        paddingRight={1}
        gap={1}
      >
        <text fg={theme.accent}>📝 {fileName}</text>
        <text fg={theme.textMuted}>
          [{expanded() ? "−" : "+"}]
        </text>
      </box>

      {/* Diff view */}
      <Show when={expanded()}>
        <DiffViewer
          oldContent={oldString}
          newContent={newString}
          fileName={fileName}
        />
      </Show>

      {/* Status */}
      <box gap={1}>
        <text fg={props.tool.status === "success" ? theme.success : theme.error}>
          {props.tool.status === "success" ? "✓ Applied" : "✗ Failed"}
        </text>
      </box>
    </box>
  )
}

// Standalone Diff Viewer component
interface DiffViewerProps {
  oldContent: string
  newContent: string
  fileName?: string
  unified?: boolean
}

export function DiffViewer(props: DiffViewerProps) {
  const [viewMode, setViewMode] = createSignal<"unified" | "split">("unified")

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  const oldLines = props.oldContent.split("\n")
  const newLines = props.newContent.split("\n")

  // Simple diff computation
  const computeDiff = () => {
    const result: Array<{
      type: "remove" | "add" | "context"
      line: string
      oldNum?: number
      newNum?: number
    }> = []

    // For removed lines
    let oldIdx = 1
    for (const line of oldLines) {
      result.push({ type: "remove", line, oldNum: oldIdx++ })
    }

    // For added lines
    let newIdx = 1
    for (const line of newLines) {
      result.push({ type: "add", line, newNum: newIdx++ })
    }

    return result
  }

  const diff = computeDiff()

  return (
    <box flexDirection="column">
      {/* View mode toggle */}
      <box gap={2} marginBottom={1}>
        <text fg={viewMode() === "unified" ? theme.accent : theme.textMuted}>
          Unified
        </text>
        <text fg={viewMode() === "split" ? theme.accent : theme.textMuted}>
          Split
        </text>
      </box>

      {/* Diff content */}
      <box
        borderStyle="single"
        borderColor={theme.border}
        flexDirection="column"
      >
        <Show when={viewMode() === "unified"}>
          {/* Unified diff view */}
          <For each={diff}>
            {(item) => (
              <box paddingLeft={1} paddingRight={1}>
                <box width={4}>
                  <text fg={theme.textMuted}>
                    {item.type === "remove" ? item.oldNum : item.type === "add" ? item.newNum : ""}
                  </text>
                </box>
                <text fg={theme.textMuted}>
                  {item.type === "remove" ? "-" : item.type === "add" ? "+" : " "}
                </text>
                <text
                  fg={item.type === "remove" ? theme.diff.removed : item.type === "add" ? theme.diff.added : theme.text}
                >
                  {item.line}
                </text>
              </box>
            )}
          </For>
        </Show>

        <Show when={viewMode() === "split"}>
          {/* Split diff view */}
          <box flexDirection="row">
            {/* Old content */}
            <box flexDirection="column" flexGrow={1}>
              <box paddingLeft={1}>
                <text fg={theme.diff.removed}><b>Old</b></text>
              </box>
              <For each={oldLines}>
                {(line, i) => (
                  <box paddingLeft={1}>
                    <text fg={theme.textMuted} width={3}>{i() + 1}</text>
                    <text fg={theme.diff.removed}>{line}</text>
                  </box>
                )}
              </For>
            </box>

            {/* New content */}
            <box flexDirection="column" flexGrow={1}>
              <box paddingLeft={1}>
                <text fg={theme.diff.added}><b>New</b></text>
              </box>
              <For each={newLines}>
                {(line, i) => (
                  <box paddingLeft={1}>
                    <text fg={theme.textMuted} width={3}>{i() + 1}</text>
                    <text fg={theme.diff.added}>{line}</text>
                  </box>
                )}
              </For>
            </box>
          </box>
        </Show>
      </box>

      {/* Diff stats */}
      <box gap={2}>
        <text fg={theme.diff.removed}>-{oldLines.length}</text>
        <text fg={theme.diff.added}>+{newLines.length}</text>
      </box>
    </box>
  )
}
