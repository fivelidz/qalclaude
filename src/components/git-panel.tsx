// QalClaude Git Panel - Git status and operations

import React, { useState, useEffect } from "react"
import { Box, Text, useInput } from "ink"
import { execSync } from "child_process"

interface GitStatus {
  branch: string
  ahead: number
  behind: number
  staged: string[]
  modified: string[]
  untracked: string[]
  isRepo: boolean
}

function getGitStatus(cwd: string): GitStatus {
  try {
    // Check if git repo
    execSync("git rev-parse --git-dir", { cwd, stdio: "pipe" })

    // Get branch name
    let branch = "main"
    try {
      branch = execSync("git branch --show-current", { cwd, stdio: "pipe" })
        .toString()
        .trim()
    } catch {
      branch = "detached"
    }

    // Get ahead/behind
    let ahead = 0
    let behind = 0
    try {
      const status = execSync("git status -sb", { cwd, stdio: "pipe" }).toString()
      const match = status.match(/\[ahead (\d+)(?:, behind (\d+))?\]|\[behind (\d+)\]/)
      if (match) {
        ahead = parseInt(match[1] || "0")
        behind = parseInt(match[2] || match[3] || "0")
      }
    } catch {}

    // Get file statuses
    const statusOutput = execSync("git status --porcelain", { cwd, stdio: "pipe" }).toString()
    const lines = statusOutput.split("\n").filter(Boolean)

    const staged: string[] = []
    const modified: string[] = []
    const untracked: string[] = []

    for (const line of lines) {
      const status = line.slice(0, 2)
      const file = line.slice(3)

      if (status[0] === "?" && status[1] === "?") {
        untracked.push(file)
      } else if (status[0] !== " " && status[0] !== "?") {
        staged.push(file)
      } else if (status[1] !== " ") {
        modified.push(file)
      }
    }

    return { branch, ahead, behind, staged, modified, untracked, isRepo: true }
  } catch {
    return {
      branch: "",
      ahead: 0,
      behind: 0,
      staged: [],
      modified: [],
      untracked: [],
      isRepo: false
    }
  }
}

interface GitPanelProps {
  cwd: string
  compact?: boolean
  onAction?: (action: string) => void
}

export function GitPanel({ cwd, compact = false, onAction }: GitPanelProps) {
  const [status, setStatus] = useState<GitStatus>({
    branch: "",
    ahead: 0,
    behind: 0,
    staged: [],
    modified: [],
    untracked: [],
    isRepo: false
  })
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setStatus(getGitStatus(cwd))
  }, [cwd])

  const refresh = () => {
    setRefreshing(true)
    setStatus(getGitStatus(cwd))
    setRefreshing(false)
  }

  if (!status.isRepo) {
    return (
      <Box>
        <Text color="gray" dimColor>Not a git repository</Text>
      </Box>
    )
  }

  if (compact) {
    const totalChanges = status.staged.length + status.modified.length + status.untracked.length

    return (
      <Box>
        <Text color="magenta"> {status.branch}</Text>
        {status.ahead > 0 && <Text color="green"> ↑{status.ahead}</Text>}
        {status.behind > 0 && <Text color="red"> ↓{status.behind}</Text>}
        {totalChanges > 0 && <Text color="yellow"> *{totalChanges}</Text>}
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      {/* Branch info */}
      <Box>
        <Text color="magenta" bold> {status.branch}</Text>
        {status.ahead > 0 && <Text color="green"> ↑{status.ahead}</Text>}
        {status.behind > 0 && <Text color="red"> ↓{status.behind}</Text>}
      </Box>

      {/* Staged files */}
      {status.staged.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="green" bold>Staged ({status.staged.length})</Text>
          {status.staged.slice(0, 5).map((file, i) => (
            <Text key={i} color="green">  + {file}</Text>
          ))}
          {status.staged.length > 5 && (
            <Text color="gray" dimColor>  ...and {status.staged.length - 5} more</Text>
          )}
        </Box>
      )}

      {/* Modified files */}
      {status.modified.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow" bold>Modified ({status.modified.length})</Text>
          {status.modified.slice(0, 5).map((file, i) => (
            <Text key={i} color="yellow">  ~ {file}</Text>
          ))}
          {status.modified.length > 5 && (
            <Text color="gray" dimColor>  ...and {status.modified.length - 5} more</Text>
          )}
        </Box>
      )}

      {/* Untracked files */}
      {status.untracked.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="gray" bold>Untracked ({status.untracked.length})</Text>
          {status.untracked.slice(0, 5).map((file, i) => (
            <Text key={i} color="gray">  ? {file}</Text>
          ))}
          {status.untracked.length > 5 && (
            <Text color="gray" dimColor>  ...and {status.untracked.length - 5} more</Text>
          )}
        </Box>
      )}

      {/* Clean state */}
      {status.staged.length === 0 && status.modified.length === 0 && status.untracked.length === 0 && (
        <Text color="green">✓ Working tree clean</Text>
      )}
    </Box>
  )
}

// Git branch selector dialog
interface GitBranchDialogProps {
  cwd: string
  onSelect: (branch: string) => void
  onClose: () => void
}

export function GitBranchDialog({ cwd, onSelect, onClose }: GitBranchDialogProps) {
  const [branches, setBranches] = useState<string[]>([])
  const [currentBranch, setCurrentBranch] = useState("")
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    try {
      const output = execSync("git branch", { cwd, stdio: "pipe" }).toString()
      const branchList = output
        .split("\n")
        .filter(Boolean)
        .map(b => {
          const isCurrent = b.startsWith("*")
          const name = b.replace(/^\*?\s*/, "").trim()
          if (isCurrent) setCurrentBranch(name)
          return name
        })
      setBranches(branchList)
    } catch {
      setBranches([])
    }
  }, [cwd])

  useInput((input, key) => {
    if (key.escape) {
      onClose()
      return
    }

    if (key.upArrow) {
      setCursor(c => Math.max(0, c - 1))
      return
    }

    if (key.downArrow) {
      setCursor(c => Math.min(branches.length - 1, c + 1))
      return
    }

    if (key.return && branches[cursor]) {
      onSelect(branches[cursor])
      onClose()
      return
    }
  })

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="magenta" padding={1}>
      <Text color="magenta" bold>Git Branches</Text>

      <Box flexDirection="column" marginTop={1} height={10} overflow="hidden">
        {branches.map((branch, i) => {
          const isSelected = i === cursor
          const isCurrent = branch === currentBranch

          return (
            <Box key={branch}>
              <Text color={isSelected ? "cyan" : "white"}>
                {isSelected ? "▸ " : "  "}
              </Text>
              <Text color={isCurrent ? "green" : isSelected ? "white" : "gray"}>
                {branch}
              </Text>
              {isCurrent && <Text color="green"> (current)</Text>}
            </Box>
          )
        })}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>Enter: checkout | Esc: close</Text>
      </Box>
    </Box>
  )
}
