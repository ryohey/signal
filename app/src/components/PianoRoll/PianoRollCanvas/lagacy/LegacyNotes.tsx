import { FC } from "react"
import { colorToVec4 } from "../../../../gl/color"
import { useNoteColor } from "../../../../hooks/useNoteColor"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { useTrack } from "../../../../hooks/useTrack"
import { PianoNoteItem } from "../../../../stores/PianoRollStore"
import { NoteCircles } from "./NoteCircles"
import { NoteRectangles } from "./NoteRectangles"

export const LegacyNotes: FC<{ zIndex: number; notes: PianoNoteItem[] }> = ({
  zIndex,
  notes,
}) => {
  const { selectedTrackId } = usePianoRoll()
  const { isRhythmTrack } = useTrack(selectedTrackId)
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
