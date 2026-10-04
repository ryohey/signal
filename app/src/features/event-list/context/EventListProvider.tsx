import {
  createEventListEditor,
  type EventListEditor,
} from "@signal-app/event-list-editor"
import { type FC, type ReactNode, useEffect, useState } from "react"
import { useSong } from "../../../hooks/useSong"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { EventListEditorProvider } from "../hooks/useEventListEditor"

export const EventListProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { selectedTrackId } = usePianoRoll()
  const { getTrack } = useSong()
  const selectedTrack = getTrack(selectedTrackId)
  const [eventListEditor, setEventListEditor] = useState<EventListEditor>()

  // Create the editor inside the effect so its track subscription is paired
  // with dispose. Creating it in useMemo breaks under StrictMode: the
  // simulated unmount disposes the memoized editor, and the remount reuses it
  // without resubscribing, so track changes never reach the list.
  useEffect(() => {
    if (selectedTrack === undefined) {
      setEventListEditor(undefined)
      return
    }
    const editor = createEventListEditor(selectedTrack)
    setEventListEditor(editor)
    return () => editor.dispose()
  }, [selectedTrack])

  if (eventListEditor === undefined) {
    return null
  }

  return (
    <EventListEditorProvider value={eventListEditor}>
      {children}
    </EventListEditorProvider>
  )
}
