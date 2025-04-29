import { useCallback, useState } from "react"
import { useStartNote, useStopNote } from "../actions"
import { useMobxSelector } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"

export function usePreviewNote() {
  const startNote = useStartNote()
  const stopNote = useStopNote()
  const [prevNoteNumber, setPrevNoteNumber] = useState<number | null>(null)
  const [stopNoteTimeout, setStopNoteTimeout] = useState<NodeJS.Timeout | null>(
    null,
  )
  const { selectedTrack } = usePianoRoll()
  const channel = useMobxSelector(() => selectedTrack?.channel, [selectedTrack])

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
      }
      return null
    })
  }, [stopNote, channel])

  return {
    previewNoteOn: useCallback(
      (noteNumber: number = 64, duration?: number) => {
        if (channel === undefined) {
          return
        }

        // if note is already playing, stop it immediately and cancel the timeout
        if (stopNoteTimeout !== null) {
          clearTimeout(stopNoteTimeout)
        }

        if (prevNoteNumber !== null) {
          stopNote({
            noteNumber: prevNoteNumber,
            channel,
          })
        }

        startNote({
          noteNumber,
          velocity: 100,
          channel,
        })
        setPrevNoteNumber(noteNumber)

        if (duration !== undefined) {
          setStopNoteTimeout(setTimeout(() => previewNoteOff(), duration))
        }
      },
      [stopNoteTimeout, channel, previewNoteOff, startNote, prevNoteNumber],
    ),
    previewNoteOff,
  }
}
