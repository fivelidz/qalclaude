// QalClaude Markdown Renderer

import React from "react"
import { Box, Text } from "ink"

interface MarkdownProps {
  content: string
  width?: number
}

interface ParsedBlock {
  type: "text" | "code" | "heading" | "list" | "quote" | "hr"
  content: string
  language?: string
  level?: number
}

function parseMarkdown(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  const lines = content.split("\n")
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith("```")) {
      const language = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({
        type: "code",
        content: codeLines.join("\n"),
        language
      })
      i++
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      blocks.push({
        type: "heading",
        content: headingMatch[2],
        level: headingMatch[1].length
      })
      i++
      continue
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      blocks.push({ type: "hr", content: "" })
      i++
      continue
    }

    // List item
    if (line.match(/^[\s]*[-*+]\s+/) || line.match(/^[\s]*\d+\.\s+/)) {
      blocks.push({
        type: "list",
        content: line.replace(/^[\s]*[-*+\d.]+\s+/, "")
      })
      i++
      continue
    }

    // Block quote
    if (line.startsWith(">")) {
      blocks.push({
        type: "quote",
        content: line.replace(/^>\s*/, "")
      })
      i++
      continue
    }

    // Regular text
    if (line.trim()) {
      blocks.push({ type: "text", content: line })
    }
    i++
  }

  return blocks
}

// Syntax highlighting colors
const SYNTAX_COLORS: Record<string, Record<string, string>> = {
  keyword: { color: "magenta" },
  string: { color: "green" },
  comment: { color: "gray" },
  function: { color: "blue" },
  number: { color: "yellow" },
  operator: { color: "cyan" },
  type: { color: "cyan" },
}

