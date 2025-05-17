import { useCallback } from "react"
import { useStartNote, useStopNote } from "../actions"
import { usePianoRoll } from "./usePianoRoll"
import { useTrack } from "./useTrack"

const playingNoteRef = {
  current: null as {
    noteNumber: number
    timeout?: NodeJS.Timeout
  } | null,
}

export function usePreviewNote() {
  const startNote = useStartNote()
  const stopNote = useStopNote()
  const {
    selectedTrackId,
    addPreviewingNoteNumbers,
    removePreviewingNoteNumbers,
  } = usePianoRoll()
  const { channel } = useTrack(selectedTrackId)

  const previewNoteOff = useCallback(() => {
    if (channel === undefined || playingNoteRef.current === null) {
      return
    }

    const { noteNumber, timeout } = playingNoteRef.current

    // stop any scheduled timeout
    if (timeout !== undefined) {
      clearTimeout(timeout)
    }

    stopNote({ noteNumber, channel })
    removePreviewingNoteNumbers(noteNumber)
    playingNoteRef.current = null
  }, [channel, stopNote, removePreviewingNoteNumbers])

  const previewNoteOn = useCallback(
    (noteNumber: number = 64, duration?: number) => {
      if (channel === undefined) return

      // stop current note immediately if playing
      previewNoteOff()

      // start the new note
      startNote({ noteNumber, velocity: 100, channel })
      addPreviewingNoteNumbers(noteNumber)

      // schedule stop if duration is specified
      if (duration !== undefined) {
        const timeout = setTimeout(() => {
          previewNoteOff()
        }, duration)
        playingNoteRef.current = {
          noteNumber,
          timeout,
        }
      } else {
        playingNoteRef.current = { noteNumber }
      }
    },
    [channel, startNote, addPreviewingNoteNumbers, previewNoteOff],
  )

  return { previewNoteOn, previewNoteOff }
}
