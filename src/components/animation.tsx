// QalClaude ASCII Animations Component
// 17 animation states with multiple frames each

import { createSignal, createEffect, onCleanup, Show } from "solid-js"
import { useTheme, defaultTheme } from "../context/theme"

// Animation frame interval (ms)
const FRAME_INTERVAL = 250

// Animation frames by state
const ANIMATIONS: Record<string, string[]> = {
  idle: [
    `    ∧,,,∧
  ( ̳• · • ̳)  ♪
  /    づ♡  ~
    zZz...`,
    `    ∧,,,∧
  ( ̳• · • ̳)  ♫
  /    づ♡   ~
    zZz...`,
    `    ∧,,,∧
  ( ̳• ‿ • ̳)  ✧
  /    づ♡  ~
    zzZ...`,
    `    ∧,,,∧
  ( ̳• · • ̳)  ·
  /    づ♡   ~
    ZzZ...`,
  ],
  thinking: [
    `    ∧,,,∧
  ( ̳° ▽ ° ̳)  ?
  /    づ
    Hmm...`,
    `    ∧,,,∧
  ( ̳° ◊ ° ̳)  ??
  /    づ
    Hmm...`,
    `    ∧,,,∧
  ( ̳° o ° ̳)  ???
  /    づ
    Thinking...`,
    `    ∧,,,∧
  ( ̳° △ ° ̳)  !?
  /    づ
    Thinking...`,
  ],
  working: [
    `    ∧,,,∧
  ( ̳> ᴗ < ̳)  ⚡
  /    づ⌨
    *typing*`,
    `    ∧,,,∧
  ( ̳> ◡ < ̳)  ⚡⚡
  /    づ⌨
    *coding*`,
    `    ∧,,,∧
  ( ̳> ᴗ < ̳)  ✨
  /    づ⌨
    *building*`,
    `    ∧,,,∧
  ( ̳> ◡ < ̳)  💫
  /    づ⌨
    *creating*`,
  ],
  searching: [
    `    ∧,,,∧
  ( ̳◉ _ ◉ ̳)  🔍
  /    づ
    Looking...`,
    `    ∧,,,∧
  ( ̳◉ . ◉ ̳)  🔎
  /    づ
    Searching...`,
    `    ∧,,,∧
  ( ̳◉ _ ◉ ̳)  👀
  /    づ
    Finding...`,
    `    ∧,,,∧
  ( ̳◉ . ◉ ̳)  ✨
  /    づ
    Found it!`,
  ],
  success: [
    `    ∧,,,∧
  ( ̳^ ᴗ ^ ̳)  ✓
  /    づ♡
    Yay!`,
    `    ∧,,,∧
  ( ̳^ ◡ ^ ̳)  ✓✓
  /    づ♡
    Done!`,
    `    ∧,,,∧
  ( ̳^ ᴗ ^ ̳)  🎉
  /    づ♡
    Success!`,
    `    ∧,,,∧
  \\( ̳^ ◡ ^ ̳)/ ✨
  /    づ
    Woohoo!`,
  ],
  error: [
    `    ∧,,,∧
  ( ̳; ω ; ̳)  ✗
  /    づ
    Oh no...`,
    `    ∧,,,∧
  ( ̳T ▽ T ̳)  ✗✗
  /    づ
    Error!`,
    `    ∧,,,∧
  ( ̳; _ ; ̳)  💢
  /    づ
    Failed...`,
    `    ∧,,,∧
  ( ̳> < ̳)   😱
  /    づ
    Help!`,
  ],
  waiting: [
    `    ∧,,,∧
  ( ̳• . • ̳)  ·
  /    づ
    Waiting...`,
    `    ∧,,,∧
  ( ̳• · • ̳)  · ·
  /    づ
    Ready...`,
    `    ∧,,,∧
  ( ̳• . • ̳)  · · ·
  /    づ
    Your turn`,
    `    ∧,,,∧
  ( ̳• ‿ • ̳)  ?
  /    づ
    Well?`,
  ],
  installing: [
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  [□□□□]
  /    づ📦
    Installing...`,
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  [■□□□]
  /    づ📦
    Installing...`,
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  [■■□□]
  /    づ📦
    Installing...`,
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  [■■■□]
  /    づ📦
    Almost...`,
    `    ∧,,,∧
  ( ̳^ ◡ ^ ̳)  [■■■■]
  /    づ✨
    Done!`,
  ],
  writing: [
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  ✏️
  /    づ📝
    Writing...`,
    `    ∧,,,∧
  ( ̳• ◡ • ̳)  ✏️~
  /    づ📝
    Editing...`,
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  ✏️~~
  /    づ📝
    Creating...`,
    `    ∧,,,∧
  ( ̳• ◡ • ̳)  ✨
  /    づ📝
    Saving...`,
  ],
  yolo: [
    `    ∧,,,∧
  ( ̳◉ ᴗ ◉ ̳) ⚡⚡
  /    づ🔥
    YOLO!`,
    `    ∧,,,∧
  ( ̳◉ ◡ ◉ ̳) 💥💥
  /    づ🔥
    SEND IT!`,
    `    ∧,,,∧
  \\( ̳◉ ᴗ ◉ ̳)/ ✨
      づ🔥
    NO FEAR!`,
    `    ∧,,,∧
  ( ̳◉ ▽ ◉ ̳) 🚀
  /    づ🔥
    FULL SEND!`,
  ],
  yolo_extreme: [
    `    ∧,,,∧
  ( ̳☠ ᴗ ☠ ̳) 💀⚡
  /    づ🔥🔥
    EXTREME!!!`,
    `    ∧,,,∧
  \\( ̳☠ ◡ ☠ ̳)/ 💥💥
      づ🔥🔥
    CHAOS MODE!`,
    `    ∧,,,∧
  ( ̳☠ ▽ ☠ ̳) 🔥💀🔥
  /    づ⚡⚡
    NO LIMITS!`,
    `    ∧,,,∧
  \\(☠益☠)/ 💀💀💀
      づ🔥🔥🔥
    MAXIMUM!!!`,
    `    ∧,,,∧
  ( ̳◉益◉ ̳) ⚡💥⚡
  /    づ☠️☠️
    UNHINGED!`,
  ],
  deploying: [
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  🚀
  /    づ    3...
    Deploying...`,
    `    ∧,,,∧
  ( ̳• ◡ • ̳)  🚀
  /    づ    2...
    Launching...`,
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  🚀
  /    づ    1...
    Liftoff!`,
    `    ∧,,,∧
  ( ̳^ ◡ ^ ̳)  🚀✨
  /    づ
    Deployed!`,
  ],
  testing: [
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  🧪
  /    づ
    Testing...`,
    `    ∧,,,∧
  ( ̳• . • ̳)  🧪○
  /    づ
    Running...`,
    `    ∧,,,∧
  ( ̳• ◡ • ̳)  🧪●○
  /    づ
    Passing...`,
    `    ∧,,,∧
  ( ̳^ ◡ ^ ̳)  ✓✓✓
  /    づ
    All pass!`,
  ],
  api: [
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  →
  /    づ🌐
    Request...`,
    `    ∧,,,∧
  ( ̳• . • ̳)  →→
  /    づ🌐
    Sending...`,
    `    ∧,,,∧
  ( ̳• ◡ • ̳)  ←←
  /    づ🌐
    Response...`,
    `    ∧,,,∧
  ( ̳^ ◡ ^ ̳)  ✓
  /    づ🌐
    Done!`,
  ],
  database: [
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  💾
  /    づ
    Querying...`,
    `    ∧,,,∧
  ( ̳• . • ̳)  💾~
  /    づ
    Fetching...`,
    `    ∧,,,∧
  ( ̳• ◡ • ̳)  💾✓
  /    づ
    Retrieved!`,
  ],
  security: [
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  🔒
  /    づ🛡️
    Securing...`,
    `    ∧,,,∧
  ( ̳• . • ̳)  🔐
  /    づ🛡️
    Checking...`,
    `    ∧,,,∧
  ( ̳^ ◡ ^ ̳)  ✓🔒
  /    づ🛡️
    Secure!`,
  ],
  monitoring: [
    `    ∧,,,∧
  ( ̳• ᴗ • ̳)  📊
  /    づ
    Monitoring...`,
    `    ∧,,,∧
  ( ̳• . • ̳)  📈
  /    づ
    Tracking...`,
    `    ∧,,,∧
  ( ̳• ◡ • ̳)  📉📊
  /    づ
    Analyzing...`,
  ],
}

