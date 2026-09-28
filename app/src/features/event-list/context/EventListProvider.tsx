import { UNASSIGNED_TRACK_ID } from "@signal-app/core"
import { createEventListEditor } from "@signal-app/event-list-editor"
import { type FC, type ReactNode, useEffect, useMemo } from "react"
import { useSong } from "../../../hooks/useSong"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { EventListEditorProvider } from "../hooks/useEventListEditor"

export const EventListProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { selectedTrackId } = usePianoRoll()
  const { getTrack } = useSong()

  const selectedTrack = useMemo(
    () =>
      selectedTrackId === UNASSIGNED_TRACK_ID
        ? undefined
        : getTrack(selectedTrackId),
    [getTrack, selectedTrackId],
  )

  const eventListEditor = useMemo(
    () => selectedTrack && createEventListEditor(selectedTrack),
    [selectedTrack],
  )

  // Dispose the previous editor's internal subscription whenever a new one
  // is created (track switch) or the panel unmounts.
  useEffect(() => {
    return () => eventListEditor?.dispose()
  }, [eventListEditor])

  if (eventListEditor === undefined) {
    return null
  }

  return (
    <EventListEditorProvider value={eventListEditor}>
      {children}
    </EventListEditorProvider>
  )
}
