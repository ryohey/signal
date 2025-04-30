import { useTheme } from "@emotion/react"
import Color from "color"
import { colorToVec4, enhanceContrast } from "../gl/color"
import { trackColorToCSSColor } from "../track/TrackColor"
import { useMobxSelector } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"

export function useNoteColor() {
  const { selectedTrack } = usePianoRoll()
  const trackColor = useMobxSelector(
    () => selectedTrack?.color,
    [selectedTrack],
  )
  const theme = useTheme()

  const baseColor = Color(
    trackColor !== undefined
      ? trackColorToCSSColor(trackColor)
      : theme.themeColor,
  )

  return {
    baseColor, // for LegacyNotes
    backgroundColor: Color(theme.backgroundColor), // for LegacyNotes
    selectedColor: colorToVec4(baseColor.lighten(0.7)),
    borderColor: colorToVec4(
      enhanceContrast(baseColor, theme.isLightContent, 0.3),
    ),
    inactiveColor: colorToVec4(Color(theme.backgroundColor)),
    activeColor: colorToVec4(baseColor),
  }
}
