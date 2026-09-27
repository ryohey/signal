import { FC } from "react"
import { colorToVec4 } from "../../../../../gl/color"
import { useIsRhythmTrack } from "../../../hooks/useIsRhythmTrack"
import { useNoteColor } from "../../../hooks/useNoteColor"
import { PianoNoteItem } from "../../../hooks/useNotes"
import { NoteCircles } from "./NoteCircles"
import { NoteRectangles } from "./NoteRectangles"

export const LegacyNotes: FC<{ zIndex: number; notes: PianoNoteItem[] }> = ({
  zIndex,
  notes,
}) => {
  const isRhythmTrack = useIsRhythmTrack()
  const { borderColor, selectedColor, baseColor, backgroundColor } =
    useNoteColor()

  const colorize = (item: PianoNoteItem) => ({
    ...item,
    color: item.isSelected
      ? selectedColor
      : colorToVec4(baseColor.mix(backgroundColor, 1 - item.velocity / 127)),
  })

  if (isRhythmTrack) {
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
}
