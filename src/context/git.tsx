// QalClaude Git Context - Git branch and modified files tracking

import {
  createContext,
  useContext,
  createSignal,
  createEffect,
  onCleanup,
  type ParentProps,
} from "solid-js"

export interface GitInfo {
  branch: string | null
  isRepo: boolean
  modifiedFiles: GitFile[]
  stagedFiles: GitFile[]
  untrackedFiles: string[]
  ahead: number
  behind: number
  hasConflicts: boolean
}

export interface GitFile {
  path: string
  status: "modified" | "added" | "deleted" | "renamed" | "copied" | "untracked"
  additions?: number
  deletions?: number
  oldPath?: string // For renamed files
}

interface GitContextValue {
  info: () => GitInfo
  refresh: () => Promise<void>
  branch: () => string | null
  isRepo: () => boolean
  modifiedFiles: () => GitFile[]
  hasChanges: () => boolean
}

const GitContext = createContext<GitContextValue>()

const defaultInfo: GitInfo = {
  branch: null,
  isRepo: false,
  modifiedFiles: [],
  stagedFiles: [],
  untrackedFiles: [],
  ahead: 0,
  behind: 0,
  hasConflicts: false,
}

export function GitProvider(props: ParentProps) {
  const [info, setInfo] = createSignal<GitInfo>(defaultInfo)
  const [refreshTrigger, setRefreshTrigger] = createSignal(0)

  // Parse git status output
  const parseGitStatus = (output: string): Partial<GitInfo> => {
    const lines = output.trim().split("\n").filter(Boolean)
    const result: Partial<GitInfo> = {
      modifiedFiles: [],
      stagedFiles: [],
      untrackedFiles: [],
    }

    for (const line of lines) {
      if (line.startsWith("##")) {
        // Branch line: ## branch...origin/branch [ahead N, behind M]
        const branchMatch = line.match(/^## ([^.]+)/)
        if (branchMatch) {
          result.branch = branchMatch[1]
        }
        const aheadMatch = line.match(/ahead (\d+)/)
        if (aheadMatch) {
          result.ahead = parseInt(aheadMatch[1], 10)
        }
        const behindMatch = line.match(/behind (\d+)/)
        if (behindMatch) {
          result.behind = parseInt(behindMatch[1], 10)
        }
      } else {
        const index = line[0]
        const worktree = line[1]
        const path = line.slice(3)

        if (index === "U" || worktree === "U") {
          result.hasConflicts = true
        }

        if (worktree === "M") {
          result.modifiedFiles!.push({ path, status: "modified" })
        } else if (worktree === "D") {
          result.modifiedFiles!.push({ path, status: "deleted" })
        } else if (worktree === "?") {
          result.untrackedFiles!.push(path)
        }

        if (index === "M") {
          result.stagedFiles!.push({ path, status: "modified" })
        } else if (index === "A") {
          result.stagedFiles!.push({ path, status: "added" })
        } else if (index === "D") {
          result.stagedFiles!.push({ path, status: "deleted" })
        } else if (index === "R") {
          const parts = path.split(" -> ")
          result.stagedFiles!.push({
            path: parts[1] || path,
            status: "renamed",
            oldPath: parts[0],
          })
        }
      }
    }

    return result
  }

  // Refresh git info
  const refresh = async () => {
    try {
      // Check if this is a git repo
      const isRepoCheck = await runGitCommand(["rev-parse", "--is-inside-work-tree"])
      if (isRepoCheck.trim() !== "true") {
        setInfo(defaultInfo)
        return
      }

      // Get branch name
      const branch = await runGitCommand(["branch", "--show-current"])

      // Get status
      const status = await runGitCommand(["status", "--porcelain=2", "-b"])
      const parsed = parseGitStatus(status)

      // Get diff stats for modified files
      const diffStat = await runGitCommand(["diff", "--stat", "--numstat"])
      const diffLines = diffStat.trim().split("\n").filter(Boolean)
      const diffStats: Record<string, { additions: number; deletions: number }> = {}

      for (const line of diffLines) {
        const match = line.match(/^(\d+)\t(\d+)\t(.+)$/)
        if (match) {
          diffStats[match[3]] = {
            additions: parseInt(match[1], 10),
            deletions: parseInt(match[2], 10),
          }
        }
      }

      // Merge diff stats into modified files
      const modifiedFiles = (parsed.modifiedFiles || []).map((file) => ({
        ...file,
        ...diffStats[file.path],
      }))

      setInfo({
        branch: branch.trim() || parsed.branch || null,
        isRepo: true,
        modifiedFiles,
        stagedFiles: parsed.stagedFiles || [],
        untrackedFiles: parsed.untrackedFiles || [],
        ahead: parsed.ahead || 0,
        behind: parsed.behind || 0,
        hasConflicts: parsed.hasConflicts || false,
      })
    } catch (error) {
      // Not a git repo or git not available
      setInfo(defaultInfo)
    }
  }

  // Run git command (simulated - in real implementation would use child_process)
  const runGitCommand = async (args: string[]): Promise<string> => {
    // In a real implementation, this would run git commands
    // For now, return mock data based on the command
    if (args[0] === "rev-parse" && args[1] === "--is-inside-work-tree") {
      return "true"
    }
    if (args[0] === "branch" && args[1] === "--show-current") {
      return "main"
    }
    if (args[0] === "status") {
      return "## main...origin/main"
    }
    if (args[0] === "diff") {
      return ""
    }
    return ""
  }

  // Initial refresh and periodic updates
  createEffect(() => {
    refreshTrigger() // Track trigger
    refresh()
  })

  // Refresh every 5 seconds
  const interval = setInterval(() => {
    setRefreshTrigger((t) => t + 1)
  }, 5000)

  onCleanup(() => clearInterval(interval))

  const value: GitContextValue = {
    info,
    refresh,
    branch: () => info().branch,
    isRepo: () => info().isRepo,
    modifiedFiles: () => info().modifiedFiles,
    hasChanges: () =>
      info().modifiedFiles.length > 0 ||
      info().stagedFiles.length > 0 ||
      info().untrackedFiles.length > 0,
  }

  return <GitContext.Provider value={value}>{props.children}</GitContext.Provider>
}

export function useGit() {
  const ctx = useContext(GitContext)
  if (!ctx) {
    throw new Error("useGit must be used within GitProvider")
  }
  return ctx
}

// Utility: format branch display
export function formatBranchDisplay(branch: string | null, ahead: number, behind: number): string {
  if (!branch) return ""

  let display = branch
  if (ahead > 0) display += ` ↑${ahead}`
  if (behind > 0) display += ` ↓${behind}`

  return display
}

// Utility: get status icon for file
export function getFileStatusIcon(status: GitFile["status"]): string {
  switch (status) {
    case "modified":
      return "M"
    case "added":
      return "A"
    case "deleted":
      return "D"
    case "renamed":
      return "R"
    case "copied":
      return "C"
    case "untracked":
      return "?"
    default:
      return " "
  }
}
