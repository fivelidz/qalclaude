// QalClaude Session List Dialog

import React, { useState } from "react"
import { Box, Text, useInput } from "ink"

interface Session {
  id: string
  title: string
  updatedAt: Date
  messageCount: number
  cost: number
}

interface SessionListProps {
  sessions: Session[]
  currentId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onClose: () => void
}

export function SessionList({
  sessions,
  currentId,
  onSelect,
  onDelete,
  onRename,
  onClose
}: SessionListProps) {
  const [cursor, setCursor] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  useInput((input, key) => {
    if (renaming) {
      if (key.escape) {
        setRenaming(null)
        setRenameValue("")
        return
      }
      if (key.return) {
        if (renameValue.trim()) {
          onRename(renaming, renameValue.trim())
        }
        setRenaming(null)
        setRenameValue("")
        return
      }
      if (key.backspace || key.delete) {
        setRenameValue(v => v.slice(0, -1))
        return
      }
      if (input && !key.ctrl) {
        setRenameValue(v => v + input)
      }
      return
    }

    if (key.escape) {
      if (deleteConfirm) {
        setDeleteConfirm(null)
      } else {
        onClose()
      }
      return
    }

    if (key.upArrow) {
      setCursor(c => Math.max(0, c - 1))
      setDeleteConfirm(null)
      return
    }

    if (key.downArrow) {
      setCursor(c => Math.min(sessions.length - 1, c + 1))
      setDeleteConfirm(null)
      return
    }

    if (key.return && sessions[cursor]) {
      onSelect(sessions[cursor].id)
      onClose()
      return
    }

    // Ctrl+D to delete
    if (key.ctrl && input === "d" && sessions[cursor]) {
      const session = sessions[cursor]
      if (deleteConfirm === session.id) {
        onDelete(session.id)
        setDeleteConfirm(null)
        setCursor(c => Math.min(c, sessions.length - 2))
      } else {
        setDeleteConfirm(session.id)
      }
      return
    }

    // Ctrl+R to rename
    if (key.ctrl && input === "r" && sessions[cursor]) {
      setRenaming(sessions[cursor].id)
      setRenameValue(sessions[cursor].title)
      return
    }
  })

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>Sessions</Text>
        <Text color="gray"> ({sessions.length})</Text>
      </Box>

      <Box flexDirection="column" height={15} overflow="hidden">
        {sessions.map((session, i) => {
          const isSelected = i === cursor
          const isCurrent = session.id === currentId
          const isDeleting = deleteConfirm === session.id
          const isRenaming = renaming === session.id

          return (
            <Box key={session.id} flexDirection="column">
              <Box>
                <Text color={isSelected ? "cyan" : isCurrent ? "green" : "white"}>
                  {isSelected ? "▸ " : "  "}
                </Text>

                {isRenaming ? (
                  <Box>
                    <Text color="cyan">{renameValue}</Text>
                    <Text color="cyan">█</Text>
                  </Box>
                ) : (
                  <>
                    <Text color={isSelected ? "white" : "gray"} bold={isSelected}>
                      {session.title || `Session ${session.id.slice(0, 8)}`}
                    </Text>
                    {isCurrent && <Text color="green"> (current)</Text>}
                  </>
                )}
              </Box>

              {isSelected && !isRenaming && (
                <Box paddingLeft={4}>
                  <Text color="gray" dimColor>
                    {session.messageCount} messages • ${session.cost.toFixed(4)} •{" "}
                    {session.updatedAt.toLocaleString()}
                  </Text>
                </Box>
              )}

              {isDeleting && (
                <Box paddingLeft={4}>
                  <Text color="red">Press Ctrl+D again to confirm delete</Text>
                </Box>
              )}
            </Box>
          )
        })}

        {sessions.length === 0 && (
          <Text color="gray">No sessions yet</Text>
        )}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color="gray" dimColor>Enter: open | Ctrl+D: delete | Ctrl+R: rename | Esc: close</Text>
      </Box>
    </Box>
  )
}
