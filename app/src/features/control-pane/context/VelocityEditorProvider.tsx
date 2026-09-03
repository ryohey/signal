import { createVelocityEditor } from "@signal-app/control-editor"
import { FC, ReactNode, useMemo } from "react"
import { useSong } from "../../../hooks/useSong"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { VelocityEditorContext } from "../hooks/useVelocityEditor"

export const VelocityEditorProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { getTrack } = useSong()
  const { selectedTrackId } = usePianoRoll()

  const velocityEditor = useMemo(() => {
    const track = getTrack(selectedTrackId)
    if (track === undefined) {
      throw new Error(
        `VelocityEditorProvider: track ${selectedTrackId} not found`,
      )
    }
    return createVelocityEditor(track)
  }, [getTrack, selectedTrackId])

  return (
    <VelocityEditorContext.Provider value={velocityEditor}>
      {children}
    </VelocityEditorContext.Provider>
  )
}
