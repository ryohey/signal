import { Measure } from "../entities/measure/Measure"
import { usePianoRoll, usePianoRollTickScroll } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"
import { useStores } from "../hooks/useStores"
import { useTrackMute } from "../hooks/useTrackMute"
import { noteOffMidiEvent, noteOnMidiEvent } from "../midi/MidiEvent"
import { useToggleGhostTrack } from "./track"

export const useStop = () => {
  const { setScrollLeftInTicks } = usePianoRoll()
  const { stop, setPosition } = usePlayer()

  return () => {
    stop()
    setPosition(0)
    setScrollLeftInTicks(0)
  }
}

export const useRewindOneBar = () => {
  const { measures, timebase } = useSong()
  const { scrollLeftTicks, setScrollLeftInTicks } = usePianoRollTickScroll()
  const { position, setPosition } = usePlayer()

  return () => {
    const tick = Measure.getPreviousMeasureTick(measures, position, timebase)
    setPosition(tick)

    // make sure player doesn't move out of sight to the left
    if (position < scrollLeftTicks) {
      setScrollLeftInTicks(position)
    }
  }
}

export const useFastForwardOneBar = () => {
  const { transform, scrollLeft, canvasWidth, setScrollLeftInPixels } =
    usePianoRollTickScroll()
  const { measures, timebase } = useSong()
  const { position, setPosition } = usePlayer()

  return () => {
    const tick = Measure.getNextMeasureTick(measures, position, timebase)
    setPosition(tick)

    // make sure player doesn't move out of sight to the right
    const x = transform.getX(position)
    const screenX = x - scrollLeft
    if (screenX > canvasWidth * 0.7) {
      setScrollLeftInPixels(x - canvasWidth * 0.7)
    }
  }
}

export const useNextTrack = () => {
  const { selectedTrackIndex, setSelectedTrackIndex } = usePianoRoll()
  const { tracks } = useSong()

  return () => {
    setSelectedTrackIndex(Math.min(selectedTrackIndex + 1, tracks.length - 1))
  }
}

export const usePreviousTrack = () => {
  const { selectedTrackIndex, setSelectedTrackIndex } = usePianoRoll()

  return () => {
    setSelectedTrackIndex(Math.max(selectedTrackIndex - 1, 1))
  }
}

export const useToggleSolo = () => {
  const { toggleSolo } = useTrackMute()
  const { selectedTrackId } = usePianoRoll()

  return () => toggleSolo(selectedTrackId)
}

export const useToggleMute = () => {
  const { toggleMute } = useTrackMute()
  const { selectedTrackId } = usePianoRoll()

  return () => toggleMute(selectedTrackId)
}

export const useToggleGhost = () => {
  const { selectedTrackId } = usePianoRoll()
  const toggleGhostTrack = useToggleGhostTrack()

  return () => toggleGhostTrack(selectedTrackId)
}

export const useStartNote = () => {
  const { synthGroup } = useStores()
  const { sendEvent } = usePlayer()

  return (
    {
      channel,
      noteNumber,
      velocity,
    }: {
      noteNumber: number
      velocity: number
      channel: number
    },
    delayTime = 0,
  ) => {
    synthGroup.activate()
    sendEvent(noteOnMidiEvent(0, channel, noteNumber, velocity), delayTime)
  }
}

export const useStopNote = () => {
  const { sendEvent } = usePlayer()

  return (
    {
      channel,
      noteNumber,
    }: {
      noteNumber: number
      channel: number
    },
    delayTime = 0,
  ) => {
    sendEvent(noteOffMidiEvent(0, channel, noteNumber, 0), delayTime)
  }
}
