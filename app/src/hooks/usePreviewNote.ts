import { useCallback, useState } from "react"
import { useStartNote, useStopNote } from "../actions"
import { usePianoRoll } from "./usePianoRoll"
import { useTrack } from "./useTrack"

export function usePreviewNote() {
  const startNote = useStartNote()
  const stopNote = useStopNote()
  const [prevNoteNumber, setPrevNoteNumber] = useState<number | null>(null)
  const [stopNoteTimeout, setStopNoteTimeout] = useState<NodeJS.Timeout | null>(
    null,
  )
  const {
    selectedTrackId,
    addPreviewingNoteNumbers,
    removePreviewingNoteNumbers,
  } = usePianoRoll()
  const { channel } = useTrack(selectedTrackId)

  const previewNoteOff = useCallback(() => {
    if (channel === undefined) {
      return
    }
    setStopNoteTimeout((stopNoteTimeout) => {
      if (stopNoteTimeout !== null) {
        clearTimeout(stopNoteTimeout)
      }
      return null
    })
    setPrevNoteNumber((prevNoteNumber) => {
      if (prevNoteNumber !== null) {
        stopNote({
          noteNumber: prevNoteNumber,
          channel,
        })
        removePreviewingNoteNumbers(prevNoteNumber)
      }
      return null
    })
  }, [stopNote, channel, removePreviewingNoteNumbers])

  return {
    previewNoteOn: useCallback(
      (noteNumber: number = 64, duration?: number) => {
        if (channel === undefined) {
          return
        }

        // if note is already playing, stop it immediately and cancel the timeout
        if (stopNoteTimeout !== null) {
          previewNoteOff()
        }

        startNote({
          noteNumber,
          velocity: 100,
          channel,
        })
        setPrevNoteNumber(noteNumber)
        addPreviewingNoteNumbers(noteNumber)

        if (duration !== undefined) {
          setStopNoteTimeout(setTimeout(() => previewNoteOff(), duration))
        }
      },
      [
        stopNoteTimeout,
        channel,
        previewNoteOff,
        startNote,
        prevNoteNumber,
        addPreviewingNoteNumbers,
      ],
    ),
    previewNoteOff,
  }
}
