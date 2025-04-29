import { Measure } from "../entities/measure/Measure"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"
import { useStores } from "../hooks/useStores"
import { noteOffMidiEvent, noteOnMidiEvent } from "../midi/MidiEvent"

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
  const { scrollLeftTicks, setScrollLeftInTicks } = usePianoRoll()
  const song = useSong()
  const { position, setPosition } = usePlayer()

  return () => {
    const tick = Measure.getPreviousMeasureTick(
      song.measures,
      position,
      song.timebase,
    )
    setPosition(tick)

    // make sure player doesn't move out of sight to the left
    if (position < scrollLeftTicks) {
      setScrollLeftInTicks(position)
    }
  }
}

export const useFastForwardOneBar = () => {
  const { canvasWidth, transform, scrollLeft, setScrollLeftInPixels } =
    usePianoRoll()
  const song = useSong()
  const { position, setPosition } = usePlayer()

  return () => {
    const tick = Measure.getNextMeasureTick(
      song.measures,
      position,
      song.timebase,
    )
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
  const song = useSong()

  return () => {
    setSelectedTrackIndex(
      Math.min(selectedTrackIndex + 1, song.tracks.length - 1),
    )
  }
}

export const usePreviousTrack = () => {
  const { selectedTrackIndex, setSelectedTrackIndex } = usePianoRoll()

  return () => {
    setSelectedTrackIndex(Math.max(selectedTrackIndex - 1, 1))
  }
}

export const useToggleSolo = () => {
  const { trackMute } = useStores()
  const { selectedTrackId } = usePianoRoll()

  return () => {
    if (trackMute.isSolo(selectedTrackId)) {
      trackMute.unsolo(selectedTrackId)
    } else {
      trackMute.solo(selectedTrackId)
    }
  }
}

export const useToggleMute = () => {
  const { trackMute } = useStores()
  const { selectedTrackId } = usePianoRoll()
  return () => {
    if (trackMute.isMuted(selectedTrackId)) {
      trackMute.unmute(selectedTrackId)
    } else {
      trackMute.mute(selectedTrackId)
    }
  }
}

export const useToggleGhost = () => {
  const { selectedTrackId, notGhostTrackIds, setNotGhostTrackIds } =
    usePianoRoll()

  return () => {
    if (notGhostTrackIds.has(selectedTrackId)) {
      notGhostTrackIds.delete(selectedTrackId)
    } else {
      notGhostTrackIds.add(selectedTrackId)
    }
    setNotGhostTrackIds(notGhostTrackIds)
  }
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
