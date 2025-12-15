import { FC } from "react"
import { ThemeType } from "./Theme"

export const ThemeName: FC<{ themeType: ThemeType }> = ({ themeType }) => {
  switch (themeType) {
    case "dark":
      return "Dark"
    case "light":
      return "Light"
    default:
      return "Unknown"
  }
}
