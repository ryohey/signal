import {
  programChangeMidiEvent,
  type TrackEventOf,
  type TrackId,
} from "@signal-app/core"
import { difference, range } from "lodash"
import type { ProgramChangeEvent } from "midifile-ts"
import { useCallback, useMemo, useState } from "react"
import { isNotUndefined } from "../../../helpers/array"
import { usePlayer } from "../../../hooks/usePlayer"
import { usePreviewNote } from "../../../hooks/usePreviewNote"
import { useSong } from "../../../hooks/useSong"
import { useTrack } from "../../../hooks/useTrack"
import { getCategoryIndex } from "../../../midi/GM"
import { useInsertTrackInstrument } from "./useInsertTrackInstrument"
import { useSetTrackInstrument } from "./useSetTrackInstrument"

// Mount only while the browser is open: the draft program number is
// initialized from the track (or the target event) on mount.
export function useInstrumentBrowser(
  trackId: TrackId,
  targetEvent?: TrackEventOf<ProgramChangeEvent>,
) {
  const {
    isRhythmTrack,
    programNumber: currentProgramNumber,
    channel,
    setChannel,
    removeEvents,
  } = useTrack(trackId)
  const { isPlaying, sendEvent, position } = usePlayer()
  const setTrackInstrumentAction = useSetTrackInstrument(
    trackId,
    targetEvent?.id,
  )
  const insertTrackInstrumentAction = useInsertTrackInstrument(trackId)
  const { tracks } = useSong()
  const { previewNoteOn } = usePreviewNote()

  // Only the program number is a draft until OK.
  // Rhythm track changes are applied to the track immediately.
  const [programNumber, setProgramNumber] = useState(
    targetEvent?.value ?? currentProgramNumber,
  )

  const selectedCategoryIndex = isRhythmTrack
    ? 0
    : getCategoryIndex(programNumber)

  const categoryFirstProgramEvents = useMemo(() => {
    if (isRhythmTrack) {
      return [0]
    }
    return range(0, 127, 8)
  }, [isRhythmTrack])

  const categoryInstruments = useMemo(() => {
    if (isRhythmTrack) {
      return [0, 8, 16, 24, 25, 32, 40, 48, 56]
    }
    const offset = selectedCategoryIndex * 8
    return range(offset, offset + 8)
  }, [selectedCategoryIndex, isRhythmTrack])

  const selectInstrument = useCallback(
    (programNumber: number) => {
      setProgramNumber(programNumber)
      if (channel === undefined) {
        return
      }
      sendEvent(programChangeMidiEvent(0, channel, programNumber))
      if (!isPlaying) {
        previewNoteOn(isRhythmTrack ? 38 : 64, 500)
      }
    },
    [channel, previewNoteOn, sendEvent, isPlaying, isRhythmTrack],
  )

  const changeRhythmTrack = useCallback(
    (newRhythmTrack: boolean) => {
      if (newRhythmTrack === isRhythmTrack) {
        return
      }
      if (newRhythmTrack) {
        setChannel(9)
      } else {
        // 適当なチャンネルに変える
        const channels = range(16)
        const usedChannels = tracks
          .filter((t) => t.id !== trackId)
          .map((t) => t.channel)
        const availableChannel =
          Math.min(
            ...difference(channels, usedChannels).filter(isNotUndefined),
          ) || 0
        setChannel(availableChannel)
      }
      setProgramNumber(0)
      setTrackInstrumentAction(0)
    },
    [isRhythmTrack, trackId, setChannel, tracks, setTrackInstrumentAction],
  )

  const applyInstrument = useCallback(() => {
    setTrackInstrumentAction(programNumber)
  }, [setTrackInstrumentAction, programNumber])

  const insertInstrumentAtCurrentPosition = useCallback(() => {
    insertTrackInstrumentAction(programNumber, position)
  }, [insertTrackInstrumentAction, programNumber, position])

  const deleteTargetEvent = useCallback(() => {
    if (targetEvent !== undefined) {
      removeEvents([targetEvent.id])
    }
  }, [targetEvent, removeEvents])

  return {
    programNumber,
    isRhythmTrack,
    selectedCategoryIndex,
    categoryFirstProgramEvents,
    categoryInstruments,
    selectInstrument,
    changeRhythmTrack,
    applyInstrument,
    insertInstrumentAtCurrentPosition,
    deleteTargetEvent,
  }
}
