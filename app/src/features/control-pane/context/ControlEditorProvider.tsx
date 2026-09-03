import { createControlEditor, ValueEventType } from "@signal-app/control-editor"
import { FC, ReactNode, useMemo } from "react"
import { useSong } from "../../../hooks/useSong"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { ControlEditorContext } from "../hooks/useControlEditor"

export const ControlEditorProvider: FC<{
  type: ValueEventType
  children: ReactNode
}> = ({ type, children }) => {
  const { getTrack } = useSong()
  const { selectedTrackId } = usePianoRoll()

  const controlEditor = useMemo(() => {
    const track = getTrack(selectedTrackId)
    if (track === undefined) {
      throw new Error(
        `ControlEditorProvider: track ${selectedTrackId} not found`,
      )
    }
    return createControlEditor(track, type)
  }, [getTrack, selectedTrackId, type])

  return (
    <ControlEditorContext.Provider value={controlEditor}>
      {children}
    </ControlEditorContext.Provider>
  )
}
