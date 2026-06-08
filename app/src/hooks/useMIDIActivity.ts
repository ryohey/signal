import { MIDIInputEvent, TrackId } from "@signal-app/core"
import { useEffect } from "react"
import { usePianoRoll } from "../features/piano-roll/hooks/usePianoRoll"
import { useMIDIDevice } from "./useMIDIDevice"
import { useStores } from "./useStores"
import { useTrack } from "./useTrack"

export const useMIDIActivity = (trackId: TrackId, onActivity: () => void) => {
  const { midiInput } = useStores()
  const { channel } = useTrack(trackId)
  const { midiInputRouting } = useMIDIDevice()
  const { selectedTrackId } = usePianoRoll()

  useEffect(() => {
    return midiInput.on("midiMessage", (e) => {
      const activity = checkActivityEvent(e)
      if (!activity) {
        return
      }
      switch (midiInputRouting) {
        case "selectedTrack":
          if (trackId !== selectedTrackId) {
            return
          }
          break
        case "channelRouting":
          if (channel !== activity.channel) {
            return
          }
          break
      }
      onActivity()
    })
  }, [
    midiInput,
    channel,
    midiInputRouting,
    trackId,
    selectedTrackId,
    onActivity,
  ])
}

function checkActivityEvent(e: MIDIInputEvent): { channel: number } | null {
  const message = e.message
  // Only handle channel messages (0x80–0xEF)
  if (message.type !== "channel") {
    return null
  }
  // Ignore note-off (0x8n) and note-on with velocity 0 (0x9n, velocity=0)
  if (
    message.subtype === "noteOff" ||
    (message.subtype === "noteOn" && message.velocity === 0)
  ) {
    return null
  }

  const channel = message.channel
  return { channel }
}
