export interface Theme {
  isLightContent: boolean // if true, text color is light and background color is dark
  font: string
  monoFont: string
  canvasFont: string
  themeColor: string
  onSurfaceColor: string // content color on themeColor
  darkBackgroundColor: string
  backgroundColor: string
  secondaryBackgroundColor: string
  editorBackgroundColor: string // control pane / arrange view / tempo editor
  editorGridColor: string
  editorSecondaryGridColor: string
  dividerColor: string
  popupBorderColor: string
  textColor: string
  secondaryTextColor: string
  tertiaryTextColor: string
  pianoKeyBlack: string
  pianoKeyWhite: string
  pianoWhiteKeyLaneColor: string
  pianoBlackKeyLaneColor: string
  pianoHighlightedLaneColor: string
  pianoLaneEdgeColor: string
  ghostNoteColor: string
  recordColor: string
  shadowColor: string
  highlightColor: string
  greenColor: string
  redColor: string
  yellowColor: string
}

const darkTheme: Theme = {
  isLightContent: true,
  font: "'DM Sans', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  monoFont: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  canvasFont: "Arial",
  themeColor: "#00D4AA", // Vibrant teal accent like MassiveMusic
  onSurfaceColor: "#0a0a0a",
  textColor: "#f5f5f7",
  secondaryTextColor: "#8e8e93",
  tertiaryTextColor: "#636366",
  dividerColor: "rgba(255, 255, 255, 0.08)",
  popupBorderColor: "rgba(255, 255, 255, 0.1)",
  darkBackgroundColor: "#0a0a0a", // Near black
  backgroundColor: "#0f0f0f", // Deep black
  secondaryBackgroundColor: "#1a1a1a",
  editorBackgroundColor: "#0a0a0a",
  editorSecondaryGridColor: "rgba(255, 255, 255, 0.03)",
  editorGridColor: "rgba(255, 255, 255, 0.06)",
  pianoKeyBlack: "#1a1a1a",
  pianoKeyWhite: "#f5f5f7",
  pianoWhiteKeyLaneColor: "#0f0f0f",
  pianoBlackKeyLaneColor: "#0a0a0a",
  pianoHighlightedLaneColor: "rgba(0, 212, 170, 0.08)",
  pianoLaneEdgeColor: "rgba(255, 255, 255, 0.04)",
  ghostNoteColor: "#333333",
  recordColor: "#ff3b30",
  shadowColor: "rgba(0, 0, 0, 0.5)",
  highlightColor: "rgba(255, 255, 255, 0.05)",
  greenColor: "#30d158",
  redColor: "#ff453a",
  yellowColor: "#ffd60a",
}

const lightTheme: Theme = {
  isLightContent: false,
  font: "Inter, -apple-system, BlinkMacSystemFont, Avenir, Lato",
  monoFont: "Roboto Mono, monospace",
  canvasFont: "Arial",
  themeColor: "hsl(230, 70%, 55%)",
  onSurfaceColor: "#ffffff",
  textColor: "#000000",
  secondaryTextColor: "hsl(223, 12%, 40%)",
  tertiaryTextColor: "#7a7f8b",
  dividerColor: "hsl(223, 12%, 80%)",
  popupBorderColor: "#e0e0e0",
  darkBackgroundColor: "hsl(228, 20%, 95%)",
  backgroundColor: "#ffffff",
  secondaryBackgroundColor: "hsl(227, 20%, 95%)",
  editorBackgroundColor: "#ffffff",
  editorGridColor: "hsl(223, 12%, 86%)",
  editorSecondaryGridColor: "hsl(223, 12%, 92%)",
  pianoKeyBlack: "#272a36",
  pianoKeyWhite: "#fbfcff",
  pianoWhiteKeyLaneColor: "#ffffff",
  pianoBlackKeyLaneColor: "hsl(228, 10%, 96%)",
  pianoHighlightedLaneColor: "hsl(228, 70%, 97%)",
  pianoLaneEdgeColor: "hsl(228, 10%, 92%)",
  ghostNoteColor: "hsl(223, 12%, 80%)",
  recordColor: "#ee6a6a",
  shadowColor: "rgba(0, 0, 0, 0.1)",
  highlightColor: "#f5f5fa",
  greenColor: "#56DE83",
  redColor: "#DE8287",
  yellowColor: "#DEBE56",
}

export const themes = {
  dark: darkTheme,
  light: lightTheme,
} as const

export const themeNames = Object.keys(themes) as (keyof typeof themes)[]
export type ThemeType = (typeof themeNames)[number]
