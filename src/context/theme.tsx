// QalClaude Theme Context Provider

import { createContext, useContext, createSignal, type ParentProps } from "solid-js"

// Theme color definitions
export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  error: string
  info: string
  text: string
  textMuted: string
  textSubtle: string
  background: string
  backgroundPanel: string
  backgroundElement: string
  border: string
  borderActive: string
  diff: {
    added: string
    removed: string
    addedBg: string
    removedBg: string
  }
  markdown: {
    code: string
    codeBg: string
    link: string
    heading: string
  }
  syntax: {
    keyword: string
    string: string
    number: string
    comment: string
    function: string
    variable: string
    type: string
    operator: string
  }
}

// Built-in themes
const themes: Record<string, { dark: ThemeColors; light: ThemeColors }> = {
  "tokyo-night": {
    dark: {
      primary: "#7aa2f7",
      secondary: "#bb9af7",
      accent: "#7dcfff",
      success: "#9ece6a",
      warning: "#e0af68",
      error: "#f7768e",
      info: "#7dcfff",
      text: "#c0caf5",
      textMuted: "#565f89",
      textSubtle: "#414868",
      background: "#1a1b26",
      backgroundPanel: "#24283b",
      backgroundElement: "#292e42",
      border: "#3b4261",
      borderActive: "#7aa2f7",
      diff: {
        added: "#9ece6a",
        removed: "#f7768e",
        addedBg: "#1a2f1f",
        removedBg: "#2f1a1f",
      },
      markdown: {
        code: "#a9b1d6",
        codeBg: "#1f2335",
        link: "#7dcfff",
        heading: "#7aa2f7",
      },
      syntax: {
        keyword: "#bb9af7",
        string: "#9ece6a",
        number: "#ff9e64",
        comment: "#565f89",
        function: "#7aa2f7",
        variable: "#c0caf5",
        type: "#7dcfff",
        operator: "#89ddff",
      },
    },
    light: {
      primary: "#2e7de9",
      secondary: "#9854f1",
      accent: "#007197",
      success: "#587539",
      warning: "#8c6c3e",
      error: "#f52a65",
      info: "#007197",
      text: "#3760bf",
      textMuted: "#6172b0",
      textSubtle: "#8990b3",
      background: "#e1e2e7",
      backgroundPanel: "#d5d6db",
      backgroundElement: "#c8c9ce",
      border: "#a8aecb",
      borderActive: "#2e7de9",
      diff: {
        added: "#587539",
        removed: "#f52a65",
        addedBg: "#d5e6d0",
        removedBg: "#f5d5d5",
      },
      markdown: {
        code: "#3760bf",
        codeBg: "#d5d6db",
        link: "#007197",
        heading: "#2e7de9",
      },
      syntax: {
        keyword: "#9854f1",
        string: "#587539",
        number: "#b15c00",
        comment: "#848cb5",
        function: "#2e7de9",
        variable: "#3760bf",
        type: "#007197",
        operator: "#006a83",
      },
    },
  },
  catppuccin: {
    dark: {
      primary: "#89b4fa",
      secondary: "#cba6f7",
      accent: "#89dceb",
      success: "#a6e3a1",
      warning: "#f9e2af",
      error: "#f38ba8",
      info: "#89dceb",
      text: "#cdd6f4",
      textMuted: "#6c7086",
      textSubtle: "#45475a",
      background: "#1e1e2e",
      backgroundPanel: "#313244",
      backgroundElement: "#45475a",
      border: "#45475a",
      borderActive: "#89b4fa",
      diff: {
        added: "#a6e3a1",
        removed: "#f38ba8",
        addedBg: "#1a2f1f",
        removedBg: "#2f1a1f",
      },
      markdown: {
        code: "#cdd6f4",
        codeBg: "#181825",
        link: "#89dceb",
        heading: "#89b4fa",
      },
      syntax: {
        keyword: "#cba6f7",
        string: "#a6e3a1",
        number: "#fab387",
        comment: "#6c7086",
        function: "#89b4fa",
        variable: "#cdd6f4",
        type: "#89dceb",
        operator: "#94e2d5",
      },
    },
    light: {
      primary: "#1e66f5",
      secondary: "#8839ef",
      accent: "#04a5e5",
      success: "#40a02b",
      warning: "#df8e1d",
      error: "#d20f39",
      info: "#04a5e5",
      text: "#4c4f69",
      textMuted: "#6c6f85",
      textSubtle: "#9ca0b0",
      background: "#eff1f5",
      backgroundPanel: "#e6e9ef",
      backgroundElement: "#ccd0da",
      border: "#bcc0cc",
      borderActive: "#1e66f5",
      diff: {
        added: "#40a02b",
        removed: "#d20f39",
        addedBg: "#d5f0d0",
        removedBg: "#f5d0d5",
      },
      markdown: {
        code: "#4c4f69",
        codeBg: "#e6e9ef",
        link: "#04a5e5",
        heading: "#1e66f5",
      },
      syntax: {
        keyword: "#8839ef",
        string: "#40a02b",
        number: "#fe640b",
        comment: "#9ca0b0",
        function: "#1e66f5",
        variable: "#4c4f69",
        type: "#04a5e5",
        operator: "#179299",
      },
    },
  },
  dracula: {
    dark: {
      primary: "#bd93f9",
      secondary: "#ff79c6",
      accent: "#8be9fd",
      success: "#50fa7b",
      warning: "#ffb86c",
      error: "#ff5555",
      info: "#8be9fd",
      text: "#f8f8f2",
      textMuted: "#6272a4",
      textSubtle: "#44475a",
      background: "#282a36",
      backgroundPanel: "#21222c",
      backgroundElement: "#44475a",
      border: "#44475a",
      borderActive: "#bd93f9",
      diff: {
        added: "#50fa7b",
        removed: "#ff5555",
        addedBg: "#1a2f1f",
        removedBg: "#2f1a1f",
      },
      markdown: {
        code: "#f8f8f2",
        codeBg: "#21222c",
        link: "#8be9fd",
        heading: "#bd93f9",
      },
      syntax: {
        keyword: "#ff79c6",
        string: "#f1fa8c",
        number: "#bd93f9",
        comment: "#6272a4",
        function: "#50fa7b",
        variable: "#f8f8f2",
        type: "#8be9fd",
        operator: "#ff79c6",
      },
    },
    light: {
      primary: "#7c3aed",
      secondary: "#db2777",
      accent: "#0891b2",
      success: "#16a34a",
      warning: "#d97706",
      error: "#dc2626",
      info: "#0891b2",
      text: "#1e293b",
      textMuted: "#64748b",
      textSubtle: "#94a3b8",
      background: "#f8fafc",
      backgroundPanel: "#f1f5f9",
      backgroundElement: "#e2e8f0",
      border: "#cbd5e1",
      borderActive: "#7c3aed",
      diff: {
        added: "#16a34a",
        removed: "#dc2626",
        addedBg: "#d1fae5",
        removedBg: "#fee2e2",
      },
      markdown: {
        code: "#1e293b",
        codeBg: "#f1f5f9",
        link: "#0891b2",
        heading: "#7c3aed",
      },
      syntax: {
        keyword: "#db2777",
        string: "#16a34a",
        number: "#7c3aed",
        comment: "#94a3b8",
        function: "#16a34a",
        variable: "#1e293b",
        type: "#0891b2",
        operator: "#db2777",
      },
    },
  },
}

interface ThemeContextValue {
  theme: ThemeColors
  themeName: () => string
  mode: () => "dark" | "light"
  setTheme: (name: string) => void
  setMode: (mode: "dark" | "light") => void
  toggleMode: () => void
  availableThemes: string[]
}

const ThemeContext = createContext<ThemeContextValue>()

export function ThemeProvider(props: ParentProps) {
  const [themeName, setThemeName] = createSignal("tokyo-night")
  const [mode, setMode] = createSignal<"dark" | "light">("dark")

  const theme = (): ThemeColors => {
    const name = themeName()
    const m = mode()
    return themes[name]?.[m] || themes["tokyo-night"].dark
  }

  const value: ThemeContextValue = {
    get theme() {
      return theme()
    },
    themeName,
    mode,
    setTheme: (name: string) => {
      if (themes[name]) {
        setThemeName(name)
      }
    },
    setMode,
    toggleMode: () => {
      setMode((m) => (m === "dark" ? "light" : "dark"))
    },
    availableThemes: Object.keys(themes),
  }

  return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return ctx
}

// Export default theme for components that don't use context yet
export const defaultTheme = themes["tokyo-night"].dark
