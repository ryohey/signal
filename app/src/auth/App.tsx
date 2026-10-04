import { ThemeProvider } from "@emotion/react"
import type { FC } from "react"
import { GlobalCSS } from "../components/Theme/GlobalCSS"
import { LocalizationContext } from "../localize/useLocalization"
import { themes } from "../theme/Theme"
import { SignInPage } from "./SignInPage"

export const App: FC = () => {
  return (
    <ThemeProvider theme={themes.dark}>
      <LocalizationContext.Provider value={{ language: null }}>
        <GlobalCSS />
        <SignInPage />
      </LocalizationContext.Provider>
    </ThemeProvider>
  )
}
