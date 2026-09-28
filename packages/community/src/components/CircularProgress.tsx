import { useTheme } from "@emotion/react"
import NinetyRingWithBg from "@ryohey/react-svg-spinners/dist/NinetyRingWithBg.js"
import type { FC } from "react"

export interface CircularProgressProps {
  size?: string | number
}

export const CircularProgress: FC<CircularProgressProps> = ({
  size = "2rem",
}) => {
  const theme = useTheme()
  return (
    <NinetyRingWithBg
      style={{ width: size, height: size }}
      color={theme.themeColor}
    />
  )
}
