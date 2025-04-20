import { FC } from "react"
import { useGhostNoteColor } from "../../../../hooks/useGhostNoteColor"
import { useGhostNotes } from "../../../../hooks/useGhostNotes"
import { PianoNoteItem } from "../../../../stores/PianoRollStore"
import { TrackId } from "../../../../track"
import { NoteCircles } from "./NoteCircles"
import { NoteRectangles } from "./NoteRectangles"

export const LegacyGhostNotes: FC<{ zIndex: number; trackId: TrackId }> = ({
  zIndex,
  trackId,
}) => {
  const style = useGhostNoteColor(trackId)
  const { notes, isRhythmTrack } = useGhostNotes(trackId)

  const colorize = (item: PianoNoteItem) => ({
    ...item,
    color: style.activeColor,
  })

  if (isRhythmTrack) {
    return (
      <NoteCircles
        strokeColor={style.strokeColor}
        rects={notes.map(colorize)}
        zIndex={zIndex}
      />
    )
  }

  return (
    <NoteRectangles
      strokeColor={style.strokeColor}
      rects={notes.map(colorize)}
      zIndex={zIndex + 0.1}
    />
  )
}
