import { useTheme } from "@emotion/react"
import Color from "color"
import { observer } from "mobx-react-lite"
import { FC } from "react"
import { colorToVec4 } from "../../../../gl/color"
import { useStores } from "../../../../hooks/useStores"
import { PianoNoteItem } from "../../../../stores/PianoRollStore"
import { trackColorToCSSColor } from "../../../../track/TrackColor"
import { NoteCircles } from "./NoteCircles"
import { NoteRectangles } from "./NoteRectangles"

export const LegacyNotes: FC<{ zIndex: number }> = observer(({ zIndex }) => {
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
  const borderColor = colorToVec4(baseColor.lighten(0.3))
  const selectedColor = colorToVec4(baseColor.lighten(0.7))
  const backgroundColor = Color(theme.backgroundColor)

  const colorize = (item: PianoNoteItem) => ({
    ...item,
    color: item.isSelected
      ? selectedColor
      : colorToVec4(baseColor.mix(backgroundColor, 1 - item.velocity / 127)),
  })

  if (selectedTrack.isRhythmTrack) {
    return (
      <NoteCircles
        strokeColor={borderColor}
        rects={notes.map(colorize)}
        zIndex={zIndex}
      />
    )
  }

  return (
    <NoteRectangles
      strokeColor={borderColor}
      rects={notes.map(colorize)}
      zIndex={zIndex + 0.1}
    />
  )
})