// Simple one-liner versions for compact display
const SIMPLE_ANIMATIONS: Record<string, string[]> = {
  idle: ["( ̳• · • ̳) zzZ", "( ̳• ‿ • ̳) zZz", "( ̳• · • ̳) ZzZ"],
  thinking: ["( ̳° ▽ ° ̳) ?", "( ̳° ◊ ° ̳) ??", "( ̳° o ° ̳) ???"],
  working: ["( ̳> ᴗ < ̳) ⚡", "( ̳> ◡ < ̳) ⚡⚡", "( ̳> ᴗ < ̳) ✨"],
  searching: ["( ̳◉ _ ◉ ̳) 🔍", "( ̳◉ . ◉ ̳) 🔎", "( ̳◉ _ ◉ ̳) 👀"],
  success: ["( ̳^ ᴗ ^ ̳) ✓", "( ̳^ ◡ ^ ̳) ✓✓", "\\( ̳^ ◡ ^ ̳)/ 🎉"],
  error: ["( ̳; ω ; ̳) ✗", "( ̳T ▽ T ̳) ✗✗", "( ̳> < ̳) 😱"],
  waiting: ["( ̳• . • ̳) ·", "( ̳• · • ̳) · ·", "( ̳• ‿ • ̳) ?"],
  yolo: ["( ̳◉ ᴗ ◉ ̳) 🔥", "( ̳◉ ◡ ◉ ̳) 💥", "( ̳◉ ▽ ◉ ̳) 🚀"],
  yolo_extreme: ["( ̳☠ ᴗ ☠ ̳) 💀🔥", "(☠益☠) 💀💀💀", "( ̳◉益◉ ̳) ⚡💥⚡"],
}

