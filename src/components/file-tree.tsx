// QalClaude File Tree Component

import React, { useState, useEffect } from "react"
import { Box, Text, useInput } from "ink"
import * as fs from "fs"
import * as path from "path"

interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
  expanded?: boolean
}

interface FileTreeProps {
  rootPath: string
  maxDepth?: number
  onSelect?: (path: string) => void
  height?: number
}

const FILE_ICONS: Record<string, string> = {
  // Folders
  directory: "📁",
  directoryOpen: "📂",
  // Languages
  ".ts": "󰛦",
  ".tsx": "󰜈",
  ".js": "󰌞",
  ".jsx": "󰌞",
  ".json": "󰘦",
  ".md": "󰍔",
  ".py": "󰌠",
  ".rs": "󱘗",
  ".go": "󰟓",
  ".nix": "󱄅",
  ".sh": "󰆍",
  ".bash": "󰆍",
  ".zsh": "󰆍",
  ".css": "󰌜",
  ".scss": "󰌜",
  ".html": "󰌝",
  ".yaml": "󰈙",
  ".yml": "󰈙",
  ".toml": "󰈙",
  ".gitignore": "󰊢",
  ".env": "󰈙",
  // Default
  default: "󰈔"
}

function getIcon(node: FileNode): string {
  if (node.isDirectory) {
    return node.expanded ? "▼" : "▶"
  }
  const ext = path.extname(node.name)
  return FILE_ICONS[ext] || FILE_ICONS.default
}

function getColor(node: FileNode): string {
  if (node.isDirectory) return "cyan"
  const ext = path.extname(node.name)
  switch (ext) {
    case ".ts":
    case ".tsx":
      return "blue"
    case ".js":
    case ".jsx":
      return "yellow"
    case ".json":
      return "green"
    case ".md":
      return "magenta"
    case ".py":
      return "cyan"
    case ".nix":
      return "blue"
    case ".sh":
    case ".bash":
      return "green"
    default:
      return "white"
  }
}

function buildTree(dirPath: string, depth: number, maxDepth: number): FileNode[] {
  if (depth >= maxDepth) return []

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const nodes: FileNode[] = []

    // Sort: directories first, then files, alphabetically
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1
      if (!a.isDirectory() && b.isDirectory()) return 1
      return a.name.localeCompare(b.name)
    })

    for (const entry of entries) {
      // Skip hidden files and common ignore patterns
      if (entry.name.startsWith(".") && entry.name !== ".env") continue
      if (["node_modules", "dist", "build", ".git", "__pycache__", "target"].includes(entry.name)) continue

      const fullPath = path.join(dirPath, entry.name)
      const node: FileNode = {
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        expanded: false
      }

      if (entry.isDirectory() && depth < maxDepth - 1) {
        node.children = buildTree(fullPath, depth + 1, maxDepth)
      }

      nodes.push(node)
    }

    return nodes
  } catch {
    return []
  }
}

function flattenTree(nodes: FileNode[], depth: number = 0): Array<{ node: FileNode; depth: number }> {
  const result: Array<{ node: FileNode; depth: number }> = []
  for (const node of nodes) {
    result.push({ node, depth })
    if (node.isDirectory && node.expanded && node.children) {
      result.push(...flattenTree(node.children, depth + 1))
    }
  }
  return result
}

export function FileTree({ rootPath, maxDepth = 4, onSelect, height = 15 }: FileTreeProps) {
  const [tree, setTree] = useState<FileNode[]>([])
  const [cursor, setCursor] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)

  useEffect(() => {
    setTree(buildTree(rootPath, 0, maxDepth))
  }, [rootPath, maxDepth])

  const flatNodes = flattenTree(tree)

  useInput((input, key) => {
    if (key.upArrow) {
      setCursor(c => Math.max(0, c - 1))
      if (cursor - 1 < scrollOffset) {
        setScrollOffset(s => Math.max(0, s - 1))
      }
      return
    }

    if (key.downArrow) {
      const newCursor = Math.min(flatNodes.length - 1, cursor + 1)
      setCursor(newCursor)
      if (newCursor >= scrollOffset + height) {
        setScrollOffset(s => s + 1)
      }
      return
    }

    if (key.return || input === " ") {
      const item = flatNodes[cursor]
      if (!item) return

      if (item.node.isDirectory) {
        // Toggle expand
        const toggleExpand = (nodes: FileNode[], targetPath: string): FileNode[] => {
          return nodes.map(n => {
            if (n.path === targetPath) {
              return { ...n, expanded: !n.expanded }
            }
            if (n.children) {
              return { ...n, children: toggleExpand(n.children, targetPath) }
            }
            return n
          })
        }
        setTree(toggleExpand(tree, item.node.path))
      } else if (onSelect) {
        onSelect(item.node.path)
      }
      return
    }
  })

  const visibleNodes = flatNodes.slice(scrollOffset, scrollOffset + height)

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="cyan" bold>Files</Text>
        <Text color="gray" dimColor> ({flatNodes.length})</Text>
      </Box>

      {visibleNodes.map(({ node, depth }, i) => {
        const actualIndex = scrollOffset + i
        const isSelected = actualIndex === cursor

        return (
          <Box key={node.path}>
            <Text color={isSelected ? "cyan" : "gray"}>
              {isSelected ? "▸" : " "}
            </Text>
            <Text>{" ".repeat(depth * 2)}</Text>
            <Text color={node.isDirectory ? "cyan" : "gray"}>
              {getIcon(node)}{" "}
            </Text>
            <Text color={isSelected ? "white" : getColor(node)} bold={isSelected}>
              {node.name}
            </Text>
          </Box>
        )
      })}

      {flatNodes.length === 0 && (
        <Text color="gray" dimColor>No files found</Text>
      )}

      {flatNodes.length > height && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {scrollOffset + 1}-{Math.min(scrollOffset + height, flatNodes.length)} of {flatNodes.length}
          </Text>
        </Box>
      )}
    </Box>
  )
}

// Simple file tree for sidebar (non-interactive)
interface MiniFileTreeProps {
  rootPath: string
  maxFiles?: number
}

export function MiniFileTree({ rootPath, maxFiles = 8 }: MiniFileTreeProps) {
  const [files, setFiles] = useState<string[]>([])

  useEffect(() => {
    try {
      const entries = fs.readdirSync(rootPath, { withFileTypes: true })
      const fileList = entries
        .filter(e => !e.name.startsWith(".") && !["node_modules", "dist", ".git"].includes(e.name))
        .slice(0, maxFiles)
        .map(e => (e.isDirectory() ? `📁 ${e.name}` : `  ${e.name}`))
      setFiles(fileList)
    } catch {
      setFiles([])
    }
  }, [rootPath, maxFiles])

  return (
    <Box flexDirection="column">
      {files.map((f, i) => (
        <Text key={i} color="gray" dimColor>{f}</Text>
      ))}
      {files.length === 0 && <Text color="gray" dimColor>Empty</Text>}
    </Box>
  )
}
