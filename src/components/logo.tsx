// QalClaude Logo Component

import React from "react"
import { Box, Text } from "ink"

const LOGO_LEFT = [
  "                ",
  "█▀▀█ █▀▀█ █░░  ",
  "█░░█ █▀▀█ █░░  ",
  "▀▀▀█ ▀░░▀ ▀▀▀  "
]

const LOGO_RIGHT = [
  "              ",
  "█▀▀█ █░░ █▀▀█ █░░█ █▀▀▄ █▀▀▀",
  "█░░░ █░░ █▀▀█ █░░█ █░░█ █▀▀▀",
  "▀▀▀▀ ▀▀▀ ▀░░▀ ░▀▀▀ ▀▀▀░ ▀▀▀▀"
]

export function Logo() {
  return (
    <Box flexDirection="column">
      {LOGO_LEFT.map((line, i) => (
        <Box key={i}>
          <Text color="gray">{line}</Text>
          <Text color="cyan" bold>{LOGO_RIGHT[i]}</Text>
        </Box>
      ))}
    </Box>
  )
}

export function SmallLogo() {
  return (
    <Text color="cyan" bold>QalClaude</Text>
  )
}
