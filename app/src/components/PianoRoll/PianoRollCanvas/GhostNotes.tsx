import { GLFallback } from "@ryohey/webgl-react"
import { FC } from "react"
import { useGhostNoteColor } from "../../../hooks/useGhostNoteColor"
import { useGhostNotes } from "../../../hooks/useGhostNotes"
import { TrackId } from "../../../track"
import { LegacyGhostNotes } from "./lagacy/LegacyGhostNotes"
import { NoteCircles } from "./NoteCircles"
import { NoteRectangles } from "./NoteRectangles"

export interface GhostNoteProps {
  zIndex: number
  trackId: TrackId
}

export const GhostNotes: FC<GhostNoteProps> = (props) => {
  return (
    <GLFallback
      component={_GhostNotes}
      fallback={LegacyGhostNotes}
      {...props}
    />
  )
}

const _GhostNotes: FC<GhostNoteProps> = ({ zIndex, trackId }) => {
  const { notes, isRhythmTrack } = useGhostNotes(trackId)
  const style = useGhostNoteColor(trackId)

  if (isRhythmTrack) {
    return <NoteCircles rects={notes} zIndex={zIndex} {...style} />
  }
  return <NoteRectangles rects={notes} zIndex={zIndex + 0.1} {...style} />
}
