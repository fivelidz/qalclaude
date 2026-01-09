// QalClaude Split Pane - Vertical and horizontal split layouts

import React, { useState } from "react"
import { Box, Text, useInput } from "ink"

interface SplitPaneProps {
  direction: "horizontal" | "vertical"
  children: React.ReactNode[]
  initialSizes?: number[]
  minSize?: number
  onResize?: (sizes: number[]) => void
}

export function SplitPane({
  direction,
  children,
  initialSizes,
  minSize = 10,
  onResize
}: SplitPaneProps) {
  const childArray = React.Children.toArray(children)
  const [sizes, setSizes] = useState<number[]>(
    initialSizes || childArray.map(() => Math.floor(100 / childArray.length))
  )
  const [activePane, setActivePane] = useState(0)
  const [resizing, setResizing] = useState(false)

  useInput((input, key) => {
    if (!resizing) return

    // Arrow keys to resize
    if (direction === "horizontal") {
      if (key.leftArrow && sizes[activePane] > minSize) {
        const newSizes = [...sizes]
        newSizes[activePane] -= 5
        if (activePane < newSizes.length - 1) {
          newSizes[activePane + 1] += 5
        }
        setSizes(newSizes)
        onResize?.(newSizes)
      }
      if (key.rightArrow && activePane < sizes.length - 1 && sizes[activePane + 1] > minSize) {
        const newSizes = [...sizes]
        newSizes[activePane] += 5
        newSizes[activePane + 1] -= 5
        setSizes(newSizes)
        onResize?.(newSizes)
      }
    } else {
      if (key.upArrow && sizes[activePane] > minSize) {
        const newSizes = [...sizes]
        newSizes[activePane] -= 5
        if (activePane < newSizes.length - 1) {
          newSizes[activePane + 1] += 5
        }
        setSizes(newSizes)
        onResize?.(newSizes)
      }
      if (key.downArrow && activePane < sizes.length - 1 && sizes[activePane + 1] > minSize) {
        const newSizes = [...sizes]
        newSizes[activePane] += 5
        newSizes[activePane + 1] -= 5
        setSizes(newSizes)
        onResize?.(newSizes)
      }
    }

    if (key.escape) {
      setResizing(false)
    }
  })

  return (
    <Box
      flexDirection={direction === "horizontal" ? "row" : "column"}
      flexGrow={1}
    >
      {childArray.map((child, i) => (
        <Box
          key={i}
          flexBasis={`${sizes[i]}%`}
          flexGrow={0}
          flexShrink={0}
          borderStyle={activePane === i && resizing ? "double" : undefined}
          borderColor={activePane === i && resizing ? "cyan" : undefined}
        >
          {child}
        </Box>
      ))}
    </Box>
  )
}

// Tab bar for multiple sessions
interface TabBarProps {
  tabs: Array<{ id: string; label: string; active?: boolean }>
  activeTab: string
  onSelect: (id: string) => void
  onClose?: (id: string) => void
  onNew?: () => void
}

export function TabBar({ tabs, activeTab, onSelect, onClose, onNew }: TabBarProps) {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      {tabs.map((tab, i) => {
        const isActive = tab.id === activeTab

        return (
          <Box key={tab.id} marginRight={1}>
            <Text
              color={isActive ? "cyan" : "gray"}
              bold={isActive}
              inverse={isActive}
            >
              {" "}{tab.label}{" "}
            </Text>
            {onClose && (
              <Text color="gray" dimColor> ×</Text>
            )}
          </Box>
        )
      })}
      {onNew && (
        <Box>
          <Text color="gray"> + </Text>
        </Box>
      )}
    </Box>
  )
}

// Panel container with header
interface PanelProps {
  title: string
  children: React.ReactNode
  focused?: boolean
  actions?: Array<{ label: string; key: string; action: () => void }>
  collapsible?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Panel({
  title,
  children,
  focused = false,
  actions,
  collapsible,
  collapsed,
  onToggleCollapse
}: PanelProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle={focused ? "double" : "single"}
      borderColor={focused ? "cyan" : "gray"}
      flexGrow={1}
    >
      {/* Header */}
      <Box paddingX={1} justifyContent="space-between">
        <Box>
          {collapsible && (
            <Text color="gray">{collapsed ? "▸ " : "▾ "}</Text>
          )}
          <Text color={focused ? "cyan" : "white"} bold>{title}</Text>
        </Box>
        {actions && (
          <Box>
            {actions.map((action, i) => (
              <Text key={i} color="gray" dimColor>
                {action.key}:{action.label}{i < actions.length - 1 ? " " : ""}
              </Text>
            ))}
          </Box>
        )}
      </Box>

      {/* Content */}
      {!collapsed && (
        <Box flexDirection="column" paddingX={1} flexGrow={1}>
          {children}
        </Box>
      )}
    </Box>
  )
}

// Resizable divider
interface DividerProps {
  direction: "horizontal" | "vertical"
  onDrag?: (delta: number) => void
}

export function Divider({ direction }: DividerProps) {
  if (direction === "horizontal") {
    return (
      <Box width={1} flexShrink={0}>
        <Text color="gray">│</Text>
      </Box>
    )
  }

  return (
    <Box height={1} flexShrink={0}>
      <Text color="gray">{"─".repeat(80)}</Text>
    </Box>
  )
}

// Multi-pane layout manager
interface LayoutManagerProps {
  layout: "single" | "split-h" | "split-v" | "quad"
  children: React.ReactNode[]
}

export function LayoutManager({ layout, children }: LayoutManagerProps) {
  const childArray = React.Children.toArray(children)

  switch (layout) {
    case "single":
      return <Box flexGrow={1}>{childArray[0]}</Box>

    case "split-h":
      return (
        <Box flexDirection="row" flexGrow={1}>
          <Box flexBasis="50%">{childArray[0]}</Box>
          <Divider direction="horizontal" />
          <Box flexBasis="50%">{childArray[1] || <Box />}</Box>
        </Box>
      )

    case "split-v":
      return (
        <Box flexDirection="column" flexGrow={1}>
          <Box flexBasis="50%">{childArray[0]}</Box>
          <Divider direction="vertical" />
          <Box flexBasis="50%">{childArray[1] || <Box />}</Box>
        </Box>
      )

    case "quad":
      return (
        <Box flexDirection="column" flexGrow={1}>
          <Box flexDirection="row" flexBasis="50%">
            <Box flexBasis="50%">{childArray[0]}</Box>
            <Divider direction="horizontal" />
            <Box flexBasis="50%">{childArray[1] || <Box />}</Box>
          </Box>
          <Divider direction="vertical" />
          <Box flexDirection="row" flexBasis="50%">
            <Box flexBasis="50%">{childArray[2] || <Box />}</Box>
            <Divider direction="horizontal" />
            <Box flexBasis="50%">{childArray[3] || <Box />}</Box>
          </Box>
        </Box>
      )

    default:
      return <Box flexGrow={1}>{childArray[0]}</Box>
  }
}
