// QalClaude Logo - ASCII art

import { theme } from "../tui/app"

export function Logo() {
  return (
    <box flexDirection="column" alignItems="center">
      <text fg={theme.primary} bold>
        {`█▀▀█ █▀▀█ █░░  █▀▀█ █░░ █▀▀█ █░░█ █▀▀▄ █▀▀▀`}
      </text>
      <text fg={theme.primary} bold>
        {`█░░█ █▀▀█ █░░  █░░░ █░░ █▀▀█ █░░█ █░░█ █▀▀▀`}
      </text>
      <text fg={theme.primary} bold>
        {`▀▀▀█ ▀░░▀ ▀▀▀  ▀▀▀▀ ▀▀▀ ▀░░▀ ░▀▀▀ ▀▀▀░ ▀▀▀▀`}
      </text>
    </box>
  )
}
