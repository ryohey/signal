import { useEffect, useState } from "react"
import { useStores } from "./useStores"

export function useMidiInputNoteNumbers() {
  const [noteNumbers, setNoteNumbers] = useState<Set<number>>(new Set())
  const { midiInput } = useStores()

  // highlight notes when receiving MIDI input
  useEffect(
    () =>
      midiInput.on("midiMessage", (e) => {
        const event = e.message

        if (event.type !== "channel") {
          return
        }

        if (event.subtype === "noteOn") {
          setNoteNumbers((prev) => new Set(prev).add(event.noteNumber))
        } else if (event.subtype === "noteOff") {
          setNoteNumbers((prev) => {
            const newSet = new Set(prev)
            newSet.delete(event.noteNumber)
            return newSet
          })
        }
      }),
    [midiInput],
  )

  return noteNumbers
}