// Simple syntax highlighting
function highlightCode(code: string, language: string): React.ReactNode[] {
  // Keywords by language
  const keywords: Record<string, string[]> = {
    javascript: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "async", "await", "try", "catch", "throw", "new", "this", "true", "false", "null", "undefined"],
    typescript: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "async", "await", "try", "catch", "throw", "new", "this", "true", "false", "null", "undefined", "type", "interface", "extends", "implements"],
    python: ["def", "class", "return", "if", "else", "elif", "for", "while", "import", "from", "as", "try", "except", "raise", "with", "True", "False", "None", "and", "or", "not", "in", "is", "lambda", "yield", "async", "await"],
    rust: ["fn", "let", "mut", "const", "if", "else", "match", "for", "while", "loop", "struct", "enum", "impl", "trait", "pub", "use", "mod", "self", "super", "true", "false", "return", "async", "await"],
    go: ["func", "var", "const", "if", "else", "for", "range", "switch", "case", "return", "struct", "interface", "type", "import", "package", "true", "false", "nil", "go", "chan", "defer"],
    nix: ["let", "in", "if", "then", "else", "with", "import", "inherit", "rec", "true", "false", "null"],
    bash: ["if", "then", "else", "fi", "for", "do", "done", "while", "case", "esac", "function", "return", "exit", "export", "local", "readonly"],
  }

  const lang = language.toLowerCase()
  const langKeywords = keywords[lang] || keywords.javascript || []

  const lines = code.split("\n")
  const result: React.ReactNode[] = []

  lines.forEach((line, lineIndex) => {
    const elements: React.ReactNode[] = []
    let remaining = line
    let key = 0

    // Simple tokenization
    while (remaining.length > 0) {
      // Comments
      const commentMatch = remaining.match(/^(\/\/.*|#.*)/)
      if (commentMatch) {
        elements.push(<Text key={key++} color="gray">{commentMatch[0]}</Text>)
        remaining = remaining.slice(commentMatch[0].length)
        continue
      }

      // Strings
      const stringMatch = remaining.match(/^("[^"]*"|'[^']*'|`[^`]*`)/)
      if (stringMatch) {
        elements.push(<Text key={key++} color="green">{stringMatch[0]}</Text>)
        remaining = remaining.slice(stringMatch[0].length)
        continue
      }

      // Numbers
      const numberMatch = remaining.match(/^(\d+\.?\d*)/)
      if (numberMatch) {
        elements.push(<Text key={key++} color="yellow">{numberMatch[0]}</Text>)
        remaining = remaining.slice(numberMatch[0].length)
        continue
      }

      // Keywords
      const wordMatch = remaining.match(/^([a-zA-Z_]\w*)/)
      if (wordMatch) {
        const word = wordMatch[0]
        if (langKeywords.includes(word)) {
          elements.push(<Text key={key++} color="magenta" bold>{word}</Text>)
        } else if (word.match(/^[A-Z]/)) {
          // Type/class names
          elements.push(<Text key={key++} color="cyan">{word}</Text>)
        } else {
          elements.push(<Text key={key++}>{word}</Text>)
        }
        remaining = remaining.slice(word.length)
        continue
      }

      // Operators and punctuation
      const opMatch = remaining.match(/^([=+\-*/<>!&|?:;,.(){}[\]]+)/)
      if (opMatch) {
        elements.push(<Text key={key++} color="white">{opMatch[0]}</Text>)
        remaining = remaining.slice(opMatch[0].length)
        continue
      }

      // Whitespace
      const wsMatch = remaining.match(/^(\s+)/)
      if (wsMatch) {
        elements.push(<Text key={key++}>{wsMatch[0]}</Text>)
        remaining = remaining.slice(wsMatch[0].length)
        continue
      }

      // Fallback: single character
      elements.push(<Text key={key++}>{remaining[0]}</Text>)
      remaining = remaining.slice(1)
    }

    result.push(
      <Box key={lineIndex}>
        <Text color="gray" dimColor>{String(lineIndex + 1).padStart(3)} │ </Text>
        {elements}
      </Box>
    )
  })

  return result
}

export function Markdown({ content, width = 80 }: MarkdownProps) {
  const blocks = parseMarkdown(content)

  return (
    <Box flexDirection="column">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            const headingColors = ["cyan", "blue", "magenta", "yellow", "green", "gray"]
            return (
              <Box key={i} marginTop={block.level === 1 ? 1 : 0} marginBottom={1}>
                <Text
                  color={headingColors[Math.min((block.level || 1) - 1, 5)]}
                  bold
                >
                  {"#".repeat(block.level || 1)} {block.content}
                </Text>
              </Box>
            )

          case "code":
            return (
              <Box key={i} flexDirection="column" marginY={1} borderStyle="single" borderColor="gray" padding={1}>
                {block.language && (
                  <Box marginBottom={1}>
                    <Text color="cyan" dimColor>{block.language}</Text>
                  </Box>
                )}
                <Box flexDirection="column">
                  {highlightCode(block.content, block.language || "")}
                </Box>
              </Box>
            )

          case "list":
            return (
              <Box key={i}>
                <Text color="cyan">  • </Text>
                <Text>{block.content}</Text>
              </Box>
            )

          case "quote":
            return (
              <Box key={i} marginLeft={2}>
                <Text color="gray">│ </Text>
                <Text color="gray" italic>{block.content}</Text>
              </Box>
            )

          case "hr":
            return (
              <Box key={i} marginY={1}>
                <Text color="gray">{"─".repeat(Math.min(width, 60))}</Text>
              </Box>
            )

          default:
            return (
              <Box key={i}>
                <Text>{block.content}</Text>
              </Box>
            )
        }
      })}
    </Box>
  )
}

// Inline code styling
export function InlineCode({ children }: { children: string }) {
  return (
    <Text backgroundColor="gray" color="white"> {children} </Text>
  )
}

// Bold text
export function Bold({ children }: { children: string }) {
  return <Text bold>{children}</Text>
}

// Italic text
export function Italic({ children }: { children: string }) {
  return <Text italic>{children}</Text>
}
