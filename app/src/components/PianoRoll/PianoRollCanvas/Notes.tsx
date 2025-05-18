import { GLFallback } from "@ryohey/webgl-react"
import { FC } from "react"
import { useNoteColor } from "../../../hooks/useNoteColor"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { useTrack } from "../../../hooks/useTrack"
import { LegacyNotes } from "./lagacy/LegacyNotes"
import { NoteCircles } from "./NoteCircles"
import { NoteLabels } from "./NoteLabels"
import { NoteRectangles } from "./NoteRectangles"

export interface NotesProps {
  zIndex: number
}

export const Notes: FC<NotesProps> = (props) => {
  return <GLFallback component={_Notes} fallback={LegacyNotes} {...props} />
}

const _Notes: FC<{ zIndex: number }> = ({ zIndex }) => {
  const { notes, selectedTrackId } = usePianoRoll()
  const { isRhythmTrack } = useTrack(selectedTrackId)
  const { borderColor, inactiveColor, activeColor, selectedColor } =
    useNoteColor()

  return (
    <>
      {isRhythmTrack && (
        <NoteCircles
          strokeColor={borderColor}
          rects={notes}
          inactiveColor={inactiveColor}
          activeColor={activeColor}
          selectedColor={selectedColor}
          zIndex={zIndex}
        />
      )}
      {!isRhythmTrack && (
        <>
          <NoteRectangles
            strokeColor={borderColor}
            inactiveColor={inactiveColor}
            activeColor={activeColor}
            selectedColor={selectedColor}
            rects={notes}
            zIndex={zIndex + 0.1}
          />
          <NoteLabels rects={notes} zIndex={zIndex + 0.2} />
        </>
      )}
    </>
  )
}
