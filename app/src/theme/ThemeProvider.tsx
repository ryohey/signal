import { ThemeProvider as EmotionThemeProvider } from "@emotion/react"
import { useSettings } from "../features/setting/hooks/useSettings"
import { themes } from "./Theme"

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { themeType } = useSettings()

  return (
    <EmotionThemeProvider theme={themes[themeType]}>
      {children}
    </EmotionThemeProvider>
  )
}