interface AnimationProps {
  state: string
  compact?: boolean
}

export function Animation(props: AnimationProps) {
  const [frame, setFrame] = createSignal(0)

  let theme = defaultTheme
  try {
    const ctx = useTheme()
    theme = ctx.theme
  } catch {}

  // Get animation frames for current state
  const getFrames = () => {
    if (props.compact) {
      return SIMPLE_ANIMATIONS[props.state] || SIMPLE_ANIMATIONS.idle
    }
    return ANIMATIONS[props.state] || ANIMATIONS.idle
  }

  // Animate frames
  createEffect(() => {
    const frames = getFrames()
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length)
    }, FRAME_INTERVAL)

    onCleanup(() => clearInterval(interval))
  })

  // Get color based on state
  const getColor = () => {
    switch (props.state) {
      case "success": return theme.success
      case "error": return theme.error
      case "warning": return theme.warning
      case "yolo": return "#f7768e"
      case "yolo_extreme": return "#ff0000"
      default: return theme.primary
    }
  }

  const currentFrame = () => {
    const frames = getFrames()
    return frames[frame() % frames.length]
  }

  return (
    <box flexDirection="column">
      <Show when={props.compact} fallback={
        <text fg={getColor()}>{currentFrame()}</text>
      }>
        <text fg={getColor()}>{currentFrame()}</text>
      </Show>
    </box>
  )
}

// Export animation state names for external use
export const ANIMATION_STATES = Object.keys(ANIMATIONS)
