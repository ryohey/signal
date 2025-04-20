import { useTheme } from "@emotion/react"
import { GLFallback } from "@ryohey/webgl-react"
import Color from "color"
import { observer } from "mobx-react-lite"
import { FC } from "react"
import { colorToVec4, enhanceContrast } from "../../../gl/color"
import { useStores } from "../../../hooks/useStores"
import { trackColorToCSSColor } from "../../../track/TrackColor"
import { NoteCircles } from "./NoteCircles"
import { NoteRectangles } from "./NoteRectangles"
import { LegacyNotes } from "./lagacy/LegacyNotes"

export interface NotesProps {
  zIndex: number
}

export const Notes: FC<NotesProps> = (props) => {
  return <GLFallback component={_Notes} fallback={LegacyNotes} {...props} />
}

const _Notes: FC<{ zIndex: number }> = observer(({ zIndex }) => {
  const {
    pianoRollStore: { notes, selectedTrack },
  } = useStores()
  const theme = useTheme()

  if (selectedTrack === undefined) {
    return <></>
  }

  const baseColor = Color(
    selectedTrack.color !== undefined
      ? trackColorToCSSColor(selectedTrack.color)
      : theme.themeColor,
  )
  const borderColor = colorToVec4(
    enhanceContrast(baseColor, theme.isLightContent, 0.3),
  )
  const selectedColor = colorToVec4(baseColor.lighten(0.7))
  const backgroundColor = colorToVec4(Color(theme.backgroundColor))
  const baseColorVec4 = colorToVec4(baseColor)

  return (
    <>
      {selectedTrack.isRhythmTrack && (
        <NoteCircles
          strokeColor={borderColor}
          rects={notes}
          inactiveColor={backgroundColor}
          activeColor={baseColorVec4}
          selectedColor={selectedColor}
          zIndex={zIndex}
        />
      )}
      {!selectedTrack.isRhythmTrack && (
        <NoteRectangles
          strokeColor={borderColor}
          inactiveColor={backgroundColor}
          activeColor={baseColorVec4}
          selectedColor={selectedColor}
          rects={notes}
          zIndex={zIndex + 0.1}
        />
      )}
    </>
  )
})
